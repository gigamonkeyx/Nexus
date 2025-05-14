/**
 * AdapterAgentFramework
 * 
 * Integrates specialized adapters with the agent framework.
 */

import { NexusClient } from '../core/NexusClient';
import { AdapterManager } from '../adapters/AdapterManager';
import { OllamaAdapter } from '../adapters/OllamaAdapter';
import { ComfyUIAdapter } from '../adapters/ComfyUIAdapter';
import { AgentFramework } from './AgentFramework';
import { Agent } from './Agent';
import { LLMAdapter } from './LLMAdapter';
import { logger } from '../utils/logger';

/**
 * Agent capabilities
 */
export enum AgentCapability {
  TEXT_GENERATION = 'text_generation',
  CHAT_COMPLETION = 'chat_completion',
  EMBEDDING_CREATION = 'embedding_creation',
  IMAGE_GENERATION = 'image_generation',
  IMAGE_EDITING = 'image_editing',
  KNOWLEDGE_GRAPH = 'knowledge_graph',
  RESEARCH = 'research',
  CODE_GENERATION = 'code_generation'
}

/**
 * Agent configuration with adapter support
 */
export interface AdapterAgentConfig {
  name: string;
  description: string;
  capabilities: AgentCapability[];
  llm: {
    provider: string;
    model: string;
  };
  ollamaServerId?: string;
  comfyuiServerId?: string;
}

/**
 * AdapterAgentFramework integrates specialized adapters with the agent framework.
 */
export class AdapterAgentFramework {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentFramework: AgentFramework;
  private llmAdapter: LLMAdapter;
  private agents: Map<string, Agent> = new Map();

