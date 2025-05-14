/**
 * CodingAgent
 * 
 * Specialized agent for code generation, analysis, and version control.
 */

import { NexusClient } from '../core/NexusClient';
import { AdapterManager } from '../adapters/AdapterManager';
import { OllamaAdapter } from '../adapters/OllamaAdapter';
import { EnhancedModularAgentFramework, TaskPriority } from '../core/EnhancedModularAgentFramework';
import { LLMAdapter } from './LLMAdapter';
import { Agent } from './Agent';
import { ProgrammingLanguage } from './modules/CodingModule';
import { AnalysisDimension } from './modules/AnalysisModule';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Coding agent configuration
 */
export interface CodingAgentConfig {
  name: string;
  description?: string;
  llm: {
    provider: string;
    model: string;
  };
  ollamaAdapter?: OllamaAdapter;
  enhancementServerUrl?: string;
  lucidityServerUrl?: string;
  githubServerUrl?: string;
  defaultLanguage?: ProgrammingLanguage;
  defaultOwner?: string;
  maxConcurrentTasks?: number;
}

/**
 * CodingAgent provides specialized capabilities for code generation, analysis, and version control.
 */
export class CodingAgent {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private llmAdapter: LLMAdapter;
  private agentFramework: EnhancedModularAgentFramework;
  private agent: Agent | null = null;
  private config: CodingAgentConfig;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;

  /**
   * Creates a new CodingAgent instance.
   * @param nexusClient NexusClient instance
   * @param adapterManager AdapterManager instance
   * @param llmAdapter LLMAdapter instance
   * @param config Coding agent configuration
   */
  constructor(nexusClient: NexusClient, adapterManager: AdapterManager, llmAdapter: LLMAdapter, config: CodingAgentConfig) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.llmAdapter = llmAdapter;
    this.agentFramework = new EnhancedModularAgentFramework(
      nexusClient, 
      llmAdapter,
      {
        maxConcurrentTasks: config.maxConcurrentTasks || 5,
        enableFallbacks: true
      }
    );
    this.config = config;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Handle module errors
    this.eventBus.subscribe('module-error', async (error) => {
      logger.warn(`Module error in coding agent: ${error.message}`);
      
      if (this.agent) {
        this.agent.addToMemory({
          role: 'assistant',
          content: `I encountered an error while processing your request: ${error.message}. Let me try a different approach.`
        });
      }
    });
    
