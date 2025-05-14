/**
 * CodeEnhancementMCPAdapter Tests
 */

import { CodeEnhancementMCPAdapter } from '../../src/adapters/CodeEnhancementMCPAdapter';
import { NexusClient } from '../../src/core/NexusClient';
import { EventBus } from '../../src/core/EventBus';
import { ErrorHandling } from '../../src/core/ErrorHandling';

// Mock the NexusClient
jest.mock('../../src/core/NexusClient', () => {
  return {
    NexusClient: jest.fn().mockImplementation(() => {
      return {
        callTool: jest.fn(),
        getServers: jest.fn().mockReturnValue(new Map([['code-enhancement', {}]]))
      };
    })
  };
});

// Mock the EventBus
jest.mock('../../src/core/EventBus', () => {
  return {
    EventBus: {
      getInstance: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
        publish: jest.fn()
      })
    }
  };
});

// Mock the ErrorHandling
jest.mock('../../src/core/ErrorHandling', () => {
  return {
    ErrorHandling: {
      getInstance: jest.fn().mockReturnValue({
        createError: jest.fn(),
        handleError: jest.fn()
      })
    },
    ErrorSeverity: {
      ERROR: 'error',
      WARNING: 'warning'
    },
    ErrorSource: {
      EXTERNAL: 'external'
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

describe('CodeEnhancementMCPAdapter', () => {
  let adapter: CodeEnhancementMCPAdapter;
  let mockNexusClient: jest.Mocked<NexusClient>;
  let mockEventBus: { subscribe: jest.Mock };
  let mockErrorHandling: { createError: jest.Mock, handleError: jest.Mock };

  beforeEach(() => {
    // Create a new adapter instance before each test
    mockNexusClient = new NexusClient() as jest.Mocked<NexusClient>;
    mockEventBus = EventBus.getInstance() as unknown as { subscribe: jest.Mock };
    mockErrorHandling = ErrorHandling.getInstance() as unknown as { createError: jest.Mock, handleError: jest.Mock };
    
    adapter = new CodeEnhancementMCPAdapter(mockNexusClient, {
      serverId: 'code-enhancement',
      defaultLanguage: 'typescript',
      defaultStyle: 'standard'
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('constructor initializes the adapter correctly', () => {
    expect(adapter).toBeDefined();
    expect(adapter.getServerId()).toBe('code-enhancement');
    expect(adapter.getDefaultLanguage()).toBe('typescript');
    expect(adapter.getDefaultStyle()).toBe('standard');
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('mcp-server-error', expect.any(Function));
  });

  test('initialize checks if the server is connected', async () => {
    // Mock getSupportedLanguages and getSupportedStyles
    mockNexusClient.callTool
      .mockResolvedValueOnce({ languages: ['javascript', 'typescript'] })
      .mockResolvedValueOnce({ styles: ['standard', 'google'] });
    
    await adapter.initialize();
    
    expect(mockNexusClient.getServers).toHaveBeenCalled();
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('get-supported-languages', {}, 'code-enhancement');
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('get-supported-styles', {}, 'code-enhancement');
    expect(adapter.getSupportedLanguagesSync()).toEqual(['javascript', 'typescript']);
    expect(adapter.getSupportedStylesSync()).toEqual(['standard', 'google']);
  });

  test('initialize throws an error if the server is not connected', async () => {
    // Mock getServers to return an empty map
    mockNexusClient.getServers.mockReturnValueOnce(new Map());
    
    await expect(adapter.initialize()).rejects.toThrow('Code Enhancement MCP server not found: code-enhancement');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
  });

  test('getSupportedLanguages calls the get-supported-languages tool', async () => {
    const mockLanguages = { languages: ['javascript', 'typescript', 'python'] };
    mockNexusClient.callTool.mockResolvedValueOnce(mockLanguages);
    
    const languages = await adapter.getSupportedLanguages();
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('get-supported-languages', {}, 'code-enhancement');
    expect(languages).toEqual(['javascript', 'typescript', 'python']);
  });

  test('getSupportedLanguages returns default languages on error', async () => {
    const mockError = new Error('Failed to get supported languages');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    const languages = await adapter.getSupportedLanguages();
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
    expect(languages).toEqual(expect.arrayContaining(['javascript', 'typescript', 'python']));
  });

  test('getSupportedStyles calls the get-supported-styles tool', async () => {
    const mockStyles = { styles: ['standard', 'google', 'airbnb'] };
    mockNexusClient.callTool.mockResolvedValueOnce(mockStyles);
    
    const styles = await adapter.getSupportedStyles();
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('get-supported-styles', {}, 'code-enhancement');
    expect(styles).toEqual(['standard', 'google', 'airbnb']);
  });

  test('getSupportedStyles returns default styles on error', async () => {
    const mockError = new Error('Failed to get supported styles');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    const styles = await adapter.getSupportedStyles();
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
    expect(styles).toEqual(expect.arrayContaining(['standard', 'google', 'airbnb']));
  });

  test('formatCode calls the format-code tool', async () => {
    const mockResult = { formattedCode: 'const x = 1;' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    const formattedCode = await adapter.formatCode('const x=1;', 'typescript', 'standard');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('format-code', {
      code: 'const x=1;',
      language: 'typescript',
      style: 'standard'
    }, 'code-enhancement');
    expect(formattedCode).toBe('const x = 1;');
  });

  test('formatCode returns original code on error', async () => {
    const mockError = new Error('Failed to format code');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    const formattedCode = await adapter.formatCode('const x=1;', 'typescript', 'standard');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
    expect(formattedCode).toBe('const x=1;');
  });

  test('analyzeCode calls the analyze-code tool', async () => {
    const mockResult = { issues: [{ message: 'Unused variable' }] };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    const analysis = await adapter.analyzeCode('const x = 1;', 'typescript');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('analyze-code', {
      code: 'const x = 1;',
      language: 'typescript'
    }, 'code-enhancement');
    expect(analysis).toEqual(mockResult);
  });

  test('analyzeCode returns empty analysis on error', async () => {
    const mockError = new Error('Failed to analyze code');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    const analysis = await adapter.analyzeCode('const x = 1;', 'typescript');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
    expect(analysis).toEqual({ issues: [] });
  });

  test('generateDocumentation calls the generate-documentation tool', async () => {
    const mockResult = { documentedCode: '/**\n * This is a variable\n */\nconst x = 1;' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    const documentedCode = await adapter.generateDocumentation('const x = 1;', 'typescript', 'standard');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('generate-documentation', {
      code: 'const x = 1;',
      language: 'typescript',
      style: 'standard'
    }, 'code-enhancement');
    expect(documentedCode).toBe('/**\n * This is a variable\n */\nconst x = 1;');
  });

  test('generateTests calls the generate-tests tool', async () => {
    const mockResult = { tests: 'test("x should be 1", () => { expect(x).toBe(1); });' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    const tests = await adapter.generateTests('const x = 1;', 'typescript', 'jest');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('generate-tests', {
      code: 'const x = 1;',
      language: 'typescript',
      framework: 'jest'
    }, 'code-enhancement');
    expect(tests).toBe('test("x should be 1", () => { expect(x).toBe(1); });');
  });

  test('refactorCode calls the refactor-code tool', async () => {
    const mockResult = { refactoredCode: 'const x = 1;' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    const refactoredCode = await adapter.refactorCode('var x = 1;', 'modernize', 'typescript');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('refactor-code', {
      code: 'var x = 1;',
      goal: 'modernize',
      language: 'typescript'
    }, 'code-enhancement');
    expect(refactoredCode).toBe('const x = 1;');
  });

  test('getters and setters work correctly', () => {
    adapter.setDefaultLanguage('javascript');
    expect(adapter.getDefaultLanguage()).toBe('javascript');
    
    adapter.setDefaultStyle('airbnb');
    expect(adapter.getDefaultStyle()).toBe('airbnb');
    
    adapter.setServerId('code-enhancement-2');
    expect(adapter.getServerId()).toBe('code-enhancement-2');
  });
});
