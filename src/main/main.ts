import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { WorkflowDatabase } from '../core/database'
import { ConfigService } from '../core/config/service'
import { CredentialVault } from '../core/credentials/vault'
import { ConnectorRegistry } from '../core/connectors/registry'
import { FileConnector } from '../core/files/fileConnector'
import { getAppDatabasePath } from '../core/appPaths'
import { AuditLogService } from '../core/audit-log'
import { TestRunnerService } from './services/testRunner'
import { TestRunResult } from '../shared/testRunnerTypes'

let mainWindow: BrowserWindow | null = null
let db: WorkflowDatabase
let configService: ConfigService
let credentialVault: CredentialVault
let connectorRegistry: ConnectorRegistry
let auditLog: AuditLogService | null = null
let fileConnector: FileConnector
const isDevelopment = process.env.NODE_ENV === 'development'
const testRunner = new TestRunnerService()

function getPreloadPath(appBasePath: string) {
  return path.join(appBasePath, 'dist', 'preload', 'preload', 'preload.js')
}

function getRendererPath(appBasePath: string) {
  return path.join(appBasePath, 'dist', 'renderer', 'index.html')
}

function createWindow() {
  const appBasePath = app.getAppPath()

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: getPreloadPath(appBasePath),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    show: false, // Show when ready
    backgroundColor: '#1a1a1a'
  })

  // Load the app
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(getRendererPath(appBasePath))
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.whenReady().then(async () => {
  const dbPath = getAppDatabasePath()
  db = new WorkflowDatabase(dbPath)
  auditLog = new AuditLogService(dbPath)
  configService = new ConfigService()
  credentialVault = new CredentialVault()
  connectorRegistry = new ConnectorRegistry()
  fileConnector = new FileConnector()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  db?.close()
  auditLog?.close()
})

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-workflows', async () => {
  try {
    return db.getAllWorkflows()
  } catch (error) {
    console.error('Error getting workflows:', error)
    throw error
  }
})

ipcMain.handle('create-workflow', async (_, workflow: { name: string; description: string }) => {
  try {
    return db.createWorkflow(workflow.name, workflow.description)
  } catch (error) {
    console.error('Error creating workflow:', error)
    throw error
  }
})

ipcMain.handle(
  'update-workflow',
  async (_, id: number, data: { name?: string; description?: string; status?: string }) => {
    try {
      return db.updateWorkflow(id, data)
    } catch (error) {
      console.error('Error updating workflow:', error)
      throw error
    }
  }
)

ipcMain.handle('delete-workflow', async (_, id: number) => {
  try {
    db.deleteWorkflow(id)
    return { success: true }
  } catch (error) {
    console.error('Error deleting workflow:', error)
    throw error
  }
})

ipcMain.handle('get-workflow', async (_, id: number) => {
  try {
    return db.getWorkflow(id)
  } catch (error) {
    console.error('Error getting workflow:', error)
    throw error
  }
})

ipcMain.handle('connectors:list', () => {
  return connectorRegistry.listConnectors()
})

ipcMain.handle('connectors:details', (_, id: string) => {
  return connectorRegistry.getConnector(id) ?? null
})

ipcMain.handle('connectors:test', async (_, id: string) => {
  return connectorRegistry.testConnector(id)
})

ipcMain.handle('test-results:export', async (_, result: TestRunResult) => {
  const fileName = `test-result-${result.suiteId}-${Date.now()}.json`
  const relativePath = path.join('test-results', fileName)
  const fullPath = fileConnector.writeFile(relativePath, JSON.stringify(result, null, 2))
  return { path: fullPath }
})

ipcMain.handle('config:get', (_, targetPath: string) => {
  return configService.get(targetPath)
})

ipcMain.handle('config:set', async (_, targetPath: string, value: unknown) => {
  await configService.set(targetPath, value)
  return { success: true }
})

ipcMain.handle('config:list-sections', () => {
  return configService.listSections()
})

ipcMain.handle('list-test-suites', () => {
  return testRunner.listSuites()
})

ipcMain.handle('run-test-suite', async (_, suiteId: string) => {
  const result = await testRunner.runSuite(suiteId)
  try {
    auditLog?.logEvent({
      actor: 'renderer',
      source: 'test-console',
      action: result.status === 'passed' ? 'test.run' : 'test.run.failed',
      target: `suite:${suiteId}`,
      metadata: {
        durationMs: result.durationMs,
        exitCode: result.exitCode,
        logs: result.logs.slice(-3)
      }
    })
  } catch (error) {
    console.error('Failed to log test run event', error)
  }
  return result
})
