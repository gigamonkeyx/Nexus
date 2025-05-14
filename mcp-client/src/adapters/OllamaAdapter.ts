/**
 * OllamaAdapter
 * 
 * Specialized adapter for integrating with Ollama MCP servers.
 * Handles the specific requirements and capabilities of Ollama MCP servers.
 */

import { NexusClient } from '../core/NexusClient';
import { ServerConfig } from '../core/types';
import { HttpTransport } from '../transport/HttpTransport';
import { logger } from '../utils/logger';

/**
 * OllamaAdapter provides specialized integration with Ollama MCP servers.
 */
export class OllamaAdapter {
  private nexusClient: NexusClient;
  private serverId: string;
  private serverConfig: ServerConfig;
  private connected: boolean = false;
  private modelCache: Map<string, any> = new Map();

  /**
   * Creates a new OllamaAdapter instance.
   * @param nexusClient NexusClient instance
   * @param serverId Server identifier
   * @param serverConfig Server configuration
   */
  constructor(nexusClient: NexusClient, serverId: string, serverConfig: ServerConfig) {
    this.nexusClient = nexusClient;
    this.serverId = serverId;
    this.serverConfig = serverConfig;
  }

  /**
   * Connects to the Ollama MCP server.
   * @returns Promise resolving to true if connection is successful
   */
  async connect(): Promise<boolean> {
    try {
      logger.info(`Connecting to Ollama MCP server: ${this.serverId}`);
      
      // Connect to the server using the NexusClient
      await this.nexusClient.connectServer(this.serverId, this.serverConfig);
      
      // Cache available models
      await this.cacheModels();
      
      this.connected = true;
      logger.info(`Successfully connected to Ollama MCP server: ${this.serverId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to connect to Ollama MCP server: ${error instanceof Error ? error.message : String(error)}`);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Caches available models from the Ollama MCP server.
   */
  private async cacheModels(): Promise<void> {
    try {
      logger.info(`Caching models from Ollama MCP server: ${this.serverId}`);
      
      // Call the list_models tool
      const result = await this.nexusClient.callTool('list_models', {});
      
      if (result && result.models) {
        // Cache the models
        for (const model of result.models) {
          this.modelCache.set(model.name, model);
        }
        
        logger.info(`Cached ${this.modelCache.size} models from Ollama MCP server`);
      }
    } catch (error) {
      logger.warn(`Failed to cache models from Ollama MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets available models from the Ollama MCP server.
   * @returns Array of available models
   */
  async getModels(): Promise<any[]> {
    if (this.modelCache.size === 0) {
      await this.cacheModels();
    }
    
    return Array.from(this.modelCache.values());
  }

  /**
   * Generates text using the Ollama MCP server.
   * @param model Model to use
   * @param prompt Prompt to generate text from
   * @param options Additional generation options
   * @returns Generated text and metadata
   */
  async generateText(model: string, prompt: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Generating text with model ${model} on Ollama MCP server: ${this.serverId}`);
      
      // Call the generate_text tool
      const result = await this.nexusClient.callTool('generate_text', {
        model,
        prompt,
        options
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generates a chat completion using the Ollama MCP server.
   * @param model Model to use
   * @param messages Chat messages
   * @param options Additional generation options
   * @returns Chat completion and metadata
   */
  async chatCompletion(model: string, messages: any[], options: any = {}): Promise<any> {
    try {
      logger.info(`Generating chat completion with model ${model} on Ollama MCP server: ${this.serverId}`);
      
      // Call the chat_completion tool
      const result = await this.nexusClient.callTool('chat_completion', {
        model,
        messages,
        options
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to generate chat completion: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Creates embeddings using the Ollama MCP server.
   * @param model Model to use
   * @param text Text to embed
   * @returns Embedding and metadata
   */
  async createEmbedding(model: string, text: string): Promise<any> {
    try {
      logger.info(`Creating embedding with model ${model} on Ollama MCP server: ${this.serverId}`);
      
      // Call the create_embedding tool
      const result = await this.nexusClient.callTool('create_embedding', {
        model,
        text
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to create embedding: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Pulls a model from the Ollama library.
   * @param model Model to pull
   * @returns Pull status
   */
  async pullModel(model: string): Promise<any> {
    try {
      logger.info(`Pulling model ${model} on Ollama MCP server: ${this.serverId}`);
      
      // Call the pull_model tool
      const result = await this.nexusClient.callTool('pull_model', {
        model
      });
      
      // Update the model cache
      await this.cacheModels();
      
      return result;
    } catch (error) {
      logger.error(`Failed to pull model: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Checks if the adapter is connected to the Ollama MCP server.
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the server ID.
   * @returns Server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Gets the server configuration.
   * @returns Server configuration
   */
  getServerConfig(): ServerConfig {
    return this.serverConfig;
  }
}
