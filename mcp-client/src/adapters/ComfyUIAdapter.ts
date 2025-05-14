/**
 * ComfyUIAdapter
 * 
 * Specialized adapter for integrating with ComfyUI MCP servers.
 * Handles the specific requirements and capabilities of ComfyUI MCP servers.
 */

import { NexusClient } from '../core/NexusClient';
import { ServerConfig } from '../core/types';
import { HttpTransport } from '../transport/HttpTransport';
import { logger } from '../utils/logger';

/**
 * ComfyUIAdapter provides specialized integration with ComfyUI MCP servers.
 */
export class ComfyUIAdapter {
  private nexusClient: NexusClient;
  private serverId: string;
  private serverConfig: ServerConfig;
  private connected: boolean = false;
  private modelCache: Map<string, any> = new Map();
  private workflowCache: Map<string, any> = new Map();

  /**
   * Creates a new ComfyUIAdapter instance.
   * @param nexusClient NexusClient instance
   * @param serverId Server identifier
   * @param serverConfig Server configuration
   */
  constructor(nexusClient: NexusClient, serverId: string, serverConfig: ServerConfig) {
    this.nexusClient = nexusClient;
    this.serverId = serverId;
    this.serverConfig = serverConfig;
  }

  /**
   * Connects to the ComfyUI MCP server.
   * @returns Promise resolving to true if connection is successful
   */
  async connect(): Promise<boolean> {
    try {
      logger.info(`Connecting to ComfyUI MCP server: ${this.serverId}`);
      
      // Connect to the server using the NexusClient
      await this.nexusClient.connectServer(this.serverId, this.serverConfig);
      
      // Cache available models and workflows
      await this.cacheModels();
      
      this.connected = true;
      logger.info(`Successfully connected to ComfyUI MCP server: ${this.serverId}`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to connect to ComfyUI MCP server: ${error instanceof Error ? error.message : String(error)}`);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Caches available models from the ComfyUI MCP server.
   */
  private async cacheModels(): Promise<void> {
    try {
      logger.info(`Caching models from ComfyUI MCP server: ${this.serverId}`);
      
      // Call the list_models tool
      const result = await this.nexusClient.callTool('list_models', {});
      
      if (result && result.models) {
        // Cache the models
        for (const model of result.models) {
          this.modelCache.set(model.name, model);
        }
        
        logger.info(`Cached ${this.modelCache.size} models from ComfyUI MCP server`);
      }
    } catch (error) {
      logger.warn(`Failed to cache models from ComfyUI MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Gets available models from the ComfyUI MCP server.
   * @returns Array of available models
   */
  async getModels(): Promise<any[]> {
    if (this.modelCache.size === 0) {
      await this.cacheModels();
    }
    
    return Array.from(this.modelCache.values());
  }

  /**
   * Generates an image from text using the ComfyUI MCP server.
   * @param prompt Text prompt
   * @param options Additional generation options
   * @returns Generated image URL and metadata
   */
  async generateImageFromText(prompt: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Generating image from text on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the generate_image_from_text tool
      const result = await this.nexusClient.callTool('generate_image_from_text', {
        prompt,
        negative_prompt: options.negative_prompt,
        width: options.width || 512,
        height: options.height || 512,
        model: options.model || 'sd_xl_base_1.0.safetensors',
        steps: options.steps || 30,
        cfg: options.cfg || 7.5,
        sampler: options.sampler || 'euler_ancestral',
        seed: options.seed || Math.floor(Math.random() * 2147483647)
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to generate image from text: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generates an image from another image using the ComfyUI MCP server.
   * @param image_url URL or path to the input image
   * @param prompt Text prompt
   * @param options Additional generation options
   * @returns Generated image URL and metadata
   */
  async generateImageFromImage(image_url: string, prompt: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Generating image from image on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the generate_image_from_image tool
      const result = await this.nexusClient.callTool('generate_image_from_image', {
        image_url,
        prompt,
        negative_prompt: options.negative_prompt,
        strength: options.strength || 0.75,
        model: options.model || 'sd_xl_base_1.0.safetensors',
        steps: options.steps || 30,
        cfg: options.cfg || 7.5,
        sampler: options.sampler || 'euler_ancestral',
        seed: options.seed || Math.floor(Math.random() * 2147483647)
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to generate image from image: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Upscales an image using the ComfyUI MCP server.
   * @param image_url URL or path to the input image
   * @param options Additional upscaling options
   * @returns Upscaled image URL and metadata
   */
  async upscaleImage(image_url: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Upscaling image on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the upscale_image tool
      const result = await this.nexusClient.callTool('upscale_image', {
        image_url,
        upscale_model: options.upscale_model || '4x-UltraSharp'
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to upscale image: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Inpaints an image using the ComfyUI MCP server.
   * @param image_url URL or path to the input image
   * @param mask_url URL or path to the mask image
   * @param prompt Text prompt
   * @param options Additional inpainting options
   * @returns Inpainted image URL and metadata
   */
  async inpaintImage(image_url: string, mask_url: string, prompt: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Inpainting image on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the inpaint_image tool
      const result = await this.nexusClient.callTool('inpaint_image', {
        image_url,
        mask_url,
        prompt,
        negative_prompt: options.negative_prompt,
        strength: options.strength || 1.0,
        model: options.model || 'sd_xl_base_1.0.safetensors',
        steps: options.steps || 30,
        cfg: options.cfg || 7.5,
        sampler: options.sampler || 'euler_ancestral',
        seed: options.seed || Math.floor(Math.random() * 2147483647)
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to inpaint image: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Applies a style transfer to an image using the ComfyUI MCP server.
   * @param image_url URL or path to the input image
   * @param style_prompt Text description of the style to apply
   * @param options Additional style transfer options
   * @returns Styled image URL and metadata
   */
  async applyStyleTransfer(image_url: string, style_prompt: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Applying style transfer on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the apply_style_transfer tool
      const result = await this.nexusClient.callTool('apply_style_transfer', {
        image_url,
        style_prompt,
        negative_prompt: options.negative_prompt,
        strength: options.strength || 0.75,
        width: options.width,
        height: options.height,
        model: options.model || 'sd_xl_base_1.0.safetensors',
        steps: options.steps || 30,
        cfg: options.cfg || 7.5,
        sampler: options.sampler || 'euler_ancestral',
        seed: options.seed || Math.floor(Math.random() * 2147483647)
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to apply style transfer: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Imports a workflow from a URL using the ComfyUI MCP server.
   * @param url URL to the workflow JSON file
   * @param name Name to save the workflow as
   * @param metadata Additional metadata for the workflow
   * @returns Import status
   */
  async importWorkflowFromUrl(url: string, name: string, metadata: any = {}): Promise<any> {
    try {
      logger.info(`Importing workflow from URL on ComfyUI MCP server: ${this.serverId}`);
      
      // Call the import_workflow_from_url tool
      const result = await this.nexusClient.callTool('import_workflow_from_url', {
        url,
        name,
        metadata
      });
      
      return result;
    } catch (error) {
      logger.error(`Failed to import workflow from URL: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Checks if the adapter is connected to the ComfyUI MCP server.
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Gets the server ID.
   * @returns Server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Gets the server configuration.
   * @returns Server configuration
   */
  getServerConfig(): ServerConfig {
    return this.serverConfig;
  }
}
