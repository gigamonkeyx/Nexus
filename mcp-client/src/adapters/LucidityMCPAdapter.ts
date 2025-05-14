/**
 * LucidityMCPAdapter
 * 
 * Adapter for the Lucidity MCP Server.
 */

import { NexusClient } from '../core/NexusClient';
import { BaseAdapter } from './BaseAdapter';
import { AdapterConfig } from './AdapterManager';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Analysis dimension
 */
export enum AnalysisDimension {
  COMPLEXITY = 'complexity',
  ABSTRACTIONS = 'abstractions',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  MAINTAINABILITY = 'maintainability',
  READABILITY = 'readability',
  ERROR_HANDLING = 'error_handling',
  DOCUMENTATION = 'documentation',
  TESTING = 'testing',
  ARCHITECTURE = 'architecture'
}

/**
 * Analysis severity
 */
export enum AnalysisSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  dimensions?: AnalysisDimension[];
  minSeverity?: AnalysisSeverity;
  includeSuggestions?: boolean;
  includeMetrics?: boolean;
  contextLines?: number;
}

/**
 * Lucidity adapter configuration
 */
export interface LucidityAdapterConfig extends AdapterConfig {
  defaultLanguage?: string;
}

/**
 * LucidityMCPAdapter provides an adapter for the Lucidity MCP Server.
 */
export class LucidityMCPAdapter extends BaseAdapter {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private defaultLanguage: string;
  private serverId: string;
  private supportedDimensions: AnalysisDimension[] = [];

  /**
   * Creates a new LucidityMCPAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config Adapter configuration
   */
  constructor(nexusClient: NexusClient, config: LucidityAdapterConfig) {
    super(config);
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.defaultLanguage = config.defaultLanguage || 'javascript';
    this.serverId = config.serverId || 'lucidity';
    
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Handle server errors
    this.eventBus.subscribe('mcp-server-error', async (error) => {
      if (error.context.serverId === this.serverId) {
        logger.warn(`Lucidity MCP server error: ${error.message}`);
      }
    });
  }

  /**
   * Initializes the adapter.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Lucidity MCP adapter');
      
      // Check if server is connected
      const servers = this.nexusClient.getServers();
      if (!servers.has(this.serverId)) {
        throw new Error(`Lucidity MCP server not found: ${this.serverId}`);
      }
      
      // Get supported dimensions
      this.supportedDimensions = await this.getSupportedDimensions();
      logger.info(`Supported dimensions: ${this.supportedDimensions.join(', ')}`);
      
      logger.info('Lucidity MCP adapter initialized successfully');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize Lucidity MCP adapter: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets supported analysis dimensions.
   * @returns Promise resolving to an array of supported dimensions
   */
  async getSupportedDimensions(): Promise<AnalysisDimension[]> {
    try {
      const result = await this.nexusClient.callTool('get-supported-dimensions', {}, this.serverId);
      
      if (result && result.dimensions) {
        return result.dimensions;
      }
      
      // Default dimensions if server doesn't provide them
      return Object.values(AnalysisDimension);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get supported dimensions: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return default dimensions on error
      return Object.values(AnalysisDimension);
    }
  }

  /**
   * Analyzes code.
   * @param code Code to analyze
   * @param language Programming language
   * @param options Analysis options
   * @returns Promise resolving to the analysis result
   */
  async analyzeCode(code: string, language?: string, options: Partial<AnalysisOptions> = {}): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('analyze-code', {
        code,
        language: language || this.defaultLanguage,
        dimensions: options.dimensions || this.supportedDimensions,
        minSeverity: options.minSeverity || AnalysisSeverity.INFO,
        includeSuggestions: options.includeSuggestions !== false,
        includeMetrics: options.includeMetrics !== false,
        contextLines: options.contextLines || 3
      }, this.serverId);
      
      return result || { issues: [], summary: {}, overallScore: 0, metrics: {} };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return empty analysis on error
      return { issues: [], summary: {}, overallScore: 0, metrics: {} };
    }
  }

  /**
   * Analyzes code for security vulnerabilities.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Promise resolving to the security analysis result
   */
  async analyzeSecurityVulnerabilities(code: string, language?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('analyze-security', {
        code,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      return result || { vulnerabilities: [], summary: { high: 0, medium: 0, low: 0 } };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze security vulnerabilities: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return empty analysis on error
      return { vulnerabilities: [], summary: { high: 0, medium: 0, low: 0 } };
    }
  }

  /**
   * Analyzes code for performance issues.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Promise resolving to the performance analysis result
   */
  async analyzePerformance(code: string, language?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('analyze-performance', {
        code,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      return result || { issues: [], metrics: {} };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return empty analysis on error
      return { issues: [], metrics: {} };
    }
  }

  /**
   * Calculates code complexity.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Promise resolving to the complexity metrics
   */
  async calculateComplexity(code: string, language?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('calculate-complexity', {
        code,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      return result || {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 0,
        linesOfCode: code.split('\n').length,
        functions: 0,
        classes: 0
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to calculate complexity: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return basic metrics on error
      return {
        cyclomaticComplexity: 0,
        cognitiveComplexity: 0,
        maintainabilityIndex: 0,
        linesOfCode: code.split('\n').length,
        functions: 0,
        classes: 0
      };
    }
  }

  /**
   * Analyzes code changes.
   * @param originalCode Original code
   * @param newCode New code
   * @param language Programming language
   * @returns Promise resolving to the change analysis result
   */
  async analyzeChanges(originalCode: string, newCode: string, language?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('analyze-changes', {
        originalCode,
        newCode,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      return result || { changes: [], impact: {}, summary: '' };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze changes: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return empty analysis on error
      return { changes: [], impact: {}, summary: '' };
    }
  }

  /**
   * Gets the default language.
   * @returns Default language
   */
  getDefaultLanguage(): string {
    return this.defaultLanguage;
  }

  /**
   * Sets the default language.
   * @param language Default language
   */
  setDefaultLanguage(language: string): void {
    this.defaultLanguage = language;
  }

  /**
   * Gets the server ID.
   * @returns Server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Sets the server ID.
   * @param serverId Server ID
   */
  setServerId(serverId: string): void {
    this.serverId = serverId;
  }

  /**
   * Gets supported dimensions.
   * @returns Supported dimensions
   */
  getSupportedDimensionsSync(): AnalysisDimension[] {
    return this.supportedDimensions;
  }
}
