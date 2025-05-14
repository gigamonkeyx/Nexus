/**
 * Continuous Learning Agent
 *
 * An agent specialized in improving other agents through continuous learning
 * from feedback and experience.
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
import { ContinuousLearningAgent, ContinuousLearningConfig } from './ContinuousLearningAgent';
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

    // Create ContinuousLearningAgent
    const agentConfig: BaseAgentConfig = {
      name: 'Continuous Learning Agent',
      description: 'An agent specialized in improving other agents through continuous learning',
      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
      taskSpecsPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'tasks', 'continuous-learning-agent-tasks.md'),
      outputPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'src', 'learning'),
      collaborators: {
        factoryEnhancerAgentId: 'factory-enhancer-agent',
        benchmarkingAgentId: 'benchmarking-agent'
      }
    };

    const agent = new ContinuousLearningAgent(
      nexusClient,
      adapterManager,
      agentCommunication,
      {
        ...agentConfig,
        feedbackStoragePath: path.join(process.cwd(), '..', '..', 'agent-workspace', 'feedback'),
        modelStoragePath: path.join(process.cwd(), '..', '..', 'agent-workspace', 'models'),
        collaborators: {
          factoryEnhancerAgentId: 'factory-enhancer-agent',
          benchmarkingAgentId: 'benchmarking-agent'
        }
      } as ContinuousLearningConfig
    );

    // Initialize the agent
    await agent.initialize();

    // Start the agent
    await agent.start();

    // Keep the process running
    logger.info('Continuous Learning Agent is running. Press Ctrl+C to stop.');

    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Stopping Continuous Learning Agent...');
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
