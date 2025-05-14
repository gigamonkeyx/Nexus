/**
 * OllamaMCPAdapter Tests
 */

import { OllamaMCPAdapter } from '../../src/adapters/OllamaMCPAdapter';
import { NexusClient } from '../../src/core/NexusClient';
import { EventBus } from '../../src/core/EventBus';
import { ErrorHandling } from '../../src/core/ErrorHandling';

// Mock the NexusClient
jest.mock('../../src/core/NexusClient', () => {
  return {
    NexusClient: jest.fn().mockImplementation(() => {
      return {
        callTool: jest.fn(),
        getServers: jest.fn().mockReturnValue(new Map([['ollama', {}]]))
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

describe('OllamaMCPAdapter', () => {
  let adapter: OllamaMCPAdapter;
  let mockNexusClient: jest.Mocked<NexusClient>;
  let mockEventBus: { subscribe: jest.Mock };
  let mockErrorHandling: { createError: jest.Mock, handleError: jest.Mock };

  beforeEach(() => {
    // Create a new adapter instance before each test
    mockNexusClient = new NexusClient() as jest.Mocked<NexusClient>;
    mockEventBus = EventBus.getInstance() as unknown as { subscribe: jest.Mock };
    mockErrorHandling = ErrorHandling.getInstance() as unknown as { createError: jest.Mock, handleError: jest.Mock };
    
    adapter = new OllamaMCPAdapter(mockNexusClient, {
      serverId: 'ollama',
      defaultModel: 'llama3'
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('constructor initializes the adapter correctly', () => {
    expect(adapter).toBeDefined();
    expect(adapter.getServerId()).toBe('ollama');
    expect(adapter.getDefaultModel()).toBe('llama3');
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('mcp-server-error', expect.any(Function));
  });

  test('initialize checks if the server is connected', async () => {
    await adapter.initialize();
    
    expect(mockNexusClient.getServers).toHaveBeenCalled();
  });

  test('initialize throws an error if the server is not connected', async () => {
    // Mock getServers to return an empty map
    mockNexusClient.getServers.mockReturnValueOnce(new Map());
    
    await expect(adapter.initialize()).rejects.toThrow('Ollama MCP server not found: ollama');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
  });

  test('getAvailableModels calls the ollama-list-models tool', async () => {
    const mockModels = { models: [{ name: 'llama3' }, { name: 'mistral' }] };
    mockNexusClient.callTool.mockResolvedValueOnce(mockModels);
    
    const models = await adapter.getAvailableModels();
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('ollama-list-models', {}, 'ollama');
    expect(models).toEqual(['llama3', 'mistral']);
  });

  test('getAvailableModels handles errors', async () => {
    const mockError = new Error('Failed to list models');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    await expect(adapter.getAvailableModels()).rejects.toThrow('Failed to list models');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
  });

  test('generateText calls the ollama-generate tool', async () => {
    const mockResponse = { response: 'Generated text' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResponse);
    
    const text = await adapter.generateText('Hello, world!', 'llama3', {
      temperature: 0.7,
      max_tokens: 100
    });
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('ollama-generate', {
      model: 'llama3',
      prompt: 'Hello, world!',
      options: {
        temperature: 0.7,
        max_tokens: 100
      }
    }, 'ollama');
    expect(text).toBe('Generated text');
  });

  test('generateText uses the default model if none is provided', async () => {
    const mockResponse = { response: 'Generated text' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResponse);
    
    await adapter.generateText('Hello, world!');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('ollama-generate', {
      model: 'llama3',
      prompt: 'Hello, world!',
      options: expect.any(Object)
    }, 'ollama');
  });

  test('generateText handles errors', async () => {
    const mockError = new Error('Failed to generate text');
    mockNexusClient.callTool.mockRejectedValueOnce(mockError);
    
    await expect(adapter.generateText('Hello, world!')).rejects.toThrow('Failed to generate text');
    
    expect(mockErrorHandling.createError).toHaveBeenCalled();
    expect(mockErrorHandling.handleError).toHaveBeenCalled();
  });

  test('generateCode creates a code-focused prompt', async () => {
    const mockResponse = { response: '```typescript\nfunction add(a: number, b: number): number {\n  return a + b;\n}\n```' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResponse);
    
    const code = await adapter.generateCode('Create a function that adds two numbers', 'typescript');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('ollama-generate', {
      model: 'llama3',
      prompt: expect.stringContaining('Generate typescript code for: Create a function that adds two numbers'),
      options: expect.objectContaining({
        temperature: 0.2
      })
    }, 'ollama');
    
    // Check that the code was cleaned up
    expect(code).not.toContain('```');
  });

  test('cleanCodeResponse removes markdown code blocks', () => {
    // @ts-ignore - Accessing private method for testing
    const cleanedCode = adapter.cleanCodeResponse('```typescript\nconst x = 1;\n```', 'typescript');
    expect(cleanedCode).toBe('const x = 1;');
  });

  test('getters and setters work correctly', () => {
    adapter.setDefaultModel('mistral');
    expect(adapter.getDefaultModel()).toBe('mistral');
    
    adapter.setServerId('ollama2');
    expect(adapter.getServerId()).toBe('ollama2');
    
    const modelConfig = { name: 'mistral', parameters: { temperature: 0.5 } };
    adapter.setModelConfig(modelConfig);
    expect(adapter.getModelConfig('mistral')).toEqual(modelConfig);
  });
});
