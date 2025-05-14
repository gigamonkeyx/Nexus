/**
 * Adapter Usage Example
 * 
 * This example demonstrates how to use the specialized adapters for Ollama and ComfyUI MCP servers.
 */

import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager, ServerType } from '../src/adapters/AdapterManager';
import { OllamaAdapter } from '../src/adapters/OllamaAdapter';
import { ComfyUIAdapter } from '../src/adapters/ComfyUIAdapter';
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
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Connect to Ollama MCP server
    const ollamaAdapter = await connectToOllamaServer(adapterManager);
    if (ollamaAdapter) {
      await demonstrateOllamaFeatures(ollamaAdapter);
    }
    
    // Connect to ComfyUI MCP server
    const comfyuiAdapter = await connectToComfyUIServer(adapterManager);
    if (comfyuiAdapter) {
      await demonstrateComfyUIFeatures(comfyuiAdapter);
    }
    
    // Demonstrate combined usage
    if (ollamaAdapter && comfyuiAdapter) {
      await demonstrateCombinedUsage(ollamaAdapter, comfyuiAdapter);
    }
  } catch (error) {
    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Connects to an Ollama MCP server
 * @param adapterManager AdapterManager instance
 * @returns OllamaAdapter instance or null if connection fails
 */
async function connectToOllamaServer(adapterManager: AdapterManager): Promise<OllamaAdapter | null> {
  try {
    logger.info('Connecting to Ollama MCP server...');
    
    // Create adapter for Ollama MCP server
    const ollamaAdapter = await adapterManager.createAdapter('ollama', {
      type: 'sse',
      url: 'http://localhost:3011/sse'
    });
    
    if (ollamaAdapter && adapterManager.detectServerType({ name: 'ollama' }) === ServerType.OLLAMA) {
      logger.info('Successfully connected to Ollama MCP server');
      return ollamaAdapter as OllamaAdapter;
    } else {
      logger.error('Failed to connect to Ollama MCP server');
      return null;
    }
  } catch (error) {
    logger.error(`Error connecting to Ollama MCP server: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Connects to a ComfyUI MCP server
 * @param adapterManager AdapterManager instance
 * @returns ComfyUIAdapter instance or null if connection fails
 */
async function connectToComfyUIServer(adapterManager: AdapterManager): Promise<ComfyUIAdapter | null> {
  try {
    logger.info('Connecting to ComfyUI MCP server...');
    
    // Create adapter for ComfyUI MCP server
    const comfyuiAdapter = await adapterManager.createAdapter('comfyui', {
      type: 'sse',
      url: 'http://localhost:3020/sse'
    });
    
    if (comfyuiAdapter && adapterManager.detectServerType({ name: 'comfyui' }) === ServerType.COMFYUI) {
      logger.info('Successfully connected to ComfyUI MCP server');
      return comfyuiAdapter as ComfyUIAdapter;
    } else {
      logger.error('Failed to connect to ComfyUI MCP server');
      return null;
    }
  } catch (error) {
    logger.error(`Error connecting to ComfyUI MCP server: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Demonstrates Ollama features
 * @param ollamaAdapter OllamaAdapter instance
 */
async function demonstrateOllamaFeatures(ollamaAdapter: OllamaAdapter): Promise<void> {
  try {
    logger.info('Demonstrating Ollama features...');
    
    // List available models
    const models = await ollamaAdapter.getModels();
    logger.info(`Available models: ${models.map(model => model.name).join(', ')}`);
    
    // Generate text
    const textResult = await ollamaAdapter.generateText('llama3', 'Explain the Model Context Protocol in simple terms.');
    logger.info(`Generated text: ${textResult.generated_text.substring(0, 100)}...`);
    
    // Generate chat completion
    const chatResult = await ollamaAdapter.chatCompletion('llama3', [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What are the key benefits of using MCP servers?' }
    ]);
    logger.info(`Chat completion: ${chatResult.message.content.substring(0, 100)}...`);
    
    // Create embedding
    const embeddingResult = await ollamaAdapter.createEmbedding('llama3', 'Model Context Protocol');
    logger.info(`Created embedding with ${embeddingResult.embedding.length} dimensions`);
  } catch (error) {
    logger.error(`Error demonstrating Ollama features: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Demonstrates ComfyUI features
 * @param comfyuiAdapter ComfyUIAdapter instance
 */
async function demonstrateComfyUIFeatures(comfyuiAdapter: ComfyUIAdapter): Promise<void> {
  try {
    logger.info('Demonstrating ComfyUI features...');
    
    // List available models
    const models = await comfyuiAdapter.getModels();
    logger.info(`Available models: ${models.map(model => model.name).join(', ')}`);
    
    // Generate image from text
    const imageResult = await comfyuiAdapter.generateImageFromText('A beautiful landscape with mountains and a lake', {
      width: 768,
      height: 512
    });
    logger.info(`Generated image: ${imageResult.image_url}`);
    
    // Upscale image
    const upscaleResult = await comfyuiAdapter.upscaleImage(imageResult.image_url);
    logger.info(`Upscaled image: ${upscaleResult.image_url}`);
    
    // Apply style transfer
    const styleResult = await comfyuiAdapter.applyStyleTransfer(imageResult.image_url, 'Oil painting, impressionist style');
    logger.info(`Styled image: ${styleResult.image_url}`);
  } catch (error) {
    logger.error(`Error demonstrating ComfyUI features: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Demonstrates combined usage of Ollama and ComfyUI
 * @param ollamaAdapter OllamaAdapter instance
 * @param comfyuiAdapter ComfyUIAdapter instance
 */
async function demonstrateCombinedUsage(ollamaAdapter: OllamaAdapter, comfyuiAdapter: ComfyUIAdapter): Promise<void> {
  try {
    logger.info('Demonstrating combined usage...');
    
    // Generate a description with Ollama
    const descriptionResult = await ollamaAdapter.generateText('llama3', 'Describe a fantasy landscape with a castle.');
    const description = descriptionResult.generated_text;
    logger.info(`Generated description: ${description.substring(0, 100)}...`);
    
    // Generate an image based on the description with ComfyUI
    const imageResult = await comfyuiAdapter.generateImageFromText(description, {
      width: 768,
      height: 512
    });
    logger.info(`Generated image: ${imageResult.image_url}`);
    
    // Generate a story about the image with Ollama
    const storyResult = await ollamaAdapter.generateText('llama3', `Write a short story about this image: ${description}`);
    logger.info(`Generated story: ${storyResult.generated_text.substring(0, 100)}...`);
  } catch (error) {
    logger.error(`Error demonstrating combined usage: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
});
