import fs from 'fs'
import os from 'os'
import path from 'path'

const APP_DIR_NAME = 'ai-workflow-manager'
const DB_FILE_NAME = 'workflows.db'
const CONFIG_DIR_NAME = 'config'
const CONFIG_FILE_NAME = 'config.json'

/**
 * Returns the platform-specific application data directory and ensures it exists.
 */
export const getAppDataDir = (): string => {
  const base =
    process.env.APPDATA ||
    (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.local', 'share'))

  const dir = path.join(base, APP_DIR_NAME)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Returns the full path to the main SQLite database file.
 */
export const getAppDatabasePath = (): string => {
  const dir = getAppDataDir()
  return path.join(dir, DB_FILE_NAME)
}

export const getConfigDir = (): string => {
  const dir = path.join(getAppDataDir(), CONFIG_DIR_NAME)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export const getConfigFilePath = (): string => {
  return path.join(getConfigDir(), CONFIG_FILE_NAME)
}
