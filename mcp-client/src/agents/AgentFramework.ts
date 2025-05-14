/**
 * AgentFramework
 * 
 * Framework for creating and managing AI agents.
 */

import { NexusClient } from '../core/NexusClient';
import { Agent, AgentConfig } from './Agent';
import { LLMAdapter } from './LLMAdapter';
import { logger } from '../utils/logger';

/**
 * AgentFramework provides a framework for creating and managing AI agents.
 */
export class AgentFramework {
  private nexusClient: NexusClient;
  private llmAdapter: LLMAdapter;
  private agents: Map<string, Agent> = new Map();

  /**
   * Creates a new AgentFramework instance.
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
  createAgent(config: AgentConfig): Agent {
    try {
      logger.info(`Creating agent: ${config.name}`);

      // Create agent
      const agent = new Agent(this.nexusClient, this.llmAdapter, config);

      // Register basic capabilities
      this.registerBasicCapabilities(agent);

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
