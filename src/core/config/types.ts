export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface ConnectorSelection {
  active: string
  available: string[]
}

export interface FileSandboxEntry {
  path: string
  read: boolean
  write: boolean
}

export interface ConfigData {
  version: number
  connectors: {
    llm: ConnectorSelection
    storage: ConnectorSelection & { sandboxPaths: string[] }
  }
  credentials: {
    vault: {
      provider: 'os' | 'json'
      fallbackKey: string | null
    }
  }
  logging: {
    level: LogLevel
    destinations: Array<
      { type: 'file'; path: string } | { type: 'console' } | { type: 'webhook'; url: string }
    >
  }
  telemetry: {
    enabled: boolean
    endpoint: string | null
  }
  scheduler: {
    defaultProfile: string
    quietHours: {
      start: string
      end: string
    }
  }
  fileSandbox: {
    allowlist: FileSandboxEntry[]
  }
}

export interface ConfigSnapshot {
  version: number
  data: ConfigData
  exportedAt: string
}
