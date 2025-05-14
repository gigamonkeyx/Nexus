/**
 * Lucidity MCP Adapter
 * 
 * Adapter for the Lucidity MCP server.
 */

import { NexusClient } from '../core/NexusClient';
import { logger } from '../utils/logger';

export interface LucidityAnalysisOptions {
  checkQuality?: boolean;
  checkSecurity?: boolean;
  checkPerformance?: boolean;
  checkMaintainability?: boolean;
  [key: string]: any;
}

export class LucidityMCPAdapter {
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
   * Analyze code
   */
  public async analyzeCode(
    code: string,
    language: string,
    options: LucidityAnalysisOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Analyzing ${language} code with Lucidity (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language,
        options: {
          checkQuality: true,
          checkSecurity: true,
          checkPerformance: true,
          checkMaintainability: true,
          ...options
        }
      };
      
      // Send request to Lucidity MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'analyze', request);
      
      if (!response) {
        throw new Error('Invalid response from Lucidity MCP server');
      }
      
      return response;
    } catch (error) {
      logger.error(`Failed to analyze code with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Analyze a file
   */
  public async analyzeFile(
    filePath: string,
    options: LucidityAnalysisOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Analyzing file ${filePath} with Lucidity (${this.serverId})`);
      
      // Create request
      const request = {
        filePath,
        options: {
          checkQuality: true,
          checkSecurity: true,
          checkPerformance: true,
          checkMaintainability: true,
          ...options
        }
      };
      
      // Send request to Lucidity MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'analyze-file', request);
      
      if (!response) {
        throw new Error('Invalid response from Lucidity MCP server');
      }
      
      return response;
    } catch (error) {
      logger.error(`Failed to analyze file with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Analyze a project
   */
  public async analyzeProject(
    projectPath: string,
    options: LucidityAnalysisOptions = {}
  ): Promise<any> {
    try {
      logger.debug(`Analyzing project ${projectPath} with Lucidity (${this.serverId})`);
      
      // Create request
      const request = {
        projectPath,
        options: {
          checkQuality: true,
          checkSecurity: true,
          checkPerformance: true,
          checkMaintainability: true,
          ...options
        }
      };
      
      // Send request to Lucidity MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'analyze-project', request);
      
      if (!response) {
        throw new Error('Invalid response from Lucidity MCP server');
      }
      
      return response;
    } catch (error) {
      logger.error(`Failed to analyze project with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get code metrics
   */
  public async getCodeMetrics(
    code: string,
    language: string
  ): Promise<any> {
    try {
      logger.debug(`Getting metrics for ${language} code with Lucidity (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language
      };
      
      // Send request to Lucidity MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'metrics', request);
      
      if (!response) {
        throw new Error('Invalid response from Lucidity MCP server');
      }
      
      return response;
    } catch (error) {
      logger.error(`Failed to get code metrics with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Visualize code
   */
  public async visualizeCode(
    code: string,
    language: string,
    visualizationType: 'dependency-graph' | 'call-graph' | 'class-diagram'
  ): Promise<any> {
    try {
      logger.debug(`Visualizing ${language} code with Lucidity (${this.serverId})`);
      
      // Create request
      const request = {
        code,
        language,
        visualizationType
      };
      
      // Send request to Lucidity MCP server
      const response = await this.nexusClient.sendRequest(this.serverId, 'visualize', request);
      
      if (!response) {
        throw new Error('Invalid response from Lucidity MCP server');
      }
      
      return response;
    } catch (error) {
      logger.error(`Failed to visualize code with Lucidity: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
