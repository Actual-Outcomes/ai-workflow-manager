/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    getAppVersion: () => Promise<string>
    getWorkflows: () => Promise<any[]>
    getWorkflow: (id: number) => Promise<any>
    createWorkflow: (workflow: { name: string; description: string }) => Promise<any>
    updateWorkflow: (id: number, data: { name?: string; description?: string; status?: string }) => Promise<any>
    deleteWorkflow: (id: number) => Promise<{ success: boolean }>
  }
}

