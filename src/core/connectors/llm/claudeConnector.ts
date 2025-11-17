import Anthropic from '@anthropic-ai/sdk'
import { LLMConnector, LLMMessage, LLMModel, LLMOptions, LLMResponse, LLMStreamEvent } from './types'

export interface ClaudeConnectorOptions {
  apiKey: string
  defaultModel?: string
}

export class ClaudeConnector implements LLMConnector {
  private client: Anthropic
  private apiKey: string
  private defaultModel: string

  constructor(options: ClaudeConnectorOptions) {
    this.apiKey = options.apiKey
    this.client = new Anthropic({ apiKey: options.apiKey })
    // Use the latest available model as default
    // Users can override via options.defaultModel or select a different model in the UI
    this.defaultModel = options.defaultModel || 'claude-sonnet-4-5-20250929'
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    try {
      // Convert messages to Anthropic format
      const systemMessage = messages.find((m) => m.role === 'system')
      const conversationMessages = messages.filter((m) => m.role !== 'system')

      const response = await this.client.messages.create({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      })

      const content = response.content
        .map((block) => {
          if (block.type === 'text') return block.text
          return ''
        })
        .join('\n')

      return {
        content,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        model: response.model,
        finishReason: response.stop_reason || undefined
      }
    } catch (error) {
      if (error instanceof Error) {
        // Provide more helpful error messages for common issues
        if (error.message.includes('not_found_error') || error.message.includes('404')) {
          throw new Error(`Model not found. The model "${options?.model || this.defaultModel}" may not be available in your account or may have been deprecated. Please check Anthropic's documentation for available models or try a different model.`)
        }
        if (error.message.includes('authentication_error') || error.message.includes('401')) {
          throw new Error(`Authentication failed. Please check that your API key is correct and has not expired.`)
        }
        throw new Error(`Claude API error: ${error.message}`)
      }
      throw error
    }
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<LLMStreamEvent> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system')
      const conversationMessages = messages.filter((m) => m.role !== 'system')

      const stream = await this.client.messages.stream({
        model: options?.model || this.defaultModel,
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      })

      let totalInputTokens = 0
      let totalOutputTokens = 0

      for await (const event of stream) {
        if (event.type === 'message_start') {
          totalInputTokens = event.message.usage.input_tokens
        } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield {
            type: 'content',
            content: event.delta.text
          }
        } else if (event.type === 'message_delta' && 'usage' in event.delta) {
          totalOutputTokens = (event.delta as { usage?: { output_tokens?: number } }).usage?.output_tokens || totalOutputTokens
        } else if (event.type === 'message_stop') {
          yield {
            type: 'done',
            usage: {
              promptTokens: totalInputTokens,
              completionTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens
            }
          }
        }
      }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listModels(): Promise<LLMModel[]> {
    try {
      // Use the SDK's built-in models.list() method
      // This handles authentication and error handling automatically
      // The SDK returns a PagePromise which auto-paginates
      const response = this.client.models.list()
      
      // Iterate through all pages to get all models
      // The PagePromise yields ModelInfo objects directly
      const allModels: LLMModel[] = []
      for await (const model of response) {
        allModels.push({
          id: model.id,
          name: model.id,
          displayName: model.display_name || model.id
        })
      }

      if (allModels.length > 0) {
        // Sort by date in model ID (newer first), then by display name
        return allModels.sort((a: LLMModel, b: LLMModel) => {
          // Sort by date in model ID (newer first)
          const dateA = a.id.match(/\d{8}/)?.[0] || ''
          const dateB = b.id.match(/\d{8}/)?.[0] || ''
          const dateCompare = dateB.localeCompare(dateA)
          if (dateCompare !== 0) return dateCompare
          // If dates are equal, sort by display name
          return (a.displayName || a.id).localeCompare(b.displayName || b.id)
        })
      }

      // If no models found, return fallback list
      return this.getFallbackModels()
    } catch (error) {
      // If API call fails (e.g., invalid API key, network error), return fallback list
      console.warn('Failed to fetch models from API, using fallback list:', error)
      return this.getFallbackModels()
    }
  }

  private getFallbackModels(): LLMModel[] {
    // Fallback list of common models if API call fails
    return [
      { id: 'claude-sonnet-4-5-20250929', displayName: 'Claude Sonnet 4.5 (2025-09-29) - Latest' },
      { id: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet (2024-10-22)' },
      { id: 'claude-3-5-haiku-20241022', displayName: 'Claude 3.5 Haiku (2024-10-22)' },
      { id: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus (2024-02-29)' },
      { id: 'claude-3-sonnet-20240229', displayName: 'Claude 3 Sonnet (2024-02-29)' },
      { id: 'claude-3-haiku-20240307', displayName: 'Claude 3 Haiku (2024-03-07)' },
      { id: 'claude-3-5-sonnet-20240620', displayName: 'Claude 3.5 Sonnet (2024-06-20)' }
    ]
  }
}

