import Database from 'better-sqlite3'
import { WorkflowDraft } from './workflowTypes'
import { ConfigService } from '../config/service'
import { getAppDatabasePath } from '../appPaths'

export class WorkflowDraftService {
  private db: Database.Database
  private configService: ConfigService

  constructor(configService: ConfigService, dbPath: string = getAppDatabasePath()) {
    this.db = new Database(dbPath)
    this.configService = configService
    this.ensureTables()
  }

  private ensureTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        version INTEGER DEFAULT 1,
        data_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  }

  createDraft(name: string, description?: string): WorkflowDraft {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_drafts (name, description, data_json)
      VALUES (?, ?, ?)
    `)
    const data = {
      nodes: [],
      transitions: []
    }
    const info = stmt.run(name, description ?? '', JSON.stringify(data))
    return this.getDraft(info.lastInsertRowid as number)!
  }

  listDrafts(): WorkflowDraft[] {
    const stmt = this.db.prepare(`SELECT * FROM workflow_drafts ORDER BY updated_at DESC`)
    return (stmt.all() as any[]).map(this.mapRowToDraft)
  }

  getDraft(id: number): WorkflowDraft | undefined {
    const stmt = this.db.prepare(`SELECT * FROM workflow_drafts WHERE id = ?`)
    const row = stmt.get(id)
    return row ? this.mapRowToDraft(row) : undefined
  }

  validateDraft(draftId: number) {
    const draft = this.getDraft(draftId)
    if (!draft) {
      return { valid: false, errors: ['Draft not found'] }
    }
    const errors: string[] = []
    if (!draft.name.trim()) {
      errors.push('Draft name required')
    }
    return {
      valid: errors.length === 0,
      errors
    }
  }

  private mapRowToDraft = (row: any): WorkflowDraft => ({
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...JSON.parse(row.data_json)
  })
}
