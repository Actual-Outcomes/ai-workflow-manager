import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ConfigService } from '../core/config/service'
import { ConfigSnapshot } from '../core/config/types'

const createTempPath = () => fs.mkdtempSync(path.join(os.tmpdir(), 'aiwm-config-'))

describe('ConfigService', () => {
  let tempDir: string
  let configPath: string
  let service: ConfigService

  beforeEach(() => {
    tempDir = createTempPath()
    configPath = path.join(tempDir, 'config.json')
    service = new ConfigService({ filePath: configPath })
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('writes default config when file missing', () => {
    expect(fs.existsSync(configPath)).toBe(true)
    const stored = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(stored.connectors.llm.active).toBe('openai')
  })

  it('gets and sets values using dot paths', async () => {
    await service.set('logging.level', 'debug')
    expect(service.get('logging.level')).toBe('debug')
    const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    expect(updated.logging.level).toBe('debug')
  })

  it('notifies watchers for specific path', async () => {
    const handler = vi.fn()
    service.watch('logging.level', handler)
    await service.set('logging.level', 'warn')
    expect(handler).toHaveBeenCalledWith('warn', 'info')
  })

  it('exports and imports snapshots', async () => {
    await service.set('telemetry.enabled', true)
    const snapshot = service.exportConfig()
    expect(snapshot.data.telemetry.enabled).toBe(true)

    const newService = new ConfigService({ filePath: path.join(tempDir, 'other.json') })
    const importedSnapshot: ConfigSnapshot = {
      ...snapshot,
      data: {
        ...snapshot.data,
        logging: { ...snapshot.data.logging, level: 'error' }
      }
    }
    await newService.importConfig(importedSnapshot)
    expect(newService.get('logging.level')).toBe('error')
  })
})
