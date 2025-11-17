import { WorkflowDraft, WorkflowRuntimeInstance } from './workflowTypes'
import { WorkflowNode, WorkflowTransition } from '../domain/workflows'
import { WorkflowRunRepository, WorkflowRunContext } from './workflowRunRepository'
import { ActionExecutor, ActionExecutionContext } from './actionExecutor'
import { ConnectorRegistry } from '../connectors/registry'
import { DocumentService } from '../documents/documentService'
import { ValidationService } from './validationService'
import { getWorkflowEventPublisher } from './workflowEventPublisher'

export interface ExecutionOptions {
  workflowVersionId?: number | null
  initialVariables?: Record<string, unknown>
}

export class WorkflowExecutionService {
  private eventPublisher = getWorkflowEventPublisher()

  constructor(
    private runRepository: WorkflowRunRepository,
    private connectorRegistry: ConnectorRegistry,
    private documentService: DocumentService,
    private validationService: ValidationService
  ) {}

  async executeWorkflow(
    draft: WorkflowDraft,
    workflowId: number,
    options: ExecutionOptions = {}
  ): Promise<number> {
    // Validate draft
    const validation = this.validationService.validate(draft)
    if (!validation.valid) {
      throw new Error(`Draft failed validation: ${validation.errors.join(', ')}`)
    }

    // Find start node
    const startNode = draft.nodes.find((n) => n.type === 'start')
    if (!startNode) {
      throw new Error('Workflow must have a start node')
    }

    // Create run
    const context: WorkflowRunContext = {
      variables: options.initialVariables || {},
      currentNode: startNode.id,
      history: [],
      metadata: {
        draftId: draft.id,
        workflowId
      }
    }

    const run = this.runRepository.createRun(workflowId, options.workflowVersionId ?? null, context)
    this.runRepository.addEvent(run.id, 'workflow-started', { draftId: draft.id })
    this.eventPublisher.publishEvent('workflow-started', run.id, { draftId: draft.id, workflowId })

    // Start execution asynchronously
    this.executeWorkflowAsync(run.id, draft, startNode.id).catch((error) => {
      this.runRepository.updateRunStatus(
        run.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      )
      this.runRepository.addEvent(run.id, 'workflow-failed', { error: error instanceof Error ? error.message : String(error) })
      this.eventPublisher.publishEvent('workflow-failed', run.id, { error: error instanceof Error ? error.message : String(error) })
    })

    return run.id
  }

  private async executeWorkflowAsync(
    runId: number,
    draft: WorkflowDraft,
    currentNodeId: string
  ): Promise<void> {
    let currentNodeIdVar = currentNodeId
    let context = this.runRepository.getRunContext(runId)!

    while (currentNodeIdVar) {
      const node = draft.nodes.find((n) => n.id === currentNodeIdVar)
      if (!node) {
        throw new Error(`Node ${currentNodeIdVar} not found`)
      }

      // Update current node
      context.currentNode = currentNodeIdVar
      this.runRepository.updateRunContext(runId, context, currentNodeIdVar)
      this.runRepository.addEvent(runId, 'node-entered', { nodeId: currentNodeIdVar })
      this.eventPublisher.publishEvent('node-entered', runId, { nodeId: currentNodeIdVar, nodeType: node.type, nodeLabel: node.label })

      // Execute entry actions
      if (node.entryActions.length > 0) {
        const entryResult = await this.executeActions(node.entryActions, context, runId)
        if (entryResult.contextUpdates) {
          context = { ...context, ...entryResult.contextUpdates }
          this.runRepository.updateRunContext(runId, context, currentNodeIdVar)
        }
        if (!entryResult.success) {
          throw new Error(`Entry action failed: ${entryResult.error}`)
        }
      }

      // Find next transition
      const transition = draft.transitions.find((t) => t.source === currentNodeIdVar)
      if (!transition) {
        // No transition means workflow is complete
        this.runRepository.addEvent(runId, 'workflow-completed', {})
        this.eventPublisher.publishEvent('workflow-completed', runId, {})
        this.runRepository.updateRunStatus(runId, 'completed')
        break
      }

      // Evaluate trigger (if present)
      if (transition.trigger) {
        const triggerResult = await this.evaluateTrigger(transition.trigger, context)
        if (!triggerResult) {
          // Trigger not ready, pause workflow
          this.runRepository.updateRunStatus(runId, 'paused')
          this.runRepository.addEvent(runId, 'workflow-paused', { reason: 'trigger-not-ready' })
          this.eventPublisher.publishEvent('workflow-paused', runId, { reason: 'trigger-not-ready' })
          break
        }
      }

      // Execute validators (if present)
      if (transition.validators && transition.validators.length > 0) {
        const validationResult = await this.executeValidators(transition.validators, context)
        if (!validationResult.valid) {
          throw new Error(`Validation failed: ${validationResult.error}`)
        }
      }

      // Execute exit actions
      if (node.exitActions.length > 0) {
        const exitResult = await this.executeActions(node.exitActions, context, runId)
        if (exitResult.contextUpdates) {
          context = { ...context, ...exitResult.contextUpdates }
          this.runRepository.updateRunContext(runId, context, currentNodeIdVar)
        }
        if (!exitResult.success) {
          throw new Error(`Exit action failed: ${exitResult.error}`)
        }
      }

      this.runRepository.addEvent(runId, 'node-exited', { nodeId: currentNodeIdVar })
      this.eventPublisher.publishEvent('node-exited', runId, { nodeId: currentNodeIdVar })

      // Move to next node
      currentNodeIdVar = transition.target
      context.currentNode = currentNodeIdVar
      context.history.push(node.id)
    }
  }

