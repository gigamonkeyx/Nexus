/**
 * ModularAgentFramework
 * 
 * Framework for creating and managing modular AI agents.
 */

import { NexusClient } from '../core/NexusClient';
import { Agent, AgentConfig } from './Agent';
import { LLMAdapter } from './LLMAdapter';
import { Module, ModuleConfig } from './modules/Module';
import { logger } from '../utils/logger';

/**
 * Modular agent configuration
 */
export interface ModularAgentConfig extends AgentConfig {
  modules?: ModuleConfig[];
}

/**
 * ModularAgentFramework provides a framework for creating and managing modular AI agents.
 */
export class ModularAgentFramework {
  private nexusClient: NexusClient;
  private llmAdapter: LLMAdapter;
  private agents: Map<string, Agent> = new Map();
  private modules: Map<string, Module> = new Map();

  /**
   * Creates a new ModularAgentFramework instance.
   * @param nexusClient NexusClient instance
   * @param llmAdapter LLMAdapter instance
   */
  constructor(nexusClient: NexusClient, llmAdapter: LLMAdapter) {
    this.nexusClient = nexusClient;
    this.llmAdapter = llmAdapter;
  }

  /**
   * Creates an agent.
   * @param config Agent configuration
   * @returns Created agent
   */
  async createAgent(config: ModularAgentConfig): Promise<Agent> {
    try {
      logger.info(`Creating agent: ${config.name}`);

      // Create agent
      const agent = new Agent(this.nexusClient, this.llmAdapter, config);

      // Register basic capabilities
      this.registerBasicCapabilities(agent);

      // Initialize modules
      if (config.modules) {
        for (const moduleConfig of config.modules) {
          await this.initializeModule(agent, moduleConfig);
        }
      }

      // Store agent
      this.agents.set(config.name, agent);

      logger.info(`Agent created successfully: ${config.name}`);
      return agent;
    } catch (error) {
      logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Registers basic capabilities with an agent.
   * @param agent Agent to register capabilities with
   */
  private registerBasicCapabilities(agent: Agent): void {
    // Register callTool capability
    agent.registerCapability('callTool', async (parameters: any) => {
      try {
        const { tool, parameters: toolParameters } = parameters;
        return await this.nexusClient.callTool(tool, toolParameters);
      } catch (error) {
        logger.error(`Failed to call tool: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    // Register getTools capability
    agent.registerCapability('getTools', async () => {
      try {
        return this.nexusClient.getTools();
      } catch (error) {
        logger.error(`Failed to get tools: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    // Register getServerInfo capability
    agent.registerCapability('getServerInfo', async (parameters: any) => {
      try {
        const { serverId } = parameters;
        return this.nexusClient.getServerInfo(serverId);
      } catch (error) {
        logger.error(`Failed to get server info: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    // Register getMemory capability
    agent.registerCapability('getMemory', async () => {
      try {
        return agent.getMemory();
      } catch (error) {
        logger.error(`Failed to get memory: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    // Register clearMemory capability
    agent.registerCapability('clearMemory', async () => {
      try {
        agent.clearMemory();
        return { success: true };
      } catch (error) {
        logger.error(`Failed to clear memory: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  }

  /**
   * Initializes a module for an agent.
   * @param agent Agent to initialize module for
   * @param moduleConfig Module configuration
   * @returns Initialized module
   */
  async initializeModule(agent: Agent, moduleConfig: ModuleConfig): Promise<Module> {
    try {
      logger.info(`Initializing module ${moduleConfig.name} for agent ${agent.getName()}`);

      // Check if module already exists
      let module = this.modules.get(moduleConfig.name);

      if (!module) {
        // Create module instance
        const ModuleClass = await this.loadModuleClass(moduleConfig.name);
        module = new ModuleClass(moduleConfig);
        this.modules.set(moduleConfig.name, module);
      }

      // Initialize module
      await module.initialize(agent);

      logger.info(`Module ${moduleConfig.name} initialized for agent ${agent.getName()}`);
      return module;
    } catch (error) {
      logger.error(`Failed to initialize module: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Loads a module class by name.
   * @param moduleName Module name
   * @returns Module class
   */
  private async loadModuleClass(moduleName: string): Promise<any> {
    try {
      // In a real implementation, this would dynamically load the module class
      // For now, we'll use a simple switch statement
      switch (moduleName) {
        case 'TextGenerationModule':
          return (await import('./modules/TextGenerationModule')).TextGenerationModule;
        case 'ImageGenerationModule':
          return (await import('./modules/ImageGenerationModule')).ImageGenerationModule;
        case 'ResearchModule':
          return (await import('./modules/ResearchModule')).ResearchModule;
        case 'PresentationModule':
          return (await import('./modules/PresentationModule')).PresentationModule;
        default:
          throw new Error(`Module not found: ${moduleName}`);
      }
    } catch (error) {
      logger.error(`Failed to load module class: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Executes a task with an agent.
   * @param agentName Agent name
   * @param task Task to execute
   * @param options Additional options
   * @returns Task result
   */
  async executeTask(agentName: string, task: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Executing task with agent ${agentName}: ${task}`);

      // Get agent
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      // Try to handle task with modules
      for (const module of this.modules.values()) {
        if (module.handleTask) {
          const handled = await module.handleTask(task, agent);
          if (handled) {
            logger.info(`Task handled by module ${module.getName()}`);
            return { handled: true, module: module.getName() };
          }
        }
      }

      // If no module handled the task, execute it with the agent
      const result = await agent.executeTask(task, options);
      return result;
    } catch (error) {
      logger.error(`Failed to execute task: ${error instanceof Error ? error.message : String(error)}`);
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
   * Gets a module by name.
   * @param name Module name
   * @returns Module or null if not found
   */
  getModule(name: string): Module | null {
    return this.modules.get(name) || null;
  }

  /**
   * Gets all modules.
   * @returns Map of module name to module
   */
  getAllModules(): Map<string, Module> {
    return this.modules;
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
   * Removes a module by name.
   * @param name Module name
   * @returns True if the module was removed, false otherwise
   */
  removeModule(name: string): boolean {
    return this.modules.delete(name);
  }

  /**
   * Clears all agents.
   */
  clearAgents(): void {
    this.agents.clear();
  }

  /**
   * Clears all modules.
   */
  clearModules(): void {
    this.modules.clear();
  }

  /**
   * Gets the LLM adapter.
   * @returns LLM adapter
   */
  getLLMAdapter(): LLMAdapter {
    return this.llmAdapter;
  }

  /**
   * Sets the LLM adapter.
   * @param llmAdapter LLM adapter
   */
  setLLMAdapter(llmAdapter: LLMAdapter): void {
    this.llmAdapter = llmAdapter;
  }
}
