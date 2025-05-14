/**
 * LibrarianAgent
 * 
 * Specialized agent for research, knowledge management, and information presentation.
 */

import { NexusClient } from '../core/NexusClient';
import { AdapterManager } from '../adapters/AdapterManager';
import { OllamaAdapter } from '../adapters/OllamaAdapter';
import { ComfyUIAdapter } from '../adapters/ComfyUIAdapter';
import { ModularAgentFramework } from './ModularAgentFramework';
import { LLMAdapter } from './LLMAdapter';
import { Agent } from './Agent';
import { PresentationFormat, PresentationStyle } from './modules/PresentationModule';
import { logger } from '../utils/logger';

/**
 * Librarian agent configuration
 */
export interface LibrarianAgentConfig {
  name: string;
  description?: string;
  llm: {
    provider: string;
    model: string;
  };
  ollamaAdapter?: OllamaAdapter;
  comfyuiAdapter?: ComfyUIAdapter;
  presentationFormat?: PresentationFormat;
  presentationStyle?: PresentationStyle;
  maxSearchResults?: number;
  maxWebFetchDepth?: number;
}

/**
 * LibrarianAgent provides specialized capabilities for research, knowledge management, and information presentation.
 */
export class LibrarianAgent {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private llmAdapter: LLMAdapter;
  private agentFramework: ModularAgentFramework;
  private agent: Agent | null = null;
  private config: LibrarianAgentConfig;

