/**
 * Basic usage example for the Nexus MCP Client.
 * 
 * This example demonstrates how to:
 * 1. Create a NexusClient instance
 * 2. Connect to MCP servers
 * 3. Create an LLM adapter
 * 4. Create an agent
 * 5. Execute a task
 */

import { NexusClient } from '../src/core/NexusClient';
import { ServerManager } from '../src/server/ServerManager';
import { ClaudeAdapter } from '../src/llm/ClaudeAdapter';
import { AgentFramework } from '../src/agent/AgentFramework';
import { StdioTransport } from '../src/transport/StdioTransport';
import { HttpTransport } from '../src/transport/HttpTransport';

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
    
    // Get server status
    console.log('Getting server status...');
    const serverStatus = await serverManager.getServerStatus();
    console.log('Server status:', serverStatus);
    
    // Create a Claude adapter
    console.log('Creating Claude adapter...');
    const claudeAdapter = new ClaudeAdapter(nexusClient, {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key',
      model: 'claude-3-5-sonnet-20241022'
    });
    
    // Create an agent framework
    console.log('Creating agent framework...');
    const agentFramework = new AgentFramework(nexusClient, claudeAdapter);
    
    // Create an agent
    console.log('Creating agent...');
    const agent = agentFramework.createAgent({
      name: 'research-agent',
      description: 'Agent for research tasks',
      llm: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022'
      }
    });
    
    // Execute a task
    console.log('Executing task...');
    const task = 'Generate an image of a sunset and store it in the database';
    console.log(`Task: ${task}`);
    
    const result = await agent.executeTask(task);
    console.log('Result:', result.text);
    
    // Disconnect from servers
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the example
main();
