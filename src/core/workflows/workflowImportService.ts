import { WorkflowDraft } from './workflowTypes'
import { WorkflowExportManifest } from './workflowExportService'
import { ConnectorRegistry } from '../connectors/registry'
import { ValidationService } from './validationService'

export interface WorkflowImportResult {
  success: boolean
  draft?: WorkflowDraft
  warnings: string[]
  errors: string[]
}

export class WorkflowImportService {
  constructor(
    private connectorRegistry: ConnectorRegistry,
    private validationService: ValidationService
  ) {}

  async importWorkflow(manifest: WorkflowExportManifest): Promise<WorkflowImportResult> {
    const warnings: string[] = []
    const errors: string[] = []

    // Validate manifest version
    if (manifest.version !== '1.0') {
      errors.push(`Unsupported manifest version: ${manifest.version}`)
      return { success: false, warnings, errors }
    }

    // Check for required connectors
    for (const connectorId of manifest.dependencies.connectors) {
      const connector = this.connectorRegistry.getConnector(connectorId)
      if (!connector) {
        warnings.push(`Required connector not found: ${connectorId}. You may need to register it before using this workflow.`)
      }
    }

    // Validate workflow structure
    const draft: WorkflowDraft = {
      id: 0, // Will be assigned by draft service
      name: manifest.workflow.name,
      description: manifest.workflow.description,
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: manifest.workflow.nodes as any[],
      transitions: manifest.workflow.transitions as any[]
    }

    const validation = this.validationService.validate(draft)
    if (!validation.valid) {
      errors.push(...validation.errors)
      return { success: false, warnings, errors }
    }

    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings)
    }

    return {
      success: true,
      draft,
      warnings,
      errors
    }
  }
}

