/**
 * CodingModule Integration Tests
 */

import { CodingModule, ProgrammingLanguage } from '../../../src/agents/modules/CodingModule';
import { NexusClient } from '../../../src/core/NexusClient';
import { AdapterManager } from '../../../src/adapters/AdapterManager';
import { OllamaMCPAdapter } from '../../../src/adapters/OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from '../../../src/adapters/CodeEnhancementMCPAdapter';
import { EventBus } from '../../../src/core/EventBus';
import { ErrorHandling } from '../../../src/core/ErrorHandling';

// Mock the NexusClient
jest.mock('../../../src/core/NexusClient', () => {
  return {
    NexusClient: jest.fn().mockImplementation(() => {
      return {
        callTool: jest.fn(),
        getServers: jest.fn().mockReturnValue(new Map([
          ['ollama', {}],
          ['code-enhancement', {}]
        ]))
      };
    })
  };
});

// Mock the AdapterManager
jest.mock('../../../src/adapters/AdapterManager', () => {
  return {
    AdapterManager: jest.fn().mockImplementation(() => {
      return {
        getFirstOllamaMCPAdapter: jest.fn(),
        getFirstCodeEnhancementAdapter: jest.fn(),
        getOllamaMCPAdapter: jest.fn(),
        getCodeEnhancementAdapter: jest.fn()
      };
    })
  };
});

// Mock the OllamaMCPAdapter
jest.mock('../../../src/adapters/OllamaMCPAdapter', () => {
  return {
    OllamaMCPAdapter: jest.fn().mockImplementation(() => {
      return {
        generateCode: jest.fn(),
        getServerId: jest.fn().mockReturnValue('ollama')
      };
    })
  };
});

// Mock the CodeEnhancementMCPAdapter
jest.mock('../../../src/adapters/CodeEnhancementMCPAdapter', () => {
  return {
    CodeEnhancementMCPAdapter: jest.fn().mockImplementation(() => {
      return {
        formatCode: jest.fn(),
        refactorCode: jest.fn(),
        generateDocumentation: jest.fn(),
        generateTests: jest.fn(),
        getServerId: jest.fn().mockReturnValue('code-enhancement')
      };
    })
  };
});

// Mock the EventBus
jest.mock('../../../src/core/EventBus', () => {
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
jest.mock('../../../src/core/ErrorHandling', () => {
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
      MODULE: 'module'
    }
  };
});

// Mock the logger
jest.mock('../../../src/utils/logger', () => {
  return {
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  };
});

