export interface DocumentBuilder {
  build(content: string): Promise<Buffer>
}
