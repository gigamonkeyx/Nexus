"use strict";
/**
 * Error Handling
 *
 * Utilities for handling errors in the bootstrapping approach.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessage = exports.validateFilePath = exports.validateTaskId = exports.validateAgentId = exports.validateServerId = exports.validateArgument = exports.assert = exports.tryExecute = exports.handleError = exports.createError = exports.ErrorCode = exports.BootstrapError = void 0;
const logger_1 = require("../utils/logger");
/**
 * Custom error class for bootstrap errors
 */
class BootstrapError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'BootstrapError';
        this.code = code;
        this.details = details;
    }
}
exports.BootstrapError = BootstrapError;
/**
 * Error codes
 */
var ErrorCode;
(function (ErrorCode) {
    // General errors
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    ErrorCode["INVALID_ARGUMENT"] = "INVALID_ARGUMENT";
    ErrorCode["NOT_IMPLEMENTED"] = "NOT_IMPLEMENTED";
    // Server errors
    ErrorCode["SERVER_NOT_FOUND"] = "SERVER_NOT_FOUND";
    ErrorCode["SERVER_CONNECTION_FAILED"] = "SERVER_CONNECTION_FAILED";
    ErrorCode["SERVER_REQUEST_FAILED"] = "SERVER_REQUEST_FAILED";
    ErrorCode["SERVER_RESPONSE_INVALID"] = "SERVER_RESPONSE_INVALID";
    // Agent errors
    ErrorCode["AGENT_NOT_FOUND"] = "AGENT_NOT_FOUND";
    ErrorCode["AGENT_INITIALIZATION_FAILED"] = "AGENT_INITIALIZATION_FAILED";
    ErrorCode["AGENT_TASK_FAILED"] = "AGENT_TASK_FAILED";
    // Task errors
    ErrorCode["TASK_NOT_FOUND"] = "TASK_NOT_FOUND";
    ErrorCode["TASK_EXECUTION_FAILED"] = "TASK_EXECUTION_FAILED";
    // Communication errors
    ErrorCode["MESSAGE_SEND_FAILED"] = "MESSAGE_SEND_FAILED";
    ErrorCode["MESSAGE_RECEIVE_FAILED"] = "MESSAGE_RECEIVE_FAILED";
    // File errors
    ErrorCode["FILE_NOT_FOUND"] = "FILE_NOT_FOUND";
    ErrorCode["FILE_READ_FAILED"] = "FILE_READ_FAILED";
    ErrorCode["FILE_WRITE_FAILED"] = "FILE_WRITE_FAILED";
    // Code generation errors
    ErrorCode["CODE_GENERATION_FAILED"] = "CODE_GENERATION_FAILED";
    ErrorCode["CODE_ANALYSIS_FAILED"] = "CODE_ANALYSIS_FAILED";
    // Benchmark errors
    ErrorCode["BENCHMARK_EXECUTION_FAILED"] = "BENCHMARK_EXECUTION_FAILED";
    ErrorCode["BENCHMARK_RESULT_INVALID"] = "BENCHMARK_RESULT_INVALID";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
/**
 * Create a bootstrap error
 */
function createError(message, code, details) {
    return new BootstrapError(message, code, details);
}
exports.createError = createError;
/**
 * Handle an error
 */
function handleError(error, context) {
    if (error instanceof BootstrapError) {
        logger_1.logger.error(`${context ? `[${context}] ` : ''}${error.message} (${error.code})${error.details ? `: ${JSON.stringify(error.details)}` : ''}`);
    }
    else {
        logger_1.logger.error(`${context ? `[${context}] ` : ''}${error instanceof Error ? error.message : String(error)}`);
    }
}
exports.handleError = handleError;
/**
 * Try to execute a function and handle any errors
 */
async function tryExecute(fn, errorMessage, errorCode, context) {
    try {
        return await fn();
    }
    catch (error) {
        handleError(error, context);
        throw createError(errorMessage, errorCode, { originalError: error instanceof Error ? error.message : String(error) });
    }
}
exports.tryExecute = tryExecute;
/**
 * Assert a condition
 */
function assert(condition, message, code, details) {
    if (!condition) {
        throw createError(message, code, details);
    }
}
exports.assert = assert;
/**
 * Validate an argument
 */
function validateArgument(value, name, validator) {
    if (value === null || value === undefined) {
        throw createError(`Argument ${name} is required`, ErrorCode.INVALID_ARGUMENT, { name });
    }
    if (validator && !validator(value)) {
        throw createError(`Argument ${name} is invalid`, ErrorCode.INVALID_ARGUMENT, { name, value });
    }
    return value;
}
exports.validateArgument = validateArgument;
/**
 * Validate a server ID
 */
function validateServerId(serverId) {
    return validateArgument(serverId, 'serverId', (value) => value.trim().length > 0);
}
exports.validateServerId = validateServerId;
/**
 * Validate an agent ID
 */
function validateAgentId(agentId) {
    return validateArgument(agentId, 'agentId', (value) => value.trim().length > 0);
}
exports.validateAgentId = validateAgentId;
/**
 * Validate a task ID
 */
function validateTaskId(taskId) {
    return validateArgument(taskId, 'taskId', (value) => value.trim().length > 0);
}
exports.validateTaskId = validateTaskId;
/**
 * Validate a file path
 */
function validateFilePath(filePath) {
    return validateArgument(filePath, 'filePath', (value) => value.trim().length > 0);
}
exports.validateFilePath = validateFilePath;
/**
 * Validate a message
 */
function validateMessage(message) {
    return validateArgument(message, 'message', (value) => typeof value === 'object' &&
        value !== null &&
        typeof value.from === 'string' &&
        typeof value.to === 'string' &&
        typeof value.type === 'string' &&
        typeof value.subject === 'string');
}
exports.validateMessage = validateMessage;
