/**
 * ImageGenerationModule
 * 
 * Module for image generation using ComfyUI.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { ComfyUIAdapter } from '../../adapters/ComfyUIAdapter';
import { logger } from '../../utils/logger';

/**
 * ImageGenerationModule configuration
 */
export interface ImageGenerationModuleConfig extends ModuleConfig {
  comfyuiAdapter: ComfyUIAdapter;
  defaultModel?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

/**
 * ImageGenerationModule provides image generation capabilities using ComfyUI.
 */
export class ImageGenerationModule extends BaseModule {
  private comfyuiAdapter: ComfyUIAdapter;
  private defaultModel: string;
  private defaultWidth: number;
  private defaultHeight: number;

  /**
   * Creates a new ImageGenerationModule instance.
   * @param config Module configuration
   */
  constructor(config: ImageGenerationModuleConfig) {
    super(config);
    this.comfyuiAdapter = config.comfyuiAdapter;
    this.defaultModel = config.defaultModel || 'sd_xl_base_1.0.safetensors';
    this.defaultWidth = config.defaultWidth || 768;
    this.defaultHeight = config.defaultHeight || 768;
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering image generation capabilities for agent: ${agent.getName()}`);

      // Register generateImageFromText capability
      agent.registerCapability('generateImageFromText', async (parameters: any) => {
        try {
          const { prompt, options } = parameters;
          return await this.comfyuiAdapter.generateImageFromText(prompt, {
            width: options?.width || this.defaultWidth,
            height: options?.height || this.defaultHeight,
            model: options?.model || this.defaultModel,
            ...options
          });
        } catch (error) {
          logger.error(`Failed to generate image from text: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register generateImageFromImage capability
      agent.registerCapability('generateImageFromImage', async (parameters: any) => {
        try {
          const { image_url, prompt, options } = parameters;
          return await this.comfyuiAdapter.generateImageFromImage(image_url, prompt, {
            model: options?.model || this.defaultModel,
            ...options
          });
        } catch (error) {
          logger.error(`Failed to generate image from image: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register upscaleImage capability
      agent.registerCapability('upscaleImage', async (parameters: any) => {
        try {
          const { image_url, options } = parameters;
          return await this.comfyuiAdapter.upscaleImage(image_url, options);
        } catch (error) {
          logger.error(`Failed to upscale image: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register inpaintImage capability
      agent.registerCapability('inpaintImage', async (parameters: any) => {
        try {
          const { image_url, mask_url, prompt, options } = parameters;
          return await this.comfyuiAdapter.inpaintImage(image_url, mask_url, prompt, {
            model: options?.model || this.defaultModel,
            ...options
          });
        } catch (error) {
          logger.error(`Failed to inpaint image: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register applyStyleTransfer capability
      agent.registerCapability('applyStyleTransfer', async (parameters: any) => {
        try {
          const { image_url, style_prompt, options } = parameters;
          return await this.comfyuiAdapter.applyStyleTransfer(image_url, style_prompt, {
            model: options?.model || this.defaultModel,
            ...options
          });
        } catch (error) {
          logger.error(`Failed to apply style transfer: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getModels capability
      agent.registerCapability('getImageModels', async () => {
        try {
          return await this.comfyuiAdapter.getModels();
        } catch (error) {
          logger.error(`Failed to get models: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Image generation capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      logger.error(`Failed to register image generation capabilities: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  async handleTask(task: string, agent: Agent): Promise<boolean> {
    // Check if the task is an image generation task
    const imageGenerationPatterns = [
      /generate (an |a )?image/i,
      /create (an |a )?image/i,
      /draw/i,
      /visualize/i,
      /picture of/i,
      /image of/i
    ];

    if (imageGenerationPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling image generation task: ${task}`);

        // Extract prompt from task
        const prompt = task.replace(/^(generate|create|draw|visualize|make)( an?| a)? (image|picture|visualization|drawing)( of)?/i, '').trim();

        // Generate image
        const result = await this.comfyuiAdapter.generateImageFromText(prompt, {
          width: this.defaultWidth,
          height: this.defaultHeight,
          model: this.defaultModel
        });

        // Add result to agent memory
        agent.addToMemory({
          role: 'assistant',
          content: `I've generated an image based on your request. You can view it here: ${result.image_url}`
        });

        return true;
      } catch (error) {
        logger.error(`Failed to handle image generation task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Gets the ComfyUI adapter.
   * @returns ComfyUI adapter
   */
  getComfyUIAdapter(): ComfyUIAdapter {
    return this.comfyuiAdapter;
  }

  /**
   * Sets the ComfyUI adapter.
   * @param comfyuiAdapter ComfyUI adapter
   */
  setComfyUIAdapter(comfyuiAdapter: ComfyUIAdapter): void {
    this.comfyuiAdapter = comfyuiAdapter;
  }

  /**
   * Gets the default model.
   * @returns Default model
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Sets the default model.
   * @param defaultModel Default model
   */
  setDefaultModel(defaultModel: string): void {
    this.defaultModel = defaultModel;
  }

  /**
   * Gets the default width.
   * @returns Default width
   */
  getDefaultWidth(): number {
    return this.defaultWidth;
  }

  /**
   * Sets the default width.
   * @param defaultWidth Default width
   */
  setDefaultWidth(defaultWidth: number): void {
    this.defaultWidth = defaultWidth;
  }

  /**
   * Gets the default height.
   * @returns Default height
   */
  getDefaultHeight(): number {
    return this.defaultHeight;
  }

  /**
   * Sets the default height.
   * @param defaultHeight Default height
   */
  setDefaultHeight(defaultHeight: number): void {
    this.defaultHeight = defaultHeight;
  }
}
