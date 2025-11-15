import { ConfigData } from './types'

export const defaultConfig = (): ConfigData => ({
  version: 1,
  connectors: {
    llm: {
      active: 'openai',
      available: ['openai', 'claude']
    },
    storage: {
      active: 'sqlite',
      available: ['sqlite'],
      sandboxPaths: []
    }
  },
  credentials: {
    vault: {
      provider: 'os',
      fallbackKey: null
    }
  },
  logging: {
    level: 'info',
    destinations: [{ type: 'console' }]
  },
  telemetry: {
    enabled: false,
    endpoint: null
  },
  scheduler: {
    defaultProfile: 'local',
    quietHours: {
      start: '22:00',
      end: '06:00'
    }
  },
  fileSandbox: {
    allowlist: []
  }
})
