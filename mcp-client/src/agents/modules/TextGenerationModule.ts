/**
 * TextGenerationModule
 * 
 * Module for text generation using Ollama.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { OllamaAdapter } from '../../adapters/OllamaAdapter';
import { logger } from '../../utils/logger';

/**
 * TextGenerationModule configuration
 */
export interface TextGenerationModuleConfig extends ModuleConfig {
  ollamaAdapter: OllamaAdapter;
  defaultModel?: string;
}

/**
 * TextGenerationModule provides text generation capabilities using Ollama.
 */
export class TextGenerationModule extends BaseModule {
  private ollamaAdapter: OllamaAdapter;
  private defaultModel: string;

  /**
   * Creates a new TextGenerationModule instance.
   * @param config Module configuration
   */
  constructor(config: TextGenerationModuleConfig) {
    super(config);
    this.ollamaAdapter = config.ollamaAdapter;
    this.defaultModel = config.defaultModel || 'llama3';
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering text generation capabilities for agent: ${agent.getName()}`);

      // Register generateText capability
      agent.registerCapability('generateText', async (parameters: any) => {
        try {
          const { prompt, model, options } = parameters;
          return await this.ollamaAdapter.generateText(model || this.defaultModel, prompt, options);
        } catch (error) {
          logger.error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register chatCompletion capability
      agent.registerCapability('chatCompletion', async (parameters: any) => {
        try {
          const { messages, model, options } = parameters;
          return await this.ollamaAdapter.chatCompletion(model || this.defaultModel, messages, options);
        } catch (error) {
          logger.error(`Failed to generate chat completion: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register createEmbedding capability
      agent.registerCapability('createEmbedding', async (parameters: any) => {
        try {
          const { text, model } = parameters;
          return await this.ollamaAdapter.createEmbedding(model || this.defaultModel, text);
        } catch (error) {
          logger.error(`Failed to create embedding: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getModels capability
      agent.registerCapability('getTextModels', async () => {
        try {
          return await this.ollamaAdapter.getModels();
        } catch (error) {
          logger.error(`Failed to get models: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register pullModel capability
      agent.registerCapability('pullTextModel', async (parameters: any) => {
        try {
          const { model } = parameters;
          return await this.ollamaAdapter.pullModel(model);
        } catch (error) {
          logger.error(`Failed to pull model: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Text generation capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      logger.error(`Failed to register text generation capabilities: ${error instanceof Error ? error.message : String(error)}`);
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
    // Check if the task is a text generation task
    const textGenerationPatterns = [
      /generate text/i,
      /write a/i,
      /create a/i,
      /summarize/i,
      /explain/i,
      /describe/i
    ];

    if (textGenerationPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling text generation task: ${task}`);

        // Generate text
        const result = await this.ollamaAdapter.generateText(this.defaultModel, task);

        // Add result to agent memory
        agent.addToMemory({
          role: 'assistant',
          content: result.generated_text
        });

        return true;
      } catch (error) {
        logger.error(`Failed to handle text generation task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Gets the Ollama adapter.
   * @returns Ollama adapter
   */
  getOllamaAdapter(): OllamaAdapter {
    return this.ollamaAdapter;
  }

  /**
   * Sets the Ollama adapter.
   * @param ollamaAdapter Ollama adapter
   */
  setOllamaAdapter(ollamaAdapter: OllamaAdapter): void {
    this.ollamaAdapter = ollamaAdapter;
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
}
