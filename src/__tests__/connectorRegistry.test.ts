import { describe, expect, it } from 'vitest'
import { ConnectorRegistry } from '../core/connectors/registry'
import { ConnectorAdapter } from '../core/connectors/types'

const createAdapter = (id: string): ConnectorAdapter => ({
  metadata: {
    id,
    name: `Connector ${id}`,
    kind: 'storage',
    version: '1.0.0',
    capabilities: [{ name: 'read', description: 'Read data' }]
  },
  async testConnectivity() {
    return { status: 'ok', message: 'All good', latencyMs: 5 }
  }
})

describe('ConnectorRegistry', () => {
  it('registers and lists connectors', () => {
    const registry = new ConnectorRegistry()
    registry.registerConnector(createAdapter('storage.local'))
    const connectors = registry.listConnectors()
    expect(connectors).toHaveLength(1)
    expect(connectors[0].id).toBe('storage.local')
  })

  it('prevents duplicate registration', () => {
    const registry = new ConnectorRegistry()
    registry.registerConnector(createAdapter('dup'))
    expect(() => registry.registerConnector(createAdapter('dup'))).toThrow()
  })

  it('tests connector health', async () => {
    const registry = new ConnectorRegistry()
    registry.registerConnector(createAdapter('health'))
    const result = await registry.testConnector('health')
    expect(result.status).toBe('ok')
    const connector = registry.getConnector('health')
    expect(connector?.lastHealthCheck?.status).toBe('ok')
    expect(connector?.status).toBe('ready')
  })
})
