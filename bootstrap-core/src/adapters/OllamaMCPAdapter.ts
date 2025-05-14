/**
 * Ollama MCP Adapter
 *
 * Adapter for the Ollama MCP server.
 */

import { NexusClient } from '../core/NexusClient';
import { logger } from '../utils/logger';

export interface OllamaGenerationOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  stop?: string[];
  [key: string]: any;
}

export class OllamaMCPAdapter {
  private nexusClient: NexusClient;
  private serverId: string;

  constructor(nexusClient: NexusClient, serverId: string) {
    this.nexusClient = nexusClient;
    this.serverId = serverId;
  }

  /**
   * Get the server ID
   */
  public getServerId(): string {
    return this.serverId;
  }

  /**
   * Generate text using Ollama
   */
  public async generateText(
    prompt: string,
    model: string = 'llama3',
    options: OllamaGenerationOptions = {}
  ): Promise<string> {
    try {
      logger.debug(`Generating text with Ollama (${this.serverId}), model: ${model}`);

      // Create request
      const request = {
        prompt,
        model,
        ...options
      };

      // Send request to Ollama MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'generate', request);

      if (!response || !response.text) {
        throw new Error('Invalid response from Ollama MCP server');
      }

      return response.text;
    } catch (error) {
      logger.error(`Failed to generate text with Ollama: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate code using Ollama
   */
  public async generateCode(
    prompt: string,
    language: string,
    options: OllamaGenerationOptions = {}
  ): Promise<string> {
    try {
      logger.debug(`Generating ${language} code with Ollama (${this.serverId})`);

      // Use a model suited for code generation
      const model = options.model || 'codellama';

      // Set appropriate options for code generation
      const codeOptions: OllamaGenerationOptions = {
        temperature: 0.2,
        max_tokens: 2000,
        ...options,
        model
      };

      // Generate code
      const code = await this.generateText(prompt, model, codeOptions);

      // Extract code from response if needed
      return this.extractCode(code, language);
    } catch (error) {
      logger.error(`Failed to generate code with Ollama: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Extract code from a response
   */
  private extractCode(response: string, language: string): string {
    // Try to extract code between triple backticks
    const codeBlockRegex = new RegExp("```(?:" + language + ")?\\n?([\\s\\S]*?)(?:```|$)", 'i');
    const match = response.match(codeBlockRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    // If no code block found, return the whole response
    return response.trim();
  }

  /**
   * Chat with Ollama
   */
  public async chat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    model: string = 'llama3',
    options: OllamaGenerationOptions = {}
  ): Promise<string> {
    try {
      logger.debug("Chatting with Ollama (" + this.serverId + "), model: " + model);

      // Create request
      const request = {
        messages,
        model,
        ...options
      };

      // Send request to Ollama MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'chat', request);

      if (!response || !response.message || !response.message.content) {
        throw new Error('Invalid response from Ollama MCP server');
      }

      return response.message.content;
    } catch (error) {
      logger.error("Failed to chat with Ollama: " + (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  }

  /**
   * Embed text using Ollama
   */
  public async embedText(
    text: string,
    model: string = 'llama3'
  ): Promise<number[]> {
    try {
      logger.debug("Embedding text with Ollama (" + this.serverId + "), model: " + model);

      // Create request
      const request = {
        text,
        model
      };

      // Send request to Ollama MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'embed', request);

      if (!response || !response.embedding || !Array.isArray(response.embedding)) {
        throw new Error('Invalid response from Ollama MCP server');
      }

      return response.embedding;
    } catch (error) {
      logger.error("Failed to embed text with Ollama: " + (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  }
}