  /**
   * Creates a new AdapterAgentFramework instance.
   * @param nexusClient NexusClient instance
   * @param adapterManager AdapterManager instance
   * @param llmAdapter LLMAdapter instance
   */
  constructor(nexusClient: NexusClient, adapterManager: AdapterManager, llmAdapter: LLMAdapter) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.llmAdapter = llmAdapter;
    this.agentFramework = new AgentFramework(nexusClient, llmAdapter);
  }

  /**
   * Creates an agent with adapter support.
   * @param config Agent configuration
   * @returns Created agent
   */
  async createAgent(config: AdapterAgentConfig): Promise<Agent> {
    try {
      logger.info(`Creating agent: ${config.name}`);

      // Create base agent
      const agent = this.agentFramework.createAgent({
        name: config.name,
        description: config.description,
        llm: config.llm
      });

      // Store agent
      this.agents.set(config.name, agent);

      // Connect to Ollama server if specified
      if (config.ollamaServerId && config.capabilities.some(cap => 
        cap === AgentCapability.TEXT_GENERATION || 
        cap === AgentCapability.CHAT_COMPLETION || 
        cap === AgentCapability.EMBEDDING_CREATION
      )) {
        await this.connectOllamaAdapter(agent, config.ollamaServerId);
      }

      // Connect to ComfyUI server if specified
      if (config.comfyuiServerId && config.capabilities.some(cap => 
        cap === AgentCapability.IMAGE_GENERATION || 
        cap === AgentCapability.IMAGE_EDITING
      )) {
        await this.connectComfyUIAdapter(agent, config.comfyuiServerId);
      }

      logger.info(`Agent created successfully: ${config.name}`);
      return agent;
    } catch (error) {
      logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Connects an Ollama adapter to an agent.
   * @param agent Agent to connect
   * @param serverId Ollama server ID
   */
  private async connectOllamaAdapter(agent: Agent, serverId: string): Promise<void> {
    try {
      logger.info(`Connecting Ollama adapter to agent: ${agent.getName()}`);

      // Get or create Ollama adapter
      let ollamaAdapter = this.adapterManager.getOllamaAdapter(serverId);
      
      if (!ollamaAdapter) {
        // Get server config from NexusClient
        const serverConfig = this.nexusClient.getServerConfig(serverId);
        
        if (!serverConfig) {
          throw new Error(`Server config not found for server: ${serverId}`);
        }
        
        // Create adapter
        const adapter = await this.adapterManager.createAdapter(serverId, serverConfig);
        
        if (!adapter || !(adapter instanceof OllamaAdapter)) {
          throw new Error(`Failed to create Ollama adapter for server: ${serverId}`);
        }
        
        ollamaAdapter = adapter;
      }

      // Register Ollama capabilities with the agent
      agent.registerCapability('generateText', async (prompt: string, options: any = {}) => {
        return ollamaAdapter!.generateText(options.model || 'llama3', prompt, options);
      });

      agent.registerCapability('chatCompletion', async (messages: any[], options: any = {}) => {
        return ollamaAdapter!.chatCompletion(options.model || 'llama3', messages, options);
      });

      agent.registerCapability('createEmbedding', async (text: string, options: any = {}) => {
        return ollamaAdapter!.createEmbedding(options.model || 'llama3', text);
      });

      logger.info(`Ollama adapter connected to agent: ${agent.getName()}`);
    } catch (error) {
      logger.error(`Failed to connect Ollama adapter to agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Connects a ComfyUI adapter to an agent.
   * @param agent Agent to connect
   * @param serverId ComfyUI server ID
   */
  private async connectComfyUIAdapter(agent: Agent, serverId: string): Promise<void> {
    try {
      logger.info(`Connecting ComfyUI adapter to agent: ${agent.getName()}`);

      // Get or create ComfyUI adapter
      let comfyuiAdapter = this.adapterManager.getComfyUIAdapter(serverId);
      
      if (!comfyuiAdapter) {
        // Get server config from NexusClient
        const serverConfig = this.nexusClient.getServerConfig(serverId);
        
        if (!serverConfig) {
          throw new Error(`Server config not found for server: ${serverId}`);
        }
        
        // Create adapter
        const adapter = await this.adapterManager.createAdapter(serverId, serverConfig);
        
        if (!adapter || !(adapter instanceof ComfyUIAdapter)) {
          throw new Error(`Failed to create ComfyUI adapter for server: ${serverId}`);
        }
        
        comfyuiAdapter = adapter;
      }

      // Register ComfyUI capabilities with the agent
      agent.registerCapability('generateImageFromText', async (prompt: string, options: any = {}) => {
        return comfyuiAdapter!.generateImageFromText(prompt, options);
      });

      agent.registerCapability('generateImageFromImage', async (imageUrl: string, prompt: string, options: any = {}) => {
        return comfyuiAdapter!.generateImageFromImage(imageUrl, prompt, options);
      });

      agent.registerCapability('upscaleImage', async (imageUrl: string, options: any = {}) => {
        return comfyuiAdapter!.upscaleImage(imageUrl, options);
      });

      agent.registerCapability('inpaintImage', async (imageUrl: string, maskUrl: string, prompt: string, options: any = {}) => {
        return comfyuiAdapter!.inpaintImage(imageUrl, maskUrl, prompt, options);
      });

      agent.registerCapability('applyStyleTransfer', async (imageUrl: string, stylePrompt: string, options: any = {}) => {
        return comfyuiAdapter!.applyStyleTransfer(imageUrl, stylePrompt, options);
      });

      logger.info(`ComfyUI adapter connected to agent: ${agent.getName()}`);
    } catch (error) {
      logger.error(`Failed to connect ComfyUI adapter to agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Gets an agent by name.
   * @param name Agent name
   * @returns Agent or null if not found
   */
  getAgent(name: string): Agent | null {
    return this.agents.get(name) || null;
  }

  /**
   * Gets all agents.
   * @returns Map of agent name to agent
   */
  getAllAgents(): Map<string, Agent> {
    return this.agents;
  }

  /**
   * Removes an agent by name.
   * @param name Agent name
   * @returns True if the agent was removed, false otherwise
   */
  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Clears all agents.
   */
  clearAgents(): void {
    this.agents.clear();
  }

  /**
   * Gets the adapter manager.
   * @returns Adapter manager
   */
  getAdapterManager(): AdapterManager {
    return this.adapterManager;
  }

  /**
   * Gets the agent framework.
   * @returns Agent framework
   */
  getAgentFramework(): AgentFramework {
    return this.agentFramework;
  }

  /**
   * Gets the LLM adapter.
   * @returns LLM adapter
   */
  getLLMAdapter(): LLMAdapter {
    return this.llmAdapter;
  }
}
