import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export interface AuditLogEntry {
  id: number
  timestamp: string
  actor: string
  source: string
  action: string
  target?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AuditLogFilters {
  limit?: number
  actor?: string
  source?: string
  action?: string
}

export interface AuditLogOptions {
  retentionDays?: number
}

/**
 * Lightweight append-only audit log stored in SQLite.
 */
export class AuditLogService {
  private db: Database.Database
  private retentionDays: number

  constructor(dbPath: string, options: AuditLogOptions = {}) {
    this.ensureDir(dbPath)
    this.db = new Database(dbPath)
    this.retentionDays = options.retentionDays ?? 90
    this.initialize()
  }

  private ensureDir(dbPath: string) {
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        actor TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'system',
        action TEXT NOT NULL,
        target TEXT,
        metadata TEXT
      )
    `)
    this.db.exec(
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC)`
    )
    this.enforceRetention()
  }

  logEvent(entry: {
    actor: string
    source?: string
    action: string
    target?: string
    metadata?: Record<string, unknown>
  }) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (actor, source, action, target, metadata)
      VALUES (@actor, @source, @action, @target, @metadata)
    `)

    stmt.run({
      actor: entry.actor,
      source: entry.source ?? 'system',
      action: entry.action,
      target: entry.target ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null
    })
  }

  listEntries(filters: AuditLogFilters = {}): AuditLogEntry[] {
    const clauses: string[] = []
    const params: Record<string, unknown> = {}

    if (filters.actor) {
      clauses.push('actor = @actor')
      params.actor = filters.actor
    }
    if (filters.source) {
      clauses.push('source = @source')
      params.source = filters.source
    }
    if (filters.action) {
      clauses.push('action = @action')
      params.action = filters.action
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const limit = filters.limit ?? 50

    const stmt = this.db.prepare(`
      SELECT id, timestamp, actor, source, action, target, metadata
      FROM audit_logs
      ${where}
      ORDER BY timestamp DESC
      LIMIT ${Math.max(limit, 1)}
    `)

    type AuditLogRow = {
      id: number
      timestamp: string
      actor: string
      source: string
      action: string
      target?: string | null
      metadata?: string | null
    }

    const rows = stmt.all(params) as AuditLogRow[]

    return rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      actor: row.actor,
      source: row.source,
      action: row.action,
      target: row.target,
      metadata: row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null
    }))
  }

  enforceRetention() {
    if (!this.retentionDays) return
    const stmt = this.db.prepare(`
      DELETE FROM audit_logs
      WHERE timestamp < datetime('now', ?)
    `)
    stmt.run(`-${this.retentionDays} days`)
  }

  close() {
    this.db.close()
  }
}
