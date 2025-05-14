/**
 * Bootstrap Factory Usage Example
 *
 * This example demonstrates how to use the MinimalAgentFactory to create
 * the initial set of agents that will help enhance the factory itself.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { MinimalAgentFactory } from '../src/agents/bootstrap/MinimalAgentFactory';
import { logger, LogLevel } from '../src/utils/logger';
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
    nexusClient.registerServer('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });

    nexusClient.registerServer('code-enhancement', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });

    // Connect to servers
    await nexusClient.connectServer('ollama');
    await nexusClient.connectServer('code-enhancement');

    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);

    // Create MinimalAgentFactory
    const factory = new MinimalAgentFactory(nexusClient, adapterManager, {
      outputDir: path.join(process.cwd(), 'bootstrap-agents'),
      workspacePath: path.join(process.cwd(), 'agent-workspace')
    });

    // Initialize the factory
    await factory.initialize();

    // Create FactoryEnhancerAgent
    logger.info('Creating FactoryEnhancerAgent...');

    const factoryEnhancerResult = await factory.createAgent({
      name: 'Factory Enhancer Agent',
      description: 'An agent specialized in enhancing the AI Agent Factory',
      type: 'factory-enhancer',
      specialization: 'typescript',
      capabilities: [
        'code_generation',
        'code_analysis',
        'refactoring',
        'factory_enhancement'
      ],
      mcpServers: [
        'ollama',
        'code-enhancement'
      ]
    });

    logger.info(`FactoryEnhancerAgent created successfully: ${factoryEnhancerResult.agentId}`);
    logger.info(`Base path: ${factoryEnhancerResult.basePath}`);
    logger.info(`Files: ${factoryEnhancerResult.files.join(', ')}`);

    // Create BenchmarkingAgent
    logger.info('Creating BenchmarkingAgent...');

    const benchmarkingResult = await factory.createAgent({
      name: 'Benchmarking Agent',
      description: 'An agent specialized in implementing and running benchmarks for other agents',
      type: 'coding',
      specialization: 'benchmarking',
      capabilities: [
        'code_generation',
        'benchmarking',
        'test_generation',
        'performance_analysis'
      ],
      mcpServers: [
        'ollama',
        'code-enhancement'
      ]
    });

    logger.info(`BenchmarkingAgent created successfully: ${benchmarkingResult.agentId}`);
    logger.info(`Base path: ${benchmarkingResult.basePath}`);
    logger.info(`Files: ${benchmarkingResult.files.join(', ')}`);

    // Create ContinuousLearningAgent
    logger.info('Creating ContinuousLearningAgent...');

    const learningResult = await factory.createAgent({
      name: 'Continuous Learning Agent',
      description: 'An agent specialized in implementing continuous learning capabilities',
      type: 'coding',
      specialization: 'machine learning',
      capabilities: [
        'code_generation',
        'machine_learning',
        'feedback_analysis',
        'model_optimization'
      ],
      mcpServers: [
        'ollama',
        'code-enhancement'
      ]
    });

    logger.info(`ContinuousLearningAgent created successfully: ${learningResult.agentId}`);
    logger.info(`Base path: ${learningResult.basePath}`);
    logger.info(`Files: ${learningResult.files.join(', ')}`);

    logger.info('All bootstrap agents created successfully');

    // Create a shared task for all agents
    logger.info('Creating a shared task for all agents...');

    // @ts-ignore - Accessing private property for demo purposes
    const agentCommunication = factory['agentCommunication'];

    const taskId = agentCommunication.createSharedTask(
      'system',
      [factoryEnhancerResult.agentId, benchmarkingResult.agentId, learningResult.agentId],
      'Enhance AI Agent Factory',
      'Collaborate to enhance the AI Agent Factory with advanced features',
      {
        assignees: [factoryEnhancerResult.agentId, benchmarkingResult.agentId, learningResult.agentId],
        tasks: [
          {
            agentId: factoryEnhancerResult.agentId,
            task: 'Implement τ-Bench Integration',
            description: 'Implement the τ-bench integration for evaluating agents in dynamic real-world settings',
            priority: 'high',
            dependencies: []
          },
          {
            agentId: benchmarkingResult.agentId,
            task: 'Implement Basic Benchmarking Framework',
            description: 'Implement a basic benchmarking framework for evaluating agents',
            priority: 'high',
            dependencies: []
          },
          {
            agentId: learningResult.agentId,
            task: 'Implement Feedback Collection System',
            description: 'Implement a system for collecting feedback from various sources',
            priority: 'high',
            dependencies: []
          }
        ]
      }
    );

    logger.info(`Shared task created with ID: ${taskId}`);

    // Share task specifications with agents
    logger.info('Sharing task specifications with agents...');

    agentCommunication.shareFile(
      'system',
      factoryEnhancerResult.agentId,
      path.join(process.cwd(), 'mcp-client', 'tasks', 'factory-enhancer-tasks.md'),
      'Detailed task specifications for Factory Enhancer Agent'
    );

    agentCommunication.shareFile(
      'system',
      benchmarkingResult.agentId,
      path.join(process.cwd(), 'mcp-client', 'tasks', 'benchmarking-agent-tasks.md'),
      'Detailed task specifications for Benchmarking Agent'
    );

    agentCommunication.shareFile(
      'system',
      learningResult.agentId,
      path.join(process.cwd(), 'mcp-client', 'tasks', 'continuous-learning-agent-tasks.md'),
      'Detailed task specifications for Continuous Learning Agent'
    );

    // Next steps
    logger.info('\nNext steps:');
    logger.info('1. Review the generated agents');
    logger.info('2. Run the agents to enhance the factory');
    logger.info('3. Monitor agent communication in the agent-workspace directory');
    logger.info('4. Use the enhanced factory to create more sophisticated agents');
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
