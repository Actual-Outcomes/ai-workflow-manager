import { ConnectorAdapter, ConnectorSummary, HealthCheckResult } from './types'

interface RegisteredConnector {
  adapter: ConnectorAdapter
  status: ConnectorSummary['status']
  lastHealthCheck?: HealthCheckResult
}

export class ConnectorRegistry {
  private connectors = new Map<string, RegisteredConnector>()

  registerConnector(adapter: ConnectorAdapter) {
    const id = adapter.metadata.id
    if (this.connectors.has(id)) {
      throw new Error(`Connector with id "${id}" already registered`)
    }
    this.connectors.set(id, {
      adapter,
      status: 'idle'
    })
  }

  listConnectors(): ConnectorSummary[] {
    return Array.from(this.connectors.values()).map(({ adapter, status, lastHealthCheck }) => ({
      ...adapter.metadata,
      status,
      lastHealthCheck
    }))
  }

  getConnector(id: string): ConnectorSummary | undefined {
    const record = this.connectors.get(id)
    if (!record) return undefined
    return {
      ...record.adapter.metadata,
      status: record.status,
      lastHealthCheck: record.lastHealthCheck
    }
  }

  async testConnector(id: string): Promise<HealthCheckResult> {
    const record = this.connectors.get(id)
    if (!record) {
      throw new Error(`Connector "${id}" is not registered`)
    }
    record.status = 'initializing'
    const result = await record.adapter.testConnectivity()
    record.lastHealthCheck = result
    record.status = result.status === 'error' ? 'error' : 'ready'
    return result
  }
}
