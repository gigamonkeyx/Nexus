/**
 * Factory Enhancer Agent
 *
 * An agent specialized in enhancing the AI Agent Factory with advanced features
 * like τ-Bench integration, continuous learning, and architecture improvements.
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  TaskManager,
  logger,
  LogLevel,
  BaseAgentConfig
} from 'bootstrap-core';
import { FactoryEnhancerAgent, FactoryEnhancerConfig } from './FactoryEnhancerAgent';
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

    // Create FactoryEnhancerAgent
    const agentConfig: FactoryEnhancerConfig = {
      name: 'Factory Enhancer Agent',
      description: 'An agent specialized in enhancing the AI Agent Factory',
      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
      taskSpecsPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'tasks', 'factory-enhancer-tasks.md'),
      outputPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'src', 'benchmarks'),
      collaborators: {
        benchmarkingAgentId: 'benchmarking-agent',
        learningAgentId: 'continuous-learning-agent'
      }
    };

    const agent = new FactoryEnhancerAgent(
      nexusClient,
      adapterManager,
      agentCommunication,
      agentConfig
    );

    // Initialize the agent
    await agent.initialize();

    // Start the agent
    await agent.start();

    // Keep the process running
    logger.info('Factory Enhancer Agent is running. Press Ctrl+C to stop.');

    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Stopping Factory Enhancer Agent...');
      await agent.stop();
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
