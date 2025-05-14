/**
 * CodeEnhancementMCPAdapter
 * 
 * Adapter for the Code Enhancement MCP Server.
 */

import { NexusClient } from '../core/NexusClient';
import { BaseAdapter } from './BaseAdapter';
import { AdapterConfig } from './AdapterManager';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Code enhancement adapter configuration
 */
export interface CodeEnhancementAdapterConfig extends AdapterConfig {
  defaultLanguage?: string;
  defaultStyle?: string;
}

/**
 * CodeEnhancementMCPAdapter provides an adapter for the Code Enhancement MCP Server.
 */
export class CodeEnhancementMCPAdapter extends BaseAdapter {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private defaultLanguage: string;
  private defaultStyle: string;
  private serverId: string;
  private supportedLanguages: string[] = [];
  private supportedStyles: string[] = [];

  /**
   * Creates a new CodeEnhancementMCPAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config Adapter configuration
   */
  constructor(nexusClient: NexusClient, config: CodeEnhancementAdapterConfig) {
    super(config);
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.defaultLanguage = config.defaultLanguage || 'javascript';
    this.defaultStyle = config.defaultStyle || 'standard';
    this.serverId = config.serverId || 'code-enhancement';
    
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
        logger.warn(`Code Enhancement MCP server error: ${error.message}`);
      }
    });
  }

  /**
   * Initializes the adapter.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Code Enhancement MCP adapter');
      
      // Check if server is connected
      const servers = this.nexusClient.getServers();
      if (!servers.has(this.serverId)) {
        throw new Error(`Code Enhancement MCP server not found: ${this.serverId}`);
      }
      
      // Get supported languages
      this.supportedLanguages = await this.getSupportedLanguages();
      logger.info(`Supported languages: ${this.supportedLanguages.join(', ')}`);
      
      // Get supported styles
      this.supportedStyles = await this.getSupportedStyles();
      logger.info(`Supported styles: ${this.supportedStyles.join(', ')}`);
      
      logger.info('Code Enhancement MCP adapter initialized successfully');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize Code Enhancement MCP adapter: ${error instanceof Error ? error.message : String(error)}`,
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
   * Gets supported programming languages.
   * @returns Promise resolving to an array of supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    try {
      const result = await this.nexusClient.callTool('get-supported-languages', {}, this.serverId);
      
      if (result && result.languages) {
        return result.languages;
      }
      
      // Default languages if server doesn't provide them
      return ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'ruby', 'php', 'rust', 'cpp'];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get supported languages: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return default languages on error
      return ['javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'ruby', 'php', 'rust', 'cpp'];
    }
  }

  /**
   * Gets supported code styles.
   * @returns Promise resolving to an array of supported styles
   */
  async getSupportedStyles(): Promise<string[]> {
    try {
      const result = await this.nexusClient.callTool('get-supported-styles', {}, this.serverId);
      
      if (result && result.styles) {
        return result.styles;
      }
      
      // Default styles if server doesn't provide them
      return ['standard', 'google', 'airbnb', 'microsoft', 'prettier'];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get supported styles: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return default styles on error
      return ['standard', 'google', 'airbnb', 'microsoft', 'prettier'];
    }
  }

  /**
   * Formats code.
   * @param code Code to format
   * @param language Programming language
   * @param style Code style
   * @returns Promise resolving to the formatted code
   */
  async formatCode(code: string, language?: string, style?: string): Promise<string> {
    try {
      const result = await this.nexusClient.callTool('format-code', {
        code,
        language: language || this.defaultLanguage,
        style: style || this.defaultStyle
      }, this.serverId);
      
      if (result && result.formattedCode) {
        return result.formattedCode;
      }
      
      // Return original code if formatting failed
      return code;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to format code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return original code on error
      return code;
    }
  }

  /**
   * Analyzes code.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Promise resolving to the analysis result
   */
  async analyzeCode(code: string, language?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('analyze-code', {
        code,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      return result || { issues: [] };
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
      return { issues: [] };
    }
  }

  /**
   * Generates documentation for code.
   * @param code Code to document
   * @param language Programming language
   * @param style Documentation style
   * @returns Promise resolving to the documented code
   */
  async generateDocumentation(code: string, language?: string, style?: string): Promise<string> {
    try {
      const result = await this.nexusClient.callTool('generate-documentation', {
        code,
        language: language || this.defaultLanguage,
        style: style || this.defaultStyle
      }, this.serverId);
      
      if (result && result.documentedCode) {
        return result.documentedCode;
      }
      
      // Return original code if documentation generation failed
      return code;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return original code on error
      return code;
    }
  }

  /**
   * Generates tests for code.
   * @param code Code to test
   * @param language Programming language
   * @param framework Test framework
   * @returns Promise resolving to the generated tests
   */
  async generateTests(code: string, language?: string, framework?: string): Promise<string> {
    try {
      const result = await this.nexusClient.callTool('generate-tests', {
        code,
        language: language || this.defaultLanguage,
        framework: framework || 'default'
      }, this.serverId);
      
      if (result && result.tests) {
        return result.tests;
      }
      
      // Return empty tests if generation failed
      return `// No tests generated for the provided code`;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return empty tests on error
      return `// Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  /**
   * Refactors code.
   * @param code Code to refactor
   * @param goal Refactoring goal
   * @param language Programming language
   * @returns Promise resolving to the refactored code
   */
  async refactorCode(code: string, goal: string, language?: string): Promise<string> {
    try {
      const result = await this.nexusClient.callTool('refactor-code', {
        code,
        goal,
        language: language || this.defaultLanguage
      }, this.serverId);
      
      if (result && result.refactoredCode) {
        return result.refactoredCode;
      }
      
      // Return original code if refactoring failed
      return code;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, language: language || this.defaultLanguage, goal }
      );
      await this.errorHandling.handleError(agentError);
      
      // Return original code on error
      return code;
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
   * Gets the default style.
   * @returns Default style
   */
  getDefaultStyle(): string {
    return this.defaultStyle;
  }

  /**
   * Sets the default style.
   * @param style Default style
   */
  setDefaultStyle(style: string): void {
    this.defaultStyle = style;
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
   * Gets supported languages.
   * @returns Supported languages
   */
  getSupportedLanguagesSync(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Gets supported styles.
   * @returns Supported styles
   */
  getSupportedStylesSync(): string[] {
    return this.supportedStyles;
  }
}
