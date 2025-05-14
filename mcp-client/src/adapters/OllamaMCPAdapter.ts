/**
 * OllamaMCPAdapter
 * 
 * Adapter for the Ollama MCP Server.
 */

import { NexusClient } from '../core/NexusClient';
import { BaseAdapter } from './BaseAdapter';
import { AdapterConfig } from './AdapterManager';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Ollama model configuration
 */
export interface OllamaModelConfig {
  name: string;
  parameters?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    stop?: string[];
    max_tokens?: number;
  };
}

/**
 * Ollama adapter configuration
 */
export interface OllamaAdapterConfig extends AdapterConfig {
  defaultModel?: string;
  models?: OllamaModelConfig[];
}

/**
 * OllamaMCPAdapter provides an adapter for the Ollama MCP Server.
 */
export class OllamaMCPAdapter extends BaseAdapter {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private defaultModel: string;
  private models: Map<string, OllamaModelConfig> = new Map();
  private serverId: string;

  /**
   * Creates a new OllamaMCPAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config Adapter configuration
   */
  constructor(nexusClient: NexusClient, config: OllamaAdapterConfig) {
    super(config);
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.defaultModel = config.defaultModel || 'llama3';
    this.serverId = config.serverId || 'ollama';
    
    // Initialize models
    if (config.models) {
      for (const model of config.models) {
        this.models.set(model.name, model);
      }
    }
    
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Handle server errors
    this.eventBus.subscribe('mcp-server-error', async (error) => {
      if (error.context.serverId === this.serverId) {
        logger.warn(`Ollama MCP server error: ${error.message}`);
      }
    });
  }

  /**
   * Initializes the adapter.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Ollama MCP adapter');
      
      // Check if server is connected
      const servers = this.nexusClient.getServers();
      if (!servers.has(this.serverId)) {
        throw new Error(`Ollama MCP server not found: ${this.serverId}`);
      }
      
      // Get available models
      const models = await this.getAvailableModels();
      logger.info(`Available Ollama models: ${models.join(', ')}`);
      
      logger.info('Ollama MCP adapter initialized successfully');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize Ollama MCP adapter: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets available models.
   * @returns Promise resolving to an array of model names
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const result = await this.nexusClient.callTool('ollama-list-models', {}, this.serverId);
      
      if (result && result.models) {
        return result.models.map((model: any) => model.name);
      }
      
      return [];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get available Ollama models: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Generates text using the Ollama model.
   * @param prompt Prompt to generate text from
   * @param model Model to use
   * @param parameters Generation parameters
   * @returns Promise resolving to the generated text
   */
  async generateText(prompt: string, model?: string, parameters?: any): Promise<string> {
    try {
      const modelName = model || this.defaultModel;
      const modelConfig = this.models.get(modelName) || { name: modelName };
      
      // Merge parameters
      const mergedParams = {
        ...(modelConfig.parameters || {}),
        ...(parameters || {})
      };
      
      const result = await this.nexusClient.callTool('ollama-generate', {
        model: modelName,
        prompt,
        options: mergedParams
      }, this.serverId);
      
      if (result && result.response) {
        return result.response;
      }
      
      throw new Error('No response from Ollama model');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate text with Ollama: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, model: model || this.defaultModel }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Generates code using the Ollama model.
   * @param description Description of the code to generate
   * @param language Programming language
   * @param model Model to use
   * @param parameters Generation parameters
   * @returns Promise resolving to the generated code
   */
  async generateCode(description: string, language: string, model?: string, parameters?: any): Promise<string> {
    try {
      // Create a code-focused prompt
      const prompt = `Generate ${language} code for: ${description}\n\nOnly provide the code, no explanations.\n\n`;
      
      // Add code-specific parameters
      const codeParameters = {
        temperature: 0.2, // Lower temperature for more deterministic code
        top_p: 0.95,
        stop: ['```'],
        ...(parameters || {})
      };
      
      const code = await this.generateText(prompt, model, codeParameters);
      
      // Clean up the response
      return this.cleanCodeResponse(code, language);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate code with Ollama: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language, model: model || this.defaultModel }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Cleans a code response.
   * @param response Response to clean
   * @param language Programming language
   * @returns Cleaned code
   */
  private cleanCodeResponse(response: string, language: string): string {
    // Remove markdown code blocks if present
    let code = response.trim();
    
    // Remove leading and trailing backticks
    const codeBlockRegex = new RegExp(`^\`\`\`(?:${language})?(.*?)\`\`\`$`, 's');
    const match = code.match(codeBlockRegex);
    
    if (match) {
      code = match[1].trim();
    }
    
    return code;
  }

  /**
   * Gets the default model.
   * @returns Default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Sets the default model.
   * @param model Default model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
  }

  /**
   * Gets a model configuration.
   * @param model Model name
   * @returns Model configuration or null if not found
   */
  getModelConfig(model: string): OllamaModelConfig | null {
    return this.models.get(model) || null;
  }

  /**
   * Sets a model configuration.
   * @param model Model configuration
   */
  setModelConfig(model: OllamaModelConfig): void {
    this.models.set(model.name, model);
  }

  /**
   * Gets the server ID.
   * @returns Server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Sets the server ID.
   * @param serverId Server ID
   */
  setServerId(serverId: string): void {
    this.serverId = serverId;
  }
}
