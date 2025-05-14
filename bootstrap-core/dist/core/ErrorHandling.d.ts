/**
 * Error Handling
 *
 * Utilities for handling errors in the bootstrapping approach.
 */
/**
 * Custom error class for bootstrap errors
 */
export declare class BootstrapError extends Error {
    readonly code: string;
    readonly details?: any;
    constructor(message: string, code: string, details?: any);
}
/**
 * Error codes
 */
export declare enum ErrorCode {
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    INVALID_ARGUMENT = "INVALID_ARGUMENT",
    NOT_IMPLEMENTED = "NOT_IMPLEMENTED",
    SERVER_NOT_FOUND = "SERVER_NOT_FOUND",
    SERVER_CONNECTION_FAILED = "SERVER_CONNECTION_FAILED",
    SERVER_REQUEST_FAILED = "SERVER_REQUEST_FAILED",
    SERVER_RESPONSE_INVALID = "SERVER_RESPONSE_INVALID",
    AGENT_NOT_FOUND = "AGENT_NOT_FOUND",
    AGENT_INITIALIZATION_FAILED = "AGENT_INITIALIZATION_FAILED",
    AGENT_TASK_FAILED = "AGENT_TASK_FAILED",
    TASK_NOT_FOUND = "TASK_NOT_FOUND",
    TASK_EXECUTION_FAILED = "TASK_EXECUTION_FAILED",
    MESSAGE_SEND_FAILED = "MESSAGE_SEND_FAILED",
    MESSAGE_RECEIVE_FAILED = "MESSAGE_RECEIVE_FAILED",
    FILE_NOT_FOUND = "FILE_NOT_FOUND",
    FILE_READ_FAILED = "FILE_READ_FAILED",
    FILE_WRITE_FAILED = "FILE_WRITE_FAILED",
    CODE_GENERATION_FAILED = "CODE_GENERATION_FAILED",
    CODE_ANALYSIS_FAILED = "CODE_ANALYSIS_FAILED",
    BENCHMARK_EXECUTION_FAILED = "BENCHMARK_EXECUTION_FAILED",
    BENCHMARK_RESULT_INVALID = "BENCHMARK_RESULT_INVALID"
}
/**
 * Create a bootstrap error
 */
export declare function createError(message: string, code: ErrorCode, details?: any): BootstrapError;
/**
 * Handle an error
 */
export declare function handleError(error: any, context?: string): void;
/**
 * Try to execute a function and handle any errors
 */
export declare function tryExecute<T>(fn: () => Promise<T>, errorMessage: string, errorCode: ErrorCode, context?: string): Promise<T>;
/**
 * Assert a condition
 */
export declare function assert(condition: boolean, message: string, code: ErrorCode, details?: any): asserts condition;
/**
 * Validate an argument
 */
export declare function validateArgument<T>(value: T | null | undefined, name: string, validator?: (value: T) => boolean): T;
/**
 * Validate a server ID
 */
export declare function validateServerId(serverId: string): string;
/**
 * Validate an agent ID
 */
export declare function validateAgentId(agentId: string): string;
/**
 * Validate a task ID
 */
export declare function validateTaskId(taskId: string): string;
/**
 * Validate a file path
 */
export declare function validateFilePath(filePath: string): string;
/**
 * Validate a message
 */
export declare function validateMessage(message: any): any;
