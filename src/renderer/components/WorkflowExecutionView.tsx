import React, { useState, useEffect, useRef } from 'react'
import { WorkflowEvent } from '../../core/workflows/workflowEventPublisher'

interface WorkflowExecutionViewProps {
  runId: number
  workflowId: number
  draftId: number
  onClose: () => void
}

interface ExecutionLogEntry {
  timestamp: string
  type: string
  message: string
  payload?: Record<string, unknown>
}

export const WorkflowExecutionView: React.FC<WorkflowExecutionViewProps> = ({
  runId,
  workflowId,
  draftId,
  onClose
}) => {
  const [run, setRun] = useState<any>(null)
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [currentNode, setCurrentNode] = useState<string | null>(null)
  const [context, setContext] = useState<Record<string, unknown>>({})
  const logEndRef = useRef<HTMLDivElement>(null)

  // Load initial run data
  useEffect(() => {
    const loadRun = async () => {
      const runData = await window.electronAPI.getWorkflowRun(runId)
      if (runData) {
        setRun(runData)
        if (runData.context_json) {
          try {
            const ctx = JSON.parse(runData.context_json)
            setContext(ctx.variables || {})
            setCurrentNode(ctx.currentNode || null)
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Load existing events
      const events = await window.electronAPI.getWorkflowRunEvents(runId)
      const initialLogs: ExecutionLogEntry[] = events.map((event: any) => ({
        timestamp: event.timestamp,
        type: event.type,
        message: formatEventMessage(event.type, JSON.parse(event.payload_json || '{}')),
        payload: JSON.parse(event.payload_json || '{}')
      }))
      setLogs(initialLogs)
    }

    loadRun()
  }, [runId])

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = window.electronAPI.onWorkflowEvent((event: WorkflowEvent) => {
      if (event.runId === runId) {
        // Update run status
        if (event.type === 'workflow-started' || event.type === 'workflow-completed' || event.type === 'workflow-failed' || event.type === 'workflow-paused' || event.type === 'workflow-resumed') {
          window.electronAPI.getWorkflowRun(runId).then(setRun)
        }

        // Update current node
        if (event.type === 'node-entered') {
          setCurrentNode(event.payload.nodeId as string)
        }

        // Update context
        if (event.type === 'action-executed' && event.payload.output) {
          setContext((prev) => ({ ...prev, ...(event.payload.output as Record<string, unknown>) }))
        }

        // Add to logs
        const logEntry: ExecutionLogEntry = {
          timestamp: event.timestamp,
          type: event.type,
          message: formatEventMessage(event.type, event.payload),
          payload: event.payload
        }
        setLogs((prev) => [...prev, logEntry])
      }
    })

    return unsubscribe
  }, [runId])

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const formatEventMessage = (type: string, payload: Record<string, unknown>): string => {
    switch (type) {
      case 'workflow-started':
        return '✅ Workflow started'
      case 'workflow-completed':
        return '✅ Workflow completed successfully'
      case 'workflow-failed':
        return `❌ Workflow failed: ${payload.error || 'Unknown error'}`
      case 'workflow-paused':
        return `⏸️ Workflow paused: ${payload.reason || 'manual'}`
      case 'workflow-resumed':
        return '▶️ Workflow resumed'
      case 'node-entered':
        return `➡️ Entered node: ${payload.nodeLabel || payload.nodeId} (${payload.nodeType})`
      case 'node-exited':
        return `⬅️ Exited node: ${payload.nodeId}`
      case 'action-executed':
        const actionType = payload.actionType as string || 'unknown'
        const actionName = actionType.replace('llm.', '').replace('document.', '').replace('variable.', '').replace('conditional.', '')
        return `⚙️ ${actionName} action${payload.success ? ' ✓' : ` ✗ (${payload.error || 'failed'})`}`
      default:
        return `${type}: ${JSON.stringify(payload)}`
    }
  }

  const handlePause = async () => {
    try {
      await window.electronAPI.pauseWorkflowRun(runId)
    } catch (error) {
      console.error('Failed to pause workflow:', error)
      // Note: Toast notifications should be handled by parent component
    }
  }

  const handleResume = async () => {
    try {
      await window.electronAPI.resumeWorkflowRun(runId, draftId)
    } catch (error) {
      console.error('Failed to resume workflow:', error)
      // Note: Toast notifications should be handled by parent component
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#4CAF50'
      case 'completed':
        return '#2196F3'
      case 'failed':
        return '#F44336'
      case 'paused':
        return '#FF9800'
      default:
        return '#9E9E9E'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff' }}>Workflow Execution</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(run?.status || 'unknown'),
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {run?.status?.toUpperCase() || 'UNKNOWN'}
              </span>
              {currentNode && (
                <span style={{ color: '#aaa', fontSize: '14px' }}>
                  Current Node: {currentNode}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {run?.status === 'running' && (
              <button
                onClick={handlePause}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Pause
              </button>
            )}
            {run?.status === 'paused' && (
              <button
                onClick={handleResume}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Resume
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
          {/* Execution Log */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Execution Log</h3>
            <div style={{
              flex: 1,
              backgroundColor: '#0d0d0d',
              borderRadius: '4px',
              padding: '10px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '8px', color: '#aaa' }}>
                  <span style={{ color: '#666' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                  <span style={{
                    color: log.type.includes('failed') ? '#F44336' :
                      log.type.includes('completed') ? '#4CAF50' :
                      log.type.includes('started') ? '#2196F3' : '#aaa'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Context Variables */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>Context Variables</h3>
            <div style={{
              flex: 1,
              backgroundColor: '#0d0d0d',
              borderRadius: '4px',
              padding: '10px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '12px'
            }}>
              {Object.keys(context).length === 0 ? (
                <div style={{ color: '#666' }}>No variables set</div>
              ) : (
                Object.entries(context).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <span style={{ color: '#4CAF50' }}>{key}:</span>{' '}
                    <span style={{ color: '#aaa' }}>{JSON.stringify(value, null, 2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

