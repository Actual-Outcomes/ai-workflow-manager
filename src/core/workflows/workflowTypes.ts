import { WorkflowNode, WorkflowTransition, WorkflowStatus } from '../domain/workflows'

export interface WorkflowDraft {
  id: number
  name: string
  description: string
  status: WorkflowStatus
  version: number
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
  transitions: WorkflowTransition[]
}
