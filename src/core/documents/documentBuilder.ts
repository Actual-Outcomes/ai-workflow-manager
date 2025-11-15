import { DocumentBuilder } from './types'
import { Document, Packer, Paragraph } from 'docx'
import { PDFDocument } from 'pdf-lib'

export class MarkdownBuilder implements DocumentBuilder {
  async build(content: string): Promise<Buffer> {
    return Buffer.from(content, 'utf-8')
  }
}

export class DocxBuilder implements DocumentBuilder {
  async build(content: string): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          children: content
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line) => new Paragraph(line))
        }
      ]
    })

    return Buffer.from(await Packer.toBuffer(doc))
  }
}

export class PdfBuilder implements DocumentBuilder {
  async build(content: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 12
    const margin = 50
    const text = content.split('\n').join('\n')
    page.drawText(text, {
      x: margin,
      y: height - margin,
      size: fontSize
    })
    const pdfBytes = await pdfDoc.save()
    return Buffer.from(pdfBytes)
  }
}
