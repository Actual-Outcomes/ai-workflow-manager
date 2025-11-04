import { contextBridge, ipcRenderer } from 'electron'

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
  deleteWorkflow: (id: number) => ipcRenderer.invoke('delete-workflow', id)
})

// Type definitions for TypeScript
export type ElectronAPI = {
  getAppVersion: () => Promise<string>
  getWorkflows: () => Promise<any[]>
  getWorkflow: (id: number) => Promise<any>
  createWorkflow: (workflow: { name: string; description: string }) => Promise<any>
  updateWorkflow: (id: number, data: { name?: string; description?: string; status?: string }) => Promise<any>
  deleteWorkflow: (id: number) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

