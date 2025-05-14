/**
 * ClaudeAdapter
 * 
 * Adapter for integrating Anthropic Claude with MCP tools.
 */

import { Anthropic } from 'anthropic';
import { NexusClient } from '../core/NexusClient';
import { LLMConfig } from '../core/types';

/**
 * ClaudeAdapter provides integration between Anthropic Claude and MCP tools.
 */
export class ClaudeAdapter {
  private nexusClient: NexusClient;
  private anthropic: Anthropic;
  private config: LLMConfig;

  /**
   * Creates a new ClaudeAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config LLM configuration
   */
  constructor(nexusClient: NexusClient, config: LLMConfig) {
    this.nexusClient = nexusClient;
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl
    });
  }

  /**
   * Converts MCP tools to Claude tool format.
   * @returns Array of tools in Claude format
   */
  formatToolsForClaude() {
    return Array.from(this.nexusClient.getTools().values()).map(tool => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: tool.inputSchema
    }));
  }

  /**
   * Processes a query using Claude with tools.
   * @param query User query
   * @param options Processing options
   * @returns Processing result
   */
  async processQuery(query: string, options: any = {}) {
    const messages = [{ role: "user", content: query }];
    const tools = this.formatToolsForClaude();
    
    // Initial Claude API call
    let response = await this.anthropic.messages.create({
      model: options.model || this.config.model || "claude-3-5-sonnet-20241022",
      max_tokens: options.maxTokens || 1000,
      messages,
      tools
    });
    
    // Process response and handle tool calls
    const finalText = [];
    const toolResults = [];
    
    for (const content of response.content) {
      if (content.type === 'text') {
        finalText.push(content.text);
      } else if (content.type === 'tool_use') {
        const toolName = content.name;
        const toolArgs = content.input;
        
        // Execute tool call
        const result = await this.nexusClient.callTool(toolName, toolArgs);
        toolResults.push(result);
        finalText.push(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`);
        
        // Add tool result to messages
        messages.push({
          role: "assistant",
          content: [content]
        });
        messages.push({
          role: "user",
          content: [{
            type: "tool_result",
            tool_use_id: content.id,
            content: result.content
          }]
        });
        
        // Get next response from Claude
        response = await this.anthropic.messages.create({
          model: options.model || this.config.model || "claude-3-5-sonnet-20241022",
          max_tokens: options.maxTokens || 1000,
          messages
        });
        
        finalText.push(response.content[0].text);
      }
    }
    
    return {
      text: finalText.join("\n"),
      toolResults
    };
  }
}
