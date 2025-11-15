import fs from 'fs'
import path from 'path'
import { getAppDataDir } from '../appPaths'

export class FileConnector {
  private baseDir: string

  constructor(baseDir: string = getAppDataDir()) {
    this.baseDir = baseDir
  }

  writeFile(relativePath: string, content: string | Buffer): string {
    const targetPath = path.join(this.baseDir, relativePath)
    const directory = path.dirname(targetPath)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
    fs.writeFileSync(targetPath, content)
    return targetPath
  }
}