  /**
   * Creates a new LibrarianAgent instance.
   * @param nexusClient NexusClient instance
   * @param adapterManager AdapterManager instance
   * @param llmAdapter LLMAdapter instance
   * @param config Librarian agent configuration
   */
  constructor(nexusClient: NexusClient, adapterManager: AdapterManager, llmAdapter: LLMAdapter, config: LibrarianAgentConfig) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.llmAdapter = llmAdapter;
    this.agentFramework = new ModularAgentFramework(nexusClient, llmAdapter);
    this.config = config;
  }

  /**
   * Initializes the librarian agent.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing librarian agent: ${this.config.name}`);

      // Create modules configuration
      const modules = [];

      // Add research module
      modules.push({
        name: 'ResearchModule',
        description: 'Module for research capabilities',
        nexusClient: this.nexusClient,
        maxSearchResults: this.config.maxSearchResults || 5,
        maxWebFetchDepth: this.config.maxWebFetchDepth || 3
      });

      // Add presentation module
      modules.push({
        name: 'PresentationModule',
        description: 'Module for presenting information in a beautiful UI',
        nexusClient: this.nexusClient,
        defaultFormat: this.config.presentationFormat || PresentationFormat.HTML,
        defaultStyle: this.config.presentationStyle || PresentationStyle.PROFESSIONAL
      });

      // Add text generation module if Ollama adapter is provided
      if (this.config.ollamaAdapter) {
        modules.push({
          name: 'TextGenerationModule',
          description: 'Module for text generation using Ollama',
          ollamaAdapter: this.config.ollamaAdapter,
          defaultModel: 'llama3'
        });
      }

      // Add image generation module if ComfyUI adapter is provided
      if (this.config.comfyuiAdapter) {
        modules.push({
          name: 'ImageGenerationModule',
          description: 'Module for image generation using ComfyUI',
          comfyuiAdapter: this.config.comfyuiAdapter,
          defaultModel: 'sd_xl_base_1.0.safetensors',
          defaultWidth: 768,
          defaultHeight: 768
        });
      }

      // Create agent
      this.agent = await this.agentFramework.createAgent({
        name: this.config.name,
        description: this.config.description || 'A librarian agent that can perform research, manage knowledge, and present information in a beautiful UI',
        llm: this.config.llm,
        modules
      });

      logger.info(`Librarian agent initialized: ${this.config.name}`);
    } catch (error) {
      logger.error(`Failed to initialize librarian agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Executes a research task.
   * @param topic Research topic
   * @param options Additional options
   * @returns Research results
   */
  async research(topic: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Researching topic: ${topic}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Execute research task
      const result = await this.agentFramework.executeTask(this.agent.getName(), `Research the topic: ${topic}`, options);
      return result;
    } catch (error) {
      logger.error(`Failed to research topic: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Presents information in a beautiful UI.
   * @param content Content to present
   * @param title Content title
   * @param format Output format
   * @param style Presentation style
   * @param metadata Additional metadata
   * @returns Presentation results
   */
  async present(content: string, title: string, format?: PresentationFormat, style?: PresentationStyle, metadata: any = {}): Promise<any> {
    try {
      logger.info(`Presenting information: ${title}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Call formatContent capability
      const result = await this.agent.executeCapability('formatContent', {
        content,
        title,
        format: format || this.config.presentationFormat || PresentationFormat.HTML,
        style: style || this.config.presentationStyle || PresentationStyle.PROFESSIONAL,
        metadata
      });

      return result;
    } catch (error) {
      logger.error(`Failed to present information: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Saves a presentation.
   * @param content Content to save
   * @param title Content title
   * @param format Output format
   * @param style Presentation style
   * @param metadata Additional metadata
   * @param filename Custom filename
   * @returns Save status
   */
  async savePresentation(content: string, title: string, format?: PresentationFormat, style?: PresentationStyle, metadata: any = {}, filename?: string): Promise<any> {
    try {
      logger.info(`Saving presentation: ${title}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Call savePresentation capability
      const result = await this.agent.executeCapability('savePresentation', {
        content,
        title,
        format: format || this.config.presentationFormat || PresentationFormat.HTML,
        style: style || this.config.presentationStyle || PresentationStyle.PROFESSIONAL,
        metadata,
        filename
      });

      return result;
    } catch (error) {
      logger.error(`Failed to save presentation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Creates a knowledge graph from research.
   * @param topic Research topic
   * @param entities Entities to create
   * @param relations Relations to create
   * @returns Knowledge graph creation status
   */
  async createKnowledgeGraph(topic: string, entities: any[], relations: any[]): Promise<any> {
    try {
      logger.info(`Creating knowledge graph for topic: ${topic}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Call createKnowledgeGraph capability
      const result = await this.agent.executeCapability('createKnowledgeGraph', {
        entities,
        relations
      });

      return result;
    } catch (error) {
      logger.error(`Failed to create knowledge graph: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Searches the knowledge graph.
   * @param query Search query
   * @returns Search results
   */
  async searchKnowledgeGraph(query: string): Promise<any> {
    try {
      logger.info(`Searching knowledge graph: ${query}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Call searchKnowledgeGraph capability
      const result = await this.agent.executeCapability('searchKnowledgeGraph', {
        query
      });

      return result;
    } catch (error) {
      logger.error(`Failed to search knowledge graph: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generates an image for a research topic.
   * @param topic Research topic
   * @param options Additional options
   * @returns Generated image
   */
  async generateImage(topic: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Generating image for topic: ${topic}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      if (!this.config.comfyuiAdapter) {
        throw new Error('ComfyUI adapter not provided');
      }

      // Call generateImageFromText capability
      const result = await this.agent.executeCapability('generateImageFromText', {
        prompt: `A visual representation of ${topic}`,
        options
      });

      return result;
    } catch (error) {
      logger.error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Executes a general task.
   * @param task Task to execute
   * @param options Additional options
   * @returns Task result
   */
  async executeTask(task: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Executing task: ${task}`);

      if (!this.agent) {
        throw new Error('Librarian agent not initialized');
      }

      // Execute task
      const result = await this.agentFramework.executeTask(this.agent.getName(), task, options);
      return result;
    } catch (error) {
      logger.error(`Failed to execute task: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Gets the agent.
   * @returns Agent
   */
  getAgent(): Agent | null {
    return this.agent;
  }

  /**
   * Gets the agent framework.
   * @returns Agent framework
   */
  getAgentFramework(): ModularAgentFramework {
    return this.agentFramework;
  }

  /**
   * Gets the configuration.
   * @returns Configuration
   */
  getConfig(): LibrarianAgentConfig {
    return this.config;
  }
}
