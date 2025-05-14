# Coding Agent Tests

This directory contains tests for the Coding Agent implementation. The tests are organized into the following categories:

## Core Tests

Tests for core components of the Coding Agent:

- `EventBus.test.ts`: Tests for the event bus that provides inter-module communication
- `ErrorHandling.test.ts`: Tests for the centralized error handling system

## Adapter Tests

Tests for adapters that connect to MCP servers:

- `OllamaMCPAdapter.test.ts`: Tests for the Ollama MCP adapter
- `CodeEnhancementMCPAdapter.test.ts`: Tests for the Code Enhancement MCP adapter
- `GitHubMCPAdapter.test.ts`: Tests for the GitHub MCP adapter
- `LucidityMCPAdapter.test.ts`: Tests for the Lucidity MCP adapter

## Module Tests

Tests for specialized modules of the Coding Agent:

- `CodingModule.test.ts`: Tests for the module that handles code generation, refactoring, and formatting
- `AnalysisModule.test.ts`: Tests for the module that handles code analysis and quality assessment
- `VersionControlModule.test.ts`: Tests for the module that handles version control operations

## Agent Tests

Tests for the Coding Agent itself:

- `CodingAgent.test.ts`: End-to-end tests for the Coding Agent
- `ClaudeAdapter.test.ts`: Tests for the Claude API adapter

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test categories
npm run test:core
npm run test:adapters
npm run test:modules
npm run test:agents

# Run all tests with detailed output
npm run test:all
```

## Test Coverage

The tests aim to achieve at least 80% code coverage for the Coding Agent implementation. You can view the coverage report by running:

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage` directory.

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place the test file in the appropriate directory based on what it's testing
2. Name the test file with the `.test.ts` extension
3. Use descriptive test names that clearly indicate what's being tested
4. Mock external dependencies to isolate the code being tested
5. Test both success and failure cases
6. Test edge cases and boundary conditions

## Test Setup

The `setup.js` file contains global setup code that runs before each test. It includes:

- Increased timeout for all tests
- Mocked console methods to reduce noise during tests
- Custom matchers for more expressive assertions
- Global beforeEach and afterEach hooks for test setup and teardown

## Jest Configuration

The Jest configuration is defined in `jest.config.js` in the root directory. It includes:

- TypeScript support via ts-jest
- Test matching pattern
- Coverage collection and reporting
- Test timeout settings
- Setup files configuration
