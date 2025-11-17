interface ConnectorSummary {
  id: string
  name: string
  kind: string
  status: string
  version: string
  description?: string
  lastHealthCheck?: {
    status: string
    message?: string
    latencyMs?: number
  }
}
interface DocumentRecord {
  id: number
  name: string
  type: 'docx' | 'pdf' | 'markdown'
  path: string
  version: number
  updatedAt: string
}

interface NotificationPreferences {
  quietHours: {
    start: string
    end: string
  }
  channels: string[]
}

interface ScheduleRecord {
  id: number
  workflowId: number
  cron: string
  timezone: string | null
  status: 'active' | 'paused'
  nextRunAt?: string | null
  lastRunAt?: string | null
  profile?: string | null
}

interface WorkflowDraftRecord {
  id: number
  name: string
  description: string
  status: string
  version: number
  createdAt: string
  updatedAt: string
  nodes: unknown[]
  transitions: unknown[]
}

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'
import { ListedTestSuite, TestRunBundle, TestRunResult } from '../shared/testRunnerTypes'
import { WorkflowDesigner } from './components/WorkflowDesigner'
import { ConfirmationModal } from './components/ConfirmationModal'
import { WorkflowExecutionView } from './components/WorkflowExecutionView'

interface Workflow {
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

type TabId = 'workflows' | 'tests' | 'diagnostics' | 'settings'

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' })
  const [appVersion, setAppVersion] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('workflows')
  const [testSuites, setTestSuites] = useState<ListedTestSuite[]>([])
  const [testSuitesLoading, setTestSuitesLoading] = useState(false)
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null)
  const [testRunResult, setTestRunResult] = useState<TestRunResult | null>(null)
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [isExportingAll, setIsExportingAll] = useState(false)
  const [connectors, setConnectors] = useState<ConnectorSummary[]>([])
  const [connectorLoading, setConnectorLoading] = useState(false)
  const [connectorError, setConnectorError] = useState<string | null>(null)
  const [showConnectorForm, setShowConnectorForm] = useState(false)
  const [selectedConnectorType, setSelectedConnectorType] = useState<'claude' | 'chatgpt' | null>(null)
  const [connectorApiKey, setConnectorApiKey] = useState('')
  const [connectorSelectedModel, setConnectorSelectedModel] = useState<string>('')
  const [connectorCustomModel, setConnectorCustomModel] = useState<string>('')
  const [connectorAvailableModels, setConnectorAvailableModels] = useState<any[]>([])
  const [connectorLoadingModels, setConnectorLoadingModels] = useState(false)
  const [connectorSubmitting, setConnectorSubmitting] = useState(false)
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [drafts, setDrafts] = useState<WorkflowDraftRecord[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [draftActionId, setDraftActionId] = useState<number | null>(null)
  const [designingDraftId, setDesigningDraftId] = useState<number | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [currentDraft, setCurrentDraft] = useState<WorkflowDraftRecord | null>(null)
  const [showCreateDraftForm, setShowCreateDraftForm] = useState(false)
  const [showTemplateSelection, setShowTemplateSelection] = useState(false)
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([])
  const [newDraftName, setNewDraftName] = useState('')
  const [newDraftDescription, setNewDraftDescription] = useState('')
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [executingWorkflowId, setExecutingWorkflowId] = useState<number | null>(null)
  const [workflowRuns, setWorkflowRuns] = useState<Record<number, any[]>>({})
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null)
  const [runEvents, setRunEvents] = useState<any[]>([])
  const [viewingExecution, setViewingExecution] = useState<{ runId: number; workflowId: number; draftId: number } | null>(null)
  const [documentForm, setDocumentForm] = useState({
    name: '',
    format: 'markdown' as DocumentRecord['type'],
    content: ''
  })
  const [isExportingDocument, setIsExportingDocument] = useState(false)
  const [logPath, setLogPath] = useState('')
  const [telemetryEnabled, setTelemetryEnabledState] = useState(false)
  const [telemetryUpdating, setTelemetryUpdating] = useState(false)
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null)
  const [notificationForm, setNotificationForm] = useState({
    quietStart: '',
    quietEnd: '',
    channels: ''
  })
  const [notificationSaving, setNotificationSaving] = useState(false)
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [scheduleForm, setScheduleForm] = useState({
    workflowId: '',
    cron: '',
    timezone: 'UTC',
    cronPattern: 'custom' as 'custom' | 'daily' | 'weekly' | 'monthly' | 'hourly',
    dailyTime: '09:00',
    weeklyDay: 'monday',
    weeklyTime: '09:00',
    monthlyDay: '1',
    monthlyTime: '09:00',
    hourlyMinute: '0'
  })
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  const loadTestSuites = useCallback(async () => {
    try {
      setTestSuitesLoading(true)
      const suites = await window.electronAPI.listTestSuites()
      setTestSuites(suites)
      setSelectedSuiteId((prev) => prev ?? suites[0]?.id ?? null)
    } catch (error) {
      console.error('Failed to load test suites:', error)
    } finally {
      setTestSuitesLoading(false)
    }
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true)
      const records = await window.electronAPI.listDocuments()
      setDocuments(records)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  const loadDrafts = useCallback(async () => {
    try {
      setDraftsLoading(true)
      const data = await window.electronAPI.listWorkflowDrafts()
      setDrafts(data)
    } catch (error) {
      console.error('Failed to load drafts:', error)
    } finally {
      setDraftsLoading(false)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    try {
      const templates = await window.electronAPI.listWorkflowTemplates()
      setWorkflowTemplates(templates)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }, [])

  const loadDiagnostics = useCallback(async () => {
    try {
      setDiagnosticsLoading(true)
      setSchedulesLoading(true)
      const [path, telemetry, prefs, scheduleRecords] = await Promise.all([
        window.electronAPI.getLogPath(),
        window.electronAPI.getTelemetryEnabled(),
        window.electronAPI.getNotificationPreferences(),
        window.electronAPI.listSchedules()
      ])
      setLogPath(path)
      setTelemetryEnabledState(telemetry)
      setNotifications(prefs)
      setNotificationForm({
        quietStart: prefs.quietHours.start,
        quietEnd: prefs.quietHours.end,
        channels: prefs.channels.join(', ')
      })
      setSchedules(scheduleRecords)
    } catch (error) {
      console.error('Failed to load diagnostics:', error)
    } finally {
      setDiagnosticsLoading(false)
      setSchedulesLoading(false)
    }
  }, [])

  const refreshSchedules = useCallback(async () => {
    try {
      setSchedulesLoading(true)
      const scheduleRecords = await window.electronAPI.listSchedules()
      setSchedules(scheduleRecords)
    } catch (error) {
      console.error('Failed to load schedules:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWorkflows()
    loadAppVersion()
    loadTestSuites()
    loadConnectors()
    loadDocuments()
    loadDrafts()
    loadDiagnostics()
    loadTemplates()
  }, [loadTestSuites, loadDocuments, loadDrafts, loadDiagnostics, loadTemplates])

  // Load runs when workflows change
  useEffect(() => {
    workflows.forEach((w) => {
      loadWorkflowRuns(w.id)
    })
  }, [workflows.map((w) => w.id).join(',')])

  useEffect(() => {
    if (!selectedSuiteId && testSuites.length > 0) {
      setSelectedSuiteId(testSuites[0].id)
    } else if (selectedSuiteId && !testSuites.some((suite) => suite.id === selectedSuiteId)) {
      setSelectedSuiteId(testSuites[0]?.id ?? null)
    }
  }, [testSuites, selectedSuiteId])

  const loadAppVersion = async () => {
    const version = await window.electronAPI.getAppVersion()
    setAppVersion(version)
  }

  const loadWorkflows = async () => {
    try {
      setLoading(true)
      const data = await window.electronAPI.getWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkflow.name.trim()) return

    try {
      await window.electronAPI.createWorkflow(newWorkflow)
      setNewWorkflow({ name: '', description: '' })
      setShowCreateForm(false)
      loadWorkflows()
    } catch (error) {
      console.error('Failed to create workflow:', error)
    }
  }

  const handleDeleteWorkflow = async (id: number) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      try {
        await window.electronAPI.deleteWorkflow(id)
        loadWorkflows()
      } catch (error) {
        console.error('Failed to delete workflow:', error)
      }
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await window.electronAPI.updateWorkflow(id, { status })
      loadWorkflows()
    } catch (error) {
      console.error('Failed to update workflow:', error)
    }
  }

  const handleExportWorkflow = async (workflowId: number) => {
    try {
      // Find draft for this workflow
      const draftsList = await window.electronAPI.listWorkflowDrafts()
      const workflow = workflows.find((w) => w.id === workflowId)
      const draft = draftsList.find((d) => d.name === workflow?.name)
      
      if (!draft) {
        alert('No draft found for this workflow. Please create and publish a draft first.')
        return
      }

      const manifest = await window.electronAPI.exportWorkflow(draft.id)
      
      // Create download
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${workflow?.name || 'workflow'}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      alert('Workflow exported successfully!')
    } catch (error) {
      console.error('Failed to export workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to export workflow')
    }
  }

  const handleImportWorkflow = async () => {
    try {
      // Create file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        try {
          const text = await file.text()
          const manifest = JSON.parse(text)
          
          const result = await window.electronAPI.importWorkflow(manifest)
          
          if (!result.success) {
            alert(`Import failed:\n${result.errors.join('\n')}\n\nWarnings:\n${result.warnings.join('\n')}`)
            return
          }

          if (result.warnings.length > 0) {
            const proceed = confirm(`Import warnings:\n${result.warnings.join('\n')}\n\nContinue?`)
            if (!proceed) return
          }

          // Create draft from imported workflow
          if (result.draft) {
            const draft = await window.electronAPI.createWorkflowDraft({
              name: result.draft.name,
              description: result.draft.description
            })
            await window.electronAPI.autosaveWorkflowDraft(draft.id, {
              nodes: result.draft.nodes,
              transitions: result.draft.transitions
            })
            await loadDrafts()
            alert('Workflow imported successfully! Check the Drafts section.')
          }
        } catch (error) {
          console.error('Failed to import workflow:', error)
          alert(error instanceof Error ? error.message : 'Failed to import workflow')
        }
      }
      input.click()
    } catch (error) {
      console.error('Failed to import workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to import workflow')
    }
  }

  const handleExecuteWorkflow = async (workflowId: number) => {
    try {
      setExecutingWorkflowId(workflowId)
      // Find draft for this workflow (for now, use first draft - in production, link workflows to drafts)
      const draftsList = await window.electronAPI.listWorkflowDrafts()
      const draft = draftsList.find((d) => d.name === workflows.find((w) => w.id === workflowId)?.name)
      if (!draft) {
        alert('No draft found for this workflow. Please create and publish a draft first.')
        return
      }
      const result = await window.electronAPI.executeWorkflow(draft.id, workflowId)
      await loadWorkflowRuns(workflowId)
      // Open execution view
      setViewingExecution({ runId: result.runId, workflowId, draftId: draft.id })
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      alert(error instanceof Error ? error.message : 'Failed to execute workflow')
    } finally {
      setExecutingWorkflowId(null)
    }
  }

  const loadWorkflowRuns = async (workflowId: number) => {
    try {
      const runs = await window.electronAPI.listWorkflowRuns(workflowId)
      setWorkflowRuns((prev) => ({ ...prev, [workflowId]: runs }))
    } catch (error) {
      console.error('Failed to load workflow runs:', error)
    }
  }

  const loadRunEvents = async (runId: number) => {
    try {
      const events = await window.electronAPI.getWorkflowRunEvents(runId)
      setRunEvents(events)
    } catch (error) {
      console.error('Failed to load run events:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981'
      case 'paused':
        return '#f59e0b'
      case 'completed':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const handleRunSuite = async (suiteId: string) => {
    setRunningSuiteId(suiteId)
    setTestError(null)
    setTestRunResult(null)
    try {
      const result = await window.electronAPI.runTestSuite(suiteId)
      setTestRunResult(result)
      await loadTestSuites()
    } catch (error) {
      console.error('Failed to run suite:', error)
      setTestError(error instanceof Error ? error.message : 'Failed to run test suite')
    } finally {
      setRunningSuiteId(null)
    }
  }

  const loadConnectors = async () => {
    try {
      setConnectorLoading(true)
      setConnectorError(null)
      const data = await window.electronAPI.listConnectors()
      setConnectors(data)
    } catch (error) {
      console.error('Failed to load connectors:', error)
      setConnectorError(error instanceof Error ? error.message : 'Failed to load connectors')
    } finally {
      setConnectorLoading(false)
    }
  }

  const resetConnectorForm = () => {
    setSelectedConnectorType(null)
    setConnectorApiKey('')
    setConnectorSelectedModel('')
    setConnectorCustomModel('')
    setConnectorAvailableModels([])
  }

  const loadConnectorModels = async (connectorType: 'claude' | 'chatgpt', apiKey: string) => {
    if (!apiKey.trim()) {
      setConnectorAvailableModels([])
      return
    }
    
    try {
      setConnectorLoadingModels(true)
      // Temporarily create connector to list models
      const connectorId = connectorType === 'claude' ? 'llm.claude' : 'llm.chatgpt'
      
      // We need to register temporarily to get models, or call API directly
      // For now, let's use a workaround - register temporarily
      const tempSecretKey = connectorType === 'claude' ? 'connector:llm:claude:temp' : 'connector:llm:openai:temp'
      await window.electronAPI.storeSecret({ key: tempSecretKey, value: apiKey.trim() })
      
      // Create a temporary connector to fetch models
      // We need to register it, wait a bit for initialization, then list models
      const tempConnectorDef = {
        id: connectorId + ':temp',
        name: connectorType === 'claude' ? 'Claude (Temp)' : 'ChatGPT (Temp)',
        kind: 'llm' as const,
        version: '1.0.0',
        description: 'Temporary connector for model listing',
        capabilities: [],
        requiresSecrets: [tempSecretKey],
        config: {} // No default model needed for temp connector
      }
      
      try {
        // Register the temp connector
        await window.electronAPI.registerConnector(tempConnectorDef)
        
        // Give it a moment for async initialization to complete
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Now try to list models
        const models = await window.electronAPI.listConnectorModels(connectorId + ':temp')
        
        if (models.length > 0) {
          setConnectorAvailableModels(models)
          if (!connectorSelectedModel) {
            setConnectorSelectedModel(models[0].id)
          }
        } else {
          // If no models returned, use fallback
          throw new Error('No models returned from API')
        }
        
        // Clean up temp connector
        await window.electronAPI.removeConnector(connectorId + ':temp')
        await window.electronAPI.storeSecret({ key: tempSecretKey, value: '' })
      } catch (error) {
        console.warn('Failed to fetch models from API, using fallback:', error)
        // If registration fails, use fallback models
        const fallbackModels = connectorType === 'claude'
          ? [
              { id: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5 (2025-09-29) - Latest' },
              { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet (2024-10-22)' },
              { id: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku (2024-10-22)' },
              { id: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus (2024-02-29)' }
            ]
          : [
              { id: 'gpt-4-turbo-preview', displayName: 'GPT-4 Turbo' },
              { id: 'gpt-4', displayName: 'GPT-4' },
              { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' }
            ]
        setConnectorAvailableModels(fallbackModels)
        if (!connectorSelectedModel && fallbackModels.length > 0) {
          setConnectorSelectedModel(fallbackModels[0].id)
        }
        
        // Still try to clean up temp connector if it was created
        try {
          await window.electronAPI.removeConnector(connectorId + ':temp')
          await window.electronAPI.storeSecret({ key: tempSecretKey, value: '' })
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      setConnectorAvailableModels([])
    } finally {
      setConnectorLoadingModels(false)
    }
  }

  const validateApiKey = (apiKey: string, type: 'claude' | 'chatgpt'): { valid: boolean; error?: string } => {
    const trimmed = apiKey.trim()
    
    if (!trimmed) {
      return { valid: false, error: 'API key cannot be empty' }
    }
    
    if (type === 'claude') {
      // Claude API keys start with "sk-ant-" and are typically 48+ characters
      if (!trimmed.startsWith('sk-ant-')) {
        return { valid: false, error: 'Claude API key must start with "sk-ant-"' }
      }
      if (trimmed.length < 48) {
        return { valid: false, error: 'Claude API key appears to be too short (minimum 48 characters)' }
      }
      if (trimmed.length > 200) {
        return { valid: false, error: 'Claude API key appears to be too long (maximum 200 characters)' }
      }
    } else if (type === 'chatgpt') {
      // ChatGPT API keys start with "sk-" and are typically 48+ characters
      if (!trimmed.startsWith('sk-')) {
        return { valid: false, error: 'ChatGPT API key must start with "sk-"' }
      }
      if (trimmed.length < 48) {
        return { valid: false, error: 'ChatGPT API key appears to be too short (minimum 48 characters)' }
      }
      if (trimmed.length > 200) {
        return { valid: false, error: 'ChatGPT API key appears to be too long (maximum 200 characters)' }
      }
    }
    
    return { valid: true }
  }

  const handleRegisterConnector = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedConnectorType || !connectorApiKey.trim()) {
      setConnectorError('Please select a connector type and provide an API key.')
      return
    }
    
    // Validate API key format
    const validation = validateApiKey(connectorApiKey, selectedConnectorType)
    if (!validation.valid) {
      setConnectorError(validation.error || 'Invalid API key format')
      return
    }
    
    try {
      setConnectorSubmitting(true)
      setConnectorError(null)
      
      // Store the API key in the credential vault first
      const secretKey = selectedConnectorType === 'claude' 
        ? 'connector:llm:claude' 
        : 'connector:llm:openai'
      // Store API key, ensuring it's trimmed
      const trimmedApiKey = connectorApiKey.trim()
      await window.electronAPI.storeSecret({ key: secretKey, value: trimmedApiKey })
      
      // Register the connector with predefined metadata and selected model
      const connectorDef = selectedConnectorType === 'claude'
        ? {
            id: 'llm.claude',
            name: 'Claude (Anthropic)',
            kind: 'llm' as const,
            version: '1.0.0',
            description: 'Anthropic Claude AI assistant',
            capabilities: [{ name: 'chat', description: 'Chat completion' }, { name: 'text', description: 'Text generation' }],
            requiresSecrets: [secretKey],
            config: { defaultModel: connectorSelectedModel === '__custom__' ? connectorCustomModel : (connectorSelectedModel || 'claude-sonnet-4-5-20250929') }
          }
        : {
            id: 'llm.chatgpt',
            name: 'ChatGPT (OpenAI)',
            kind: 'llm' as const,
            version: '1.0.0',
            description: 'OpenAI ChatGPT AI assistant',
            capabilities: [{ name: 'chat', description: 'Chat completion' }, { name: 'text', description: 'Text generation' }],
            requiresSecrets: [secretKey],
            config: { defaultModel: connectorSelectedModel || 'gpt-4-turbo-preview' }
          }
      
      await window.electronAPI.registerConnector(connectorDef)
      await loadConnectors()
      resetConnectorForm()
      setShowConnectorForm(false)
    } catch (error) {
      console.error('Failed to register connector:', error)
      setConnectorError(error instanceof Error ? error.message : 'Failed to register connector.')
    } finally {
      setConnectorSubmitting(false)
    }
  }

  const handleRemoveConnector = async (id: string) => {
    try {
      await window.electronAPI.removeConnector(id)
      await loadConnectors()
    } catch (error) {
      console.error('Failed to remove connector:', error)
      alert('Failed to remove connector.')
    }
  }

  const handleTestConnector = async (id: string) => {
    try {
      setConnectorLoading(true)
      await window.electronAPI.testConnector(id)
      await loadConnectors()
    } catch (error) {
      console.error('Connector test failed:', error)
      setConnectorError(error instanceof Error ? error.message : 'Connector test failed')
    } finally {
      setConnectorLoading(false)
    }
  }

  const handleDocumentFormChange = (field: 'name' | 'format' | 'content', value: string) => {
    setDocumentForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyLogPath = async () => {
    if (!logPath) return
    try {
      await navigator.clipboard.writeText(logPath)
      alert('Log path copied to clipboard.')
    } catch (error) {
      console.error('Failed to copy log path:', error)
      alert('Failed to copy log path.')
    }
  }

  const handleTelemetryToggle = async () => {
    try {
      setTelemetryUpdating(true)
      const updated = await window.electronAPI.setTelemetryEnabled(!telemetryEnabled)
      setTelemetryEnabledState(updated)
    } catch (error) {
      console.error('Failed to update telemetry setting:', error)
      alert('Failed to update telemetry setting.')
    } finally {
      setTelemetryUpdating(false)
    }
  }

  const handleNotificationInputChange = (
    field: 'quietStart' | 'quietEnd' | 'channels',
    value: string
  ) => {
    setNotificationForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleNotificationSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!notifications) return
    try {
      setNotificationSaving(true)
      const channels = notificationForm.channels
        .split(',')
        .map((channel) => channel.trim())
        .filter(Boolean)
      const payload = {
        quietHours: {
          start: notificationForm.quietStart || notifications.quietHours.start,
          end: notificationForm.quietEnd || notifications.quietHours.end
        },
        channels: channels.length ? channels : notifications.channels
      }
      const updated = await window.electronAPI.setNotificationPreferences(payload)
      setNotifications(updated)
      setNotificationForm({
        quietStart: updated.quietHours.start,
        quietEnd: updated.quietHours.end,
        channels: updated.channels.join(', ')
      })
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      alert('Failed to save notification preferences.')
    } finally {
      setNotificationSaving(false)
    }
  }

  const handleValidateDraft = async (id: number) => {
    try {
      setDraftActionId(id)
      const result = await window.electronAPI.validateWorkflowDraft(id)
      if (result.valid) {
        alert(
          result.warnings.length
            ? `Valid with warnings:\n${result.warnings.join('\n')}`
            : 'Draft valid'
        )
      } else {
        alert(`Draft invalid:\n${result.errors.join('\n')}`)
      }
    } catch (error) {
      console.error('Failed to validate draft:', error)
      alert('Failed to validate draft.')
    } finally {
      setDraftActionId(null)
    }
  }

  const handlePublishDraft = async (id: number) => {
    try {
      setDraftActionId(id)
      const result = await window.electronAPI.publishWorkflowDraft(id)
      alert(`Published workflow #${result.workflow.id}`)
      await loadWorkflows()
      await loadDrafts()
    } catch (error) {
      console.error('Failed to publish draft:', error)
      alert('Publish failed. Check validation errors in CLI/logs.')
    } finally {
      setDraftActionId(null)
    }
  }

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Delete this draft?')) {
      return
    }
    try {
      setDraftActionId(id)
      await window.electronAPI.deleteWorkflowDraft(id)
      await loadDrafts()
    } catch (error) {
      console.error('Failed to delete draft:', error)
      alert('Failed to delete draft.')
    } finally {
      setDraftActionId(null)
    }
  }

  const handleSaveDesigner = async (nodes: any[], transitions: any[]) => {
    if (!designingDraftId) return
    
    try {
      console.log('Saving draft:', { draftId: designingDraftId, nodes, transitions })
      await window.electronAPI.autosaveWorkflowDraft(designingDraftId, {
        nodes: nodes as any,
        transitions: transitions as any
      })
      // Update current draft without reloading all drafts (faster)
      const updated = await window.electronAPI.getWorkflowDraft(designingDraftId)
      if (updated) {
        console.log('Draft updated:', updated)
        setCurrentDraft(updated as any)
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
      alert('Failed to save workflow changes.')
    }
  }

  // Load draft when opening designer - always reload when draft ID changes
  useEffect(() => {
    if (designingDraftId) {
      window.electronAPI.getWorkflowDraft(designingDraftId).then((draft) => {
        if (draft) {
          setCurrentDraft(draft as any)
        }
      }).catch((error) => {
        console.error('Failed to load draft:', error)
      })
    } else {
      // Clear draft when closing designer
      setCurrentDraft(null)
    }
  }, [designingDraftId])

  const handleExportDocument = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!documentForm.name.trim() || !documentForm.content.trim()) {
      alert('Provide a document name and content before exporting.')
      return
    }
    try {
      setIsExportingDocument(true)
      const result = await window.electronAPI.exportDocument({
        name: documentForm.name,
        format: documentForm.format,
        content: documentForm.content
      })
      alert(`✅ Document saved to ${result.path}`)
      setDocumentForm({ name: '', format: documentForm.format, content: '' })
      await loadDocuments()
    } catch (error) {
      console.error('Failed to export document:', error)
      alert('Document export failed. Check logs for details.')
    } finally {
      setIsExportingDocument(false)
    }
  }

  const handleRunAllSuites = async () => {
    if (!testSuites.length) {
      return
    }
    setRunningSuiteId('all')
    setTestError(null)
    setTestRunResult(null)
    try {
      let lastResult: TestRunResult | null = null
      for (const suite of testSuites) {
        const result = await window.electronAPI.runTestSuite(suite.id)
        lastResult = result
        await loadTestSuites()
      }
      if (lastResult) {
        setTestRunResult(lastResult)
      }
    } catch (error) {
      console.error('Failed to run all suites:', error)
      setTestError(error instanceof Error ? error.message : 'Failed to run all suites')
    } finally {
      setRunningSuiteId(null)
    }
  }

  const currentSuite = selectedSuiteId
    ? (testSuites.find((suite) => suite.id === selectedSuiteId) ?? null)
    : null

  const currentResult =
    testRunResult && currentSuite && testRunResult.suiteId === currentSuite.id
      ? testRunResult
      : (currentSuite?.lastRun ?? null)

  const canExportAllResults = useMemo(
    () => testSuites.some((suite) => suite.lastRun !== null),
    [testSuites]
  )

  const buildTestRunBundle = useCallback((): TestRunBundle | null => {
    if (!testSuites.length) {
      return null
    }
    const suites = testSuites.map((suite) => ({
      suiteId: suite.id,
      suiteName: suite.name,
      result: suite.lastRun
    }))
    const totalCompleted = suites.filter((entry) => entry.result !== null).length
    if (totalCompleted === 0) {
      return null
    }
    return {
      generatedAt: new Date().toISOString(),
      totalSuites: suites.length,
      totalCompleted,
      suites
    }
  }, [testSuites])

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return '—'
    const seconds = durationMs / 1000
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Number((seconds % 60).toFixed(0))
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatTimestamp = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const formatScheduleTime = (value?: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString()
  }

  const getSuiteStatusLabel = (suite: ListedTestSuite) => {
    if (suite.isRunning) return 'Running...'
    if (!suite.lastRun) return 'Never run'
    return suite.lastRun.status === 'passed' ? 'Passed' : 'Needs attention'
  }

  const getSuiteStatusClass = (suite: ListedTestSuite) => {
    if (suite.isRunning) return 'status-running'
    if (!suite.lastRun) return 'status-idle'
    return suite.lastRun.status === 'passed' ? 'status-passed' : 'status-failed'
  }

  const handleExportResult = async () => {
    if (!currentResult) return
    try {
      const response = await window.electronAPI.exportTestResult(currentResult)
      if (response.canceled || !response.path) {
        return
      }
      alert(`✅ Test result saved to ${response.path}`)
    } catch (error) {
      console.error('Failed to export test result:', error)
      alert('Failed to export test result. Check logs for details.')
    }
  }

  const handleCopyResult = async () => {
    if (!currentResult) return
    try {
      const resultText = [
        `Test Suite: ${currentSuite?.name || currentResult.suiteId}`,
        `Status: ${currentResult.status.toUpperCase()}`,
        `Started: ${formatTimestamp(currentResult.startedAt)}`,
        `Finished: ${formatTimestamp(currentResult.finishedAt)}`,
        `Duration: ${formatDuration(currentResult.durationMs)}`,
        currentResult.exitCode !== null ? `Exit Code: ${currentResult.exitCode}` : '',
        currentResult.errorMessage ? `Error: ${currentResult.errorMessage}` : '',
        '',
        'Logs:',
        '---',
        ...currentResult.logs
      ]
        .filter((line) => line !== '')
        .join('\n')

      await navigator.clipboard.writeText(resultText)
      alert('✅ Test result copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy test result:', error)
      alert('Failed to copy test result. Check logs for details.')
    }
  }

  const handleExportAllResults = async () => {
    const bundle = buildTestRunBundle()
    if (!bundle) {
      alert('Run at least one suite before exporting combined results.')
      return
    }
    try {
      setIsExportingAll(true)
      const response = await window.electronAPI.exportAllTestResults(bundle)
      if (response.canceled || !response.path) {
        return
      }
      alert(`✅ All test results saved to ${response.path}`)
    } catch (error) {
      console.error('Failed to export all test results:', error)
      alert('Failed to export all test results. Check logs for details.')
    } finally {
      setIsExportingAll(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🤖 AI Workflow Manager</h1>
          <span className="version">v{appVersion}</span>
        </div>
      </header>

      <main className="main">
            <div className="toolbar">
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  onClick={handleImportWorkflow}
                  title="Import workflow from JSON file"
                >
                  Import Workflow
                </button>
              </div>
              <div className="tab-switcher">
            <button
              className={`tab-button ${activeTab === 'workflows' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab('workflows')}
            >
              Workflows
            </button>
            <button
              className={`tab-button ${activeTab === 'tests' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setActiveTab('tests')
                if (!testSuites.length) {
                  loadTestSuites()
                }
              }}
            >
              Test Console
            </button>
            <button
              className={`tab-button ${activeTab === 'diagnostics' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setActiveTab('diagnostics')
                loadDiagnostics()
              }}
            >
              Diagnostics
            </button>
            <button
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setActiveTab('settings')
                loadDiagnostics()
                loadConnectors()
                loadDocuments()
              }}
            >
              Settings
            </button>
          </div>
          {activeTab === 'workflows' && (
            <button
              className="btn-primary"
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? '✕ Cancel' : '+ New Workflow'}
            </button>
          )}
        </div>

        {activeTab === 'workflows' && (
          <>
            <section className="draft-section">
              <div className="draft-header">
                <div>
                  <h3>Workflow Drafts</h3>
                  <p>Validate and publish drafts before activating workflows.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => setShowCreateDraftForm(true)}
                  >
                    + Create Draft
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={loadDrafts}
                    disabled={draftsLoading}
                  >
                    {draftsLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>
              {draftsLoading ? (
                <div className="loading small">Loading drafts…</div>
              ) : drafts.length === 0 ? (
                <div className="empty-state compact">
                  <p>No drafts yet. Click "+ Create Draft" above to create your first workflow draft.</p>
                </div>
              ) : (
                <div className="draft-grid">
                  {drafts.map((draft) => (
                    <div key={draft.id} className="draft-card">
                      <div className="draft-card-header">
                        <div>
                          <h4>{draft.name}</h4>
                          <small>
                            v{draft.version} · {draft.status}
                          </small>
                        </div>
                        <span className="draft-updated">
                          Updated {new Date(draft.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="draft-actions">
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => {
                            setDesigningDraftId(draft.id)
                            setCurrentDraft(draft)
                          }}
                        >
                          Open Designer
                        </button>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => handleValidateDraft(draft.id)}
                          disabled={draftActionId === draft.id}
                        >
                          {draftActionId === draft.id ? 'Working…' : 'Validate'}
                        </button>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => handlePublishDraft(draft.id)}
                          disabled={draftActionId === draft.id}
                        >
                          Publish
                        </button>
                        <button
                          className="btn-danger"
                          type="button"
                          onClick={() => handleDeleteDraft(draft.id)}
                          disabled={draftActionId === draft.id}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {showCreateDraftForm && (
              <div className="create-form" style={{ marginTop: '20px' }}>
                <h2>Create New Workflow Draft</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!newDraftName.trim()) {
                    alert('Please enter a draft name')
                    return
                  }
                  try {
                    setCreatingDraft(true)
                    const draft = await window.electronAPI.createWorkflowDraft({ 
                      name: newDraftName.trim(),
                      description: newDraftDescription.trim() || undefined
                    })
                    setShowCreateDraftForm(false)
                    setNewDraftName('')
                    setNewDraftDescription('')
                    await loadDrafts()
                    // Auto-open designer for new draft
                    setDesigningDraftId(draft.id)
                    setCurrentDraft(draft as any)
                  } catch (error) {
                    console.error('Failed to create draft:', error)
                    alert('Failed to create draft.')
                  } finally {
                    setCreatingDraft(false)
                  }
                }}>
                  <div className="form-group">
                    <label htmlFor="draft-name">Name *</label>
                    <input
                      type="text"
                      id="draft-name"
                      value={newDraftName}
                      onChange={(e) => setNewDraftName(e.target.value)}
                      placeholder="Enter draft name"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="draft-description">Description</label>
                    <textarea
                      id="draft-description"
                      value={newDraftDescription}
                      onChange={(e) => setNewDraftDescription(e.target.value)}
                      placeholder="Enter draft description (optional)"
                      rows={3}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" disabled={creatingDraft}>
                      {creatingDraft ? 'Creating...' : 'Create Draft'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setShowCreateDraftForm(false)
                        setNewDraftName('')
                        setNewDraftDescription('')
                      }}
                      disabled={creatingDraft}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showTemplateSelection && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}>
                <div style={{
                  backgroundColor: '#1e1e1e',
                  borderRadius: '8px',
                  padding: '30px',
                  maxWidth: '600px',
                  width: '100%',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                  <h2 style={{ color: '#fff', marginTop: 0 }}>Select a Template</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                    {workflowTemplates.map((template) => (
                      <div
                        key={template.name}
                        onClick={async () => {
                          try {
                            setCreatingDraft(true)
                            const draft = await window.electronAPI.createWorkflowDraft({
                              name: template.name,
                              description: template.description
                            })
                            await window.electronAPI.autosaveWorkflowDraft(draft.id, {
                              nodes: template.nodes,
                              transitions: template.transitions
                            })
                            setShowTemplateSelection(false)
                            await loadDrafts()
                            setDesigningDraftId(draft.id)
                            setCurrentDraft(draft as any)
                          } catch (error) {
                            console.error('Failed to create draft from template:', error)
                            alert('Failed to create draft from template.')
                          } finally {
                            setCreatingDraft(false)
                          }
                        }}
                        style={{
                          padding: '15px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <h3 style={{ color: '#fff', margin: '0 0 5px 0' }}>{template.name}</h3>
                        <p style={{ color: '#aaa', margin: 0, fontSize: '14px' }}>{template.description}</p>
                        <span style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                          Category: {template.category}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowTemplateSelection(false)}
                    className="btn-secondary"
                    style={{ marginTop: '20px', width: '100%' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {designingDraftId && currentDraft && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#0a0a0a',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  padding: '15px 20px',
                  background: '#1a1a1a',
                  borderBottom: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  <h2 style={{ margin: 0, flex: 1, color: '#fff' }}>Designing: {currentDraft.name}</h2>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => {
                      setDesigningDraftId(null)
                      setCurrentDraft(null)
                      setSelectedNodeId(null)
                    }}
                  >
                    Close Designer
                  </button>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  {currentDraft && (
                    <WorkflowDesigner
                      draftId={designingDraftId}
                      nodes={Array.isArray(currentDraft.nodes) ? (currentDraft.nodes as any) : []}
                      transitions={Array.isArray(currentDraft.transitions) ? (currentDraft.transitions as any) : []}
                      onSave={handleSaveDesigner}
                      onNodeSelect={setSelectedNodeId}
                      selectedNodeId={selectedNodeId}
                    />
                  )}
                </div>
              </div>
            )}

            {showCreateForm && (
              <div className="create-form">
                <h2>Create New Workflow</h2>
                <form onSubmit={handleCreateWorkflow}>
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={newWorkflow.name}
                      onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                      placeholder="Enter workflow name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={newWorkflow.description}
                      onChange={(e) =>
                        setNewWorkflow({ ...newWorkflow, description: e.target.value })
                      }
                      placeholder="Enter workflow description"
                      rows={3}
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Create Workflow
                  </button>
                </form>
              </div>
            )}

            <div className="workflows-container">
              {loading ? (
                <div className="loading">Loading workflows...</div>
              ) : workflows.length === 0 ? (
                <div className="empty-state">
                  <p>No workflows yet. Create your first workflow to get started!</p>
                </div>
              ) : (
                <div className="workflows-grid">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="workflow-card">
                      <div className="workflow-header">
                        <h3>{workflow.name}</h3>
                        <div
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(workflow.status) }}
                        >
                          {workflow.status}
                        </div>
                      </div>
                      <p className="workflow-description">
                        {workflow.description || 'No description'}
                      </p>
                      <div className="workflow-meta">
                        <small>Created: {new Date(workflow.created_at).toLocaleDateString()}</small>
                      </div>
                      <div className="workflow-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                          className="btn-primary"
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                          disabled={executingWorkflowId === workflow.id}
                        >
                          {executingWorkflowId === workflow.id ? 'Starting…' : 'Run'}
                        </button>
                        <select
                          value={workflow.status}
                          onChange={(e) => handleStatusChange(workflow.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Completed</option>
                        </select>
                        <button
                          className="btn-secondary"
                          onClick={() => handleExportWorkflow(workflow.id)}
                          title="Export workflow"
                        >
                          Export
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                        >
                          Delete
                        </button>
                      </div>
                      {workflowRuns[workflow.id] && workflowRuns[workflow.id].length > 0 && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#888' }}>
                          <strong>Runs:</strong> {workflowRuns[workflow.id].length}
                          {workflowRuns[workflow.id].some((r) => r.status === 'running') && (
                            <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>● Running</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <section className="connector-section">
              <div className="connector-header">
                <h3>Connector Health</h3>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={loadConnectors}
                  disabled={connectorLoading}
                >
                  {connectorLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowConnectorForm((prev) => !prev)}
                >
                  {showConnectorForm ? 'Cancel' : 'Add Connector'}
                </button>
              </div>
              {showConnectorForm && (
                <div className="connector-form-card">
                  <form className="notification-form" onSubmit={handleRegisterConnector}>
                    {!selectedConnectorType ? (
                      <>
                        <h4 style={{ marginBottom: '1rem', color: '#fff' }}>Select Connector Type</h4>
                        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setSelectedConnectorType('claude')}
                            style={{ width: '100%', padding: '1rem' }}
                          >
                            Claude (Anthropic)
                          </button>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setSelectedConnectorType('chatgpt')}
                            style={{ width: '100%', padding: '1rem' }}
                          >
                            ChatGPT (OpenAI)
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectedConnectorType(null)}
                            style={{ padding: '0.5rem 1rem' }}
                          >
                            ← Back
                          </button>
                          <h4 style={{ color: '#fff', margin: 0 }}>
                            {selectedConnectorType === 'claude' ? 'Claude (Anthropic)' : 'ChatGPT (OpenAI)'}
                          </h4>
                        </div>
                        <div className="form-group">
                          <label htmlFor="connector-api-key">
                            API Key
                            {selectedConnectorType === 'claude' && (
                              <small style={{ display: 'block', color: '#888', marginTop: '0.25rem' }}>
                                Get your API key from{' '}
                                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                  Anthropic Console
                                </a>
                              </small>
                            )}
                            {selectedConnectorType === 'chatgpt' && (
                              <small style={{ display: 'block', color: '#888', marginTop: '0.25rem' }}>
                                Get your API key from{' '}
                                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                  OpenAI Platform
                                </a>
                              </small>
                            )}
                          </label>
                  <input
                    id="connector-api-key"
                    type="password"
                    value={connectorApiKey}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setConnectorApiKey(newValue)
                      
                      // Clear previous errors when user types
                      if (connectorError) {
                        setConnectorError(null)
                      }
                      
                      // Validate format as user types (but don't block)
                      if (newValue.trim().length > 0) {
                        const validation = validateApiKey(newValue, selectedConnectorType)
                        if (!validation.valid && newValue.trim().length > 5) {
                          // Only show error if they've typed enough to see the pattern
                          setConnectorError(validation.error || 'Invalid API key format')
                        } else if (validation.valid) {
                          setConnectorError(null)
                        }
                      }
                      
                      // Load models when API key is entered and valid
                      if (newValue.trim().length > 10) {
                        const keyValidation = validateApiKey(newValue, selectedConnectorType)
                        if (keyValidation.valid) {
                          loadConnectorModels(selectedConnectorType, newValue)
                        }
                      } else {
                        setConnectorAvailableModels([])
                        setConnectorSelectedModel('')
                      }
                    }}
                    placeholder={selectedConnectorType === 'claude' ? 'sk-ant-...' : 'sk-...'}
                    required
                    autoFocus
                  />
                  {connectorApiKey.trim().length > 0 && (
                    <small style={{ display: 'block', color: connectorError ? '#ef4444' : '#888', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      {connectorError || (selectedConnectorType === 'claude' 
                        ? 'Format: sk-ant-... (48+ characters)'
                        : 'Format: sk-... (48+ characters)')}
                    </small>
                  )}
                </div>
                {connectorAvailableModels.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="connector-model">
                      Model
                      <small style={{ display: 'block', color: '#888', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                        If your model isn't listed, you can type it manually below
                      </small>
                    </label>
                    {connectorLoadingModels ? (
                      <div style={{ color: '#888', fontSize: '0.875rem' }}>Loading models...</div>
                    ) : (
                      <>
                        <select
                          id="connector-model"
                          value={connectorSelectedModel}
                          onChange={(e) => setConnectorSelectedModel(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', marginBottom: '0.5rem' }}
                        >
                          {connectorAvailableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.displayName || model.name || model.id}
                            </option>
                          ))}
                          <option value="__custom__">Custom model (enter below)</option>
                        </select>
                        {connectorSelectedModel === '__custom__' && (
                          <input
                            type="text"
                            placeholder="Enter model name (e.g., claude-3-5-sonnet-20241022)"
                            value={connectorCustomModel}
                            onChange={(e) => {
                              setConnectorCustomModel(e.target.value.trim())
                            }}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff' }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
                <button 
                  className="btn-primary" 
                  type="submit" 
                  disabled={connectorSubmitting || connectorLoadingModels || (connectorSelectedModel === '__custom__' && !connectorCustomModel.trim())}
                >
                  {connectorSubmitting ? 'Saving…' : 'Connect'}
                </button>
                      </>
                    )}
                  </form>
                </div>
              )}
              {connectorError && <div className="test-error">{connectorError}</div>}
              {connectorLoading ? (
                <div className="loading small">Loading connectors…</div>
              ) : connectors.length === 0 ? (
                <div className="empty-state compact">
                  <p>No connectors registered.</p>
                </div>
              ) : (
                <div className="connector-grid">
                  {connectors.map((connector) => (
                    <div key={connector.id} className="connector-card">
                      <div className="connector-card-header">
                        <div>
                          <h4>{connector.name}</h4>
                          <small>
                            {connector.kind} · v{connector.version}
                          </small>
                        </div>
                        <span
                          className={`suite-status ${connector.status === 'ready' ? 'status-passed' : connector.status === 'error' ? 'status-failed' : 'status-idle'}`}
                        >
                          {connector.status.toUpperCase()}
                        </span>
                      </div>
                      {connector.description && <p>{connector.description}</p>}
                      {connector.lastHealthCheck && (
                        <div className="connector-health">
                          <strong>{connector.lastHealthCheck.status.toUpperCase()}</strong>
                          <span>{connector.lastHealthCheck.message ?? 'OK'}</span>
                        </div>
                      )}
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => handleTestConnector(connector.id)}
                        disabled={connectorLoading}
                      >
                        Run Health Check
                      </button>
                      <button
                        className="btn-danger"
                        type="button"
                        onClick={() => handleRemoveConnector(connector.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="document-section">
              <div className="document-header">
                <h3>Document Workspace</h3>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={loadDocuments}
                  disabled={documentsLoading}
                >
                  {documentsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <div className="document-grid">
                <div className="document-form-card">
                  <h4>Export Document</h4>
                  <form onSubmit={handleExportDocument}>
                    <div className="form-group">
                      <label htmlFor="doc-name">Name</label>
                      <input
                        id="doc-name"
                        type="text"
                        value={documentForm.name}
                        onChange={(e) => handleDocumentFormChange('name', e.target.value)}
                        placeholder="Sprint summary"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="doc-format">Format</label>
                      <select
                        id="doc-format"
                        value={documentForm.format}
                        onChange={(e) =>
                          handleDocumentFormChange(
                            'format',
                            e.target.value as DocumentRecord['type']
                          )
                        }
                      >
                        <option value="markdown">Markdown</option>
                        <option value="docx">DOCX</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="doc-content">Content</label>
                      <textarea
                        id="doc-content"
                        rows={5}
                        value={documentForm.content}
                        onChange={(e) => handleDocumentFormChange('content', e.target.value)}
                        placeholder="## Release Notes..."
                      />
                    </div>
                    <button className="btn-primary" type="submit" disabled={isExportingDocument}>
                      {isExportingDocument ? 'Exporting…' : 'Export Document'}
                    </button>
                  </form>
                </div>
                <div className="document-list-card">
                  <h4>Recent Documents</h4>
                  {documentsLoading ? (
                    <div className="loading small">Loading documents…</div>
                  ) : documents.length === 0 ? (
                    <div className="empty-state compact">
                      <p>No documents exported yet.</p>
                    </div>
                  ) : (
                    <div className="document-list">
                      {documents.map((doc) => (
                        <div key={doc.id} className="document-card">
                          <div>
                            <strong>{doc.name}</strong>
                            <span className="doc-meta">
                              {doc.type.toUpperCase()} · v{doc.version}
                            </span>
                          </div>
                          <small>Updated: {new Date(doc.updatedAt).toLocaleString()}</small>
                          <code className="doc-path">{doc.path}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'tests' && (
          <div className="test-console">
            <div className="test-console-panels">
              <div className="test-suite-list">
                {testSuitesLoading ? (
                  <div className="loading small">Loading suites...</div>
                ) : testSuites.length === 0 ? (
                  <div className="empty-state">
                    <p>No suites configured yet.</p>
                  </div>
                ) : (
                  testSuites.map((suite) => (
                    <button
                      key={suite.id}
                      className={`suite-card ${selectedSuiteId === suite.id ? 'selected' : ''}`}
                      type="button"
                      onClick={() => setSelectedSuiteId(suite.id)}
                    >
                      <div className="suite-card-header">
                        <div>
                          <h3>{suite.name}</h3>
                          <p>{suite.description}</p>
                        </div>
                        <span className={`suite-status ${getSuiteStatusClass(suite)}`}>
                          {getSuiteStatusLabel(suite)}
                        </span>
                      </div>
                      <div className="suite-tags">
                        {suite.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <small className="suite-meta">
                        Last run: {suite.lastRun ? formatTimestamp(suite.lastRun.finishedAt) : '—'}
                      </small>
                    </button>
                  ))
                )}
              </div>

              <div className="test-suite-details">
                {currentSuite ? (
                  <>
                    <div className="test-suite-details-header">
                      <div>
                        <h2>{currentSuite.name}</h2>
                        <p>{currentSuite.description}</p>
                      </div>
                      <div className="test-suite-actions">
                        <div className="run-all-group">
                          <button
                            className="btn-secondary run-all"
                            type="button"
                            onClick={handleRunAllSuites}
                            disabled={runningSuiteId !== null}
                          >
                            {runningSuiteId === 'all' ? 'Running All…' : 'Run All Suites'}
                          </button>
                          <button
                            className="btn-secondary download-all"
                            type="button"
                            onClick={handleExportAllResults}
                            disabled={
                              !canExportAllResults || isExportingAll || runningSuiteId !== null
                            }
                          >
                            {isExportingAll ? 'Saving...' : 'Download Results'}
                          </button>
                        </div>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => handleRunSuite(currentSuite.id)}
                          disabled={runningSuiteId === currentSuite.id || runningSuiteId === 'all'}
                        >
                          {runningSuiteId === currentSuite.id ? 'Running...' : 'Run Selected Tests'}
                        </button>
                      </div>
                    </div>

                    <div className="test-suite-meta">
                      <div>
                        <span>Status</span>
                        <strong>
                          {currentResult ? currentResult.status.toUpperCase() : 'NOT RUN'}
                        </strong>
                      </div>
                      <div>
                        <span>Last finished</span>
                        <strong>
                          {currentResult ? formatTimestamp(currentResult.finishedAt) : '—'}
                        </strong>
                      </div>
                      <div>
                        <span>Duration</span>
                        <strong>
                          {currentResult ? formatDuration(currentResult.durationMs) : '—'}
                        </strong>
                      </div>
                    </div>

                    {testError && <div className="test-error">{testError}</div>}

                    <div className="test-logs">
                      {currentResult ? (
                        <>
                          <div className="test-logs-actions">
                            <button
                              className="btn-secondary"
                              type="button"
                              onClick={handleCopyResult}
                            >
                              Copy Result
                            </button>
                            <button
                              className="btn-secondary"
                              type="button"
                              onClick={handleExportResult}
                            >
                              Export Result
                            </button>
                          </div>
                          {currentResult.logs.map((line, index) => (
                            <div key={`${currentResult.suiteId}-${index}`} className="log-line">
                              {line}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="empty-state compact">
                          <p>Select a suite and run tests to see output.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <p>Select a test suite to view details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="diagnostics-grid">
            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Logging</h3>
                  <p>Current application log destination.</p>
                </div>
                <div className="diagnostic-actions">
                  <button className="btn-secondary" type="button" onClick={loadDiagnostics}>
                    Refresh
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={handleCopyLogPath}
                    disabled={!logPath}
                  >
                    Copy Path
                  </button>
                </div>
              </div>
              {diagnosticsLoading && !logPath ? (
                <div className="loading small">Loading log path…</div>
              ) : (
                <code className="log-path">{logPath || 'Log path unavailable'}</code>
              )}
            </section>

            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Telemetry</h3>
                  <p>Opt-in diagnostic payload generation.</p>
                </div>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleTelemetryToggle}
                  disabled={telemetryUpdating}
                >
                  {telemetryUpdating
                    ? 'Updating…'
                    : telemetryEnabled
                      ? 'Disable Telemetry'
                      : 'Enable Telemetry'}
                </button>
              </div>
              <p className="diagnostic-subtext">
                Status:{' '}
                <strong className={telemetryEnabled ? 'status-enabled' : 'status-disabled'}>
                  {telemetryEnabled ? 'Enabled' : 'Disabled'}
                </strong>
              </p>
            </section>

            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Notification Preferences</h3>
                  <p>Quiet hours and delivery channels.</p>
                </div>
              </div>
              {!notifications ? (
                <div className="loading small">Loading notification preferences…</div>
              ) : (
                <form className="notification-form" onSubmit={handleNotificationSave}>
                  <div className="form-group inline">
                    <label htmlFor="quiet-start">Quiet Start</label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={notificationForm.quietStart}
                      onChange={(e) => handleNotificationInputChange('quietStart', e.target.value)}
                    />
                  </div>
                  <div className="form-group inline">
                    <label htmlFor="quiet-end">Quiet End</label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={notificationForm.quietEnd}
                      onChange={(e) => handleNotificationInputChange('quietEnd', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="channels">Channels (comma-separated)</label>
                    <input
                      id="channels"
                      type="text"
                      value={notificationForm.channels}
                      onChange={(e) => handleNotificationInputChange('channels', e.target.value)}
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={notificationSaving}>
                    {notificationSaving ? 'Saving…' : 'Save Preferences'}
                  </button>
                </form>
              )}
            </section>

            <section className="diagnostic-card span-2">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Schedules</h3>
                  <p>Upcoming workflow runs from SchedulerService.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    type="button"
                    onClick={() => {
                      setScheduleForm({
                        workflowId: '',
                        cron: '',
                        timezone: 'UTC',
                        cronPattern: 'daily',
                        dailyTime: '09:00',
                        weeklyDay: 'monday',
                        weeklyTime: '09:00',
                        monthlyDay: '1',
                        monthlyTime: '09:00',
                        hourlyMinute: '0'
                      })
                      setEditingScheduleId(null)
                      setShowScheduleForm(true)
                    }}
                  >
                    + Add Schedule
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={refreshSchedules}
                    disabled={schedulesLoading}
                  >
                    {schedulesLoading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>
              {schedulesLoading && !schedules.length ? (
                <div className="loading small">Loading schedules…</div>
              ) : schedules.length === 0 ? (
                <div className="empty-state compact">
                  <p>No schedules created yet.</p>
                </div>
              ) : (
                <div className="diagnostic-table-wrapper">
                  <table className="diagnostic-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Workflow</th>
                        <th>Cron</th>
                        <th>Timezone</th>
                        <th>Next Run</th>
                        <th>Last Run</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => {
                        const workflow = workflows.find(w => w.id === schedule.workflowId)
                        return (
                          <tr key={schedule.id}>
                            <td>#{schedule.id}</td>
                            <td>{workflow ? workflow.name : `Workflow #${schedule.workflowId}`}</td>
                            <td><code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{schedule.cron}</code></td>
                            <td>{schedule.timezone ?? 'UTC'}</td>
                            <td>{formatScheduleTime(schedule.nextRunAt)}</td>
                            <td>{formatScheduleTime(schedule.lastRunAt) !== '—' ? `Last: ${formatScheduleTime(schedule.lastRunAt)}` : 'Never run'}</td>
                            <td>
                              <span
                                className={`suite-status ${schedule.status === 'active' ? 'status-passed' : 'status-idle'}`}
                              >
                                {schedule.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  className="btn-secondary"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                  onClick={async () => {
                                    if (schedule.status === 'active') {
                                      await window.electronAPI.pauseSchedule(schedule.id)
                                    } else {
                                      await window.electronAPI.resumeSchedule(schedule.id)
                                    }
                                    await refreshSchedules()
                                  }}
                                >
                                  {schedule.status === 'active' ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ fontSize: '12px', padding: '4px 8px' }}
                                  onClick={async () => {
                                    if (confirm(`Delete schedule #${schedule.id}?`)) {
                                      await window.electronAPI.deleteSchedule(schedule.id)
                                      await refreshSchedules()
                                    }
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {/* Connector Settings */}
            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Connector Settings</h3>
                  <p>Manage LLM connectors and API keys.</p>
                </div>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={loadConnectors}
                  disabled={connectorLoading}
                >
                  {connectorLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              {connectorLoading && !connectors.length ? (
                <div className="loading small">Loading connectors…</div>
              ) : connectors.length === 0 ? (
                <div className="empty-state compact">
                  <p>No connectors registered. Use the "Connector Health" section to add connectors.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {connectors.map((connector) => (
                    <div
                      key={connector.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>
                          {connector.name}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '12px' }}>
                          {connector.kind} · {connector.version}
                        </div>
                        {connector.lastHealthCheck && (
                          <div style={{ color: connector.lastHealthCheck.status === 'healthy' ? '#10b981' : '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                            {connector.lastHealthCheck.status === 'healthy' ? '✓' : '✗'} {connector.lastHealthCheck.message || connector.lastHealthCheck.status}
                          </div>
                        )}
                      </div>
                      <button
                        className="btn-danger"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                        onClick={async () => {
                          await window.electronAPI.removeConnector(connector.id)
                          await loadConnectors()
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Document Settings */}
            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Document Settings</h3>
                  <p>Configure document storage and defaults.</p>
                </div>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={loadDocuments}
                  disabled={documentsLoading}
                >
                  {documentsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Default Document Path
                  </label>
                  <input
                    type="text"
                    placeholder="Configure in ConfigService..."
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px'
                    }}
                  />
                  <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Document path configuration coming soon
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Registered Documents ({documents.length})
                  </label>
                  <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', padding: '8px', fontSize: '12px', color: '#aaa' }}>
                    {documents.length === 0 ? 'No documents registered' : `${documents.length} document(s) in registry`}
                  </div>
                </div>
              </div>
            </section>

            {/* Notification Settings */}
            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>Notification Settings</h3>
                  <p>Configure notification preferences and quiet hours.</p>
                </div>
              </div>
              {notifications ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    try {
                      setNotificationSaving(true)
                      await window.electronAPI.setNotificationPreferences({
                        quietHours: {
                          start: notificationForm.quietStart,
                          end: notificationForm.quietEnd
                        },
                        channels: notificationForm.channels.split(',').map((c) => c.trim()).filter(Boolean)
                      })
                      await loadDiagnostics()
                      alert('Notification preferences saved!')
                    } catch (error) {
                      console.error('Failed to save notification preferences:', error)
                      alert('Failed to save notification preferences')
                    } finally {
                      setNotificationSaving(false)
                    }
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="quietStart">Quiet Hours Start</label>
                    <input
                      id="quietStart"
                      type="time"
                      value={notificationForm.quietStart}
                      onChange={(e) => setNotificationForm({ ...notificationForm, quietStart: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="quietEnd">Quiet Hours End</label>
                    <input
                      id="quietEnd"
                      type="time"
                      value={notificationForm.quietEnd}
                      onChange={(e) => setNotificationForm({ ...notificationForm, quietEnd: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="channels">Channels (comma-separated)</label>
                    <input
                      id="channels"
                      type="text"
                      value={notificationForm.channels}
                      onChange={(e) => setNotificationForm({ ...notificationForm, channels: e.target.value })}
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={notificationSaving}>
                    {notificationSaving ? 'Saving…' : 'Save Preferences'}
                  </button>
                </form>
              ) : (
                <div className="loading small">Loading notification preferences…</div>
              )}
            </section>

            {/* File Sandbox Settings */}
            <section className="diagnostic-card">
              <div className="diagnostic-card-header">
                <div>
                  <h3>File Sandbox Settings</h3>
                  <p>Configure allowed directories for file operations.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Allowed Directories
                  </label>
                  <textarea
                    placeholder="One directory per line..."
                    disabled
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    File sandbox configuration coming soon
                  </small>
                </div>
              </div>
            </section>

            {/* General Settings */}
            <section className="diagnostic-card span-2">
              <div className="diagnostic-card-header">
                <div>
                  <h3>General Settings</h3>
                  <p>Application preferences and configuration.</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Theme
                  </label>
                  <select
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px'
                    }}
                  >
                    <option>Dark (default)</option>
                  </select>
                  <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Theme selection coming soon
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Language
                  </label>
                  <select
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px'
                    }}
                  >
                    <option>English (default)</option>
                  </select>
                  <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    Localization coming soon
                  </small>
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', fontSize: '14px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={telemetryEnabled}
                      onChange={async (e) => {
                        try {
                          setTelemetryUpdating(true)
                          await window.electronAPI.setTelemetryEnabled(e.target.checked)
                          setTelemetryEnabledState(e.target.checked)
                        } catch (error) {
                          console.error('Failed to update telemetry setting:', error)
                        } finally {
                          setTelemetryUpdating(false)
                        }
                      }}
                      disabled={telemetryUpdating}
                      style={{ width: '18px', height: '18px' }}
                    />
                    Enable Telemetry
                  </label>
                  <small style={{ color: '#888', fontSize: '12px', display: 'block' }}>
                    Help improve the app by sharing anonymous usage data
                  </small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Log Path
                  </label>
                  <input
                    type="text"
                    value={logPath}
                    disabled
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Schedule Form Modal */}
      {showScheduleForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: '#fff'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff' }}>
              {editingScheduleId ? 'Edit Schedule' : 'Add Schedule'}
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Workflow
              </label>
              <select
                value={scheduleForm.workflowId}
                onChange={(e) => setScheduleForm({ ...scheduleForm, workflowId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
                disabled={!!editingScheduleId}
              >
                <option value="">Select a workflow...</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id.toString()}>{w.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Schedule Pattern
              </label>
              <select
                value={scheduleForm.cronPattern}
                onChange={(e) => {
                  const pattern = e.target.value as typeof scheduleForm.cronPattern
                  setScheduleForm({ ...scheduleForm, cronPattern: pattern })
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="custom">Custom Cron Expression</option>
              </select>
            </div>

            {scheduleForm.cronPattern === 'daily' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleForm.dailyTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dailyTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {scheduleForm.cronPattern === 'weekly' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Day of Week
                  </label>
                  <select
                    value={scheduleForm.weeklyDay}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, weeklyDay: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.weeklyTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, weeklyTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            {scheduleForm.cronPattern === 'monthly' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Day of Month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={scheduleForm.monthlyDay}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, monthlyDay: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.monthlyTime}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, monthlyTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: '#0a0a0a',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </>
            )}

            {scheduleForm.cronPattern === 'hourly' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                  Minute (0-59)
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={scheduleForm.hourlyMinute}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, hourlyMinute: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            )}

            {scheduleForm.cronPattern === 'custom' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                  Cron Expression (e.g., "0 9 * * *" for daily at 9 AM)
                </label>
                <input
                  type="text"
                  value={scheduleForm.cron}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, cron: e.target.value })}
                  placeholder="0 9 * * *"
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#0a0a0a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
                <small style={{ color: '#888', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Format: minute hour day month day-of-week
                </small>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>
                Timezone
              </label>
              <input
                type="text"
                value={scheduleForm.timezone}
                onChange={(e) => setScheduleForm({ ...scheduleForm, timezone: e.target.value })}
                placeholder="UTC"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#0a0a0a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowScheduleForm(false)
                  setEditingScheduleId(null)
                }}
                disabled={scheduleSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={async () => {
                  if (!scheduleForm.workflowId) {
                    alert('Please select a workflow')
                    return
                  }

                  let cronExpression = scheduleForm.cron
                  
                  // Generate cron expression from pattern
                  if (scheduleForm.cronPattern !== 'custom') {
                    const [hour, minute] = scheduleForm.cronPattern === 'daily' 
                      ? scheduleForm.dailyTime.split(':')
                      : scheduleForm.cronPattern === 'weekly'
                      ? scheduleForm.weeklyTime.split(':')
                      : scheduleForm.cronPattern === 'monthly'
                      ? scheduleForm.monthlyTime.split(':')
                      : ['*', scheduleForm.hourlyMinute]

                    if (scheduleForm.cronPattern === 'daily') {
                      cronExpression = `${minute} ${hour} * * *`
                    } else if (scheduleForm.cronPattern === 'weekly') {
                      const dayMap: Record<string, string> = {
                        monday: '1',
                        tuesday: '2',
                        wednesday: '3',
                        thursday: '4',
                        friday: '5',
                        saturday: '6',
                        sunday: '0'
                      }
                      cronExpression = `${minute} ${hour} * * ${dayMap[scheduleForm.weeklyDay]}`
                    } else if (scheduleForm.cronPattern === 'monthly') {
                      cronExpression = `${minute} ${hour} ${scheduleForm.monthlyDay} * *`
                    } else if (scheduleForm.cronPattern === 'hourly') {
                      cronExpression = `${scheduleForm.hourlyMinute} * * * *`
                    }
                  }

                  if (!cronExpression) {
                    alert('Please provide a cron expression')
                    return
                  }

                  try {
                    setScheduleSubmitting(true)
                    await window.electronAPI.addSchedule(
                      parseInt(scheduleForm.workflowId),
                      cronExpression,
                      { timezone: scheduleForm.timezone || 'UTC' }
                    )
                    setShowScheduleForm(false)
                    setEditingScheduleId(null)
                    await refreshSchedules()
                  } catch (error) {
                    console.error('Failed to create schedule:', error)
                    alert(`Failed to create schedule: ${error instanceof Error ? error.message : String(error)}`)
                  } finally {
                    setScheduleSubmitting(false)
                  }
                }}
                disabled={scheduleSubmitting || !scheduleForm.workflowId}
              >
                {scheduleSubmitting ? 'Saving...' : editingScheduleId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Execution View */}
      {viewingExecution && (
        <WorkflowExecutionView
          runId={viewingExecution.runId}
          workflowId={viewingExecution.workflowId}
          draftId={viewingExecution.draftId}
          onClose={() => setViewingExecution(null)}
        />
      )}
    </div>
  )
}

export default App
