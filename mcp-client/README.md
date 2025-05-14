# Nexus MCP Client

An LLM-compatible client for MCP servers in the Nexus Hub, with specialized adapters for Ollama and ComfyUI integration.

## Overview

The Nexus MCP Client provides a unified interface for LLMs to interact with specialized MCP servers. It enables AI agents to leverage the capabilities of various MCP servers through a consistent API. The client includes specialized adapters for Ollama and ComfyUI servers, making it easy to leverage their unique capabilities.

## Architecture

The client follows the standard MCP architecture:

1. **Client Core**: Handles communication with MCP servers using the protocol
2. **Transport Layer**: Supports both HTTP/SSE and stdio transports
3. **LLM Integration Layer**: Adapts MCP tools for use with different LLM providers
4. **Agent Framework**: Orchestrates tool usage across multiple servers

## Key Components

### Core Client Library

The core client library handles the fundamental communication with MCP servers:

- **Server Connection Management**: Connect to and manage multiple MCP servers
- **Tool Discovery**: Discover and register tools from connected servers
- **Tool Execution**: Execute tools on appropriate servers
- **Transport Abstraction**: Support different transport mechanisms (stdio, HTTP/SSE)

### LLM Integration Layer

The LLM integration layer adapts MCP tools for use with different LLM providers:

- **Tool Format Conversion**: Convert MCP tool definitions to LLM-specific formats
- **Response Processing**: Handle LLM responses and tool calls
- **Context Management**: Maintain conversation context across multiple interactions

### Server Manager

The server manager handles the registration and monitoring of MCP servers:

- **Server Registration**: Register server configurations
- **Health Monitoring**: Monitor server health and status
- **Automatic Reconnection**: Reconnect to servers when connections are lost

### Agent Framework

The agent framework provides a structure for building AI agents that use MCP tools:

- **Task Planning**: Plan and execute complex tasks
- **Tool Selection**: Select appropriate tools for tasks
- **Result Evaluation**: Evaluate tool results and determine next steps

### Specialized Adapters

The client includes specialized adapters for different MCP server types:

#### Ollama Adapter

The Ollama adapter provides specialized methods for interacting with Ollama MCP servers:

- `getModels()`: Get available models
- `generateText(model, prompt, options)`: Generate text
- `chatCompletion(model, messages, options)`: Generate a chat completion
- `createEmbedding(model, text)`: Create embeddings
- `pullModel(model)`: Pull a model from the Ollama library

#### ComfyUI Adapter

The ComfyUI adapter provides specialized methods for interacting with ComfyUI MCP servers:

- `getModels()`: Get available models
- `generateImageFromText(prompt, options)`: Generate an image from text
- `generateImageFromImage(image_url, prompt, options)`: Generate an image from another image
- `upscaleImage(image_url, options)`: Upscale an image
- `inpaintImage(image_url, mask_url, prompt, options)`: Inpaint an image
- `applyStyleTransfer(image_url, style_prompt, options)`: Apply a style transfer
- `importWorkflowFromUrl(url, name, metadata)`: Import a workflow from a URL

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Usage with Agent Framework

```typescript
import { NexusClient, ServerManager, ClaudeAdapter, AgentFramework } from 'nexus-mcp-client';

// Create a NexusClient instance
const nexusClient = new NexusClient();

// Create a ServerManager instance
const serverManager = new ServerManager(nexusClient);

// Register servers
serverManager.registerServer('comfyui', {
  type: 'stdio',
  command: 'node',
  args: ['D:/mcp/comfyui-mcp/index.js']
});

serverManager.registerServer('supabase', {
  type: 'stdio',
  command: 'node',
  args: ['D:/mcp/supabase-mcp/index.js']
});

// Connect to all registered servers
await serverManager.connectAll();

// Create a Claude adapter
const claudeAdapter = new ClaudeAdapter(nexusClient, {
  provider: 'anthropic',
  apiKey: 'your-api-key',
  model: 'claude-3-5-sonnet-20241022'
});

// Create an agent framework
const agentFramework = new AgentFramework(nexusClient, claudeAdapter);

// Create an agent
const agent = agentFramework.createAgent({
  name: 'research-agent',
  description: 'Agent for research tasks',
  llm: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022'
  }
});

// Execute a task
const result = await agent.executeTask('Generate an image of a sunset and store it in the database');
console.log(result.text);
```

### Using Specialized Adapters

```typescript
import { NexusClient, AdapterManager } from 'nexus-mcp-client';

// Create a client and adapter manager
const client = new NexusClient();
const adapterManager = new AdapterManager(client);

// Connect to an Ollama MCP server
const ollamaAdapter = await adapterManager.createAdapter('ollama', {
  type: 'sse',
  url: 'http://localhost:3011/sse'
});

// Use the Ollama adapter
const models = await ollamaAdapter.getModels();
console.log(`Available models: ${models.map(model => model.name).join(', ')}`);

// Generate text with Ollama
const textResult = await ollamaAdapter.generateText('llama3', 'Explain the Model Context Protocol in simple terms.');
console.log(`Generated text: ${textResult.generated_text}`);

// Connect to a ComfyUI MCP server
const comfyuiAdapter = await adapterManager.createAdapter('comfyui', {
  type: 'sse',
  url: 'http://localhost:3020/sse'
});

// Generate an image with ComfyUI
const imageResult = await comfyuiAdapter.generateImageFromText('A beautiful landscape with mountains and a lake', {
  width: 768,
  height: 512
});
console.log(`Generated image: ${imageResult.image_url}`);

// Combined usage example
const description = await ollamaAdapter.generateText('llama3', 'Describe a fantasy landscape with a castle.');
const image = await comfyuiAdapter.generateImageFromText(description.generated_text);
console.log(`Generated image from description: ${image.image_url}`);
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Lint the code
npm run lint
```

## License

MIT
