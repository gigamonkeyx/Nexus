/**
 * CodingAgent End-to-End Tests
 */

import { CodingAgent, LLMProvider, TaskPriority } from '../../src/agents/CodingAgent';
import { ClaudeAdapter } from '../../src/agents/ClaudeAdapter';
import { ProgrammingLanguage } from '../../src/agents/modules/CodingModule';
import { AnalysisDimension } from '../../src/agents/modules/AnalysisModule';
import { NexusClient } from '../../src/core/NexusClient';
import { AdapterManager } from '../../src/adapters/AdapterManager';
import { OllamaMCPAdapter } from '../../src/adapters/OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from '../../src/adapters/CodeEnhancementMCPAdapter';
import { GitHubMCPAdapter } from '../../src/adapters/GitHubMCPAdapter';
import { LucidityMCPAdapter } from '../../src/adapters/LucidityMCPAdapter';
import { EventBus } from '../../src/core/EventBus';
import { ErrorHandling } from '../../src/core/ErrorHandling';

// Mock the NexusClient
jest.mock('../../src/core/NexusClient', () => {
  return {
    NexusClient: jest.fn().mockImplementation(() => {
      return {
        callTool: jest.fn(),
        getServers: jest.fn().mockReturnValue(new Map([
          ['ollama', {}],
          ['code-enhancement', {}],
          ['lucidity', {}],
          ['github', {}]
        ]))
      };
    })
  };
});

// Mock the AdapterManager
jest.mock('../../src/adapters/AdapterManager', () => {
  return {
    AdapterManager: jest.fn().mockImplementation(() => {
      return {
        getFirstOllamaMCPAdapter: jest.fn(),
        getFirstCodeEnhancementAdapter: jest.fn(),
        getFirstLucidityAdapter: jest.fn(),
        getFirstGitHubAdapter: jest.fn(),
        getOllamaMCPAdapter: jest.fn(),
        getCodeEnhancementAdapter: jest.fn(),
        getLucidityAdapter: jest.fn(),
        getGitHubAdapter: jest.fn()
      };
    })
  };
});

// Mock the ClaudeAdapter
jest.mock('../../src/agents/ClaudeAdapter', () => {
  return {
    ClaudeAdapter: jest.fn().mockImplementation(() => {
      return {
        generateText: jest.fn(),
        generateChatResponse: jest.fn(),
        getConfig: jest.fn().mockReturnValue({
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229-v1:0'
        }),
        updateConfig: jest.fn(),
        getModel: jest.fn().mockReturnValue('claude-3-sonnet-20240229-v1:0'),
        setModel: jest.fn()
      };
    }),
    MessageRole: {
      USER: 'user',
      ASSISTANT: 'assistant',
      SYSTEM: 'system'
    }
  };
});

// Mock the modules
jest.mock('../../src/agents/modules/CodingModule', () => {
  return {
    CodingModule: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn(),
        generateCode: jest.fn(),
        refactorCode: jest.fn(),
        formatCode: jest.fn(),
        generateDocumentation: jest.fn(),
        generateTests: jest.fn(),
        detectLanguage: jest.fn(),
        getDefaultLanguage: jest.fn().mockReturnValue('typescript'),
        setDefaultLanguage: jest.fn()
      };
    }),
    ProgrammingLanguage: {
      JAVASCRIPT: 'javascript',
      TYPESCRIPT: 'typescript',
      PYTHON: 'python',
      JAVA: 'java',
      CSHARP: 'csharp',
      GO: 'go',
      RUBY: 'ruby',
      PHP: 'php',
      RUST: 'rust',
      CPP: 'cpp'
    }
  };
});

jest.mock('../../src/agents/modules/AnalysisModule', () => {
  return {
    AnalysisModule: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn(),
        analyzeCode: jest.fn(),
        analyzeSecurityVulnerabilities: jest.fn(),
        analyzePerformance: jest.fn(),
        calculateComplexity: jest.fn(),
        analyzeChanges: jest.fn(),
        getDefaultLanguage: jest.fn().mockReturnValue('typescript'),
        setDefaultLanguage: jest.fn()
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
    }
  };
});

