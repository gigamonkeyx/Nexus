# MCP Integration Guide

This guide explains how to integrate the Minimal Agent Factory with Model Context Protocol (MCP) servers.

## Table of Contents

1. [Introduction](#introduction)
2. [MCP Overview](#mcp-overview)
3. [Supported MCP Servers](#supported-mcp-servers)
4. [Connecting to MCP Servers](#connecting-to-mcp-servers)
5. [Using MCP Adapters](#using-mcp-adapters)
6. [Creating Custom Adapters](#creating-custom-adapters)
7. [MCP Server Configuration](#mcp-server-configuration)
8. [Troubleshooting](#troubleshooting)

## Introduction

The Model Context Protocol (MCP) is a standardized protocol for interacting with AI models and services. It provides a consistent interface for sending requests to and receiving responses from different AI models and services.

The Minimal Agent Factory integrates with MCP servers to provide agents with access to a wide range of AI capabilities, including:

- Text generation
- Code generation
- Image generation
- Embedding generation
- Benchmarking
- And more

## MCP Overview

### What is MCP?

The Model Context Protocol (MCP) is a protocol for interacting with AI models and services. It defines a standard way to:

- Send requests to AI models
- Receive responses from AI models
- Stream responses from AI models
- Manage context and state
- Handle errors and exceptions

### Why Use MCP?

MCP provides several benefits:

- **Standardization**: Provides a consistent interface for different AI models and services
- **Interoperability**: Allows different components to work together seamlessly
- **Flexibility**: Supports a wide range of AI capabilities and use cases
- **Scalability**: Enables distributed and scalable AI systems
- **Extensibility**: Can be extended to support new AI capabilities and use cases

## Supported MCP Servers

The Minimal Agent Factory supports the following MCP servers:

### Ollama MCP

- **Description**: Provides access to Ollama models for text generation, code generation, and embedding generation
- **Port**: 3011
- **Capabilities**: Text generation, code generation, embedding generation
- **Models**: Llama, Mistral, Phi, and more

### Code Enhancement MCP

- **Description**: Provides code enhancement capabilities, including code generation, refactoring, and analysis
- **Port**: 3020
- **Capabilities**: Code generation, code refactoring, code analysis
- **Models**: CodeLlama, StarCoder, and more

### Lucidity MCP

- **Description**: Provides reasoning and planning capabilities
- **Port**: 3021
- **Capabilities**: Reasoning, planning, problem-solving
- **Models**: Llama, Claude, and more

### Benchmark MCP

- **Description**: Provides benchmarking capabilities for evaluating agent performance
- **Port**: 8020
- **Capabilities**: HumanEval, τ-Bench, and custom benchmarks
- **Models**: N/A (uses other models for evaluation)

## Connecting to MCP Servers

### Using NexusClient

The `NexusClient` class provides methods for connecting to MCP servers:

```javascript
const nexusClient = new NexusClient();

// Register a server
nexusClient.registerServer('ollama', {
  type: 'sse',
  url: 'http://localhost:3011/sse'
});

// Connect to the server
await nexusClient.connectServer('ollama');

// Check if connected
const isConnected = nexusClient.isServerConnected('ollama');
```

### Connection Options

The `registerServer` method accepts the following options:

- **type**: The type of connection ('sse' for Server-Sent Events)
- **url**: The URL of the MCP server
- **headers**: Optional headers to include in the request
- **reconnect**: Whether to automatically reconnect if the connection is lost (default: true)
- **reconnectInterval**: The interval in milliseconds between reconnection attempts (default: 5000)
- **maxReconnectAttempts**: The maximum number of reconnection attempts (default: 10)

### Handling Connection Events

The `NexusClient` emits events when the connection status changes:

```javascript
nexusClient.on('connected', (serverId) => {
  console.log(`Connected to ${serverId}`);
});

nexusClient.on('disconnected', (serverId) => {
  console.log(`Disconnected from ${serverId}`);
});

nexusClient.on('reconnecting', (serverId, attempt) => {
  console.log(`Reconnecting to ${serverId} (attempt ${attempt})`);
});

nexusClient.on('error', (serverId, error) => {
  console.error(`Error with ${serverId}: ${error.message}`);
});
```

## Using MCP Adapters

### AdapterManager

The `AdapterManager` class provides a unified interface for interacting with MCP servers:

```javascript
const adapterManager = new AdapterManager(nexusClient);

// Get an adapter for a specific server
const ollamaAdapter = adapterManager.getAdapter('ollama');

// Get the first adapter of a specific type
const ollamaMCPAdapter = adapterManager.getFirstOllamaMCPAdapter();
const codeEnhancementMCPAdapter = adapterManager.getFirstCodeEnhancementMCPAdapter();
const lucidityMCPAdapter = adapterManager.getFirstLucidityMCPAdapter();
const benchmarkMCPAdapter = adapterManager.getFirstBenchmarkAdapter();
```

### OllamaMCPAdapter

The `OllamaMCPAdapter` provides methods for interacting with Ollama models:

```javascript
// Generate text
const text = await ollamaMCPAdapter.generateText(
  'What is the capital of France?',
  'llama3',
  {
    temperature: 0.7,
    max_tokens: 100
  }
);

// Generate code
const code = await ollamaMCPAdapter.generateCode(
  'Write a function to calculate the factorial of a number',
  'javascript',
  {
    temperature: 0.3,
    max_tokens: 200
  }
);

// Generate embeddings
const embeddings = await ollamaMCPAdapter.generateEmbeddings(
  'This is a test sentence',
  'llama3'
);
```

### CodeEnhancementMCPAdapter

The `CodeEnhancementMCPAdapter` provides methods for enhancing code:

```javascript
// Generate code
const code = await codeEnhancementMCPAdapter.generateCode(
  'Write a function to calculate the factorial of a number',
  'javascript',
  {
    temperature: 0.3,
    max_tokens: 200
  }
);

// Refactor code
const refactoredCode = await codeEnhancementMCPAdapter.refactorCode(
  'function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }',
  'javascript',
  'Improve performance by using iteration instead of recursion'
);

// Analyze code
const analysis = await codeEnhancementMCPAdapter.analyzeCode(
  'function factorial(n) { if (n <= 1) return 1; return n * factorial(n - 1); }',
  'javascript'
);
```

### LucidityMCPAdapter

The `LucidityMCPAdapter` provides methods for reasoning and planning:

```javascript
// Reason about a problem
const reasoning = await lucidityMCPAdapter.reason(
  'If it takes 5 hours to drive 300 miles, how long will it take to drive 500 miles at the same speed?'
);

// Create a plan
const plan = await lucidityMCPAdapter.createPlan(
  'How to build a website',
  {
    steps: 5,
    format: 'markdown'
  }
);

// Solve a problem
const solution = await lucidityMCPAdapter.solveProblem(
  'Find the value of x in the equation 2x + 5 = 15'
);
```

### BenchmarkMCPAdapter

The `BenchmarkMCPAdapter` provides methods for benchmarking agents:

```javascript
// Run a benchmark
const result = await benchmarkMCPAdapter.runBenchmark(
  'humaneval',
  agentId,
  {
    maxProblems: 10,
    timeout: 60000
  }
);

// Compare benchmark results
const comparison = await benchmarkMCPAdapter.compareBenchmarkResults(
  result1,
  result2
);

// Get progress report
const progressReport = await benchmarkMCPAdapter.getProgressReport(agentId);
```

## Creating Custom Adapters

You can create custom adapters for new MCP servers by extending the base adapter classes:

```typescript
import { BaseMCPAdapter, NexusClient } from 'bootstrap-core';

export class CustomMCPAdapter extends BaseMCPAdapter {
  constructor(nexusClient: NexusClient, serverId: string) {
    super(nexusClient, serverId);
  }
  
  // Implement custom methods
  public async customMethod(input: string): Promise<string> {
    // Send a request to the MCP server
    const response = await this.sendRequest({
      type: 'custom',
      input
    });
    
    // Process the response
    return response.output;
  }
}
```

Then register the adapter with the `AdapterManager`:

```typescript
// Create a custom adapter factory
adapterManager.registerAdapterFactory('custom', (nexusClient, serverId) => {
  return new CustomMCPAdapter(nexusClient, serverId);
});
```

## MCP Server Configuration

### Ollama MCP

The Ollama MCP server requires Ollama to be installed and running. It connects to the Ollama API to provide access to Ollama models.

Configuration options:

- **port**: The port to listen on (default: 3011)
- **ollamaUrl**: The URL of the Ollama API (default: http://localhost:11434)
- **models**: The models to make available (default: all models)

### Code Enhancement MCP

The Code Enhancement MCP server provides code enhancement capabilities using various models.

Configuration options:

- **port**: The port to listen on (default: 3020)
- **models**: The models to make available (default: all models)
- **ollamaUrl**: The URL of the Ollama API (default: http://localhost:11434)

### Lucidity MCP

The Lucidity MCP server provides reasoning and planning capabilities using various models.

Configuration options:

- **port**: The port to listen on (default: 3021)
- **models**: The models to make available (default: all models)
- **ollamaUrl**: The URL of the Ollama API (default: http://localhost:11434)

### Benchmark MCP

The Benchmark MCP server provides benchmarking capabilities for evaluating agent performance.

Configuration options:

- **port**: The port to listen on (default: 8020)
- **benchmarks**: The benchmarks to make available (default: all benchmarks)
- **resultsPath**: The path to store benchmark results (default: ./benchmark-results)

## Troubleshooting

### Connection Issues

If you have trouble connecting to an MCP server:

1. Make sure the server is running
2. Check the server URL and port
3. Check for any firewall or network issues
4. Check the server logs for errors

### Adapter Issues

If you have trouble using an adapter:

1. Make sure the server is connected
2. Check the adapter configuration
3. Check the server logs for errors
4. Try using a different adapter or server

### Model Issues

If you have trouble with a specific model:

1. Make sure the model is available on the server
2. Check the model configuration
3. Try using a different model
4. Check the server logs for errors
