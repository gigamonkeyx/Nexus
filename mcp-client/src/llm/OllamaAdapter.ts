/**
 * OllamaAdapter
 * 
 * Adapter for integrating Ollama models with MCP tools.
 */

import { NexusClient } from '../core/NexusClient';
import { LLMConfig } from '../core/types';

/**
 * OllamaAdapter provides integration between Ollama models and MCP tools.
 */
export class OllamaAdapter {
  private nexusClient: NexusClient;
  private config: LLMConfig;
  private baseUrl: string;

  /**
   * Creates a new OllamaAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config LLM configuration
   */
  constructor(nexusClient: NexusClient, config: LLMConfig) {
    this.nexusClient = nexusClient;
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  /**
   * Converts MCP tools to a format that can be included in the prompt.
   * @returns Tool descriptions for the prompt
   */
  formatToolsForPrompt(): string {
    const tools = Array.from(this.nexusClient.getTools().values());
    
    if (tools.length === 0) {
      return '';
    }
    
    let toolsText = 'You have access to the following tools:\n\n';
    
    for (const tool of tools) {
      toolsText += `Tool: ${tool.name}\n`;
      toolsText += `Description: ${tool.description || 'No description provided'}\n`;
      toolsText += `Parameters: ${JSON.stringify(tool.inputSchema, null, 2)}\n\n`;
    }
    
    toolsText += 'To use a tool, respond with JSON in the following format:\n';
    toolsText += '```json\n{"tool": "tool_name", "parameters": {"param1": "value1", "param2": "value2"}}\n```\n\n';
    
    return toolsText;
  }

  /**
   * Processes a query using Ollama with tools.
   * @param query User query
   * @param options Processing options
   * @returns Processing result
   */
  async processQuery(query: string, options: any = {}) {
    const model = options.model || this.config.model || 'llama3';
    const toolsPrompt = this.formatToolsForPrompt();
    const fullPrompt = `${toolsPrompt}${query}`;
    
    // Call Ollama API
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: fullPrompt,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const responseText = data.response;
    
    // Try to extract tool calls from the response
    const toolCalls = this.extractToolCalls(responseText);
    const finalText = [];
    const toolResults = [];
    
    // If no tool calls were found, return the response as is
    if (toolCalls.length === 0) {
      return {
        text: responseText,
        toolResults: []
      };
    }
    
    // Process each tool call
    for (const toolCall of toolCalls) {
      try {
        const result = await this.nexusClient.callTool(toolCall.tool, toolCall.parameters);
        toolResults.push(result);
        finalText.push(`[Calling tool ${toolCall.tool} with args ${JSON.stringify(toolCall.parameters)}]`);
        
        // Call Ollama again with the tool result
        const followUpPrompt = `${fullPrompt}\n\nTool result: ${JSON.stringify(result.content)}\n\nBased on this result, please provide your final answer:`;
        
        const followUpResponse = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            prompt: followUpPrompt,
            stream: false
          })
        });
        
        if (!followUpResponse.ok) {
          throw new Error(`Ollama API error: ${followUpResponse.statusText}`);
        }
        
        const followUpData = await followUpResponse.json();
        finalText.push(followUpData.response);
      } catch (error) {
        finalText.push(`Error calling tool ${toolCall.tool}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return {
      text: finalText.join('\n'),
      toolResults
    };
  }

  /**
   * Extracts tool calls from the response text.
   * @param text Response text
   * @returns Array of tool calls
   */
  private extractToolCalls(text: string): Array<{ tool: string; parameters: any }> {
    const toolCalls = [];
    
    // Look for JSON blocks in the response
    const jsonRegex = /```json\s*([\s\S]*?)\s*```|{[\s\S]*?}/g;
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        const jsonText = match[1] || match[0];
        const json = JSON.parse(jsonText);
        
        if (json.tool && json.parameters) {
          toolCalls.push({
            tool: json.tool,
            parameters: json.parameters
          });
        }
      } catch (error) {
        // Ignore invalid JSON
      }
    }
    
    return toolCalls;
  }
}
