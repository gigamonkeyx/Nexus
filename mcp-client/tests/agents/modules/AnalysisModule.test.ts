/**
 * AnalysisModule Integration Tests
 */

import { AnalysisModule } from '../../../src/agents/modules/AnalysisModule';
import { ProgrammingLanguage } from '../../../src/agents/modules/CodingModule';
import { NexusClient } from '../../../src/core/NexusClient';
import { AdapterManager } from '../../../src/adapters/AdapterManager';
import { LucidityMCPAdapter, AnalysisDimension, AnalysisSeverity } from '../../../src/adapters/LucidityMCPAdapter';
import { EventBus } from '../../../src/core/EventBus';
import { ErrorHandling } from '../../../src/core/ErrorHandling';

// Mock the NexusClient
jest.mock('../../../src/core/NexusClient', () => {
  return {
    NexusClient: jest.fn().mockImplementation(() => {
      return {
        callTool: jest.fn(),
        getServers: jest.fn().mockReturnValue(new Map([
          ['lucidity', {}]
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
        getFirstLucidityAdapter: jest.fn(),
        getLucidityAdapter: jest.fn()
      };
    })
  };
});

// Mock the LucidityMCPAdapter
jest.mock('../../../src/adapters/LucidityMCPAdapter', () => {
  return {
    LucidityMCPAdapter: jest.fn().mockImplementation(() => {
      return {
        analyzeCode: jest.fn(),
        analyzeSecurityVulnerabilities: jest.fn(),
        analyzePerformance: jest.fn(),
        calculateComplexity: jest.fn(),
        analyzeChanges: jest.fn(),
        getServerId: jest.fn().mockReturnValue('lucidity')
      };
    }),
    AnalysisDimension: {
      COMPLEXITY: 'complexity',
      ABSTRACTIONS: 'abstractions',
      SECURITY: 'security',
      PERFORMANCE: 'performance',
      MAINTAINABILITY: 'maintainability',
      READABILITY: 'readability',
      ERROR_HANDLING: 'error_handling',
      DOCUMENTATION: 'documentation',
      TESTING: 'testing',
      ARCHITECTURE: 'architecture'
    },
    AnalysisSeverity: {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'critical'
    }
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

describe('AnalysisModule Integration', () => {
  let module: AnalysisModule;
  let mockNexusClient: jest.Mocked<NexusClient>;
  let mockAdapterManager: jest.Mocked<AdapterManager>;
  let mockLucidityAdapter: jest.Mocked<LucidityMCPAdapter>;
  let mockEventBus: { subscribe: jest.Mock };
  let mockErrorHandling: { createError: jest.Mock, handleError: jest.Mock };

  beforeEach(() => {
    // Create mock instances
    mockNexusClient = new NexusClient() as jest.Mocked<NexusClient>;
    mockAdapterManager = new AdapterManager(mockNexusClient) as jest.Mocked<AdapterManager>;
    mockLucidityAdapter = new LucidityMCPAdapter(mockNexusClient, {}) as jest.Mocked<LucidityMCPAdapter>;
    mockEventBus = EventBus.getInstance() as unknown as { subscribe: jest.Mock };
    mockErrorHandling = ErrorHandling.getInstance() as unknown as { createError: jest.Mock, handleError: jest.Mock };
    
    // Set up adapter manager to return our mock adapter
    mockAdapterManager.getFirstLucidityAdapter.mockReturnValue(mockLucidityAdapter);
    
    // Create a new module instance
    module = new AnalysisModule(mockNexusClient, mockAdapterManager, ProgrammingLanguage.TYPESCRIPT);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('initialize sets up adapters and event handlers', async () => {
    await module.initialize();
    
    expect(mockAdapterManager.getFirstLucidityAdapter).toHaveBeenCalled();
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('adapter:added', expect.any(Function));
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('adapter:removed', expect.any(Function));
  });

  test('analyzeCode uses Lucidity adapter if available', async () => {
    const mockCode = 'function add(a: number, b: number): number { return a + b; }';
    const mockAnalysisResult = {
      issues: [{ message: 'Function is too simple', severity: 'info' }],
      summary: { complexity: 1 },
      overallScore: 95,
      metrics: { cyclomaticComplexity: 1 }
    };
    mockLucidityAdapter.analyzeCode.mockResolvedValueOnce(mockAnalysisResult);
    
    await module.initialize();
    
    const result = await module.analyzeCode(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY],
      { minSeverity: AnalysisSeverity.INFO }
    );
    
    expect(mockLucidityAdapter.analyzeCode).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      {
        dimensions: [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY],
        minSeverity: AnalysisSeverity.INFO,
        includeSuggestions: true,
        includeMetrics: true,
        contextLines: 3
      }
    );
    expect(result).toBe(mockAnalysisResult);
  });

  test('analyzeCode falls back to direct MCP call if no adapter is available', async () => {
    // Set up adapter manager to return null for adapters
    mockAdapterManager.getFirstLucidityAdapter.mockReturnValueOnce(undefined);
    
    const mockCode = 'function add(a: number, b: number): number { return a + b; }';
    const mockAnalysisResult = {
      issues: [{ message: 'Function is too simple', severity: 'info' }],
      summary: { complexity: 1 },
      overallScore: 95,
      metrics: { cyclomaticComplexity: 1 }
    };
    mockNexusClient.callTool.mockResolvedValueOnce(mockAnalysisResult);
    
    await module.initialize();
    
    const result = await module.analyzeCode(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY],
      { minSeverity: AnalysisSeverity.INFO }
    );
    
    expect(mockNexusClient.callTool).toHaveBeenCalledWith('analyze-code', {
      code: mockCode,
      language: ProgrammingLanguage.TYPESCRIPT,
      dimensions: [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY],
      minSeverity: AnalysisSeverity.INFO,
      includeSuggestions: true,
      includeMetrics: true,
      contextLines: 3
    });
    expect(result).toBe(mockAnalysisResult);
  });

  test('analyzeSecurityVulnerabilities uses Lucidity adapter if available', async () => {
    const mockCode = 'const password = "hardcoded";';
    const mockSecurityResult = {
      vulnerabilities: [{ message: 'Hardcoded password', severity: 'critical' }],
      summary: { high: 0, medium: 0, low: 0, critical: 1 }
    };
    mockLucidityAdapter.analyzeSecurityVulnerabilities.mockResolvedValueOnce(mockSecurityResult);
    
    await module.initialize();
    
    const result = await module.analyzeSecurityVulnerabilities(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      { minSeverity: AnalysisSeverity.WARNING }
    );
    
    expect(mockLucidityAdapter.analyzeSecurityVulnerabilities).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT
    );
    expect(result).toBe(mockSecurityResult);
  });

  test('analyzePerformance uses Lucidity adapter if available', async () => {
    const mockCode = 'for (let i = 0; i < array.length; i++) { /* ... */ }';
    const mockPerformanceResult = {
      issues: [{ message: 'Cache array length outside loop', severity: 'warning' }],
      metrics: { loopEfficiency: 0.7 }
    };
    mockLucidityAdapter.analyzePerformance.mockResolvedValueOnce(mockPerformanceResult);
    
    await module.initialize();
    
    const result = await module.analyzePerformance(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      { includeHotspots: true }
    );
    
    expect(mockLucidityAdapter.analyzePerformance).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT
    );
    expect(result).toBe(mockPerformanceResult);
  });

  test('calculateComplexity uses Lucidity adapter if available', async () => {
    const mockCode = 'function complex() { if (a) { if (b) { while (c) { /* ... */ } } } }';
    const mockComplexityResult = {
      cyclomaticComplexity: 4,
      cognitiveComplexity: 6,
      maintainabilityIndex: 65,
      linesOfCode: 1,
      functions: 1,
      classes: 0
    };
    mockLucidityAdapter.calculateComplexity.mockResolvedValueOnce(mockComplexityResult);
    
    await module.initialize();
    
    const result = await module.calculateComplexity(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      { includeVisualization: true }
    );
    
    expect(mockLucidityAdapter.calculateComplexity).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT
    );
    expect(result).toBe(mockComplexityResult);
  });

  test('analyzeChanges uses Lucidity adapter if available', async () => {
    const mockOriginalCode = 'function add(a, b) { return a + b; }';
    const mockNewCode = 'function add(a: number, b: number): number { return a + b; }';
    const mockChangesResult = {
      changes: [{ type: 'added', content: 'Type annotations' }],
      impact: { complexity: 0, maintainability: 1 },
      summary: 'Added type annotations'
    };
    mockLucidityAdapter.analyzeChanges.mockResolvedValueOnce(mockChangesResult);
    
    await module.initialize();
    
    const result = await module.analyzeChanges(
      mockOriginalCode,
      mockNewCode,
      ProgrammingLanguage.TYPESCRIPT,
      { includeVisualization: true }
    );
    
    expect(mockLucidityAdapter.analyzeChanges).toHaveBeenCalledWith(
      mockOriginalCode,
      mockNewCode,
      ProgrammingLanguage.TYPESCRIPT
    );
    expect(result).toBe(mockChangesResult);
  });

  test('getters and setters work correctly', () => {
    expect(module.getDefaultLanguage()).toBe(ProgrammingLanguage.TYPESCRIPT);
    
    module.setDefaultLanguage(ProgrammingLanguage.JAVASCRIPT);
    expect(module.getDefaultLanguage()).toBe(ProgrammingLanguage.JAVASCRIPT);
  });
});
