# Coding Agent

The Coding Agent is a specialized agent that connects to MCP servers to provide powerful coding capabilities. It can generate, analyze, and manage code across multiple programming languages.

## Architecture

The Coding Agent is built on a modular architecture with the following components:

### Core Components

- **EventBus**: Provides inter-module communication with support for one-time event handlers
- **ErrorHandling**: Provides centralized error handling with retry mechanisms and fallback strategies
- **BaseAdapter**: Provides a base class for all adapters with common functionality

### MCP Server Adapters

- **OllamaMCPAdapter**: Provides access to Ollama's local LLM capabilities for code generation
- **CodeEnhancementMCPAdapter**: Provides code formatting, analysis, and documentation generation
- **GitHubMCPAdapter**: Provides GitHub integration for repository operations and PR management
- **LucidityMCPAdapter**: Provides code quality analysis across multiple dimensions

### Specialized Modules

- **CodingModule**: Provides code generation, refactoring, and formatting capabilities
- **AnalysisModule**: Provides code quality analysis and security vulnerability scanning
- **VersionControlModule**: Provides GitHub integration for repository operations and PR management

### Agent Implementation

- **CodingAgent**: Integrates all components and provides a unified interface for coding tasks
- **ClaudeAdapter**: Provides access to Claude API for natural language processing

## Features

The Coding Agent provides the following features:

### Code Generation

- Generate code based on natural language descriptions
- Support for multiple programming languages
- Customizable code generation options (comments, tests, style)

### Code Analysis

- Analyze code quality across multiple dimensions
- Detect security vulnerabilities
- Analyze performance issues
- Calculate code complexity
- Analyze code changes

### Code Refactoring

- Refactor code for different goals (performance, readability, maintainability)
- Preserve comments and formatting during refactoring
- Apply code style guidelines

### Documentation Generation

- Generate documentation for code
- Support for different documentation styles
- Include examples, types, returns, and parameters

### Test Generation

- Generate tests for code
- Support for different test frameworks
- Include edge cases and mocks

### Version Control

- Create and manage GitHub repositories
- Create branches and pull requests
- Create and manage issues

## Usage

Here's an example of how to use the Coding Agent:

```typescript
import { NexusClient } from '../src/core/NexusClient';
import { AdapterManager } from '../src/adapters/AdapterManager';
import { ClaudeAdapter } from '../src/agents/ClaudeAdapter';
import { CodingAgent } from '../src/agents/CodingAgent';
import { ProgrammingLanguage } from '../src/agents/modules/CodingModule';
import { AnalysisDimension } from '../src/agents/modules/AnalysisModule';

// Create NexusClient
const nexusClient = new NexusClient();

// Register servers
nexusClient.registerServer('ollama', {
  type: 'sse',
  url: 'http://localhost:3011/sse'
});

nexusClient.registerServer('code-enhancement', {
  type: 'sse',
  url: 'http://localhost:3020/sse'
});

// Connect to servers
await nexusClient.connectServer('ollama');
await nexusClient.connectServer('code-enhancement');

// Create AdapterManager
const adapterManager = new AdapterManager(nexusClient);

// Create adapters
const ollamaAdapter = await adapterManager.createAdapter('ollama', {
  type: 'sse',
  url: 'http://localhost:3011/sse'
});

// Create ClaudeAdapter
const claudeAdapter = new ClaudeAdapter({
  provider: 'anthropic',
  model: 'claude-3-sonnet-20240229-v1:0',
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key'
});

// Create CodingAgent
const codingAgent = new CodingAgent(
  nexusClient,
  adapterManager,
  claudeAdapter,
  {
    name: 'Code Wizard',
    description: 'A coding agent that can generate, analyze, and manage code',
    llm: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229-v1:0'
    },
    ollamaAdapter: ollamaAdapter,
    enhancementServerUrl: 'http://localhost:3020',
    lucidityServerUrl: 'http://localhost:3021',
    githubServerUrl: 'http://localhost:3022',
    defaultLanguage: ProgrammingLanguage.TYPESCRIPT,
    defaultOwner: 'your-github-username',
    maxConcurrentTasks: 3
  }
);

// Initialize the coding agent
await codingAgent.initialize();

// Generate code
const codeResult = await codingAgent.generateCode(
  'Create a utility function that formats a date in various formats (ISO, US, EU) with timezone support',
  ProgrammingLanguage.TYPESCRIPT,
  {
    includeComments: true,
    includeTests: true,
    style: 'verbose'
  }
);

// Analyze code
const analysisResult = await codingAgent.analyzeCode(
  codeResult.code,
  ProgrammingLanguage.TYPESCRIPT,
  [
    AnalysisDimension.COMPLEXITY,
    AnalysisDimension.MAINTAINABILITY,
    AnalysisDimension.PERFORMANCE
  ]
);

// Refactor code
const refactoredResult = await codingAgent.refactorCode(
  codeResult.code,
  'performance',
  {
    preserveComments: true
  }
);

// Generate tests
const testsResult = await codingAgent.generateTests(
  refactoredResult.code,
  ProgrammingLanguage.TYPESCRIPT,
  'jest'
);
```

## MCP Server Requirements

The Coding Agent requires the following MCP servers:

- **Ollama MCP Server**: For code generation using local LLMs
- **Code Enhancement MCP Server**: For code formatting, analysis, and documentation generation
- **Lucidity MCP Server**: For code quality analysis
- **GitHub MCP Server**: For GitHub integration

## Testing

The Coding Agent includes comprehensive tests for all components:

- Unit tests for core components and adapters
- Integration tests for modules
- End-to-end tests for the agent

You can run the tests using the following command:

```bash
npm test
```

## Future Enhancements

Planned enhancements for the Coding Agent include:

- Support for more programming languages
- Integration with more MCP servers
- Enhanced code generation capabilities
- Improved code analysis
- Better GitHub integration
- Support for other version control systems