    // Handle MCP server errors
    this.eventBus.subscribe('mcp-server-error', async (error) => {
      logger.warn(`MCP server error in coding agent: ${error.message}`);
      
      if (this.agent) {
        this.agent.addToMemory({
          role: 'assistant',
          content: `I encountered an error with an external service: ${error.message}. I'll try to use an alternative method.`
        });
      }
    });
  }

  /**
   * Initializes the coding agent.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing coding agent: ${this.config.name}`);

      // Create modules configuration
      const modules = [];

      // Add coding module
      modules.push({
        name: 'CodingModule',
        description: 'Module for code generation, editing, and refactoring',
        nexusClient: this.nexusClient,
        defaultLanguage: this.config.defaultLanguage || ProgrammingLanguage.JAVASCRIPT,
        enhancementServerUrl: this.config.enhancementServerUrl
      });

      // Add analysis module
      modules.push({
        name: 'AnalysisModule',
        description: 'Module for code analysis and quality assessment',
        nexusClient: this.nexusClient,
        lucidityServerUrl: this.config.lucidityServerUrl
      });

      // Add version control module
      modules.push({
        name: 'VersionControlModule',
        description: 'Module for Git operations and GitHub integration',
        nexusClient: this.nexusClient,
        githubServerUrl: this.config.githubServerUrl,
        defaultOwner: this.config.defaultOwner
      });

      // Add presentation module
      modules.push({
        name: 'PresentationModule',
        description: 'Module for presenting information in a beautiful UI',
        nexusClient: this.nexusClient
      });

      // Create agent
      this.agent = await this.agentFramework.createAgent({
        name: this.config.name,
        description: this.config.description || 'A coding agent that can generate, analyze, and manage code',
        llm: this.config.llm,
        modules
      });

      logger.info(`Coding agent initialized: ${this.config.name}`);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize coding agent: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { agentName: this.config.name }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Generates code based on a description.
   * @param description Description of the code to generate
   * @param language Programming language
   * @param options Additional options
   * @returns Generated code
   */
  async generateCode(description: string, language?: ProgrammingLanguage, options: any = {}): Promise<any> {
    try {
      logger.info(`Generating code for: ${description}`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Call generateCode capability
      const result = await this.agent.executeCapability('generateCode', {
        description,
        options: {
          language: language || this.config.defaultLanguage || ProgrammingLanguage.JAVASCRIPT,
          ...options
        }
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { description, language }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Analyzes code for quality issues.
   * @param code Code to analyze
   * @param language Programming language
   * @param dimensions Analysis dimensions
   * @returns Analysis result
   */
  async analyzeCode(code: string, language?: ProgrammingLanguage, dimensions?: AnalysisDimension[]): Promise<any> {
    try {
      logger.info(`Analyzing code (language: ${language || 'auto-detect'})`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Call analyzeCode capability
      const result = await this.agent.executeCapability('analyzeCode', {
        code,
        language,
        options: {
          dimensions,
          includeSuggestions: true,
          includeMetrics: true
        }
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a pull request.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Pull request title
   * @param body Pull request body
   * @param headBranch Head branch
   * @param baseBranch Base branch
   * @returns Created pull request
   */
  async createPullRequest(owner: string, repo: string, title: string, body: string, headBranch: string, baseBranch: string = 'main'): Promise<any> {
    try {
      logger.info(`Creating pull request in ${owner}/${repo}`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Call createPullRequest capability
      const result = await this.agent.executeCapability('createPullRequest', {
        owner,
        repo,
        options: {
          title,
          body,
          headBranch,
          baseBranch,
          draft: false,
          maintainerCanModify: true
        }
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { owner, repo, title }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Refactors code.
   * @param code Code to refactor
   * @param goal Refactoring goal
   * @param options Additional options
   * @returns Refactored code
   */
  async refactorCode(code: string, goal: 'readability' | 'performance' | 'security' | 'maintainability', options: any = {}): Promise<any> {
    try {
      logger.info(`Refactoring code (goal: ${goal})`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Call refactorCode capability
      const result = await this.agent.executeCapability('refactorCode', {
        code,
        options: {
          goal,
          ...options
        }
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { goal, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Generates tests for code.
   * @param code Code to test
   * @param language Programming language
   * @param framework Test framework
   * @returns Generated tests
   */
  async generateTests(code: string, language?: ProgrammingLanguage, framework?: string): Promise<any> {
    try {
      logger.info(`Generating tests (language: ${language || 'auto-detect'}, framework: ${framework || 'default'})`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Call generateTests capability
      const result = await this.agent.executeCapability('generateTests', {
        code,
        language,
        framework
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { language, framework, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Executes a coding task.
   * @param task Task to execute
   * @param options Additional options
   * @returns Task result
   */
  async executeTask(task: string, options: any = {}): Promise<any> {
    try {
      logger.info(`Executing coding task: ${task}`);

      if (!this.agent) {
        throw new Error('Coding agent not initialized');
      }

      // Execute task
      const result = await this.agentFramework.executeTask(
        this.agent.getName(), 
        task, 
        {
          priority: TaskPriority.NORMAL,
          waitForCompletion: true,
          ...options
        }
      );
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to execute coding task: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { task }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets the agent.
   * @returns Agent
   */
  getAgent(): Agent | null {
    return this.agent;
  }

  /**
   * Gets the agent framework.
   * @returns Agent framework
   */
  getAgentFramework(): EnhancedModularAgentFramework {
    return this.agentFramework;
  }

  /**
   * Gets the configuration.
   * @returns Configuration
   */
  getConfig(): CodingAgentConfig {
    return this.config;
  }
}
