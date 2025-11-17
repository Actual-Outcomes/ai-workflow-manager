import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { FileConnector } from '../core/files/fileConnector'
import { DocumentRegistry } from '../core/documents/documentRegistry'
import { DocumentService } from '../core/documents/documentService'

const createTempContext = () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-service-'))
  return {
    tempDir,
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

describe('DocumentService', () => {
  it('exports documents and stores registry entries', async () => {
    const ctx = createTempContext()
    const dbPath = path.join(ctx.tempDir, 'documents.db')
    const registry = new DocumentRegistry(dbPath)
    const fileConnector = new FileConnector(ctx.tempDir)
    const service = new DocumentService(registry, fileConnector)

    const result = await service.exportDocument({
      name: 'Sprint Summary',
      format: 'markdown',
      content: '# Hello'
    })

    // Verify path structure and file extension
    expect(result.path).toContain('documents')
    expect(fs.existsSync(result.path)).toBe(true)
    expect(path.isAbsolute(result.path)).toBe(true)
    expect(result.path).toMatch(/\.md$/) // Should have .md extension for markdown
    // Filename is slugified (lowercase, spaces to hyphens) with timestamp
    expect(path.basename(result.path)).toMatch(/^sprint-summary-\d+\.md$/)

    // Verify file content matches
    const fileContent = fs.readFileSync(result.path, 'utf-8')
    expect(fileContent).toBe('# Hello')

    const documents = service.listDocuments()
    expect(documents.length).toBe(1)
    expect(documents[0].name).toBe('Sprint Summary')
    expect(documents[0].type).toBe('markdown')
    expect(documents[0].path).toBe(result.path)

    registry.close()
    ctx.cleanup()
  })

  it('rejects empty names', async () => {
    const ctx = createTempContext()
    const registry = new DocumentRegistry(path.join(ctx.tempDir, 'documents.db'))
    const fileConnector = new FileConnector(ctx.tempDir)
    const service = new DocumentService(registry, fileConnector)

    await expect(
      service.exportDocument({ name: '   ', format: 'pdf', content: 'data' })
    ).rejects.toThrow('Document name is required')

    registry.close()
    ctx.cleanup()
  })
})
