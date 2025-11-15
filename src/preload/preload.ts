import { contextBridge, ipcRenderer } from 'electron'
import { ListedTestSuite, TestRunResult } from '../shared/testRunnerTypes'
import { ConnectorSummary, HealthCheckResult } from '../core/connectors/types'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Workflow operations
  getWorkflows: () => ipcRenderer.invoke('get-workflows'),
  getWorkflow: (id: number) => ipcRenderer.invoke('get-workflow', id),
  createWorkflow: (workflow: { name: string; description: string }) =>
    ipcRenderer.invoke('create-workflow', workflow),
  updateWorkflow: (id: number, data: { name?: string; description?: string; status?: string }) =>
    ipcRenderer.invoke('update-workflow', id, data),
  deleteWorkflow: (id: number) => ipcRenderer.invoke('delete-workflow', id),

  // Test console
  listTestSuites: (): Promise<ListedTestSuite[]> => ipcRenderer.invoke('list-test-suites'),
  runTestSuite: (suiteId: string): Promise<TestRunResult> =>
    ipcRenderer.invoke('run-test-suite', suiteId),

  // Connectors
  listConnectors: (): Promise<ConnectorSummary[]> => ipcRenderer.invoke('connectors:list'),
  getConnectorDetails: (id: string): Promise<ConnectorSummary | null> =>
    ipcRenderer.invoke('connectors:details', id),
  testConnector: (id: string): Promise<HealthCheckResult> =>
    ipcRenderer.invoke('connectors:test', id),

  // Config
  getConfigValue: (path: string): Promise<unknown> => ipcRenderer.invoke('config:get', path),
  setConfigValue: (path: string, value: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('config:set', path, value),
  listConfigSections: (): Promise<string[]> => ipcRenderer.invoke('config:list-sections'),

  // Test results export
  exportTestResult: (result: TestRunResult): Promise<{ path: string }> =>
    ipcRenderer.invoke('test-results:export', result)
})

// Type definitions for TypeScript
export type ElectronAPI = {
  getAppVersion: () => Promise<string>
  getWorkflows: () => Promise<any[]>
  getWorkflow: (id: number) => Promise<any>
  createWorkflow: (workflow: { name: string; description: string }) => Promise<any>
  updateWorkflow: (
    id: number,
    data: { name?: string; description?: string; status?: string }
  ) => Promise<any>
  deleteWorkflow: (id: number) => Promise<{ success: boolean }>
  listTestSuites: () => Promise<ListedTestSuite[]>
  runTestSuite: (suiteId: string) => Promise<TestRunResult>
  listConnectors: () => Promise<ConnectorSummary[]>
  getConnectorDetails: (id: string) => Promise<ConnectorSummary | null>
  testConnector: (id: string) => Promise<HealthCheckResult>
  getConfigValue: (path: string) => Promise<unknown>
  setConfigValue: (path: string, value: unknown) => Promise<{ success: boolean }>
  listConfigSections: () => Promise<string[]>
  exportTestResult: (result: TestRunResult) => Promise<{ path: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