jest.mock('../../src/agents/modules/VersionControlModule', () => {
  return {
    VersionControlModule: jest.fn().mockImplementation(() => {
      return {
        initialize: jest.fn(),
        createRepository: jest.fn(),
        getRepositories: jest.fn(),
        createBranch: jest.fn(),
        getBranches: jest.fn(),
        createPullRequest: jest.fn(),
        getPullRequests: jest.fn(),
        createIssue: jest.fn(),
        getIssues: jest.fn(),
        getDefaultOwner: jest.fn().mockReturnValue('gigamonkeyx'),
        setDefaultOwner: jest.fn(),
        getDefaultRepo: jest.fn().mockReturnValue(''),
        setDefaultRepo: jest.fn()
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
      AGENT: 'agent'
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

describe('CodingAgent End-to-End', () => {
  let agent: CodingAgent;
  let mockNexusClient: jest.Mocked<NexusClient>;
  let mockAdapterManager: jest.Mocked<AdapterManager>;
  let mockClaudeAdapter: jest.Mocked<ClaudeAdapter>;
  let mockEventBus: { subscribe: jest.Mock };
  let mockErrorHandling: { createError: jest.Mock, handleError: jest.Mock };

  beforeEach(() => {
    // Create mock instances
    mockNexusClient = new NexusClient() as jest.Mocked<NexusClient>;
    mockAdapterManager = new AdapterManager(mockNexusClient) as jest.Mocked<AdapterManager>;
    mockClaudeAdapter = new ClaudeAdapter({
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229-v1:0',
      apiKey: 'test-api-key'
    }) as jest.Mocked<ClaudeAdapter>;
    mockEventBus = EventBus.getInstance() as unknown as { subscribe: jest.Mock };
    mockErrorHandling = ErrorHandling.getInstance() as unknown as { createError: jest.Mock, handleError: jest.Mock };
    
    // Create a new agent instance
    agent = new CodingAgent(
      mockNexusClient,
      mockAdapterManager,
      mockClaudeAdapter,
      {
        name: 'Test Coding Agent',
        description: 'A test coding agent',
        llm: {
          provider: LLMProvider.ANTHROPIC,
          model: 'claude-3-sonnet-20240229-v1:0'
        },
        defaultLanguage: ProgrammingLanguage.TYPESCRIPT,
        defaultOwner: 'gigamonkeyx',
        maxConcurrentTasks: 3
      }
    );
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  test('initialize sets up modules and event handlers', async () => {
    await agent.initialize();
    
    // Check that modules were initialized
    // @ts-ignore - Accessing private property for testing
    expect(agent.codingModule.initialize).toHaveBeenCalled();
    // @ts-ignore - Accessing private property for testing
    expect(agent.analysisModule.initialize).toHaveBeenCalled();
    // @ts-ignore - Accessing private property for testing
    expect(agent.versionControlModule.initialize).toHaveBeenCalled();
    
    // Check that event handlers were registered
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('task:completed', expect.any(Function));
    expect(mockEventBus.subscribe).toHaveBeenCalledWith('task:failed', expect.any(Function));
  });

  test('generateCode delegates to CodingModule', async () => {
    const mockCode = 'function add(a: number, b: number): number { return a + b; }';
    // @ts-ignore - Accessing private property for testing
    agent.codingModule = {
      generateCode: jest.fn().mockResolvedValue(mockCode)
    };
    
    await agent.initialize();
    
    const result = await agent.generateCode(
      'Create a function that adds two numbers',
      ProgrammingLanguage.TYPESCRIPT,
      { includeComments: true }
    );
    
    // @ts-ignore - Accessing private property for testing
    expect(agent.codingModule.generateCode).toHaveBeenCalledWith(
      'Create a function that adds two numbers',
      ProgrammingLanguage.TYPESCRIPT,
      { includeComments: true }
    );
    expect(result).toEqual({
      code: mockCode,
      language: ProgrammingLanguage.TYPESCRIPT
    });
  });

  test('analyzeCode delegates to AnalysisModule', async () => {
    const mockAnalysisResult = {
      issues: [{ message: 'Function is too simple', severity: 'info' }],
      summary: { complexity: 1 },
      overallScore: 95,
      metrics: { cyclomaticComplexity: 1 }
    };
    // @ts-ignore - Accessing private property for testing
    agent.analysisModule = {
      analyzeCode: jest.fn().mockResolvedValue(mockAnalysisResult)
    };
    
    await agent.initialize();
    
    const result = await agent.analyzeCode(
      'function add(a: number, b: number): number { return a + b; }',
      ProgrammingLanguage.TYPESCRIPT,
      [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY]
    );
    
    // @ts-ignore - Accessing private property for testing
    expect(agent.analysisModule.analyzeCode).toHaveBeenCalledWith(
      'function add(a: number, b: number): number { return a + b; }',
      ProgrammingLanguage.TYPESCRIPT,
      [AnalysisDimension.COMPLEXITY, AnalysisDimension.MAINTAINABILITY]
    );
    expect(result).toBe(mockAnalysisResult);
  });

  test('refactorCode delegates to CodingModule', async () => {
    const mockCode = 'var x = 1;';
    const mockRefactoredCode = 'const x = 1;';
    // @ts-ignore - Accessing private property for testing
    agent.codingModule = {
      refactorCode: jest.fn().mockResolvedValue(mockRefactoredCode)
    };
    
    await agent.initialize();
    
    const result = await agent.refactorCode(
      mockCode,
      'modernize',
      { preserveComments: true }
    );
    
    // @ts-ignore - Accessing private property for testing
    expect(agent.codingModule.refactorCode).toHaveBeenCalledWith(
      mockCode,
      'modernize',
      { preserveComments: true }
    );
    expect(result).toEqual({
      code: mockRefactoredCode,
      goal: 'modernize'
    });
  });

  test('generateTests delegates to CodingModule', async () => {
    const mockCode = 'function add(a: number, b: number): number { return a + b; }';
    const mockTests = 'test("add should correctly add two numbers", () => { expect(add(1, 2)).toBe(3); });';
    // @ts-ignore - Accessing private property for testing
    agent.codingModule = {
      generateTests: jest.fn().mockResolvedValue(mockTests)
    };
    
    await agent.initialize();
    
    const result = await agent.generateTests(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      'jest'
    );
    
    // @ts-ignore - Accessing private property for testing
    expect(agent.codingModule.generateTests).toHaveBeenCalledWith(
      mockCode,
      ProgrammingLanguage.TYPESCRIPT,
      'jest'
    );
    expect(result).toEqual({
      tests: mockTests,
      language: ProgrammingLanguage.TYPESCRIPT,
      framework: 'jest'
    });
  });

  test('createPullRequest delegates to VersionControlModule', async () => {
    const mockPullRequest = {
      number: 1,
      html_url: 'https://github.com/gigamonkeyx/test-repo/pull/1',
      title: 'Test PR',
      body: 'This is a test PR',
      head: 'feature-branch',
      base: 'main'
    };
    // @ts-ignore - Accessing private property for testing
    agent.versionControlModule = {
      createPullRequest: jest.fn().mockResolvedValue(mockPullRequest)
    };
    
    await agent.initialize();
    
    const result = await agent.createPullRequest(
      'gigamonkeyx',
      'test-repo',
      'Test PR',
      'This is a test PR',
      'feature-branch',
      'main'
    );
    
    // @ts-ignore - Accessing private property for testing
    expect(agent.versionControlModule.createPullRequest).toHaveBeenCalledWith(
      'test-repo',
      {
        title: 'Test PR',
        body: 'This is a test PR',
        head: 'feature-branch',
        base: 'main'
      },
      'gigamonkeyx'
    );
    expect(result).toBe(mockPullRequest);
  });

  test('executeTask creates and processes a task', async () => {
    // Mock the task execution
    // @ts-ignore - Accessing private method for testing
    jest.spyOn(agent, 'createTask').mockImplementation((description, priority) => {
      const taskId = 'test-task-id';
      // @ts-ignore - Accessing private property for testing
      agent.tasks = new Map();
      // @ts-ignore - Accessing private property for testing
      agent.tasks.set(taskId, {
        id: taskId,
        description,
        status: 'pending',
        priority: priority || TaskPriority.MEDIUM,
        createdAt: new Date()
      });
      
      // Simulate task completion
      setTimeout(() => {
        // @ts-ignore - Accessing private property for testing
        const task = agent.tasks.get(taskId);
        task.status = 'completed';
        task.completedAt = new Date();
        task.result = { message: 'Task completed successfully' };
      }, 10);
      
      return taskId;
    });
    
    await agent.initialize();
    
    const result = await agent.executeTask(
      'Create a React component',
      TaskPriority.HIGH
    );
    
    // @ts-ignore - Accessing private method for testing
    expect(agent.createTask).toHaveBeenCalledWith(
      'Create a React component',
      TaskPriority.HIGH
    );
    expect(result).toEqual({ message: 'Task completed successfully' });
  });

  test('getters and setters work correctly', () => {
    expect(agent.getName()).toBe('Test Coding Agent');
    expect(agent.getDescription()).toBe('A test coding agent');
    expect(agent.getLLMConfig()).toEqual({
      provider: LLMProvider.ANTHROPIC,
      model: 'claude-3-sonnet-20240229-v1:0'
    });
    expect(agent.getDefaultLanguage()).toBe(ProgrammingLanguage.TYPESCRIPT);
    expect(agent.getDefaultOwner()).toBe('gigamonkeyx');
    
    agent.setDefaultLanguage(ProgrammingLanguage.JAVASCRIPT);
    expect(agent.getDefaultLanguage()).toBe(ProgrammingLanguage.JAVASCRIPT);
    
    agent.setDefaultOwner('new-owner');
    expect(agent.getDefaultOwner()).toBe('new-owner');
  });
});
