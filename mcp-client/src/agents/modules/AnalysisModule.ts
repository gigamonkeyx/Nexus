/**
 * AnalysisModule
 * 
 * Module for code analysis and quality assessment.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { NexusClient } from '../../core/NexusClient';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import { ProgrammingLanguage } from './CodingModule';
import { logger } from '../../utils/logger';

/**
 * Analysis dimension
 */
export enum AnalysisDimension {
  COMPLEXITY = 'complexity',
  MAINTAINABILITY = 'maintainability',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  RELIABILITY = 'reliability',
  TESTABILITY = 'testability',
  REUSABILITY = 'reusability',
  MODULARITY = 'modularity',
  DOCUMENTATION = 'documentation',
  STYLE = 'style'
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
 * Analysis issue
 */
export interface AnalysisIssue {
  message: string;
  dimension: AnalysisDimension;
  severity: AnalysisSeverity;
  line?: number;
  column?: number;
  suggestion?: string;
}

/**
 * Analysis result
 */
export interface AnalysisResult {
  issues: AnalysisIssue[];
  summary: {
    [dimension in AnalysisDimension]?: {
      score: number;
      issues: number;
    };
  };
  overallScore: number;
  metrics: {
    [key: string]: number;
  };
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  dimensions?: AnalysisDimension[];
  minSeverity?: AnalysisSeverity;
  includeSuggestions?: boolean;
  includeMetrics?: boolean;
}

/**
 * AnalysisModule configuration
 */
export interface AnalysisModuleConfig extends ModuleConfig {
  nexusClient: NexusClient;
  lucidityServerUrl?: string;
}

/**
 * AnalysisModule provides capabilities for code analysis and quality assessment.
 */
export class AnalysisModule extends BaseModule {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private lucidityServerUrl?: string;

