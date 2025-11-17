import { contextBridge, ipcRenderer } from 'electron'
import { ListedTestSuite, TestRunResult, TestRunBundle } from '../shared/testRunnerTypes'
import { Workflow } from '../core/database'
import {
  ConnectorSummary,
  HealthCheckResult,
  ManagedConnectorDefinition
} from '../core/connectors/types'
import {
  WorkflowDraft,
  WorkflowDraftContent,
  WorkflowDraftUpdateInput,
  WorkflowDraftValidationResult
} from '../core/workflows/workflowTypes'
import { DocumentRecord } from '../core/documents/documentRegistry'
import { ExportDocumentPayload } from '../core/documents/documentService'
import { NotificationPreferences } from '../core/notifications/types'
import { ScheduleRecord } from '../core/scheduler/schedulerService'
import { TemplateRecord } from '../core/templates/templateRegistry'
import { WorkflowEvent } from '../core/workflows/workflowEventPublisher'

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
  registerConnector: (definition: ManagedConnectorDefinition) =>
    ipcRenderer.invoke('connectors:register', definition),
    removeConnector: (id: string) => ipcRenderer.invoke('connectors:remove', id),
    listConnectorModels: (connectorId: string) => ipcRenderer.invoke('connectors:list-models', connectorId),
    storeSecret: (secret: { key: string; value: string }) =>
      ipcRenderer.invoke('vault:store-secret', secret),

  // Config
  getConfigValue: (path: string): Promise<unknown> => ipcRenderer.invoke('config:get', path),
  setConfigValue: (path: string, value: unknown): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('config:set', path, value),
  listConfigSections: (): Promise<string[]> => ipcRenderer.invoke('config:list-sections'),
  getLogPath: () => ipcRenderer.invoke('logging:get-path'),
  getTelemetryEnabled: () => ipcRenderer.invoke('telemetry:get-enabled'),
  setTelemetryEnabled: (enabled: boolean) => ipcRenderer.invoke('telemetry:set-enabled', enabled),

  // Test results export
  exportTestResult: (result: TestRunResult): Promise<{ path?: string; canceled: boolean }> =>
    ipcRenderer.invoke('test-results:export', result),
  exportAllTestResults: (bundle: TestRunBundle): Promise<{ path?: string; canceled: boolean }> =>
    ipcRenderer.invoke('test-results:export-batch', bundle),

  // Workflow drafts
  listWorkflowDrafts: (): Promise<WorkflowDraft[]> => ipcRenderer.invoke('workflow-drafts:list'),
  getWorkflowDraft: (id: number): Promise<WorkflowDraft | null> =>
    ipcRenderer.invoke('workflow-drafts:get', id),
  createWorkflowDraft: (payload: { name: string; description?: string }): Promise<WorkflowDraft> =>
    ipcRenderer.invoke('workflow-drafts:create', payload),
  updateWorkflowDraft: (id: number, input: WorkflowDraftUpdateInput): Promise<WorkflowDraft> =>
    ipcRenderer.invoke('workflow-drafts:update', id, input),
  autosaveWorkflowDraft: (id: number, content: WorkflowDraftContent): Promise<WorkflowDraft> =>
    ipcRenderer.invoke('workflow-drafts:autosave', id, content),
  deleteWorkflowDraft: (id: number): Promise<{ success: boolean }> =>
    ipcRenderer.invoke('workflow-drafts:delete', id),
  validateWorkflowDraft: (id: number): Promise<WorkflowDraftValidationResult> =>
    ipcRenderer.invoke('workflow-drafts:validate', id),
  publishWorkflowDraft: (id: number) => ipcRenderer.invoke('workflow-drafts:publish', id),

  // Workflow execution
  executeWorkflow: (draftId: number, workflowId: number, options?: { workflowVersionId?: number; initialVariables?: Record<string, unknown> }) =>
    ipcRenderer.invoke('workflow:execute', draftId, workflowId, options),
  listWorkflowRuns: (workflowId: number) => ipcRenderer.invoke('workflow:runs:list', workflowId),
  getWorkflowRun: (runId: number) => ipcRenderer.invoke('workflow:runs:get', runId),
  getWorkflowRunEvents: (runId: number) => ipcRenderer.invoke('workflow:runs:events', runId),
  pauseWorkflowRun: (runId: number) => ipcRenderer.invoke('workflow:runs:pause', runId),
  resumeWorkflowRun: (runId: number, draftId: number) => ipcRenderer.invoke('workflow:runs:resume', runId, draftId),
  exportWorkflow: (draftId: number) => ipcRenderer.invoke('workflow:export', draftId),
  importWorkflow: (manifest: any) => ipcRenderer.invoke('workflow:import', manifest),
  listWorkflowTemplates: () => ipcRenderer.invoke('workflow:templates:list'),
  getWorkflowTemplate: (name: string) => ipcRenderer.invoke('workflow:templates:get', name),
  onWorkflowEvent: (callback: (event: WorkflowEvent) => void) => {
    const handler = (_: unknown, event: WorkflowEvent) => callback(event)
    ipcRenderer.on('workflow-event', handler)
    return () => {
      ipcRenderer.removeListener('workflow-event', handler)
    }
  },

  // Documents
  listDocuments: (): Promise<DocumentRecord[]> => ipcRenderer.invoke('documents:list'),
  exportDocument: (payload: ExportDocumentPayload) =>
    ipcRenderer.invoke('documents:export', payload),

  // Notifications & Scheduler
  getNotificationPreferences: () => ipcRenderer.invoke('notifications:get-preferences'),
  setNotificationPreferences: (prefs: NotificationPreferences) =>
    ipcRenderer.invoke('notifications:set-preferences', prefs),
  addSchedule: (
    workflowId: number,
    cron: string,
    options?: { timezone?: string; profile?: string }
  ) => ipcRenderer.invoke('scheduler:add', workflowId, cron, options),
  updateSchedule: (
    id: number,
    cron: string,
    options?: { timezone?: string; profile?: string }
  ) => ipcRenderer.invoke('scheduler:update', id, cron, options),
  listSchedules: () => ipcRenderer.invoke('scheduler:list'),
  pauseSchedule: (id: number) => ipcRenderer.invoke('scheduler:pause', id),
  resumeSchedule: (id: number) => ipcRenderer.invoke('scheduler:resume', id),
  deleteSchedule: (id: number) => ipcRenderer.invoke('scheduler:delete', id),
  createTemplate: (payload: {
    name: string
    description?: string
    documentPath?: string
    workflowVersionId?: number
  }) => ipcRenderer.invoke('templates:create', payload),
  listTemplates: () => ipcRenderer.invoke('templates:list'),
  listTemplateRevisions: (templateId: number) =>
    ipcRenderer.invoke('templates:revisions', templateId)
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
    registerConnector: (definition: ManagedConnectorDefinition) => Promise<ConnectorSummary>
    removeConnector: (id: string) => Promise<{ success: boolean }>
    listConnectorModels: (connectorId: string) => Promise<any[]>
    storeSecret: (secret: { key: string; value: string }) => Promise<void>
  getConfigValue: (path: string) => Promise<unknown>
  setConfigValue: (path: string, value: unknown) => Promise<{ success: boolean }>
  listConfigSections: () => Promise<string[]>
  getLogPath: () => Promise<string>
  getTelemetryEnabled: () => Promise<boolean>
  setTelemetryEnabled: (enabled: boolean) => Promise<boolean>
  exportTestResult: (result: TestRunResult) => Promise<{ path?: string; canceled: boolean }>
  exportAllTestResults: (bundle: TestRunBundle) => Promise<{ path?: string; canceled: boolean }>
  listWorkflowDrafts: () => Promise<WorkflowDraft[]>
  getWorkflowDraft: (id: number) => Promise<WorkflowDraft | null>
  createWorkflowDraft: (payload: { name: string; description?: string }) => Promise<WorkflowDraft>
  updateWorkflowDraft: (id: number, input: WorkflowDraftUpdateInput) => Promise<WorkflowDraft>
  autosaveWorkflowDraft: (id: number, content: WorkflowDraftContent) => Promise<WorkflowDraft>
  deleteWorkflowDraft: (id: number) => Promise<{ success: boolean }>
  validateWorkflowDraft: (id: number) => Promise<WorkflowDraftValidationResult>
  publishWorkflowDraft: (id: number) => Promise<{ workflow: Workflow; draft: WorkflowDraft }>
  executeWorkflow: (draftId: number, workflowId: number, options?: { workflowVersionId?: number; initialVariables?: Record<string, unknown> }) => Promise<{ runId: number }>
  listWorkflowRuns: (workflowId: number) => Promise<any[]>
  getWorkflowRun: (runId: number) => Promise<any | null>
  getWorkflowRunEvents: (runId: number) => Promise<any[]>
  pauseWorkflowRun: (runId: number) => Promise<{ success: boolean }>
  resumeWorkflowRun: (runId: number, draftId: number) => Promise<{ success: boolean }>
  exportWorkflow: (draftId: number) => Promise<any>
  importWorkflow: (manifest: any) => Promise<any>
  listWorkflowTemplates: () => Promise<any[]>
  getWorkflowTemplate: (name: string) => Promise<any | null>
  onWorkflowEvent: (callback: (event: WorkflowEvent) => void) => () => void
  listDocuments: () => Promise<DocumentRecord[]>
  exportDocument: (
    payload: ExportDocumentPayload
  ) => Promise<{ path: string; record: DocumentRecord }>
  getNotificationPreferences: () => Promise<NotificationPreferences>
  setNotificationPreferences: (prefs: NotificationPreferences) => Promise<NotificationPreferences>
  addSchedule: (
    workflowId: number,
    cron: string,
    options?: { timezone?: string; profile?: string }
  ) => Promise<ScheduleRecord>
  updateSchedule: (
    id: number,
    cron: string,
    options?: { timezone?: string; profile?: string }
  ) => Promise<{ success: boolean }>
  listSchedules: () => Promise<ScheduleRecord[]>
  pauseSchedule: (id: number) => Promise<{ success: boolean }>
  resumeSchedule: (id: number) => Promise<{ success: boolean }>
  deleteSchedule: (id: number) => Promise<{ success: boolean }>
  createTemplate: (payload: {
    name: string
    description?: string
    documentPath?: string
    workflowVersionId?: number
  }) => Promise<TemplateRecord>
  listTemplates: () => Promise<TemplateRecord[]>
  listTemplateRevisions: (templateId: number) => Promise<any[]>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
