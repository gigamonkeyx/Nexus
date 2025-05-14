/**
 * Adapter Test Script
 * 
 * This script tests the specialized adapters for Ollama and ComfyUI MCP servers.
 * It demonstrates how to use the adapters to interact with these servers.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager, ServerType } from '../src/adapters/AdapterManager';
import { OllamaAdapter } from '../src/adapters/OllamaAdapter';
import { ComfyUIAdapter } from '../src/adapters/ComfyUIAdapter';
import { logger, LogLevel } from '../src/utils/logger';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

/**
 * Tests the Ollama adapter
 */
async function testOllamaAdapter() {
  try {
    logger.info('=== Testing Ollama Adapter ===');
    
    // Create NexusClient
    const nexusClient = new NexusClient();
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create adapter for Ollama MCP server
    logger.info('Creating Ollama adapter...');
    const ollamaAdapter = await adapterManager.createAdapter('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    if (!ollamaAdapter || !(ollamaAdapter instanceof OllamaAdapter)) {
      logger.error('Failed to create Ollama adapter');
      return;
    }
    
    logger.info('Ollama adapter created successfully');
    
    // Test getModels
    logger.info('Testing getModels...');
    const models = await ollamaAdapter.getModels();
    logger.info(`Available models: ${models.map(model => model.name).join(', ')}`);
    
    // Test generateText
    logger.info('Testing generateText...');
    const textResult = await ollamaAdapter.generateText('llama3', 'Explain the Model Context Protocol in simple terms.');
    logger.info(`Generated text: ${textResult.generated_text.substring(0, 100)}...`);
    
    // Test chatCompletion
    logger.info('Testing chatCompletion...');
    const chatResult = await ollamaAdapter.chatCompletion('llama3', [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What are the key benefits of using MCP servers?' }
    ]);
    logger.info(`Chat completion: ${chatResult.message.content.substring(0, 100)}...`);
    
    // Test createEmbedding
    logger.info('Testing createEmbedding...');
    const embeddingResult = await ollamaAdapter.createEmbedding('llama3', 'Model Context Protocol');
    logger.info(`Created embedding with ${embeddingResult.embedding.length} dimensions`);
    
    logger.info('Ollama adapter tests completed successfully');
  } catch (error) {
    logger.error(`Error testing Ollama adapter: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Tests the ComfyUI adapter
 */
async function testComfyUIAdapter() {
  try {
    logger.info('=== Testing ComfyUI Adapter ===');
    
    // Create NexusClient
    const nexusClient = new NexusClient();
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create adapter for ComfyUI MCP server
    logger.info('Creating ComfyUI adapter...');
    const comfyuiAdapter = await adapterManager.createAdapter('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    if (!comfyuiAdapter || !(comfyuiAdapter instanceof ComfyUIAdapter)) {
      logger.error('Failed to create ComfyUI adapter');
      return;
    }
    
    logger.info('ComfyUI adapter created successfully');
    
    // Test getModels
    logger.info('Testing getModels...');
    const models = await comfyuiAdapter.getModels();
    logger.info(`Available models: ${models.map(model => model.name).join(', ')}`);
    
    // Test generateImageFromText
    logger.info('Testing generateImageFromText...');
    const imageResult = await comfyuiAdapter.generateImageFromText('A beautiful landscape with mountains and a lake', {
      width: 768,
      height: 512
    });
    logger.info(`Generated image: ${imageResult.image_url}`);
    
    // Test upscaleImage
    logger.info('Testing upscaleImage...');
    const upscaleResult = await comfyuiAdapter.upscaleImage(imageResult.image_url);
    logger.info(`Upscaled image: ${upscaleResult.image_url}`);
    
    // Test applyStyleTransfer
    logger.info('Testing applyStyleTransfer...');
    const styleResult = await comfyuiAdapter.applyStyleTransfer(imageResult.image_url, 'Oil painting, impressionist style');
    logger.info(`Styled image: ${styleResult.image_url}`);
    
    logger.info('ComfyUI adapter tests completed successfully');
  } catch (error) {
    logger.error(`Error testing ComfyUI adapter: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Tests combined usage of Ollama and ComfyUI adapters
 */
async function testCombinedUsage() {
  try {
    logger.info('=== Testing Combined Usage ===');
    
    // Create NexusClient
    const nexusClient = new NexusClient();
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create adapter for Ollama MCP server
    logger.info('Creating Ollama adapter...');
    const ollamaAdapter = await adapterManager.createAdapter('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    if (!ollamaAdapter || !(ollamaAdapter instanceof OllamaAdapter)) {
      logger.error('Failed to create Ollama adapter');
      return;
    }
    
    // Create adapter for ComfyUI MCP server
    logger.info('Creating ComfyUI adapter...');
    const comfyuiAdapter = await adapterManager.createAdapter('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    if (!comfyuiAdapter || !(comfyuiAdapter instanceof ComfyUIAdapter)) {
      logger.error('Failed to create ComfyUI adapter');
      return;
    }
    
    logger.info('Both adapters created successfully');
    
    // Generate a description with Ollama
    logger.info('Generating description with Ollama...');
    const descriptionResult = await ollamaAdapter.generateText('llama3', 'Describe a fantasy landscape with a castle.');
    const description = descriptionResult.generated_text;
    logger.info(`Generated description: ${description.substring(0, 100)}...`);
    
    // Generate an image based on the description with ComfyUI
    logger.info('Generating image with ComfyUI based on description...');
    const imageResult = await comfyuiAdapter.generateImageFromText(description, {
      width: 768,
      height: 512
    });
    logger.info(`Generated image: ${imageResult.image_url}`);
    
    // Generate a story about the image with Ollama
    logger.info('Generating story with Ollama based on image...');
    const storyResult = await ollamaAdapter.generateText('llama3', `Write a short story about this image: ${description}`);
    logger.info(`Generated story: ${storyResult.generated_text.substring(0, 100)}...`);
    
    logger.info('Combined usage tests completed successfully');
  } catch (error) {
    logger.error(`Error testing combined usage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    logger.info('Starting adapter tests...');
    
    // Test Ollama adapter
    await testOllamaAdapter();
    
    // Test ComfyUI adapter
    await testComfyUIAdapter();
    
    // Test combined usage
    await testCombinedUsage();
    
    logger.info('All tests completed');
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
