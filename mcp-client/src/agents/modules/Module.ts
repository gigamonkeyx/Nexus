/**
 * Module
 * 
 * Base interface for agent modules.
 */

import { Agent } from '../Agent';

/**
 * Module configuration
 */
export interface ModuleConfig {
  name: string;
  description: string;
  [key: string]: any;
}

/**
 * Module interface for agent modules.
 */
export interface Module {
  /**
   * Gets the module name.
   * @returns Module name
   */
  getName(): string;

  /**
   * Gets the module description.
   * @returns Module description
   */
  getDescription(): string;

  /**
   * Gets the module configuration.
   * @returns Module configuration
   */
  getConfig(): ModuleConfig;

  /**
   * Initializes the module.
   * @param agent Agent to initialize with
   * @returns Promise resolving when initialization is complete
   */
  initialize(agent: Agent): Promise<void>;

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  registerCapabilities(agent: Agent): Promise<void>;

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  handleTask?(task: string, agent: Agent): Promise<boolean>;

  /**
   * Cleans up the module.
   * @returns Promise resolving when cleanup is complete
   */
  cleanup?(): Promise<void>;
}
