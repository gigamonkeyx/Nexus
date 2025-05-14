/**
 * ClaudeAdapter
 * 
 * Adapter for Anthropic's Claude language model.
 */

import { LLMAdapter, LLMConfig, Message, Completion, MessageRole } from './LLMAdapter';
import { logger } from '../utils/logger';
import axios from 'axios';

/**
 * Claude-specific configuration
 */
export interface ClaudeConfig extends LLMConfig {
  apiKey: string;
  baseUrl?: string;
  version?: string;
}

/**
 * ClaudeAdapter provides access to Anthropic's Claude language model.
 */
export class ClaudeAdapter implements LLMAdapter {
  private config: ClaudeConfig;

  /**
   * Creates a new ClaudeAdapter instance.
   * @param config Claude configuration
   */
  constructor(config: ClaudeConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.anthropic.com',
      version: config.version || '2023-06-01'
    };
  }

  /**
   * Generates a completion from messages.
   * @param messages Messages
   * @param options Additional options
   * @returns Completion
   */
  async generateCompletion(messages: Message[], options: any = {}): Promise<Completion> {
    try {
      logger.info(`Generating completion with model: ${this.config.model}`);

      // Convert messages to Claude format
      const claudeMessages = this.convertMessagesToClaudeFormat(messages);

      // Create request body
      const body = {
        model: this.config.model,
        messages: claudeMessages,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.95,
        top_k: options.top_k || 40,
        stop_sequences: options.stop_sequences || [],
        stream: false
      };

      // Send request
      const response = await axios.post(`${this.config.baseUrl}/v1/messages`, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.config.version
        }
      });

      // Extract completion
      const content = response.data.content[0].text;
      const finishReason = response.data.stop_reason;
      const usage = {
        prompt_tokens: response.data.usage.input_tokens,
        completion_tokens: response.data.usage.output_tokens,
        total_tokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      };

      return {
        content,
        finish_reason: finishReason,
        model: this.config.model,
        usage
      };
    } catch (error) {
      logger.error(`Failed to generate completion: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generates a streaming completion from messages.
   * @param messages Messages
   * @param callback Callback for each chunk
   * @param options Additional options
   * @returns Completion
   */
  async generateStreamingCompletion(messages: Message[], callback: (chunk: any) => void, options: any = {}): Promise<Completion> {
    try {
      logger.info(`Generating streaming completion with model: ${this.config.model}`);

      // Convert messages to Claude format
      const claudeMessages = this.convertMessagesToClaudeFormat(messages);

      // Create request body
      const body = {
        model: this.config.model,
        messages: claudeMessages,
        max_tokens: options.max_tokens || 1024,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.95,
        top_k: options.top_k || 40,
        stop_sequences: options.stop_sequences || [],
        stream: true
      };

      // Send request
      const response = await axios.post(`${this.config.baseUrl}/v1/messages`, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.config.version
        },
        responseType: 'stream'
      });

      // Process stream
      let content = '';
      let finishReason = '';
      let usage = {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      };

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.type === 'content_block_delta') {
                const delta = parsedData.delta.text;
                content += delta;
                callback({ content: delta });
              } else if (parsedData.type === 'message_stop') {
                finishReason = parsedData.message_stop.stop_reason;
                usage = {
                  prompt_tokens: parsedData.message_stop.usage.input_tokens,
                  completion_tokens: parsedData.message_stop.usage.output_tokens,
                  total_tokens: parsedData.message_stop.usage.input_tokens + parsedData.message_stop.usage.output_tokens
                };
              }
            } catch (error) {
              logger.error(`Failed to parse streaming data: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }
      });

      // Wait for stream to end
      await new Promise<void>((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

      return {
        content,
        finish_reason: finishReason,
        model: this.config.model,
        usage
      };
    } catch (error) {
      logger.error(`Failed to generate streaming completion: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Creates embeddings for text.
   * @param text Text to embed
   * @param options Additional options
   * @returns Embeddings
   */
  async createEmbeddings(text: string | string[], options: any = {}): Promise<number[][]> {
    try {
      logger.info(`Creating embeddings with model: ${options.model || 'claude-3-sonnet-20240229-v1:0'}`);

      // Convert text to array if it's a string
      const textArray = Array.isArray(text) ? text : [text];

      // Create request body
      const body = {
        model: options.model || 'claude-3-sonnet-20240229-v1:0',
        input: textArray,
        dimensions: options.dimensions || 1536
      };

      // Send request
      const response = await axios.post(`${this.config.baseUrl}/v1/embeddings`, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': this.config.version
        }
      });

      // Extract embeddings
      return response.data.embeddings;
    } catch (error) {
      logger.error(`Failed to create embeddings: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Converts messages to Claude format.
   * @param messages Messages
   * @returns Claude-formatted messages
   */
  private convertMessagesToClaudeFormat(messages: Message[]): any[] {
    return messages.map(message => {
      switch (message.role) {
        case MessageRole.SYSTEM:
          return {
            role: 'system',
            content: message.content
          };
        case MessageRole.USER:
          return {
            role: 'user',
            content: message.content
          };
        case MessageRole.ASSISTANT:
          return {
            role: 'assistant',
            content: message.content
          };
        case MessageRole.TOOL:
          return {
            role: 'tool',
            content: message.content,
            name: message.name,
            tool_call_id: message.tool_call_id
          };
        default:
          return {
            role: 'user',
            content: message.content
          };
      }
    });
  }

  /**
   * Gets the provider.
   * @returns Provider
   */
  getProvider(): string {
    return this.config.provider;
  }

  /**
   * Gets the model.
   * @returns Model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Gets the configuration.
   * @returns Configuration
   */
  getConfig(): LLMConfig {
    return this.config;
  }
}
