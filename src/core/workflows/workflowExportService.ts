import { WorkflowDraft } from './workflowTypes'
import { ConnectorRegistry } from '../connectors/registry'

export interface WorkflowExportManifest {
  version: string
  workflow: {
    name: string
    description: string
    nodes: unknown[]
    transitions: unknown[]
  }
  dependencies: {
    connectors: string[]
    documents: string[]
  }
  metadata: {
    exportedAt: string
    exportedBy?: string
  }
}

export class WorkflowExportService {
  constructor(private connectorRegistry: ConnectorRegistry) {}

  exportWorkflow(draft: WorkflowDraft): WorkflowExportManifest {
    // Extract required connectors from workflow nodes
    const requiredConnectors: string[] = []
    draft.nodes.forEach((node) => {
      node.entryActions.forEach((action) => {
        if (action.type === 'llm.chat' && action.config.connectorId) {
          const connectorId = action.config.connectorId as string
          if (!requiredConnectors.includes(connectorId)) {
            requiredConnectors.push(connectorId)
          }
        }
      })
    })

    return {
      version: '1.0',
      workflow: {
        name: draft.name,
        description: draft.description,
        nodes: draft.nodes,
        transitions: draft.transitions
      },
      dependencies: {
        connectors: requiredConnectors,
        documents: [] // TODO: Extract document dependencies
      },
      metadata: {
        exportedAt: new Date().toISOString()
      }
    }
  }
}

