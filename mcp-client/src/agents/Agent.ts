/**
 * Agent
 *
 * Represents an AI agent that can execute tasks using various capabilities.
 */

import { NexusClient } from '../core/NexusClient';
import { LLMAdapter } from './LLMAdapter';
import { logger } from '../utils/logger';

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  llm: {
    provider: string;
    model: string;
  };
}

/**
 * Task result
 */
export interface TaskResult {
  text: string;
  data?: any;
  error?: Error;
}

/**
 * Agent represents an AI agent that can execute tasks using various capabilities.
 */
export class Agent {
  private nexusClient: NexusClient;
  private llmAdapter: LLMAdapter;
  private config: AgentConfig;
  private capabilities: Map<string, Function> = new Map();
  private memory: any[] = [];
  private modules: Set<string> = new Set();

  /**
   * Creates a new Agent instance.
   * @param nexusClient NexusClient instance
   * @param llmAdapter LLMAdapter instance
   * @param config Agent configuration
   */
  constructor(nexusClient: NexusClient, llmAdapter: LLMAdapter, config: AgentConfig) {
    this.nexusClient = nexusClient;
    this.llmAdapter = llmAdapter;
    this.config = config;
  }

  /**
   * Executes a task.
   * @param task Task to execute
   * @param options Additional options
   * @returns Task result
   */
  async executeTask(task: string, options: any = {}): Promise<TaskResult> {
    try {
      logger.info(`Executing task: ${task}`);

      // Create system message
      const systemMessage = this.createSystemMessage();

      // Create user message
      const userMessage = {
        role: 'user',
        content: task
      };

      // Create messages array
      const messages = [
        systemMessage,
        ...this.memory,
        userMessage
      ];

      // Generate completion
      const completion = await this.llmAdapter.generateCompletion(messages, {
        model: this.config.llm.model,
        ...options
      });

      // Parse completion to extract tool calls
      const toolCalls = this.parseToolCalls(completion.content);

      // Execute tool calls
      const toolResults = await this.executeToolCalls(toolCalls);

      // Add user message and assistant response to memory
      this.memory.push(userMessage);
      this.memory.push({
        role: 'assistant',
        content: completion.content
      });

      // Limit memory size
      if (this.memory.length > 10) {
        this.memory = this.memory.slice(this.memory.length - 10);
      }

      return {
        text: completion.content,
        data: toolResults
      };
    } catch (error) {
      logger.error(`Failed to execute task: ${error instanceof Error ? error.message : String(error)}`);
      return {
        text: `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Creates a system message for the agent.
   * @returns System message
   */
  private createSystemMessage(): any {
    return {
      role: 'system',
      content: `You are ${this.config.name}, ${this.config.description}. You have access to the following capabilities: ${Array.from(this.capabilities.keys()).join(', ')}. When you need to use a capability, use the following format: <tool name="capability_name" parameters={...}></tool>`
    };
  }

  /**
   * Parses tool calls from completion content.
   * @param content Completion content
   * @returns Array of tool calls
   */
  private parseToolCalls(content: string): any[] {
    const toolCalls: any[] = [];
    const regex = /<tool name="([^"]+)" parameters=(\{[^}]+\})><\/tool>/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      try {
        const name = match[1];
        const parameters = JSON.parse(match[2]);
        toolCalls.push({ name, parameters });
      } catch (error) {
        logger.error(`Failed to parse tool call: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return toolCalls;
  }

  /**
   * Executes tool calls.
   * @param toolCalls Array of tool calls
   * @returns Array of tool results
   */
  private async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    const results: any[] = [];

    for (const toolCall of toolCalls) {
      try {
        const capability = this.capabilities.get(toolCall.name);

        if (!capability) {
          throw new Error(`Capability not found: ${toolCall.name}`);
        }

        const result = await capability(toolCall.parameters);
        results.push({ name: toolCall.name, result });
      } catch (error) {
        logger.error(`Failed to execute tool call: ${error instanceof Error ? error.message : String(error)}`);
        results.push({ name: toolCall.name, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  /**
   * Registers a capability with the agent.
   * @param name Capability name
   * @param handler Capability handler
   */
  registerCapability(name: string, handler: Function): void {
    this.capabilities.set(name, handler);
  }

  /**
   * Unregisters a capability from the agent.
   * @param name Capability name
   * @returns True if the capability was unregistered, false otherwise
   */
  unregisterCapability(name: string): boolean {
    return this.capabilities.delete(name);
  }

  /**
   * Gets a capability by name.
   * @param name Capability name
   * @returns Capability handler or null if not found
   */
  getCapability(name: string): Function | null {
    return this.capabilities.get(name) || null;
  }

  /**
   * Gets all capabilities.
   * @returns Map of capability name to handler
   */
  getAllCapabilities(): Map<string, Function> {
    return this.capabilities;
  }

  /**
   * Gets the agent name.
   * @returns Agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Gets the agent description.
   * @returns Agent description
   */
  getDescription(): string {
    return this.config.description;
  }

  /**
   * Gets the agent configuration.
   * @returns Agent configuration
   */
  getConfig(): AgentConfig {
    return this.config;
  }

  /**
   * Gets the agent memory.
   * @returns Agent memory
   */
  getMemory(): any[] {
    return this.memory;
  }

  /**
   * Clears the agent memory.
   */
  clearMemory(): void {
    this.memory = [];
  }

  /**
   * Adds a message to the agent memory.
   * @param message Message to add
   */
  addToMemory(message: any): void {
    this.memory.push(message);

    // Limit memory size
    if (this.memory.length > 10) {
      this.memory = this.memory.slice(this.memory.length - 10);
    }
  }

  /**
   * Registers a module with the agent.
   * @param moduleName Module name
   */
  registerModule(moduleName: string): void {
    this.modules.add(moduleName);
  }

  /**
   * Unregisters a module from the agent.
   * @param moduleName Module name
   * @returns True if the module was unregistered, false otherwise
   */
  unregisterModule(moduleName: string): boolean {
    return this.modules.delete(moduleName);
  }

  /**
   * Checks if a module is registered with the agent.
   * @param moduleName Module name
   * @returns True if the module is registered, false otherwise
   */
  hasModule(moduleName: string): boolean {
    return this.modules.has(moduleName);
  }

  /**
   * Gets all registered modules.
   * @returns Set of module names
   */
  getModules(): Set<string> {
    return this.modules;
  }

  /**
   * Gets the Nexus client.
   * @returns Nexus client
   */
  getNexusClient(): NexusClient {
    return this.nexusClient;
  }

  /**
   * Gets the LLM adapter.
   * @returns LLM adapter
   */
  getLLMAdapter(): LLMAdapter {
    return this.llmAdapter;
  }
}
