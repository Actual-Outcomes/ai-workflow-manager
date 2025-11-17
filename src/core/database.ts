import Database from 'better-sqlite3'
import { WorkflowDraftContent } from './workflows/workflowTypes'

export interface Workflow {
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

export interface WorkflowVersion {
  id: number
  workflow_id: number
  version: number
  definition_json: string
  created_at: string
}

export class WorkflowDatabase {
  private db: Database.Database

  constructor(dbPath: string) {
    this.db = new Database(dbPath)
    this.initialize()
  }

  private initialize() {
    // Create workflows table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        definition_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
      )
    `)

    // Create workflow_steps table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        step_type TEXT NOT NULL,
        config TEXT,
        order_index INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
      )
    `)

    // Create workflow_runs table for execution history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workflow_version_id INTEGER,
        workflow_id INTEGER NOT NULL,
        status TEXT DEFAULT 'running',
        current_node_id TEXT,
        context_json TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        error TEXT,
        FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE,
        FOREIGN KEY (workflow_version_id) REFERENCES workflow_versions (id) ON DELETE SET NULL
      )
    `)
    
    // Migration: Add workflow_version_id column if it doesn't exist
    try {
      const tableInfo = this.db.prepare("PRAGMA table_info(workflow_runs)").all() as Array<{ name: string }>
      const hasVersionId = tableInfo.some(col => col.name === 'workflow_version_id')
      if (!hasVersionId) {
        this.db.exec(`
          ALTER TABLE workflow_runs 
          ADD COLUMN workflow_version_id INTEGER
        `)
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_workflow_runs_version 
          ON workflow_runs(workflow_version_id)
        `)
      }
    } catch (error) {
      // Table might not exist yet, which is fine
      console.warn('Migration check for workflow_version_id failed:', error)
    }

    // Create workflow_run_events table for execution events
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_run_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type TEXT NOT NULL,
        payload_json TEXT,
        emitter TEXT,
        FOREIGN KEY (run_id) REFERENCES workflow_runs (id) ON DELETE CASCADE
      )
    `)
  }

  // Workflow CRUD operations
  getAllWorkflows(): Workflow[] {
    const stmt = this.db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC')
    return stmt.all() as Workflow[]
  }

  getWorkflow(id: number): Workflow | undefined {
    const stmt = this.db.prepare('SELECT * FROM workflows WHERE id = ?')
    return stmt.get(id) as Workflow | undefined
  }

  createWorkflow(name: string, description: string): Workflow {
    const stmt = this.db.prepare(`
      INSERT INTO workflows (name, description, status)
      VALUES (?, ?, 'draft')
    `)
    const info = stmt.run(name, description)
    return this.getWorkflow(info.lastInsertRowid as number)!
  }

  updateWorkflow(
    id: number,
    data: { name?: string; description?: string; status?: string }
  ): Workflow {
    const updates: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }
    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description)
    }
    if (data.status !== undefined) {
      updates.push('status = ?')
      values.push(data.status)
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE workflows
      SET ${updates.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values)
    return this.getWorkflow(id)!
  }

  deleteWorkflow(id: number): void {
    const stmt = this.db.prepare('DELETE FROM workflows WHERE id = ?')
    stmt.run(id)
  }

  createWorkflowVersion(
    workflowId: number,
    version: number,
    definition: WorkflowDraftContent
  ): WorkflowVersion {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_versions (workflow_id, version, definition_json)
      VALUES (?, ?, ?)
    `)
    const info = stmt.run(workflowId, version, JSON.stringify(definition))
    return this.getWorkflowVersion(info.lastInsertRowid as number)!
  }

  getWorkflowVersion(id: number): WorkflowVersion | undefined {
    const stmt = this.db.prepare('SELECT * FROM workflow_versions WHERE id = ?')
    return stmt.get(id) as WorkflowVersion | undefined
  }

  listWorkflowVersions(workflowId: number): WorkflowVersion[] {
    const stmt = this.db.prepare(
      'SELECT * FROM workflow_versions WHERE workflow_id = ? ORDER BY version DESC'
    )
    return stmt.all(workflowId) as WorkflowVersion[]
  }

  close(): void {
    this.db.close()
  }
}
