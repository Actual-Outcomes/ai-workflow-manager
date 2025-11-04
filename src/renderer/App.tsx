import React, { useState, useEffect } from 'react'
import './App.css'

interface Workflow {
  id: number
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  created_at: string
  updated_at: string
}

function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' })
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    loadWorkflows()
    loadAppVersion()
  }, [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'paused': return '#f59e0b'
      case 'completed': return '#3b82f6'
      default: return '#6b7280'
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
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? '✕ Cancel' : '+ New Workflow'}
          </button>
        </div>

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
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Enter workflow description"
                  rows={3}
                />
              </div>
              <button type="submit" className="btn-primary">Create Workflow</button>
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
                  <p className="workflow-description">{workflow.description || 'No description'}</p>
                  <div className="workflow-meta">
                    <small>Created: {new Date(workflow.created_at).toLocaleDateString()}</small>
                  </div>
                  <div className="workflow-actions">
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
                      className="btn-danger"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

