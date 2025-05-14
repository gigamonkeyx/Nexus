/**
 * AgentFramework
 * 
 * Framework for building AI agents with MCP tools.
 */

import { NexusClient } from '../core/NexusClient';
import { ClaudeAdapter } from '../llm/ClaudeAdapter';
import { Agent } from './Agent';
import { AgentConfig } from '../core/types';

/**
 * AgentFramework provides a structure for building AI agents that use MCP tools.
 */
export class AgentFramework {
  private nexusClient: NexusClient;
  private llmAdapter: ClaudeAdapter;

  /**
   * Creates a new AgentFramework instance.
   * @param nexusClient NexusClient instance
   * @param llmAdapter LLM adapter
   */
  constructor(nexusClient: NexusClient, llmAdapter: ClaudeAdapter) {
    this.nexusClient = nexusClient;
    this.llmAdapter = llmAdapter;
  }

  /**
   * Creates a new agent with specific capabilities.
   * @param config Agent configuration
   * @returns Agent instance
   */
  createAgent(config: AgentConfig): Agent {
    return new Agent(this.nexusClient, this.llmAdapter, config);
  }
}