  private async executeActions(
    actions: Array<{ id: string; type: string; config: Record<string, unknown> }>,
    context: WorkflowRunContext,
    runId: number
  ) {
    // Get LLM connector (use first available)
    // First ensure connectors are initialized by testing them
    const allConnectors = this.connectorRegistry.listConnectors()
    const llmConnectors = allConnectors.filter((c) => c.kind === 'llm')
    
    let llmConnector = undefined
    if (llmConnectors.length > 0) {
      // Try to get the first LLM connector
      const connectorId = llmConnectors[0].id
      llmConnector = this.connectorRegistry.getLLMConnector(connectorId)
      
      // If not initialized, trigger initialization by testing
      if (!llmConnector) {
        try {
          await this.connectorRegistry.testConnector(connectorId)
          llmConnector = this.connectorRegistry.getLLMConnector(connectorId)
        } catch {
          // Connector not available
        }
      }
    }

    const executor = new ActionExecutor(llmConnector, this.documentService)

    let updatedContext = context
    const results = []

    for (const action of actions) {
      const result = await executor.execute(action, {
        context: updatedContext,
        llmConnector,
        documentService: this.documentService
      })

      results.push(result)
      this.runRepository.addEvent(runId, 'action-executed', {
        actionId: action.id,
        actionType: action.type,
        success: result.success,
        error: result.error
      })
      this.eventPublisher.publishEvent('action-executed', runId, {
        actionId: action.id,
        actionType: action.type,
        success: result.success,
        error: result.error,
        output: result.output
      })

      if (result.contextUpdates) {
        updatedContext = { ...updatedContext, ...result.contextUpdates }
      }

      if (!result.success) {
        return result
      }
    }

    return {
      success: true,
      contextUpdates: {
        variables: updatedContext.variables
      }
    }
  }

  private async evaluateTrigger(
    trigger: { type: string; config: Record<string, unknown> },
    context: WorkflowRunContext
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'immediate':
        return true
      case 'conditional':
        const condition = trigger.config.condition as string
        // Simple condition evaluation
        try {
          const interpolated = condition.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            const value = context.variables[key]
            return value !== undefined ? JSON.stringify(value) : 'undefined'
          })
          return Boolean(eval(interpolated))
        } catch {
          return false
        }
      default:
        return true
    }
  }

  private async executeValidators(
    validators: Array<{ type: string; config: Record<string, unknown> }>,
    context: WorkflowRunContext
  ): Promise<{ valid: boolean; error?: string }> {
    for (const validator of validators) {
      switch (validator.type) {
        case 'expression':
          const expression = validator.config.expression as string
          try {
            const interpolated = expression.replace(/\{\{(\w+)\}\}/g, (_, key) => {
              const value = context.variables[key]
              return value !== undefined ? JSON.stringify(value) : 'undefined'
            })
            const result = eval(interpolated)
            if (!result) {
              return {
                valid: false,
                error: `Validator expression failed: ${expression}`
              }
            }
          } catch (error) {
            return {
              valid: false,
              error: error instanceof Error ? error.message : 'Validator evaluation error'
            }
          }
          break
        default:
          // Unknown validator type, pass through
          break
      }
    }
    return { valid: true }
  }

  async pauseRun(runId: number): Promise<void> {
    const run = this.runRepository.getRun(runId)
    if (!run) {
      throw new Error(`Run ${runId} not found`)
    }
    if (run.status !== 'running') {
      throw new Error(`Run ${runId} is not running`)
    }
    this.runRepository.updateRunStatus(runId, 'paused')
    this.runRepository.addEvent(runId, 'workflow-paused', { reason: 'manual' })
    this.eventPublisher.publishEvent('workflow-paused', runId, { reason: 'manual' })
  }

  async resumeRun(runId: number, draft: WorkflowDraft): Promise<void> {
    const run = this.runRepository.getRun(runId)
    if (!run) {
      throw new Error(`Run ${runId} not found`)
    }
    if (run.status !== 'paused') {
      throw new Error(`Run ${runId} is not paused`)
    }

    this.runRepository.updateRunStatus(runId, 'running')
    this.runRepository.addEvent(runId, 'workflow-resumed', {})
    this.eventPublisher.publishEvent('workflow-resumed', runId, {})

    const context = this.runRepository.getRunContext(runId)!
    const currentNodeId = context.currentNode || draft.nodes.find((n) => n.type === 'start')?.id

    if (currentNodeId) {
      await this.executeWorkflowAsync(runId, draft, currentNodeId)
    }
  }
}

