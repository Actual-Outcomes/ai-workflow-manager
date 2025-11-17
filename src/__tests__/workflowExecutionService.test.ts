import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { WorkflowExecutionService } from '../core/workflows/workflowExecutionService'
import { WorkflowRunRepository } from '../core/workflows/workflowRunRepository'
import { ConnectorRegistry } from '../core/connectors/registry'
import { DocumentService } from '../core/documents/documentService'
import { ValidationService } from '../core/workflows/validationService'
import { WorkflowDraft } from '../core/workflows/workflowTypes'
import Database from 'better-sqlite3'
import fs from 'fs'
import os from 'os'
import path from 'path'

const createTestDb = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-exec-test-'))
  const dbPath = path.join(tempDir, 'test.db')
  const db = new Database(dbPath)
  
  // Create required tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workflow_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      definition_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
    )
  `)
  db.exec(`
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
      FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE CASCADE
    )
  `)
  db.exec(`
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
  
  return { db, dbPath, tempDir }
}

describe('WorkflowExecutionService', () => {
  let db: Database.Database
  let dbPath: string
  let tempDir: string
  let runRepository: WorkflowRunRepository
  let connectorRegistry: ConnectorRegistry
  let documentService: DocumentService
  let validationService: ValidationService
  let executionService: WorkflowExecutionService

  beforeEach(() => {
    const testDb = createTestDb()
    db = testDb.db
    dbPath = testDb.dbPath
    tempDir = testDb.tempDir
    
    runRepository = new WorkflowRunRepository(db)
    connectorRegistry = new ConnectorRegistry()
    const mockDocumentRegistry = {
      list: () => [],
      add: () => ({ id: 1, name: 'test', type: 'markdown', path: '/test', version: 1 }),
      close: () => {}
    }
    const mockFileConnector = {
      writeFile: () => '/test/path'
    }
    documentService = new DocumentService(mockDocumentRegistry as any, mockFileConnector as any)
    validationService = new ValidationService()
    executionService = new WorkflowExecutionService(
      runRepository,
      connectorRegistry,
      documentService,
      validationService
    )
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('creates a workflow run', async () => {
    const draft: WorkflowDraft = {
      id: 1,
      name: 'Test Workflow',
      description: 'Test',
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'start', type: 'start', label: 'Start', entryActions: [], exitActions: [] }
      ],
      transitions: []
    }

    const runId = await executionService.executeWorkflow(draft, 1)
    const run = runRepository.getRun(runId)
    
    expect(run).toBeDefined()
    expect(run?.status).toBe('running')
    expect(run?.workflow_id).toBe(1)
  })

  it('executes a simple workflow with start and end nodes', async () => {
    const draft: WorkflowDraft = {
      id: 1,
      name: 'Simple Workflow',
      description: 'Test',
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        { id: 'start', type: 'start', label: 'Start', entryActions: [], exitActions: [] },
        { id: 'end', type: 'end', label: 'End', entryActions: [], exitActions: [] }
      ],
      transitions: [
        { id: 't1', source: 'start', target: 'end', trigger: undefined, validators: [] }
      ]
    }

    const runId = await executionService.executeWorkflow(draft, 1)
    
    // Wait a bit for async execution
    await new Promise((resolve) => setTimeout(resolve, 100))
    
    const run = runRepository.getRun(runId)
    expect(run).toBeDefined()
    
    const events = runRepository.getRunEvents(runId)
    expect(events.length).toBeGreaterThan(0)
    expect(events.some((e) => e.type === 'workflow-started')).toBe(true)
  })
})

