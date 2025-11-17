export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface LLMResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  finishReason?: string
}

export interface LLMStreamEvent {
  type: 'content' | 'done' | 'error'
  content?: string
  usage?: LLMResponse['usage']
  error?: string
}

export interface LLMModel {
  id: string
  name?: string
  displayName?: string
}

export interface LLMConnector {
  /**
   * Send a chat completion request
   */
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>

  /**
   * Stream a chat completion request
   */
  stream?(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<LLMStreamEvent>

  /**
   * Get token usage statistics
   */
  getUsage?(): {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }

  /**
   * List available models
   */
  listModels?(): Promise<LLMModel[]>
}

