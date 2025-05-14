/**
 * CodingModule
 * 
 * Module for code generation, editing, and refactoring.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { NexusClient } from '../../core/NexusClient';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import { logger } from '../../utils/logger';

/**
 * Supported programming languages
 */
export enum ProgrammingLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  CPP = 'cpp',
  PHP = 'php',
  RUBY = 'ruby'
}

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  language: ProgrammingLanguage;
  includeComments?: boolean;
  includeTests?: boolean;
  style?: 'concise' | 'verbose' | 'optimized';
}

/**
 * Code refactoring options
 */
export interface CodeRefactoringOptions {
  goal: 'readability' | 'performance' | 'security' | 'maintainability';
  preserveComments?: boolean;
  preserveStructure?: boolean;
}

/**
 * CodingModule configuration
 */
export interface CodingModuleConfig extends ModuleConfig {
  nexusClient: NexusClient;
  defaultLanguage?: ProgrammingLanguage;
  enhancementServerUrl?: string;
}

/**
 * CodingModule provides capabilities for code generation, editing, and refactoring.
 */
export class CodingModule extends BaseModule {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private defaultLanguage: ProgrammingLanguage;
  private enhancementServerUrl?: string;
  private languageDetectors: Map<string, RegExp> = new Map();

  /**
   * Creates a new CodingModule instance.
   * @param config Module configuration
   */
  constructor(config: CodingModuleConfig) {
    super(config);
    this.nexusClient = config.nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.defaultLanguage = config.defaultLanguage || ProgrammingLanguage.JAVASCRIPT;
    this.enhancementServerUrl = config.enhancementServerUrl;
    this.initializeLanguageDetectors();
  }

