import { ConfigService } from '../config/service'
import { CredentialVault } from '../credentials/vault'
import {
  ConnectorAdapter,
  ConnectorCapability,
  ConnectorSummary,
  HealthCheckResult,
  ManagedConnectorDefinition
} from './types'
import { LLMConnector, LLMModel } from './llm/types'
import { ClaudeConnector } from './llm/claudeConnector'
import { ChatgptConnector } from './llm/chatgptConnector'

const REGISTRY_CONFIG_PATH = 'connectors.registry'

interface RegisteredConnector {
  adapter: ConnectorAdapter
  status: ConnectorSummary['status']
  lastHealthCheck?: HealthCheckResult
}

export class ConnectorRegistry {
  private connectors = new Map<string, RegisteredConnector>()
  private managedConnectors = new Set<string>()
  private llmConnectors = new Map<string, LLMConnector>()

  constructor(
    private configService?: ConfigService,
    private credentialVault?: CredentialVault
  ) {
    if (this.configService) {
      this.bootstrapManagedConnectors()
    }
  }

  /**
   * Get an LLM connector by ID
   */
  getLLMConnector(id: string): LLMConnector | undefined {
    return this.llmConnectors.get(id)
  }

  /**
   * List all registered LLM connectors
   */
  listLLMConnectors(): string[] {
    return Array.from(this.llmConnectors.keys())
  }

  /**
   * List available models for an LLM connector
   */
  async listLLMModels(connectorId: string): Promise<LLMModel[]> {
    // First, try to get existing connector
    let connector = this.llmConnectors.get(connectorId)
    
    // If connector not initialized, try to initialize it
    if (!connector) {
      const record = this.connectors.get(connectorId)
      if (record && record.adapter.metadata.kind === 'llm' && this.credentialVault && record.adapter.metadata.requiresSecrets?.length) {
        const secretKey = record.adapter.metadata.requiresSecrets[0]
        const secret = await this.credentialVault.retrieveSecret(secretKey)
        if (secret?.value) {
          const def = this.getManagedConfig()[connectorId]
          const defaultModel = def ? (def.config as { defaultModel?: string })?.defaultModel : undefined
          const apiKey = secret.value.trim()
          // Handle both 'llm.claude' and 'llm.claude:temp' formats
          if (connectorId === 'llm.claude' || connectorId.startsWith('llm.claude:')) {
            connector = new ClaudeConnector({ apiKey, defaultModel })
            this.llmConnectors.set(connectorId, connector)
          } else if (connectorId === 'llm.chatgpt' || connectorId.startsWith('llm.chatgpt:')) {
            connector = new ChatgptConnector({ apiKey, defaultModel })
            this.llmConnectors.set(connectorId, connector)
          }
        }
      }
    }
    
    if (!connector || !connector.listModels) {
      return []
    }
    try {
      return await connector.listModels()
    } catch (error) {
      console.error(`Failed to list models for ${connectorId}:`, error)
      return []
    }
  }

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
    
    // For LLM connectors, test actual API connectivity
    if (record.adapter.metadata.kind === 'llm') {
      // Ensure connector is initialized before testing
      let llmConnector = this.llmConnectors.get(id)
      if (!llmConnector && this.credentialVault && record.adapter.metadata.requiresSecrets?.length) {
        // Initialize connector if not already initialized
        const secretKey = record.adapter.metadata.requiresSecrets[0]
        const secret = await this.credentialVault.retrieveSecret(secretKey)
        if (secret?.value) {
          const def = this.getManagedConfig()[id]
          const defaultModel = def ? (def.config as { defaultModel?: string })?.defaultModel : undefined
          // Handle both 'llm.claude' and 'llm.claude:temp' formats
          if (id === 'llm.claude' || id.startsWith('llm.claude:')) {
            llmConnector = new ClaudeConnector({ apiKey: secret.value.trim(), defaultModel })
            this.llmConnectors.set(id, llmConnector)
          } else if (id === 'llm.chatgpt' || id.startsWith('llm.chatgpt:')) {
            llmConnector = new ChatgptConnector({ apiKey: secret.value.trim(), defaultModel })
            this.llmConnectors.set(id, llmConnector)
          }
        }
      }
      
      if (llmConnector) {
        try {
          // Test with a simple message
          await llmConnector.chat([
            { role: 'user', content: 'Hello' }
          ], { maxTokens: 10 })
          const result = { status: 'ok' as const, message: 'API connectivity verified', latencyMs: 0 }
          record.lastHealthCheck = result
          record.status = 'ready'
          return result
        } catch (error) {
          let errorMessage = 'API test failed'
          if (error instanceof Error) {
            // Provide more helpful error messages
            if (error.message.includes('not_found_error') || error.message.includes('404')) {
              errorMessage = `Model not found. The selected model may not be available in your account. Please check your connector configuration and try a different model.`
            } else if (error.message.includes('authentication_error') || error.message.includes('401')) {
              errorMessage = `Authentication failed. Please verify your API key is correct.`
            } else {
              errorMessage = error.message
            }
          }
          const result = {
            status: 'error' as const,
            message: errorMessage
          }
          record.lastHealthCheck = result
          record.status = 'error'
          return result
        }
      } else {
        // Connector not initialized - likely missing API key
        const result = {
          status: 'error' as const,
          message: 'API key not found or connector not initialized'
        }
        record.lastHealthCheck = result
        record.status = 'error'
        return result
      }
    }
    
