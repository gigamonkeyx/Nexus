/**
 * Multi-LLM example for the Nexus MCP Client.
 * 
 * This example demonstrates how to:
 * 1. Create a NexusClient instance
 * 2. Connect to MCP servers
 * 3. Create multiple LLM adapters
 * 4. Create agents with different LLM providers
 * 5. Execute tasks with different agents
 */

import { NexusClient } from '../src/core/NexusClient';
import { ServerManager } from '../src/server/ServerManager';
import { ClaudeAdapter } from '../src/llm/ClaudeAdapter';
import { OpenAIAdapter } from '../src/llm/OpenAIAdapter';
import { OllamaAdapter } from '../src/llm/OllamaAdapter';
import { AgentFramework } from '../src/agent/AgentFramework';
import { Agent } from '../src/agent/Agent';

async function main() {
  try {
    console.log('Creating NexusClient...');
    const nexusClient = new NexusClient();
    
    console.log('Creating ServerManager...');
    const serverManager = new ServerManager(nexusClient);
    
    // Register servers
    console.log('Registering servers...');
    
    // ComfyUI MCP Server (HTTP)
    serverManager.registerServer('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020'
    });
    
    // Supabase MCP Server (HTTP)
    serverManager.registerServer('supabase', {
      type: 'sse',
      url: 'http://localhost:3007'
    });
    
    // Terminal MCP Server (HTTP)
    serverManager.registerServer('terminal', {
      type: 'sse',
      url: 'http://localhost:3014'
    });
    
    // Connect to all registered servers
    console.log('Connecting to servers...');
    const connectionResults = await serverManager.connectAll();
    console.log('Connection results:', connectionResults);
    
    // Create LLM adapters
    console.log('Creating LLM adapters...');
    
    // Claude adapter
    const claudeAdapter = new ClaudeAdapter(nexusClient, {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key',
      model: 'claude-3-5-sonnet-20241022'
    });
    
    // OpenAI adapter
    const openaiAdapter = new OpenAIAdapter(nexusClient, {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
      model: 'gpt-4o'
    });
    
    // Ollama adapter
    const ollamaAdapter = new OllamaAdapter(nexusClient, {
      provider: 'ollama',
      model: 'llama3'
    });
    
    // Create agent frameworks
    console.log('Creating agent frameworks...');
    const claudeAgentFramework = new AgentFramework(nexusClient, claudeAdapter);
    
    // Create agents
    console.log('Creating agents...');
    
    // Claude agent
    const claudeAgent = claudeAgentFramework.createAgent({
      name: 'claude-agent',
      description: 'Agent powered by Claude',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022'
      }
    });
    
    // Execute tasks with different agents
    console.log('Executing tasks...');
    
    // Task 1: Generate an image
    const imageTask = 'Generate an image of a sunset over the ocean';
    console.log(`\nTask for Claude agent: ${imageTask}`);
    
    const imageResult = await claudeAgent.executeTask(imageTask);
    console.log('Claude agent result:', imageResult.text);
    
    // Task 2: Query the database
    const dbTask = 'Find all users who signed up in the last month';
    console.log(`\nTask for Claude agent: ${dbTask}`);
    
    const dbResult = await claudeAgent.executeTask(dbTask);
    console.log('Claude agent result:', dbResult.text);
    
    // Task 3: Execute a terminal command
    const terminalTask = 'List all files in the current directory';
    console.log(`\nTask for Claude agent: ${terminalTask}`);
    
    const terminalResult = await claudeAgent.executeTask(terminalTask);
    console.log('Claude agent result:', terminalResult.text);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
main();