  /**
   * Initialize language detectors
   */
  private initializeLanguageDetectors(): void {
    this.languageDetectors.set(ProgrammingLanguage.JAVASCRIPT, /\.(js|jsx|mjs)$/i);
    this.languageDetectors.set(ProgrammingLanguage.TYPESCRIPT, /\.(ts|tsx)$/i);
    this.languageDetectors.set(ProgrammingLanguage.PYTHON, /\.(py|pyw)$/i);
    this.languageDetectors.set(ProgrammingLanguage.JAVA, /\.java$/i);
    this.languageDetectors.set(ProgrammingLanguage.CSHARP, /\.(cs|csx)$/i);
    this.languageDetectors.set(ProgrammingLanguage.GO, /\.go$/i);
    this.languageDetectors.set(ProgrammingLanguage.RUST, /\.rs$/i);
    this.languageDetectors.set(ProgrammingLanguage.CPP, /\.(cpp|cc|cxx|h|hpp)$/i);
    this.languageDetectors.set(ProgrammingLanguage.PHP, /\.(php|phtml)$/i);
    this.languageDetectors.set(ProgrammingLanguage.RUBY, /\.(rb|rake)$/i);
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering coding capabilities for agent: ${agent.getName()}`);

      // Register generateCode capability
      agent.registerCapability('generateCode', async (parameters: any) => {
        try {
          const { description, options } = parameters;
          return this.generateCode(description, options);
        } catch (error) {
          logger.error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register refactorCode capability
      agent.registerCapability('refactorCode', async (parameters: any) => {
        try {
          const { code, options } = parameters;
          return this.refactorCode(code, options);
        } catch (error) {
          logger.error(`Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register formatCode capability
      agent.registerCapability('formatCode', async (parameters: any) => {
        try {
          const { code, language } = parameters;
          return this.formatCode(code, language);
        } catch (error) {
          logger.error(`Failed to format code: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register generateDocumentation capability
      agent.registerCapability('generateDocumentation', async (parameters: any) => {
        try {
          const { code, language, style } = parameters;
          return this.generateDocumentation(code, language, style);
        } catch (error) {
          logger.error(`Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register generateTests capability
      agent.registerCapability('generateTests', async (parameters: any) => {
        try {
          const { code, language, framework } = parameters;
          return this.generateTests(code, language, framework);
        } catch (error) {
          logger.error(`Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register detectLanguage capability
      agent.registerCapability('detectLanguage', async (parameters: any) => {
        try {
          const { filename, code } = parameters;
          return this.detectLanguage(filename, code);
        } catch (error) {
          logger.error(`Failed to detect language: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Coding capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to register coding capabilities: ${error instanceof Error ? error.message : String(error)}`,
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
   * Generates code based on a description.
   * @param description Description of the code to generate
   * @param options Code generation options
   * @returns Generated code
   */
  private async generateCode(description: string, options: Partial<CodeGenerationOptions> = {}): Promise<any> {
    try {
      logger.info(`Generating code for: ${description}`);
      
      const language = options.language || this.defaultLanguage;
      
      // Try to use Code Enhancement MCP Server if available
      if (this.enhancementServerUrl) {
        try {
          return await this.nexusClient.callTool('generate-code', {
            description,
            language,
            includeComments: options.includeComments !== false,
            includeTests: options.includeTests === true,
            style: options.style || 'concise'
          });
        } catch (error) {
          logger.warn(`Failed to use Code Enhancement MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to LLM-based generation
        }
      }
      
      // Fall back to LLM-based code generation
      // This would typically use the agent's LLM adapter
      
      // For now, return a placeholder
      return {
        code: `// Generated code for: ${description}\n// Language: ${language}\n\n// TODO: Implement this`,
        language
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { description }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Refactors code.
   * @param code Code to refactor
   * @param options Code refactoring options
   * @returns Refactored code
   */
  private async refactorCode(code: string, options: Partial<CodeRefactoringOptions> = {}): Promise<any> {
    try {
      logger.info('Refactoring code');
      
      const goal = options.goal || 'readability';
      
      // Try to use Code Enhancement MCP Server if available
      if (this.enhancementServerUrl) {
        try {
          return await this.nexusClient.callTool('refactor-code', {
            code,
            goal,
            preserveComments: options.preserveComments !== false,
            preserveStructure: options.preserveStructure !== false
          });
        } catch (error) {
          logger.warn(`Failed to use Code Enhancement MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to LLM-based refactoring
        }
      }
      
      // Fall back to LLM-based code refactoring
      // This would typically use the agent's LLM adapter
      
      // For now, return a placeholder
      return {
        code: `// Refactored code (goal: ${goal})\n\n${code}`,
        changes: []
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to refactor code: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Formats code.
   * @param code Code to format
   * @param language Programming language
   * @returns Formatted code
   */
  private async formatCode(code: string, language?: ProgrammingLanguage): Promise<any> {
    try {
      logger.info(`Formatting code (language: ${language || 'auto-detect'})`);
      
      // Detect language if not provided
      if (!language) {
        language = this.detectLanguageFromCode(code);
      }
      
      // Try to use Code Enhancement MCP Server if available
      if (this.enhancementServerUrl) {
        try {
          return await this.nexusClient.callTool('format-code', {
            code,
            language
          });
        } catch (error) {
          logger.warn(`Failed to use Code Enhancement MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic formatting
        }
      }
      
      // Fall back to basic formatting
      // This would typically use language-specific formatters
      
      // For now, return the original code
      return {
        code,
        language
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to format code: ${error instanceof Error ? error.message : String(error)}`,
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
   * Generates documentation for code.
   * @param code Code to document
   * @param language Programming language
   * @param style Documentation style
   * @returns Documented code
   */
  private async generateDocumentation(code: string, language?: ProgrammingLanguage, style: string = 'standard'): Promise<any> {
    try {
      logger.info(`Generating documentation for code (language: ${language || 'auto-detect'}, style: ${style})`);
      
      // Detect language if not provided
      if (!language) {
        language = this.detectLanguageFromCode(code);
      }
      
      // Try to use Code Enhancement MCP Server if available
      if (this.enhancementServerUrl) {
        try {
          return await this.nexusClient.callTool('generate-documentation', {
            code,
            language,
            style
          });
        } catch (error) {
          logger.warn(`Failed to use Code Enhancement MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to LLM-based documentation
        }
      }
      
      // Fall back to LLM-based documentation generation
      // This would typically use the agent's LLM adapter
      
      // For now, return a placeholder
      return {
        code: `// Documentation generated (style: ${style})\n\n${code}`,
        language
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate documentation: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, style, codeLength: code.length }
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
  private async generateTests(code: string, language?: ProgrammingLanguage, framework?: string): Promise<any> {
    try {
      logger.info(`Generating tests for code (language: ${language || 'auto-detect'}, framework: ${framework || 'default'})`);
      
      // Detect language if not provided
      if (!language) {
        language = this.detectLanguageFromCode(code);
      }
      
      // Try to use Code Enhancement MCP Server if available
      if (this.enhancementServerUrl) {
        try {
          return await this.nexusClient.callTool('generate-tests', {
            code,
            language,
            framework
          });
        } catch (error) {
          logger.warn(`Failed to use Code Enhancement MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to LLM-based test generation
        }
      }
      
      // Fall back to LLM-based test generation
      // This would typically use the agent's LLM adapter
      
      // For now, return a placeholder
      return {
        tests: `// Generated tests for the provided code\n// Language: ${language}\n// Framework: ${framework || 'default'}\n\n// TODO: Implement tests`,
        language
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to generate tests: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { language, framework, codeLength: code.length }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Detects the programming language of code.
   * @param filename Filename (optional)
   * @param code Code to detect language for
   * @returns Detected language
   */
  private async detectLanguage(filename?: string, code?: string): Promise<ProgrammingLanguage> {
    try {
      logger.info(`Detecting language (filename: ${filename || 'not provided'})`);
      
      // Try to detect from filename first
      if (filename) {
        for (const [language, pattern] of this.languageDetectors.entries()) {
          if (pattern.test(filename)) {
            return language as ProgrammingLanguage;
          }
        }
      }
      
      // If filename detection failed and code is provided, try to detect from code
      if (code) {
        return this.detectLanguageFromCode(code);
      }
      
      // Default to the module's default language
      return this.defaultLanguage;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to detect language: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { filename }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Detects the programming language from code.
   * @param code Code to detect language for
   * @returns Detected language
   */
  private detectLanguageFromCode(code: string): ProgrammingLanguage {
    // This is a simplified implementation
    // In a real implementation, this would use more sophisticated language detection
    
    // Look for language-specific patterns
    if (code.includes('import React') || code.includes('export default') || code.includes('const ') || code.includes('let ')) {
      return ProgrammingLanguage.JAVASCRIPT;
    }
    
    if (code.includes('interface ') || code.includes('type ') || code.includes('export class')) {
      return ProgrammingLanguage.TYPESCRIPT;
    }
    
    if (code.includes('def ') || code.includes('import ') && code.includes(':')) {
      return ProgrammingLanguage.PYTHON;
    }
    
    if (code.includes('public class ') || code.includes('private ') || code.includes('protected ')) {
      return ProgrammingLanguage.JAVA;
    }
    
    // Default to the module's default language
    return this.defaultLanguage;
  }

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  async handleTask(task: string, agent: Agent): Promise<boolean> {
    // Check if the task is a coding task
    const codingPatterns = [
      /generate (a |some )?code/i,
      /write (a |some )?code/i,
      /create (a |some )?function/i,
      /implement (a |some )?class/i,
      /refactor (the |this )?code/i,
      /format (the |this )?code/i,
      /document (the |this )?code/i,
      /generate (tests|test cases)/i
    ];

    if (codingPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling coding task: ${task}`);

        // Extract task details
        // This is a simplified implementation
        // In a real implementation, this would use more sophisticated NLP
        
        if (task.match(/generate (a |some )?code/i) || task.match(/write (a |some )?code/i)) {
          const result = await this.generateCode(task);
          
          // Add result to agent memory
          agent.addToMemory({
            role: 'assistant',
            content: `I've generated code based on your request. Here it is:\n\n\`\`\`${result.language}\n${result.code}\n\`\`\``
          });
          
          return true;
        }
        
        if (task.match(/refactor (the |this )?code/i)) {
          // Extract code from agent memory
          const memory = agent.getMemory();
          const lastUserMessage = memory.filter(msg => msg.role === 'user').pop();
          
          if (lastUserMessage && lastUserMessage.content) {
            // Try to extract code from the message
            const codeMatch = lastUserMessage.content.match(/```(?:\w+)?\s*([\s\S]+?)```/);
            
            if (codeMatch) {
              const code = codeMatch[1];
              const result = await this.refactorCode(code);
              
              // Add result to agent memory
              agent.addToMemory({
                role: 'assistant',
                content: `I've refactored the code. Here it is:\n\n\`\`\`\n${result.code}\n\`\`\``
              });
              
              return true;
            }
          }
        }
        
        // Handle other coding tasks similarly...
        
        return false;
      } catch (error) {
        logger.error(`Failed to handle coding task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }
}
