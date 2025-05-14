/**
 * BaseAdapter
 * 
 * Base class for all adapters.
 */

import { AdapterConfig } from './AdapterManager';

/**
 * BaseAdapter provides a base class for all adapters.
 */
export abstract class BaseAdapter {
  protected config: AdapterConfig;

  /**
   * Creates a new BaseAdapter instance.
   * @param config Adapter configuration
   */
  constructor(config: AdapterConfig) {
    this.config = config;
  }

  /**
   * Initializes the adapter.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    // To be implemented by subclasses
  }

  /**
   * Gets the adapter configuration.
   * @returns Adapter configuration
   */
  getConfig(): AdapterConfig {
    return this.config;
  }

  /**
   * Sets the adapter configuration.
   * @param config Adapter configuration
   */
  setConfig(config: AdapterConfig): void {
    this.config = config;
  }

  /**
   * Updates the adapter configuration.
   * @param config Partial adapter configuration
   */
  updateConfig(config: Partial<AdapterConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }
}
