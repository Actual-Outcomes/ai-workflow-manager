import { describe, it, expect } from 'vitest'
import { MarkdownBuilder, DocxBuilder, PdfBuilder } from '../core/documents/documentBuilder'

describe('Document builders', () => {
  it('MarkdownBuilder returns utf-8 buffer', async () => {
    const builder = new MarkdownBuilder()
    const buffer = await builder.build('# Hello')
    expect(buffer.toString()).toContain('# Hello')
  })

  it('DocxBuilder produces non-empty buffer', async () => {
    const builder = new DocxBuilder()
    const buffer = await builder.build('Hello world')
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('PdfBuilder produces non-empty buffer', async () => {
    const builder = new PdfBuilder()
    const buffer = await builder.build('PDF content')
    expect(buffer.length).toBeGreaterThan(0)
  })
})
