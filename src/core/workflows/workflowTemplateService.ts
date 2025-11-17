import fs from 'fs'
import path from 'path'
import { WorkflowDraft } from './workflowTypes'

export interface WorkflowTemplate {
  name: string
  description: string
  category: string
  nodes: unknown[]
  transitions: unknown[]
}

export class WorkflowTemplateService {
  private templatesPath: string

  constructor(appPath?: string) {
    // Get templates directory
    // If appPath is provided (from Electron main process), use it
    // Otherwise, use relative path from __dirname
    if (appPath) {
      // In dev, appPath points to project root; in production, it points to app.asar
      this.templatesPath = path.join(appPath, 'src', 'core', 'templates', 'workflows')
      
      // Fallback: if path doesn't exist, try relative to __dirname
      if (!fs.existsSync(this.templatesPath)) {
        this.templatesPath = path.join(__dirname, '..', 'templates', 'workflows')
      }
    } else {
      // Default: relative to this file
      this.templatesPath = path.join(__dirname, '..', 'templates', 'workflows')
    }
  }

  listTemplates(): WorkflowTemplate[] {
    try {
      const files = fs.readdirSync(this.templatesPath)
      const templates: WorkflowTemplate[] = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.templatesPath, file)
          const content = fs.readFileSync(filePath, 'utf-8')
          const template = JSON.parse(content) as WorkflowTemplate
          templates.push(template)
        }
      }

      return templates
    } catch (error) {
      console.error('Failed to list templates:', error)
      return []
    }
  }

  getTemplate(name: string): WorkflowTemplate | null {
    try {
      const templates = this.listTemplates()
      return templates.find((t) => t.name === name) || null
    } catch (error) {
      console.error(`Failed to get template ${name}:`, error)
      return null
    }
  }

  createDraftFromTemplate(template: WorkflowTemplate): Omit<WorkflowDraft, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: template.name,
      description: template.description,
      status: 'draft',
      version: 1,
      nodes: template.nodes as any[],
      transitions: template.transitions as any[]
    }
  }
}

