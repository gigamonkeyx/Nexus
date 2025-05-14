/**
 * OpenAIAdapter
 * 
 * Adapter for integrating OpenAI models with MCP tools.
 */

import { NexusClient } from '../core/NexusClient';
import { LLMConfig } from '../core/types';

/**
 * OpenAIAdapter provides integration between OpenAI models and MCP tools.
 */
export class OpenAIAdapter {
  private nexusClient: NexusClient;
  private config: LLMConfig;
  private openai: any; // Using any for now, will be properly typed when we add OpenAI SDK

  /**
   * Creates a new OpenAIAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config LLM configuration
   */
  constructor(nexusClient: NexusClient, config: LLMConfig) {
    this.nexusClient = nexusClient;
    this.config = config;
    
    // Initialize OpenAI client
    // This is a placeholder - we'll need to add the OpenAI SDK as a dependency
    this.openai = {
      chat: {
        completions: {
          create: async (params: any) => {
            throw new Error('OpenAI SDK not implemented');
          }
        }
      }
    };
  }

  /**
   * Converts MCP tools to OpenAI function format.
   * @returns Array of tools in OpenAI format
   */
  formatToolsForOpenAI() {
    return Array.from(this.nexusClient.getTools().values()).map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description || "",
        parameters: tool.inputSchema
      }
    }));
  }

  /**
   * Processes a query using OpenAI with tools.
   * @param query User query
   * @param options Processing options
   * @returns Processing result
   */
  async processQuery(query: string, options: any = {}) {
    const messages = [{ role: "user", content: query }];
    const tools = this.formatToolsForOpenAI();
    
    // Initial OpenAI API call
    let response = await this.openai.chat.completions.create({
      model: options.model || this.config.model || "gpt-4o",
      messages,
      tools,
      tool_choice: "auto"
    });
    
    // Process response and handle tool calls
    const finalText = [];
    const toolResults = [];
    
    const responseMessage = response.choices[0].message;
    finalText.push(responseMessage.content || "");
    
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Add assistant message to conversation
      messages.push(responseMessage);
      
      // Process each tool call
      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        // Execute tool call
        const result = await this.nexusClient.callTool(toolName, toolArgs);
        toolResults.push(result);
        finalText.push(`[Calling tool ${toolName} with args ${toolCall.function.arguments}]`);
        
        // Add tool result to messages
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result.content)
        });
      }
      
      // Get next response from OpenAI
      response = await this.openai.chat.completions.create({
        model: options.model || this.config.model || "gpt-4o",
        messages
      });
      
      finalText.push(response.choices[0].message.content || "");
    }
    
    return {
      text: finalText.join("\n"),
      toolResults
    };
  }
}
