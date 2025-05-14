/**
 * ErrorHandling
 * 
 * Centralized error handling system for the agent framework.
 */

import { EventBus } from './EventBus';
import { logger } from '../utils/logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error source types
 */
export enum ErrorSource {
  MODULE = 'module',
  MCP_SERVER = 'mcp_server',
  MCP_CLIENT = 'mcp_client',
  FRAMEWORK = 'framework',
  EXTERNAL = 'external'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  moduleName?: string;
  serverName?: string;
  operation?: string;
  timestamp: Date;
  [key: string]: any;
}

/**
 * Agent error interface
 */
export interface AgentError {
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  originalError?: Error;
  context: ErrorContext;
  handled: boolean;
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: AgentError) => boolean | Promise<boolean>;

/**
 * Retry options interface
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors?: (string | RegExp)[];
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

/**
 * ErrorHandling provides a centralized error handling system.
 */
export class ErrorHandling {
  private static instance: ErrorHandling;
  private eventBus: EventBus;
  private errorHandlers: Map<ErrorSeverity, ErrorHandler[]> = new Map();
  private fallbackHandlers: ErrorHandler[] = [];

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.eventBus = EventBus.getInstance();
    
    // Initialize error handlers map
    Object.values(ErrorSeverity).forEach(severity => {
      this.errorHandlers.set(severity as ErrorSeverity, []);
    });
    
    // Register default error handler
    this.registerFallbackHandler(this.defaultErrorHandler.bind(this));
  }

  /**
   * Get the ErrorHandling instance
   * @returns ErrorHandling instance
   */
  public static getInstance(): ErrorHandling {
    if (!ErrorHandling.instance) {
      ErrorHandling.instance = new ErrorHandling();
    }
    return ErrorHandling.instance;
  }

  /**
   * Register an error handler for a specific severity
   * @param severity Error severity
   * @param handler Error handler
   */
  public registerHandler(severity: ErrorSeverity, handler: ErrorHandler): void {
    this.errorHandlers.get(severity)!.push(handler);
    logger.debug(`Registered error handler for severity: ${severity}`);
  }

  /**
   * Register a fallback error handler
   * @param handler Error handler
   */
  public registerFallbackHandler(handler: ErrorHandler): void {
    this.fallbackHandlers.push(handler);
    logger.debug('Registered fallback error handler');
  }

  /**
   * Handle an error
   * @param error Error to handle
   * @returns True if the error was handled
   */
  public async handleError(error: AgentError): Promise<boolean> {
    logger.debug(`Handling error: ${error.message}`);
    
    // Try severity-specific handlers
    const handlers = this.errorHandlers.get(error.severity) || [];
    for (const handler of handlers) {
      try {
        const handled = await Promise.resolve(handler(error));
        if (handled) {
          error.handled = true;
          return true;
        }
      } catch (handlerError) {
        logger.error(`Error in error handler: ${handlerError instanceof Error ? handlerError.message : String(handlerError)}`);
      }
    }
    
    // Try fallback handlers
    for (const handler of this.fallbackHandlers) {
      try {
        const handled = await Promise.resolve(handler(error));
        if (handled) {
          error.handled = true;
          return true;
        }
      } catch (handlerError) {
        logger.error(`Error in fallback handler: ${handlerError instanceof Error ? handlerError.message : String(handlerError)}`);
      }
    }
    
    // If no handler handled the error, mark it as unhandled
    error.handled = false;
    return false;
  }

  /**
   * Default error handler
   * @param error Error to handle
   * @returns True if the error was handled
   */
  private defaultErrorHandler(error: AgentError): boolean {
    // Log the error
    switch (error.severity) {
      case ErrorSeverity.INFO:
        logger.info(`[${error.source}] ${error.message}`);
        break;
      case ErrorSeverity.WARNING:
        logger.warn(`[${error.source}] ${error.message}`);
        break;
      case ErrorSeverity.ERROR:
        logger.error(`[${error.source}] ${error.message}`);
        break;
      case ErrorSeverity.CRITICAL:
        logger.error(`[CRITICAL] [${error.source}] ${error.message}`);
        break;
    }
    
    // Publish error event
    this.eventBus.publish('error', error);
    
    // Default handler doesn't fully handle the error
    return false;
  }

  /**
   * Create an error object
   * @param message Error message
   * @param severity Error severity
   * @param source Error source
   * @param originalError Original error
   * @param context Error context
   * @returns Agent error object
   */
  public createError(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    source: ErrorSource = ErrorSource.FRAMEWORK,
    originalError?: Error,
    context: Partial<ErrorContext> = {}
  ): AgentError {
    return {
      message,
      severity,
      source,
      originalError,
      context: {
        timestamp: new Date(),
        ...context
      },
      handled: false
    };
  }

  /**
   * Retry a function with exponential backoff
   * @param fn Function to retry
   * @param options Retry options
   * @returns Function result
   */
  public async retry<T>(fn: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
    const retryOptions: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= retryOptions.maxRetries + 1; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        if (retryOptions.retryableErrors && !this.isRetryableError(lastError, retryOptions.retryableErrors)) {
          throw lastError;
        }
        
        // If this was the last attempt, throw the error
        if (attempt > retryOptions.maxRetries) {
          throw lastError;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryOptions.initialDelay * Math.pow(retryOptions.backoffFactor, attempt - 1),
          retryOptions.maxDelay
        );
        
        logger.debug(`Retry attempt ${attempt}/${retryOptions.maxRetries} after ${delay}ms: ${lastError.message}`);
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never happen, but TypeScript requires a return
    throw lastError;
  }

  /**
   * Check if an error is retryable
   * @param error Error to check
   * @param retryableErrors List of retryable error patterns
   * @returns True if the error is retryable
   */
  private isRetryableError(error: Error, retryableErrors: (string | RegExp)[]): boolean {
    const errorMessage = error.message;
    
    return retryableErrors.some(pattern => {
      if (typeof pattern === 'string') {
        return errorMessage.includes(pattern);
      } else {
        return pattern.test(errorMessage);
      }
    });
  }
}
