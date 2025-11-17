import { WorkflowAction } from '../domain/workflows'
import { LLMConnector } from '../connectors/llm/types'
import { DocumentService } from '../documents/documentService'
import { WorkflowRunContext } from './workflowRunRepository'

export interface ActionExecutionContext {
  context: WorkflowRunContext
  llmConnector?: LLMConnector
  documentService?: DocumentService
}

export interface ActionExecutionResult {
  success: boolean
  output?: unknown
  error?: string
  contextUpdates?: Partial<WorkflowRunContext>
}

export class ActionExecutor {
  constructor(
    private llmConnector?: LLMConnector,
    private documentService?: DocumentService
  ) {}

  async execute(
    action: WorkflowAction,
    executionContext: ActionExecutionContext
  ): Promise<ActionExecutionResult> {
    const { context } = executionContext

    try {
      switch (action.type) {
        case 'llm':
          return await this.executeLLMAction(action, context)
        case 'document':
          return await this.executeDocumentAction(action, context)
        case 'variable':
          return await this.executeVariableAction(action, context)
        case 'conditional':
          return await this.executeConditionalAction(action, context)
        default:
          return {
            success: false,
            error: `Unknown action type: ${action.type}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async executeLLMAction(
    action: WorkflowAction,
    context: WorkflowRunContext
  ): Promise<ActionExecutionResult> {
    if (!this.llmConnector) {
      return {
        success: false,
        error: 'LLM connector not available'
      }
    }

    const prompt = this.interpolateString(action.config.prompt as string, context.variables)
    const model = (action.config.model as string) || undefined
    const temperature = action.config.temperature as number | undefined
    const maxTokens = action.config.maxTokens as number | undefined

    try {
      const response = await this.llmConnector.chat(
        [{ role: 'user', content: prompt }],
        { model, temperature, maxTokens }
      )

      // Store response in context
      const outputVar = (action.config.outputVariable as string) || 'llm_response'
      const contextUpdates: Partial<WorkflowRunContext> = {
        variables: {
          ...context.variables,
          [outputVar]: response.content,
          [`${outputVar}_usage`]: response.usage
        }
      }

      return {
        success: true,
        output: response.content,
        contextUpdates
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LLM API call failed'
      }
    }
  }

  private async executeDocumentAction(
    action: WorkflowAction,
    context: WorkflowRunContext
  ): Promise<ActionExecutionResult> {
    if (!this.documentService) {
      return {
        success: false,
        error: 'Document service not available'
      }
    }

    const template = action.config.template as string
    const format = (action.config.format as string) || 'markdown'
    const content = this.interpolateString(action.config.content as string, context.variables)

    try {
      const result = await this.documentService.exportDocument({
        name: template,
        format: format as 'markdown' | 'pdf' | 'docx',
        content
      })

      return {
        success: true,
        output: result.path,
        contextUpdates: {
          variables: {
            ...context.variables,
            [`document_${template}`]: result.path
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Document generation failed'
      }
    }
  }

  private executeVariableAction(
    action: WorkflowAction,
    context: WorkflowRunContext
  ): ActionExecutionResult {
    const name = action.config.name as string
    const value = action.config.value

    if (!name) {
      return {
        success: false,
        error: 'Variable name is required'
      }
    }

    return {
      success: true,
      output: value,
      contextUpdates: {
        variables: {
          ...context.variables,
          [name]: value
        }
      }
    }
  }

  private async executeConditionalAction(
    action: WorkflowAction,
    context: WorkflowRunContext
  ): Promise<ActionExecutionResult> {
    const condition = action.config.condition as string
    const thenActions = (action.config.then as WorkflowAction[]) || []
    const elseActions = (action.config.else as WorkflowAction[]) || []

    // Simple condition evaluation (can be enhanced)
    const conditionResult = this.evaluateCondition(condition, context.variables)

    const actionsToExecute = conditionResult ? thenActions : elseActions

    const results: ActionExecutionResult[] = []
    let updatedContext = { ...context }

    for (const subAction of actionsToExecute) {
      const result = await this.execute(subAction, {
        context: updatedContext,
        llmConnector: this.llmConnector,
        documentService: this.documentService
      })
      results.push(result)

      if (result.contextUpdates) {
        updatedContext = {
          ...updatedContext,
          ...result.contextUpdates
        }
      }
    }

    return {
      success: results.every((r) => r.success),
      output: results,
      contextUpdates: {
        variables: updatedContext.variables
      }
    }
  }

  private interpolateString(template: string, variables: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = variables[key]
      return value !== undefined ? String(value) : `{{${key}}}`
    })
  }

  private evaluateCondition(condition: string, variables: Record<string, unknown>): boolean {
    // Simple condition evaluation - can be enhanced with a proper expression parser
    try {
      // Replace variables in condition
      const interpolated = condition.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = variables[key]
        return value !== undefined ? JSON.stringify(value) : 'undefined'
      })

      // Evaluate as JavaScript expression (simple cases only)
      // In production, use a proper expression parser for security
      return Boolean(eval(interpolated))
    } catch {
      return false
    }
  }
}

