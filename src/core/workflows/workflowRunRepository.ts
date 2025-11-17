import Database from 'better-sqlite3'

export interface WorkflowRun {
  id: number
  workflow_version_id: number | null
  workflow_id: number
  status: 'running' | 'paused' | 'completed' | 'failed'
  current_node_id: string | null
  context_json: string | null
  started_at: string
  completed_at: string | null
  error: string | null
}

export interface WorkflowRunEvent {
  id: number
  run_id: number
  timestamp: string
  type: string
  payload_json: string | null
  emitter: string | null
}

export interface WorkflowRunContext {
  variables: Record<string, unknown>
  currentNode: string | null
  history: string[]
  metadata: Record<string, unknown>
}

export class WorkflowRunRepository {
  constructor(private db: Database.Database) {}

  createRun(
    workflowId: number,
    workflowVersionId: number | null,
    context?: WorkflowRunContext
  ): WorkflowRun {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_runs (workflow_id, workflow_version_id, status, context_json, current_node_id)
      VALUES (?, ?, 'running', ?, ?)
    `)
    const contextJson = context ? JSON.stringify(context) : JSON.stringify({ variables: {}, history: [], metadata: {} })
    const info = stmt.run(workflowId, workflowVersionId, contextJson, context?.currentNode || null)
    return this.getRun(info.lastInsertRowid as number)!
  }

  getRun(id: number): WorkflowRun | undefined {
    const stmt = this.db.prepare('SELECT * FROM workflow_runs WHERE id = ?')
    return stmt.get(id) as WorkflowRun | undefined
  }

  getRunsByWorkflow(workflowId: number): WorkflowRun[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_runs 
      WHERE workflow_id = ? 
      ORDER BY started_at DESC
    `)
    return stmt.all(workflowId) as WorkflowRun[]
  }

  updateRunStatus(id: number, status: WorkflowRun['status'], error?: string): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs 
      SET status = ?, completed_at = ?, error = ?
      WHERE id = ?
    `)
    const completedAt = status === 'completed' || status === 'failed' ? new Date().toISOString() : null
    stmt.run(status, completedAt, error || null, id)
  }

  updateRunContext(id: number, context: WorkflowRunContext, currentNodeId?: string): void {
    const stmt = this.db.prepare(`
      UPDATE workflow_runs 
      SET context_json = ?, current_node_id = ?
      WHERE id = ?
    `)
    stmt.run(JSON.stringify(context), currentNodeId || null, id)
  }

  getRunContext(id: number): WorkflowRunContext | null {
    const run = this.getRun(id)
    if (!run || !run.context_json) return null
    try {
      return JSON.parse(run.context_json) as WorkflowRunContext
    } catch {
      return null
    }
  }

  addEvent(runId: number, type: string, payload?: unknown, emitter?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_run_events (run_id, type, payload_json, emitter)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run(runId, type, payload ? JSON.stringify(payload) : null, emitter || null)
  }

  getRunEvents(runId: number): WorkflowRunEvent[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_run_events 
      WHERE run_id = ? 
      ORDER BY timestamp ASC
    `)
    return stmt.all(runId) as WorkflowRunEvent[]
  }

  deleteRun(id: number): void {
    const stmt = this.db.prepare('DELETE FROM workflow_runs WHERE id = ?')
    stmt.run(id)
  }
}

