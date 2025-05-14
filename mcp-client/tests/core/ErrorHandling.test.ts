/**
 * ErrorHandling Tests
 */

import { ErrorHandling, ErrorSeverity, ErrorSource, AgentError } from '../../src/core/ErrorHandling';
import { EventBus } from '../../src/core/EventBus';

// Mock the EventBus
jest.mock('../../src/core/EventBus', () => {
  return {
    EventBus: {
      getInstance: jest.fn().mockReturnValue({
        publish: jest.fn().mockResolvedValue(undefined)
      })
    }
  };
});

// Mock the logger
jest.mock('../../src/utils/logger', () => {
  return {
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  };
});

describe('ErrorHandling', () => {
  let errorHandling: ErrorHandling;
  let mockEventBus: { publish: jest.Mock };

  beforeEach(() => {
    // Reset the ErrorHandling instance before each test
    // @ts-ignore - Accessing private static property for testing
    ErrorHandling.instance = undefined;
    errorHandling = ErrorHandling.getInstance();
    
    // Get the mocked EventBus
    mockEventBus = EventBus.getInstance() as unknown as { publish: jest.Mock };
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clear all error handlers after each test
    errorHandling.clear();
  });

  test('getInstance returns a singleton instance', () => {
    const instance1 = ErrorHandling.getInstance();
    const instance2 = ErrorHandling.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('createError creates an error with default values', () => {
    const message = 'Test error';
    const error = errorHandling.createError(message);
    
    expect(error).toEqual({
      message,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.FRAMEWORK,
      timestamp: expect.any(Date),
      handled: false,
      retryCount: 0
    });
  });

  test('createError creates an error with custom values', () => {
    const message = 'Test error';
    const severity = ErrorSeverity.CRITICAL;
    const source = ErrorSource.AGENT;
    const originalError = new Error('Original error');
    const context = { test: 'context' };
    
    const error = errorHandling.createError(message, severity, source, originalError, context);
    
    expect(error).toEqual({
      message,
      severity,
      source,
      timestamp: expect.any(Date),
      originalError,
      context,
      handled: false,
      retryCount: 0
    });
  });

  test('registerHandler adds an error handler', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    errorHandling.registerHandler(ErrorSource.FRAMEWORK, handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.get(ErrorSource.FRAMEWORK)).toContain(handler);
  });

  test('unregisterHandler removes an error handler', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    errorHandling.registerHandler(ErrorSource.FRAMEWORK, handler);
    
    // Verify the handler was added
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.get(ErrorSource.FRAMEWORK)).toContain(handler);
    
    // Unregister the handler
    const result = errorHandling.unregisterHandler(ErrorSource.FRAMEWORK, handler);
    
    // Verify the handler was removed
    expect(result).toBe(true);
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.get(ErrorSource.FRAMEWORK)).not.toContain(handler);
  });

  test('handleError calls handlers for the error source', async () => {
    const handler = jest.fn().mockResolvedValue(true);
    errorHandling.registerHandler(ErrorSource.AGENT, handler);
    
    const error: AgentError = {
      message: 'Test error',
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.AGENT,
      timestamp: new Date(),
      handled: false,
      retryCount: 0
    };
    
    await errorHandling.handleError(error);
    
    expect(handler).toHaveBeenCalledWith(error);
    expect(error.handled).toBe(true);
    expect(mockEventBus.publish).toHaveBeenCalledWith('error:agent', error);
    expect(mockEventBus.publish).toHaveBeenCalledWith('error', error);
  });

  test('handleError calls framework handlers if no source handlers handle the error', async () => {
    const sourceHandler = jest.fn().mockResolvedValue(false);
    const frameworkHandler = jest.fn().mockResolvedValue(true);
    
    errorHandling.registerHandler(ErrorSource.AGENT, sourceHandler);
    errorHandling.registerHandler(ErrorSource.FRAMEWORK, frameworkHandler);
    
    const error: AgentError = {
      message: 'Test error',
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.AGENT,
      timestamp: new Date(),
      handled: false,
      retryCount: 0
    };
    
    await errorHandling.handleError(error);
    
    expect(sourceHandler).toHaveBeenCalledWith(error);
    expect(frameworkHandler).toHaveBeenCalledWith(error);
    expect(error.handled).toBe(true);
  });

  test('retry retries a function until it succeeds', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Attempt 1 failed'))
      .mockRejectedValueOnce(new Error('Attempt 2 failed'))
      .mockResolvedValueOnce('Success');
    
    const result = await errorHandling.retry(fn, {
      maxRetries: 3,
      initialDelay: 10,
      maxDelay: 100,
      backoffFactor: 2
    });
    
    expect(fn).toHaveBeenCalledTimes(3);
    expect(result).toBe('Success');
  });

  test('retry throws an error if all retries fail', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('All attempts failed'));
    
    await expect(errorHandling.retry(fn, {
      maxRetries: 2,
      initialDelay: 10,
      maxDelay: 100,
      backoffFactor: 2
    })).rejects.toThrow('All attempts failed');
    
    expect(fn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
  });

  test('setDefaultRetryOptions updates the default retry options', () => {
    const options = {
      maxRetries: 5,
      initialDelay: 20,
      maxDelay: 200,
      backoffFactor: 3
    };
    
    errorHandling.setDefaultRetryOptions(options);
    
    expect(errorHandling.getDefaultRetryOptions()).toEqual({
      maxRetries: 5,
      initialDelay: 20,
      maxDelay: 200,
      backoffFactor: 3,
      retryableErrors: [ErrorSeverity.WARNING, ErrorSeverity.ERROR]
    });
  });

  test('clear removes all error handlers', () => {
    errorHandling.registerHandler(ErrorSource.FRAMEWORK, jest.fn());
    errorHandling.registerHandler(ErrorSource.AGENT, jest.fn());
    
    errorHandling.clear();
    
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.size).toBe(0);
  });

  test('clearSource removes all error handlers for a specific source', () => {
    errorHandling.registerHandler(ErrorSource.FRAMEWORK, jest.fn());
    errorHandling.registerHandler(ErrorSource.AGENT, jest.fn());
    
    errorHandling.clearSource(ErrorSource.FRAMEWORK);
    
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.has(ErrorSource.FRAMEWORK)).toBe(false);
    // @ts-ignore - Accessing private property for testing
    expect(errorHandling.handlers.has(ErrorSource.AGENT)).toBe(true);
  });
});
