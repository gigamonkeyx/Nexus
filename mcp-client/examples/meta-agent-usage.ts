/**
 * Meta-Agent Usage Example
 *
 * This example demonstrates how to use the Meta-Agent to create, test, optimize,
 * and deploy a coding agent.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { MetaAgent, AgentCreationRequest } from '../src/agents/meta/MetaAgent';
import { CodingAgentTemplate } from '../src/agents/meta/templates/CodingAgentTemplate';
import { logger, LogLevel } from '../src/utils/logger';
import { EventBus } from '../src/core/EventBus';

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

    nexusClient.registerServer('lucidity', {
      type: 'sse',
      url: 'http://localhost:3021/sse'
    });

    nexusClient.registerServer('github', {
      type: 'sse',
      url: 'http://localhost:3022/sse'
    });

    nexusClient.registerServer('mcp-benchmark-server', {
      type: 'sse',
      url: 'http://localhost:8020/sse'
    });

    // Connect to servers
    await nexusClient.connectServer('ollama');
    await nexusClient.connectServer('code-enhancement');
    await nexusClient.connectServer('lucidity');
    await nexusClient.connectServer('github');
    await nexusClient.connectServer('mcp-benchmark-server');

    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);

    // Set up event listeners
    const eventBus = EventBus.getInstance();

    eventBus.subscribe('agent:design:completed', (data) => {
      logger.info(`Event: Agent design completed - ${data.name} (${data.agentId})`);
    });

    eventBus.subscribe('agent:implementation:completed', (data) => {
      logger.info(`Event: Agent implementation completed - ${data.name} (${data.agentId})`);
      logger.info(`  Files: ${data.files}, Lines of code: ${data.linesOfCode}`);
    });

    eventBus.subscribe('agent:test:completed', (data) => {
      logger.info(`Event: Agent testing completed - ${data.agentId}`);
      logger.info(`  Passed: ${data.passed}, Performance targets met: ${data.performanceTargetsMet}`);
    });

    eventBus.subscribe('agent:optimization:completed', (data) => {
      logger.info(`Event: Agent optimization completed - ${data.agentId}`);
      logger.info(`  Version: ${data.version}, Improvements: ${data.improvements}`);
    });

    eventBus.subscribe('agent:deployment:completed', (data) => {
      logger.info(`Event: Agent deployment completed - ${data.agentId}`);
      logger.info(`  Version: ${data.version}, Environment: ${data.environment}`);
    });

    eventBus.subscribe('agent:registered', (data) => {
      logger.info(`Event: Agent registered - ${data.name} (${data.agentId})`);
    });

    // Create Meta-Agent
    const metaAgent = new MetaAgent(nexusClient, adapterManager, {
      name: 'Meta-Agent',
      description: 'Agent specialized in creating and optimizing other AI agents',
      templatePath: './src/agents/meta/templates',
      benchmarkServerUrl: 'http://localhost:8020',
      githubServerUrl: 'http://localhost:3022',
      ollamaServerUrl: 'http://localhost:3011',
      codeEnhancementServerUrl: 'http://localhost:3020',
      lucidityServerUrl: 'http://localhost:3021',
      registryPath: './agent-registry',
      githubOwner: 'gigamonkeyx'
    });

    // Initialize the Meta-Agent
    await metaAgent.initialize();

    // Register templates
    metaAgent.registerTemplate('coding', new CodingAgentTemplate());

    // Create a coding agent
    logger.info('Creating a TypeScript coding agent...');

    const request: AgentCreationRequest = {
      agentType: 'coding',
      name: 'TypeScript Wizard',
      description: 'A coding agent specialized in TypeScript development',
      specialization: 'typescript',
      capabilities: [
        'code_generation',
        'code_analysis',
        'refactoring',
        'testing',
        'documentation'
      ],
      performanceTargets: {
        'humaneval': {
          'pass@1': 0.6,
          'pass@10': 0.8
        },
        'codexglue': {
          'bleu': 0.5,
          'codebleu': 0.6
        }
      },
      mcpServers: [
        'ollama',
        'code-enhancement',
        'lucidity',
        'github'
      ],
      additionalConfig: {
        defaultStyle: 'standard',
        includeComments: true,
        maxConcurrentTasks: 3
      }
    };

    const result = await metaAgent.createAgent(request);

    logger.info(`Agent created successfully: ${result.agentId}`);
    logger.info(`Implementation details: ${JSON.stringify(result.implementationDetails, null, 2)}`);

    // Optimize the agent based on benchmark results
    if (result.benchmarkResults &&
        result.benchmarkResults.humaneval &&
        result.benchmarkResults.humaneval.score < request.performanceTargets!.humaneval['pass@1']) {

      logger.info(`Optimizing agent ${result.agentId} to improve benchmark performance...`);

      const optimizationResult = await metaAgent.optimizeAgent(
        result.agentId,
        result.benchmarkResults
      );

      logger.info(`Agent optimized successfully: ${JSON.stringify(optimizationResult.benchmarkResults, null, 2)}`);
    }

    // List all agents in the registry
    logger.info('Listing all agents in the registry...');

    // @ts-ignore - Accessing private property for demo purposes
    const agents = await metaAgent.registry.listAgents();

    logger.info(`Found ${agents.length} agents in the registry:`);
    for (const agent of agents) {
      logger.info(`- ${agent.name} (${agent.agentId}): ${agent.description}`);
      logger.info(`  Type: ${agent.type}, Status: ${agent.status}, Version: ${agent.version}`);
      logger.info(`  Capabilities: ${agent.capabilities.join(', ')}`);
    }

    // Find agents by capability
    logger.info('Finding agents with code_generation capability...');

    // @ts-ignore - Accessing private property for demo purposes
    const codeGenerationAgents = await metaAgent.registry.findAgentsByCapability('code_generation');

    logger.info(`Found ${codeGenerationAgents.length} agents with code_generation capability`);

    // Create another agent with a different specialization
    logger.info('Creating a Python coding agent...');

    const pythonRequest: AgentCreationRequest = {
      agentType: 'coding',
      name: 'Python Wizard',
      description: 'A coding agent specialized in Python development',
      specialization: 'python',
      capabilities: [
        'code_generation',
        'code_analysis',
        'refactoring',
        'testing',
        'documentation'
      ],
      performanceTargets: {
        'humaneval': {
          'pass@1': 0.7,
          'pass@10': 0.9
        }
      },
      mcpServers: [
        'ollama',
        'code-enhancement',
        'lucidity',
        'github'
      ]
    };

    const pythonResult = await metaAgent.createAgent(pythonRequest);

    logger.info(`Python agent created successfully: ${pythonResult.agentId}`);

    // List all agents again
    logger.info('Listing all agents in the registry after creating Python agent...');

    // @ts-ignore - Accessing private property for demo purposes
    const updatedAgents = await metaAgent.registry.listAgents();

    logger.info(`Found ${updatedAgents.length} agents in the registry`);

    logger.info('Meta-Agent example completed successfully');
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
