/**
 * Agent
 * 
 * Agent class that can perform tasks using LLM and tools.
 */

import { NexusClient } from '../core/NexusClient';
import { ClaudeAdapter } from '../llm/ClaudeAdapter';
import { AgentConfig } from '../core/types';

/**
 * Agent represents an AI agent that can perform tasks using LLM and tools.
 */
export class Agent {
  private nexusClient: NexusClient;
  private llmAdapter: ClaudeAdapter;
  private config: AgentConfig;
  private memory: Array<{ role: string; content: string }>;

  /**
   * Creates a new Agent instance.
   * @param nexusClient NexusClient instance
   * @param llmAdapter LLM adapter
   * @param config Agent configuration
   */
  constructor(nexusClient: NexusClient, llmAdapter: ClaudeAdapter, config: AgentConfig) {
    this.nexusClient = nexusClient;
    this.llmAdapter = llmAdapter;
    this.config = config;
    this.memory = [];
  }

  /**
   * Executes a task.
   * @param task Task description
   * @returns Task execution result
   */
  async executeTask(task: string): Promise<any> {
    // Add task to memory
    this.memory.push({ role: "user", content: task });
    
    // Process with LLM
    const response = await this.llmAdapter.processQuery(
      this.formatMemoryForQuery(),
      this.config.options
    );
    
    // Add response to memory
    this.memory.push({ role: "assistant", content: response.text });
    
    return response;
  }

  /**
   * Formats memory for query.
   * @returns Formatted memory
   */
  private formatMemoryForQuery(): string {
    // Simple implementation - just return the last user message
    const lastUserMessage = [...this.memory]
      .reverse()
      .find(msg => msg.role === "user");
    
    return lastUserMessage ? lastUserMessage.content : "";
  }

  /**
   * Gets the agent's memory.
   * @returns Agent memory
   */
  getMemory(): Array<{ role: string; content: string }> {
    return [...this.memory];
  }

  /**
   * Clears the agent's memory.
   */
  clearMemory(): void {
    this.memory = [];
  }
}
