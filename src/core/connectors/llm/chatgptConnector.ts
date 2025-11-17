import OpenAI from 'openai'
import { LLMConnector, LLMMessage, LLMModel, LLMOptions, LLMResponse, LLMStreamEvent } from './types'

export interface ChatgptConnectorOptions {
  apiKey: string
  defaultModel?: string
}

export class ChatgptConnector implements LLMConnector {
  private client: OpenAI
  private defaultModel: string

  constructor(options: ChatgptConnectorOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey })
    this.defaultModel = options.defaultModel || 'gpt-4-turbo-preview'
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens
      })

      const choice = response.choices[0]
      if (!choice) {
        throw new Error('No response from ChatGPT API')
      }

      return {
        content: choice.message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model,
        finishReason: choice.finish_reason || undefined
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ChatGPT API error: ${error.message}`)
      }
      throw error
    }
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMOptions
  ): AsyncIterable<LLMStreamEvent> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options?.model || this.defaultModel,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stream: true
      })

      let usage: LLMResponse['usage'] | undefined

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta
        if (delta?.content) {
          yield {
            type: 'content',
            content: delta.content
          }
        }

        // Capture usage if available
        if (chunk.usage) {
          usage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens
          }
        }
      }

      yield {
        type: 'done',
        usage: usage || {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0
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
      const models = await this.client.models.list()
      return models.data
        .filter((model) => model.id.includes('gpt'))
        .map((model) => ({
          id: model.id,
          name: model.id,
          displayName: model.id
        }))
    } catch (error) {
      // If API call fails, return common models
      return [
        { id: 'gpt-4-turbo-preview', displayName: 'GPT-4 Turbo' },
        { id: 'gpt-4', displayName: 'GPT-4' },
        { id: 'gpt-3.5-turbo', displayName: 'GPT-3.5 Turbo' }
      ]
    }
  }
}

