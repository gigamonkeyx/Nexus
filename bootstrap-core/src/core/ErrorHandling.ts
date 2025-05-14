/**
 * Error Handling
 * 
 * Utilities for handling errors in the bootstrapping approach.
 */

import { logger } from '../utils/logger';

/**
 * Custom error class for bootstrap errors
 */
export class BootstrapError extends Error {
  public readonly code: string;
  public readonly details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'BootstrapError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Error codes
 */
export enum ErrorCode {
  // General errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Server errors
  SERVER_NOT_FOUND = 'SERVER_NOT_FOUND',
  SERVER_CONNECTION_FAILED = 'SERVER_CONNECTION_FAILED',
  SERVER_REQUEST_FAILED = 'SERVER_REQUEST_FAILED',
  SERVER_RESPONSE_INVALID = 'SERVER_RESPONSE_INVALID',
  
  // Agent errors
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  AGENT_INITIALIZATION_FAILED = 'AGENT_INITIALIZATION_FAILED',
  AGENT_TASK_FAILED = 'AGENT_TASK_FAILED',
  
  // Task errors
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_EXECUTION_FAILED = 'TASK_EXECUTION_FAILED',
  
  // Communication errors
  MESSAGE_SEND_FAILED = 'MESSAGE_SEND_FAILED',
  MESSAGE_RECEIVE_FAILED = 'MESSAGE_RECEIVE_FAILED',
  
  // File errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_FAILED = 'FILE_READ_FAILED',
  FILE_WRITE_FAILED = 'FILE_WRITE_FAILED',
  
  // Code generation errors
  CODE_GENERATION_FAILED = 'CODE_GENERATION_FAILED',
  CODE_ANALYSIS_FAILED = 'CODE_ANALYSIS_FAILED',
  
  // Benchmark errors
  BENCHMARK_EXECUTION_FAILED = 'BENCHMARK_EXECUTION_FAILED',
  BENCHMARK_RESULT_INVALID = 'BENCHMARK_RESULT_INVALID'
}

/**
 * Create a bootstrap error
 */
export function createError(message: string, code: ErrorCode, details?: any): BootstrapError {
  return new BootstrapError(message, code, details);
}

/**
 * Handle an error
 */
export function handleError(error: any, context?: string): void {
  if (error instanceof BootstrapError) {
    logger.error(`${context ? `[${context}] ` : ''}${error.message} (${error.code})${error.details ? `: ${JSON.stringify(error.details)}` : ''}`);
  } else {
    logger.error(`${context ? `[${context}] ` : ''}${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Try to execute a function and handle any errors
 */
export async function tryExecute<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  errorCode: ErrorCode,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    throw createError(errorMessage, errorCode, { originalError: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Assert a condition
 */
export function assert(condition: boolean, message: string, code: ErrorCode, details?: any): asserts condition {
  if (!condition) {
    throw createError(message, code, details);
  }
}

/**
 * Validate an argument
 */
export function validateArgument<T>(
  value: T | null | undefined,
  name: string,
  validator?: (value: T) => boolean
): T {
  if (value === null || value === undefined) {
    throw createError(`Argument ${name} is required`, ErrorCode.INVALID_ARGUMENT, { name });
  }
  
  if (validator && !validator(value)) {
    throw createError(`Argument ${name} is invalid`, ErrorCode.INVALID_ARGUMENT, { name, value });
  }
  
  return value;
}

/**
 * Validate a server ID
 */
export function validateServerId(serverId: string): string {
  return validateArgument(serverId, 'serverId', (value) => value.trim().length > 0);
}

/**
 * Validate an agent ID
 */
export function validateAgentId(agentId: string): string {
  return validateArgument(agentId, 'agentId', (value) => value.trim().length > 0);
}

/**
 * Validate a task ID
 */
export function validateTaskId(taskId: string): string {
  return validateArgument(taskId, 'taskId', (value) => value.trim().length > 0);
}

/**
 * Validate a file path
 */
export function validateFilePath(filePath: string): string {
  return validateArgument(filePath, 'filePath', (value) => value.trim().length > 0);
}

/**
 * Validate a message
 */
export function validateMessage(message: any): any {
  return validateArgument(message, 'message', (value) => 
    typeof value === 'object' && 
    value !== null && 
    typeof value.from === 'string' && 
    typeof value.to === 'string' && 
    typeof value.type === 'string' && 
    typeof value.subject === 'string'
  );
}
