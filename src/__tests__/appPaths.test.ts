import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAppDataDir, getAppDatabasePath } from '../core/appPaths'

describe('appPaths helpers', () => {
  let tempDir: string
  let originalAppData: string | undefined
  let homedirSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aiwm-appdata-'))
    originalAppData = process.env.APPDATA
    process.env.APPDATA = tempDir
    homedirSpy = vi.spyOn(os, 'homedir').mockReturnValue(tempDir)
  })

  afterEach(() => {
    process.env.APPDATA = originalAppData
    homedirSpy.mockRestore()
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('creates the application data directory when missing', () => {
    const dir = getAppDataDir()
    expect(fs.existsSync(dir)).toBe(true)
    expect(dir.startsWith(tempDir)).toBe(true)
  })

  it('builds the database path inside the app data directory', () => {
    const dir = getAppDataDir()
    const dbPath = getAppDatabasePath()
    expect(dbPath).toBe(path.join(dir, 'workflows.db'))
  })
})
