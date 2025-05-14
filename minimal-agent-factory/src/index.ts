/**
 * Minimal Agent Factory
 * 
 * A minimal factory for creating and managing AI agents.
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  logger,
  LogLevel
} from 'bootstrap-core';
import { MinimalAgentFactory } from './MinimalAgentFactory';
import * as path from 'path';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

/**
 * Main function
 */
async function main() {
  try {
    // Create NexusClient
    const nexusClient = new NexusClient();
    
    // Register servers
    const servers = ['ollama', 'code-enhancement', 'lucidity'];
    
    servers.forEach(server => {
      nexusClient.registerServer(server, {
        type: 'sse',
        url: `http://localhost:${getPortForServer(server)}/sse`
      });
    });
    
    // Connect to servers
    for (const server of servers) {
      try {
        await nexusClient.connectServer(server);
        logger.info(`Connected to ${server} server`);
      } catch (error) {
        logger.warn(`Failed to connect to ${server} server: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create AgentCommunication
    const agentCommunication = new AgentCommunication(nexusClient, {
      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace')
    });
    
    // Create MinimalAgentFactory
    const factory = new MinimalAgentFactory(
      nexusClient,
      adapterManager,
      agentCommunication,
      {
        workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
        outputPath: path.join(process.cwd(), '..', '..', 'agents'),
        templatePath: path.join(process.cwd(), '..', '..', 'agent-templates'),
        agentSpecsPath: path.join(process.cwd(), '..', '..', 'agent-specs'),
        bootstrapAgents: {
          factoryEnhancerAgentId: 'factory-enhancer-agent',
          benchmarkingAgentId: 'benchmarking-agent',
          continuousLearningAgentId: 'continuous-learning-agent'
        }
      }
    );
    
    // Initialize the factory
    await factory.initialize();
    
    // Start the factory
    await factory.start();
    
    // Create a simple agent
    const agentId = await factory.createAgent(
      'Simple Agent',
      'generic',
      ['basic_agent'],
      {
        description: 'A simple agent for testing'
      }
    );
    
    logger.info(`Created agent: ${agentId}`);
    
    // Start the agent
    await factory.startAgent(agentId);
    
    // Create a task for the agent
    const taskId = await factory.createTask(
      agentId,
      'Test Task',
      'A simple task for testing',
      {
        priority: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    );
    
    logger.info(`Created task: ${taskId}`);
    
    // Keep the process running
    logger.info('Minimal Agent Factory is running. Press Ctrl+C to stop.');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Stopping Minimal Agent Factory...');
      await factory.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * Get port for a server
 */
function getPortForServer(server: string): number {
  // Default ports for common servers
  const serverPorts: Record<string, number> = {
    'ollama': 3011,
    'code-enhancement': 3020,
    'lucidity': 3021,
    'github': 3022,
    'mcp-benchmark-server': 8020
  };
  
  return serverPorts[server] || 3000;
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