describe('CodingModule Integration', () => {
  let module: CodingModule;
  let mockNexusClient: jest.Mocked<NexusClient>;
  let mockAdapterManager: jest.Mocked<AdapterManager>;
  let mockOllamaAdapter: jest.Mocked<OllamaMCPAdapter>;
  let mockCodeEnhancementAdapter: jest.Mocked<CodeEnhancementMCPAdapter>;
  let mockEventBus: { subscribe: jest.Mock };
  let mockErrorHandling: { createError: jest.Mock, handleError: jest.Mock };

  beforeEach(() => {
    // Create mock instances
    mockNexusClient = new NexusClient() as jest.Mocked<NexusClient>;
    mockAdapterManager = new AdapterManager(mockNexusClient) as jest.Mocked<AdapterManager>;
    mockOllamaAdapter = new OllamaMCPAdapter(mockNexusClient, {}) as jest.Mocked<OllamaMCPAdapter>;
    mockCodeEnhancementAdapter = new CodeEnhancementMCPAdapter(mockNexusClient, {}) as jest.Mocked<CodeEnhancementMCPAdapter>;
    mockEventBus = EventBus.getInstance() as unknown as { subscribe: jest.Mock };
    mockErrorHandling = ErrorHandling.getInstance() as unknown as { createError: jest.Mock, handleError: jest.Mock };
    
    // Set up adapter manager to return our mock adapters
    mockAdapterManager.getFirstOllamaMCPAdapter.mockReturnValue(mockOllamaAdapter);
    mockAdapterManager.getFirstCodeEnhancementAdapter.mockReturnValue(mockCodeEnhancementAdapter);
    
    // Create a new module instance
    module = new CodingModule(mockNexusClient, mockAdapterManager, ProgrammingLanguage.TYPESCRIPT);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('initialize sets up adapters and event handlers', async () => {
    await module.initialize();
    
    expect(mockAdapterManager.getFirstOllamaMCPAdapter).toHaveBeenCalled();
    expect(mockAdapterManager.getFirstCodeEnhancementAdapter).toHaveBeenCalled();
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('adapter:added', expect.any(Function));
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('adapter:removed', expect.any(Function));
  });

  test('generateCode uses Ollama adapter if available', async () => {
    const mockCode = 'function add(a: number, b: number): number { return a + b; }';
    mockOllamaAdapter.generateCode.mockResolvedValueOnce(mockCode);
    mockCodeEnhancementAdapter.formatCode.mockResolvedValueOnce(mockCode);
    
    await module.initialize();
    
    const code = await module.generateCode(
      'Create a function that adds two numbers',
      ProgrammingLanguage.TYPESCRIPT,
      { includeComments: true }
    );
    
    expect(mockOllamaAdapter.generateCode).toHaveBeenCalledWith(
      expect.stringContaining('Create a function that adds two numbers'),
      ProgrammingLanguage.TYPESCRIPT,
      undefined,
      expect.objectContaining({ temperature: 0.2 })
    );
    expect(mockCodeEnhancementAdapter.formatCode).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      undefined
    );
    expect(code).toBe(mockCode);
  });

  test('generateCode falls back to direct MCP call if no adapter is available', async () => {
    // Set up adapter manager to return null for adapters
    mockAdapterManager.getFirstOllamaMCPAdapter.mockReturnValueOnce(undefined);
    
    const mockResult = { code: 'function add(a: number, b: number): number { return a + b; }' };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    await module.initialize();
    
    const code = await module.generateCode(
      'Create a function that adds two numbers',
      ProgrammingLanguage.TYPESCRIPT,
      { includeComments: true }
    );
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('generate-code', {
      description: 'Create a function that adds two numbers',
      language: ProgrammingLanguage.TYPESCRIPT,
      includeComments: true,
      includeTests: false,
      style: 'standard'
    });
    expect(code).toBe(mockResult.code);
  });

  test('refactorCode uses code enhancement adapter if available', async () => {
    const mockCode = 'var x = 1;';
    const mockRefactoredCode = 'const x = 1;';
    mockCodeEnhancementAdapter.refactorCode.mockResolvedValueOnce(mockRefactoredCode);
    
    await module.initialize();
    
    const refactoredCode = await module.refactorCode(mockCode, 'modernize', {
      preserveComments: true
    });
    
    expect(mockCodeEnhancementAdapter.refactorCode).toHaveBeenCalledWith(
      mockCode,
      'modernize'
    );
    expect(refactoredCode).toBe(mockRefactoredCode);
  });

  test('formatCode uses code enhancement adapter if available', async () => {
    const mockCode = 'const x=1;';
    const mockFormattedCode = 'const x = 1;';
    mockCodeEnhancementAdapter.formatCode.mockResolvedValueOnce(mockFormattedCode);
    
    await module.initialize();
    
    const formattedCode = await module.formatCode(mockCode, ProgrammingLanguage.TYPESCRIPT, {
      style: 'standard'
    });
    
    expect(mockCodeEnhancementAdapter.formatCode).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      'standard'
    );
    expect(formattedCode).toBe(mockFormattedCode);
  });

  test('generateDocumentation uses code enhancement adapter if available', async () => {
    const mockCode = 'function add(a, b) { return a + b; }';
    const mockDocumentedCode = '/**\n * Adds two numbers\n * @param {number} a First number\n * @param {number} b Second number\n * @returns {number} Sum of a and b\n */\nfunction add(a, b) { return a + b; }';
    mockCodeEnhancementAdapter.generateDocumentation.mockResolvedValueOnce(mockDocumentedCode);
    
    await module.initialize();
    
    const documentedCode = await module.generateDocumentation(mockCode, ProgrammingLanguage.JAVASCRIPT, {
      style: 'jsdoc'
    });
    
    expect(mockCodeEnhancementAdapter.generateDocumentation).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.JAVASCRIPT,
      'jsdoc'
    );
    expect(documentedCode).toBe(mockDocumentedCode);
  });

  test('generateTests uses code enhancement adapter if available', async () => {
    const mockCode = 'function add(a, b) { return a + b; }';
    const mockTests = 'test("add should correctly add two numbers", () => { expect(add(1, 2)).toBe(3); });';
    mockCodeEnhancementAdapter.generateTests.mockResolvedValueOnce(mockTests);
    
    await module.initialize();
    
    const tests = await module.generateTests(mockCode, ProgrammingLanguage.JAVASCRIPT, 'jest');
    
    expect(mockCodeEnhancementAdapter.generateTests).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.JAVASCRIPT,
      'jest'
    );
    expect(tests).toBe(mockTests);
  });

  test('detectLanguage calls the detect-language tool', async () => {
    const mockResult = { language: ProgrammingLanguage.TYPESCRIPT };
    mockNexusClient.callTool.mockResolvedValueOnce(mockResult);
    
    await module.initialize();
    
    const language = await module.detectLanguage('const x: number = 1;');
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('detect-language', {
      code: 'const x: number = 1;'
    }, expect.any(String));
    expect(language).toBe(ProgrammingLanguage.TYPESCRIPT);
  });

  test('getters and setters work correctly', () => {
    expect(module.getDefaultLanguage()).toBe(ProgrammingLanguage.TYPESCRIPT);
    
    module.setDefaultLanguage(ProgrammingLanguage.JAVASCRIPT);
    expect(module.getDefaultLanguage()).toBe(ProgrammingLanguage.JAVASCRIPT);
  });
});
