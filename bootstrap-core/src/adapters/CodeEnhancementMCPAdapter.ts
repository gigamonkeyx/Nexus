/**
 * Code Enhancement MCP Adapter
 * 
 * Adapter for the Code Enhancement MCP server.
 */

import { NexusClient } from '../core/NexusClient';
import { logger } from '../utils/logger';

export interface CodeEnhancementOptions {
  addDocumentation?: boolean;
  addErrorHandling?: boolean;
  addLogging?: boolean;
  improvePerformance?: boolean;
  improveReadability?: boolean;
  [key: string]: any;
}

export class CodeEnhancementMCPAdapter {
  private nexusClient: NexusClient;
  private serverId: string;
  
  constructor(nexusClient: NexusClient, serverId: string) {
    this.nexusClient = nexusClient;
    this.serverId = serverId;
  }
  
  /**
   * Get the server ID
   */
  public getServerId(): string {
    return this.serverId;
  }
  
  /**
   * Enhance code
   */
  public async enhanceCode(
    code: string,
    language: string,
    options: CodeEnhancementOptions = {}
  ): Promise<string> {
    try {
      logger.debug(`Enhancing ${language} code with CodeEnhancement (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language,
        options: {
          addDocumentation: true,
          addErrorHandling: true,
          addLogging: true,
          improveReadability: true,
          ...options
        }
      };
      
      // Send request to CodeEnhancement MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'enhance', request);
      
      if (!response || !response.enhancedCode) {
        throw new Error('Invalid response from CodeEnhancement MCP server');
      }
      
      return response.enhancedCode;
    } catch (error) {
      logger.error(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Format code
   */
  public async formatCode(
    code: string,
    language: string
  ): Promise<string> {
    try {
      logger.debug(`Formatting ${language} code with CodeEnhancement (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language
      };
      
      // Send request to CodeEnhancement MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'format', request);
      
      if (!response || !response.formattedCode) {
        throw new Error('Invalid response from CodeEnhancement MCP server');
      }
      
      return response.formattedCode;
    } catch (error) {
      logger.error(`Failed to format code: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Refactor code
   */
  public async refactorCode(
    code: string,
    language: string,
    refactoringType: 'extract-method' | 'rename-variable' | 'simplify' | 'optimize',
    options: any = {}
  ): Promise<string> {
    try {
      logger.debug(`Refactoring ${language} code with CodeEnhancement (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language,
        refactoringType,
        options
      };
      
      // Send request to CodeEnhancement MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'refactor', request);
      
      if (!response || !response.refactoredCode) {
        throw new Error('Invalid response from CodeEnhancement MCP server');
      }
      
      return response.refactoredCode;
    } catch (error) {
      logger.error(`Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Generate tests for code
   */
  public async generateTests(
    code: string,
    language: string,
    options: any = {}
  ): Promise<string> {
    try {
      logger.debug(`Generating tests for ${language} code with CodeEnhancement (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language,
        options
      };
      
      // Send request to CodeEnhancement MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'generate-tests', request);
      
      if (!response || !response.tests) {
        throw new Error('Invalid response from CodeEnhancement MCP server');
      }
      
      return response.tests;
    } catch (error) {
      logger.error(`Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
