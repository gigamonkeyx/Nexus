/**
 * Adapter Agent Usage Example
 * 
 * This example demonstrates how to use the AdapterAgentFramework to create agents
 * that leverage specialized adapters for Ollama and ComfyUI MCP servers.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { ClaudeAdapter } from '../src/agents/ClaudeAdapter';
import { AdapterAgentFramework, AgentCapability } from '../src/agents/AdapterAgentFramework';
import { logger, LogLevel } from '../src/utils/logger';

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
    
    nexusClient.registerServer('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    // Connect to servers
    await nexusClient.connectServer('ollama');
    await nexusClient.connectServer('comfyui');
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create ClaudeAdapter
    const claudeAdapter = new ClaudeAdapter({
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229-v1:0',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
    });
    
    // Create AdapterAgentFramework
    const agentFramework = new AdapterAgentFramework(nexusClient, adapterManager, claudeAdapter);
    
    // Create a research agent with Ollama capabilities
    const researchAgent = await agentFramework.createAgent({
      name: 'Research Agent',
      description: 'An agent that can research topics and generate text',
      capabilities: [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.CHAT_COMPLETION,
        AgentCapability.EMBEDDING_CREATION,
        AgentCapability.RESEARCH
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229-v1:0'
      },
      ollamaServerId: 'ollama'
    });
    
    // Create a creative agent with ComfyUI capabilities
    const creativeAgent = await agentFramework.createAgent({
      name: 'Creative Agent',
      description: 'An agent that can generate and edit images',
      capabilities: [
        AgentCapability.IMAGE_GENERATION,
        AgentCapability.IMAGE_EDITING
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229-v1:0'
      },
      comfyuiServerId: 'comfyui'
    });
    
    // Create a multimodal agent with both Ollama and ComfyUI capabilities
    const multimodalAgent = await agentFramework.createAgent({
      name: 'Multimodal Agent',
      description: 'An agent that can research topics, generate text, and create images',
      capabilities: [
        AgentCapability.TEXT_GENERATION,
        AgentCapability.CHAT_COMPLETION,
        AgentCapability.EMBEDDING_CREATION,
        AgentCapability.IMAGE_GENERATION,
        AgentCapability.IMAGE_EDITING,
        AgentCapability.RESEARCH
      ],
      llm: {
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229-v1:0'
      },
      ollamaServerId: 'ollama',
      comfyuiServerId: 'comfyui'
    });
    
    // Execute tasks with the research agent
    logger.info('Executing task with research agent...');
    const researchResult = await researchAgent.executeTask('Research the history of artificial intelligence and summarize the key milestones.');
    logger.info(`Research agent result: ${researchResult.text.substring(0, 100)}...`);
    
    // Execute tasks with the creative agent
    logger.info('Executing task with creative agent...');
    const creativeResult = await creativeAgent.executeTask('Generate an image of a futuristic city with flying cars and tall skyscrapers.');
    logger.info(`Creative agent result: ${creativeResult.text.substring(0, 100)}...`);
    
    // Execute tasks with the multimodal agent
    logger.info('Executing task with multimodal agent...');
    const multimodalResult = await multimodalAgent.executeTask('Research the concept of neural networks, summarize it, and create an image that illustrates how they work.');
    logger.info(`Multimodal agent result: ${multimodalResult.text.substring(0, 100)}...`);
    
    // Execute a complex task with the multimodal agent
    logger.info('Executing complex task with multimodal agent...');
    const complexResult = await multimodalAgent.executeTask(`
      1. Research the concept of quantum computing
      2. Summarize the key principles in simple terms
      3. Generate an image that illustrates quantum computing
      4. Create a more detailed explanation of quantum entanglement
      5. Generate another image that specifically illustrates quantum entanglement
    `);
    logger.info(`Complex task result: ${complexResult.text.substring(0, 100)}...`);
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