    const result = await record.adapter.testConnectivity()
    record.lastHealthCheck = result
    record.status = result.status === 'error' ? 'error' : 'ready'
    return result
  }

  async addManagedConnector(def: ManagedConnectorDefinition): Promise<ConnectorSummary> {
    this.assertConfig('register connectors')
    const sanitized = this.normalizeDefinition(def)
    const existing = this.getManagedConfig()
    if (existing[sanitized.id]) {
      throw new Error(`Connector "${sanitized.id}" already exists`)
    }
    const next = { ...existing, [sanitized.id]: sanitized }
    await this.configService!.set(REGISTRY_CONFIG_PATH, next)
    this.registerManagedAdapter(sanitized)
    return this.getConnector(sanitized.id)!
  }

  async removeManagedConnector(id: string): Promise<void> {
    this.assertConfig('remove connectors')
    const existing = this.getManagedConfig()
    if (!existing[id]) {
      throw new Error(`Connector "${id}" is not managed`)
    }
    const { [id]: _removed, ...rest } = existing
    await this.configService!.set(REGISTRY_CONFIG_PATH, rest)
    this.connectors.delete(id)
    this.managedConnectors.delete(id)
  }

  private bootstrapManagedConnectors() {
    const entries = this.getManagedConfig()
    Object.values(entries).forEach((entry) => {
      try {
        this.registerManagedAdapter(entry)
      } catch (error) {
        console.warn(`Failed to register managed connector "${entry.id}":`, error)
      }
    })
  }

  private registerManagedAdapter(def: ManagedConnectorDefinition) {
    const adapter = this.createManagedAdapter(def)
    this.registerConnector(adapter)
    this.managedConnectors.add(def.id)
  }

  private createManagedAdapter(def: ManagedConnectorDefinition): ConnectorAdapter {
    const metadata = {
      id: def.id,
      name: def.name,
      kind: def.kind,
      version: def.version,
      description: def.description,
      capabilities: def.capabilities ?? [],
      requiresSecrets: def.requiresSecrets
    }
    
    // For LLM connectors, we'll initialize them lazily when needed
    // (in listLLMModels, testConnector, or testConnectivity)
    // This avoids async initialization issues during adapter creation
    
    return {
      metadata,
      testConnectivity: async () => {
        if (!def.requiresSecrets?.length) {
          return { status: 'ok', message: 'No secrets required' }
        }
        if (!this.credentialVault) {
          return {
            status: 'warn',
            message: 'Credential vault not configured; cannot verify secrets'
          }
        }
        const missing: string[] = []
        for (const key of def.requiresSecrets) {
          const secret = await this.credentialVault.retrieveSecret(key)
          if (!secret?.value) {
            missing.push(key)
          } else if (def.kind === 'llm') {
            // Initialize LLM connector if not already initialized
            if (!this.llmConnectors.has(def.id)) {
              const defaultModel = (def.config as { defaultModel?: string })?.defaultModel
              // Trim API key to remove any whitespace
              const apiKey = secret.value.trim()
              // Handle both 'llm.claude' and 'llm.claude:temp' formats
              if (def.id === 'llm.claude' || def.id.startsWith('llm.claude:')) {
                this.llmConnectors.set(def.id, new ClaudeConnector({ apiKey, defaultModel }))
              } else if (def.id === 'llm.chatgpt' || def.id.startsWith('llm.chatgpt:')) {
                this.llmConnectors.set(def.id, new ChatgptConnector({ apiKey, defaultModel }))
              }
            }
          }
        }
        if (missing.length) {
          return {
            status: 'error',
            message: `Missing secrets: ${missing.join(', ')}`
          }
        }
        return { status: 'ok', message: 'All required secrets present' }
      }
    }
  }

  private getManagedConfig(): Record<string, ManagedConnectorDefinition> {
    if (!this.configService) return {}
    return (
      (this.configService.get(REGISTRY_CONFIG_PATH) as Record<
        string,
        ManagedConnectorDefinition
      >) ?? {}
    )
  }

  private normalizeDefinition(def: ManagedConnectorDefinition): ManagedConnectorDefinition {
    return {
      ...def,
      id: def.id.trim(),
      name: def.name.trim(),
      version: def.version.trim(),
      capabilities: (def.capabilities ?? []).map((cap: ConnectorCapability) => ({
        name: cap.name.trim(),
        description: cap.description
      }))
    }
  }

  private assertConfig(action: string) {
    if (!this.configService) {
      throw new Error(`ConfigService required to ${action}`)
    }
  }
}
