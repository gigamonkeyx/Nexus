/**
 * BaseModule
 * 
 * Base implementation of the Module interface.
 */

import { Agent } from '../Agent';
import { Module, ModuleConfig } from './Module';
import { logger } from '../../utils/logger';

/**
 * BaseModule provides a base implementation of the Module interface.
 */
export abstract class BaseModule implements Module {
  protected config: ModuleConfig;
  protected initialized: boolean = false;

  /**
   * Creates a new BaseModule instance.
   * @param config Module configuration
   */
  constructor(config: ModuleConfig) {
    this.config = config;
  }

  /**
   * Gets the module name.
   * @returns Module name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Gets the module description.
   * @returns Module description
   */
  getDescription(): string {
    return this.config.description;
  }

  /**
   * Gets the module configuration.
   * @returns Module configuration
   */
  getConfig(): ModuleConfig {
    return this.config;
  }

  /**
   * Initializes the module.
   * @param agent Agent to initialize with
   * @returns Promise resolving when initialization is complete
   */
  async initialize(agent: Agent): Promise<void> {
    try {
      logger.info(`Initializing module: ${this.getName()}`);
      
      // Register capabilities
      await this.registerCapabilities(agent);
      
      this.initialized = true;
      logger.info(`Module initialized: ${this.getName()}`);
    } catch (error) {
      logger.error(`Failed to initialize module ${this.getName()}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  abstract registerCapabilities(agent: Agent): Promise<void>;

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  async handleTask(task: string, agent: Agent): Promise<boolean> {
    // Base implementation doesn't handle any tasks
    return false;
  }

  /**
   * Cleans up the module.
   * @returns Promise resolving when cleanup is complete
   */
  async cleanup(): Promise<void> {
    logger.info(`Cleaning up module: ${this.getName()}`);
    this.initialized = false;
  }
}
