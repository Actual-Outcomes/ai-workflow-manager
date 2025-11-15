export type WorkflowStatus = 'draft' | 'active' | 'inactive'

export interface WorkflowDefinition {
  id: number
  name: string
  description?: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  version: number
}

export interface WorkflowNode {
  id: string
  type: string
  label: string
  entryActions: WorkflowAction[]
  exitActions: WorkflowAction[]
  metadata?: Record<string, unknown>
}

export interface WorkflowTransition {
  id: string
  source: string
  target: string
  trigger?: WorkflowTrigger
  validators?: WorkflowValidator[]
}

export interface WorkflowAction {
  id: string
  type: string
  config: Record<string, unknown>
}

export interface WorkflowTrigger {
  type: string
  config: Record<string, unknown>
}

export interface WorkflowValidator {
  type: string
  config: Record<string, unknown>
}