  /**
   * Creates a new AnalysisModule instance.
   * @param config Module configuration
   */
  constructor(config: AnalysisModuleConfig) {
    super(config);
    this.nexusClient = config.nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.lucidityServerUrl = config.lucidityServerUrl;
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering analysis capabilities for agent: ${agent.getName()}`);

      // Register analyzeCode capability
      agent.registerCapability('analyzeCode', async (parameters: any) => {
        try {
          const { code, language, options } = parameters;
          return this.analyzeCode(code, language, options);
        } catch (error) {
          logger.error(`Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register analyzeSecurityVulnerabilities capability
      agent.registerCapability('analyzeSecurityVulnerabilities', async (parameters: any) => {
        try {
          const { code, language } = parameters;
          return this.analyzeSecurityVulnerabilities(code, language);
        } catch (error) {
          logger.error(`Failed to analyze security vulnerabilities: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register analyzePerformance capability
      agent.registerCapability('analyzePerformance', async (parameters: any) => {
        try {
          const { code, language } = parameters;
          return this.analyzePerformance(code, language);
        } catch (error) {
          logger.error(`Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register analyzeDependencies capability
      agent.registerCapability('analyzeDependencies', async (parameters: any) => {
        try {
          const { code, language } = parameters;
          return this.analyzeDependencies(code, language);
        } catch (error) {
          logger.error(`Failed to analyze dependencies: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register calculateComplexity capability
      agent.registerCapability('calculateComplexity', async (parameters: any) => {
        try {
          const { code, language } = parameters;
          return this.calculateComplexity(code, language);
        } catch (error) {
          logger.error(`Failed to calculate complexity: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Analysis capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to register analysis capabilities: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { moduleName: this.getName(), agentName: agent.getName() }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Analyzes code for quality issues.
   * @param code Code to analyze
   * @param language Programming language
   * @param options Analysis options
   * @returns Analysis result
   */
  private async analyzeCode(code: string, language?: ProgrammingLanguage, options: Partial<AnalysisOptions> = {}): Promise<AnalysisResult> {
    try {
      logger.info(`Analyzing code (language: ${language || 'auto-detect'})`);
      
      // Try to use Lucidity MCP Server if available
      if (this.lucidityServerUrl) {
        try {
          const result = await this.nexusClient.callTool('analyze-code', {
            code,
            language,
            dimensions: options.dimensions || Object.values(AnalysisDimension),
            minSeverity: options.minSeverity || AnalysisSeverity.INFO,
            includeSuggestions: options.includeSuggestions !== false,
            includeMetrics: options.includeMetrics !== false
          });
          
          return result;
        } catch (error) {
          logger.warn(`Failed to use Lucidity MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic analysis
        }
      }
      
      // Fall back to basic analysis
      // This would typically use language-specific analyzers or LLM-based analysis
      
      // For now, return a placeholder result
      return {
        issues: [
          {
            message: 'This is a placeholder analysis result',
            dimension: AnalysisDimension.MAINTAINABILITY,
            severity: AnalysisSeverity.INFO,
            suggestion: 'Replace with actual analysis'
          }
        ],
        summary: {
          [AnalysisDimension.MAINTAINABILITY]: {
            score: 0.8,
            issues: 1
          }
        },
        overallScore: 0.8,
        metrics: {
          linesOfCode: code.split('\n').length,
          complexity: 1
        }
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Analyzes code for security vulnerabilities.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Security analysis result
   */
  private async analyzeSecurityVulnerabilities(code: string, language?: ProgrammingLanguage): Promise<any> {
    try {
      logger.info(`Analyzing security vulnerabilities (language: ${language || 'auto-detect'})`);
      
      // Try to use Lucidity MCP Server if available
      if (this.lucidityServerUrl) {
        try {
          return await this.nexusClient.callTool('analyze-security', {
            code,
            language
          });
        } catch (error) {
          logger.warn(`Failed to use Lucidity MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic security analysis
        }
      }
      
      // Fall back to basic security analysis
      // This would typically use security scanning tools or LLM-based analysis
      
      // For now, return a placeholder result
      return {
        vulnerabilities: [
          {
            type: 'placeholder',
            severity: 'low',
            description: 'This is a placeholder security vulnerability',
            line: 1,
            mitigation: 'Replace with actual security analysis'
          }
        ],
        summary: {
          high: 0,
          medium: 0,
          low: 1
        }
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze security vulnerabilities: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Analyzes code for performance issues.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Performance analysis result
   */
  private async analyzePerformance(code: string, language?: ProgrammingLanguage): Promise<any> {
    try {
      logger.info(`Analyzing performance (language: ${language || 'auto-detect'})`);
      
      // Try to use Lucidity MCP Server if available
      if (this.lucidityServerUrl) {
        try {
          return await this.nexusClient.callTool('analyze-performance', {
            code,
            language
          });
        } catch (error) {
          logger.warn(`Failed to use Lucidity MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic performance analysis
        }
      }
      
      // Fall back to basic performance analysis
      // This would typically use performance analysis tools or LLM-based analysis
      
      // For now, return a placeholder result
      return {
        issues: [
          {
            type: 'placeholder',
            severity: 'low',
            description: 'This is a placeholder performance issue',
            line: 1,
            suggestion: 'Replace with actual performance analysis'
          }
        ],
        metrics: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)'
        }
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze performance: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Analyzes code dependencies.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Dependency analysis result
   */
  private async analyzeDependencies(code: string, language?: ProgrammingLanguage): Promise<any> {
    try {
      logger.info(`Analyzing dependencies (language: ${language || 'auto-detect'})`);
      
      // Try to use Lucidity MCP Server if available
      if (this.lucidityServerUrl) {
        try {
          return await this.nexusClient.callTool('analyze-dependencies', {
            code,
            language
          });
        } catch (error) {
          logger.warn(`Failed to use Lucidity MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic dependency analysis
        }
      }
      
      // Fall back to basic dependency analysis
      // This would typically use dependency analysis tools or LLM-based analysis
      
      // For now, return a placeholder result
      return {
        dependencies: [
          {
            name: 'placeholder',
            version: '1.0.0',
            type: 'external'
          }
        ],
        graph: {
          nodes: [],
          edges: []
        }
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to analyze dependencies: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Calculates code complexity.
   * @param code Code to analyze
   * @param language Programming language
   * @returns Complexity metrics
   */
  private async calculateComplexity(code: string, language?: ProgrammingLanguage): Promise<any> {
    try {
      logger.info(`Calculating complexity (language: ${language || 'auto-detect'})`);
      
      // Try to use Lucidity MCP Server if available
      if (this.lucidityServerUrl) {
        try {
          return await this.nexusClient.callTool('calculate-complexity', {
            code,
            language
          });
        } catch (error) {
          logger.warn(`Failed to use Lucidity MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic complexity calculation
        }
      }
      
      // Fall back to basic complexity calculation
      // This would typically use complexity analysis tools or LLM-based analysis
      
      // For now, return a placeholder result
      return {
        cyclomaticComplexity: 1,
        cognitiveComplexity: 1,
        maintainabilityIndex: 80,
        linesOfCode: code.split('\n').length,
        functions: 1,
        classes: 0
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to calculate complexity: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
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
    // Check if the task is an analysis task
    const analysisPatterns = [
      /analyze (the |this )?code/i,
      /check (the |this )?code/i,
      /review (the |this )?code/i,
      /find (issues|problems|bugs)/i,
      /security (check|analysis|audit)/i,
      /performance (check|analysis|audit)/i,
      /complexity (check|analysis|measurement)/i
    ];

    if (analysisPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling analysis task: ${task}`);

        // Extract code from agent memory
        const memory = agent.getMemory();
        const lastUserMessage = memory.filter(msg => msg.role === 'user').pop();
        
        if (lastUserMessage && lastUserMessage.content) {
          // Try to extract code from the message
          const codeMatch = lastUserMessage.content.match(/```(?:\w+)?\s*([\s\S]+?)```/);
          
          if (codeMatch) {
            const code = codeMatch[1];
            
            // Determine which analysis to perform based on the task
            if (task.match(/security/i)) {
              const result = await this.analyzeSecurityVulnerabilities(code);
              
              // Add result to agent memory
              agent.addToMemory({
                role: 'assistant',
                content: `I've analyzed the code for security vulnerabilities. Here are the results:\n\n${JSON.stringify(result, null, 2)}`
              });
              
              return true;
            } else if (task.match(/performance/i)) {
              const result = await this.analyzePerformance(code);
              
              // Add result to agent memory
              agent.addToMemory({
                role: 'assistant',
                content: `I've analyzed the code for performance issues. Here are the results:\n\n${JSON.stringify(result, null, 2)}`
              });
              
              return true;
            } else if (task.match(/complexity/i)) {
              const result = await this.calculateComplexity(code);
              
              // Add result to agent memory
              agent.addToMemory({
                role: 'assistant',
                content: `I've calculated the complexity metrics for the code. Here are the results:\n\n${JSON.stringify(result, null, 2)}`
              });
              
              return true;
            } else {
              // General code analysis
              const result = await this.analyzeCode(code);
              
              // Add result to agent memory
              agent.addToMemory({
                role: 'assistant',
                content: `I've analyzed the code. Here are the results:\n\n${JSON.stringify(result, null, 2)}`
              });
              
              return true;
            }
          }
        }
        
        return false;
      } catch (error) {
        logger.error(`Failed to handle analysis task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }
}
