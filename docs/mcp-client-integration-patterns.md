# MCP Client Integration Patterns

This document describes the key integration patterns used in the Nexus MCP client for integrating with Ollama and ComfyUI MCP servers.

## 1. Adapter Pattern

The Adapter Pattern is used to create specialized adapters for different MCP server types. This allows the client to interact with each server type in a way that leverages its unique capabilities while maintaining a consistent interface.

### Implementation

- `AdapterManager`: Manages specialized adapters for different server types
- `OllamaAdapter`: Specialized adapter for Ollama MCP servers
- `ComfyUIAdapter`: Specialized adapter for ComfyUI MCP servers

### Benefits

- Encapsulates server-specific logic
- Provides a more intuitive API for each server type
- Allows for specialized error handling and optimizations

### Example

```typescript
// Create adapter manager
const adapterManager = new AdapterManager(nexusClient);

// Create specialized adapter
const ollamaAdapter = await adapterManager.createAdapter('ollama', {
  type: 'sse',
  url: 'http://localhost:3011/sse'
});

// Use specialized methods
const result = await ollamaAdapter.generateText('llama3', 'Hello, world!');
```

## 2. Abstraction Pattern

The Abstraction Pattern is used to identify and abstract common integration patterns across different server types. This allows the client to provide a consistent interface for common operations while still allowing for specialized functionality.

### Implementation

- Common interfaces for similar operations
- Shared utility functions
- Consistent error handling

### Benefits

- Reduces code duplication
- Provides a consistent experience for common operations
- Makes it easier to add new server types

### Example

```typescript
// Both adapters implement getModels()
const ollamaModels = await ollamaAdapter.getModels();
const comfyuiModels = await comfyuiAdapter.getModels();
```

## 3. Discovery Pattern

The Discovery Pattern is used to automatically discover and connect to available MCP servers. This allows the client to dynamically adapt to the available servers without requiring manual configuration.

### Implementation

- Server type detection based on server info
- Automatic tool discovery
- Dynamic adapter creation

### Benefits

- Reduces manual configuration
- Adapts to available servers
- Enables plug-and-play functionality

### Example

```typescript
// Detect server type
const serverType = adapterManager.detectServerType(serverInfo);

// Create appropriate adapter
const adapter = await adapterManager.createAdapter(serverId, serverConfig);
```

## 4. Registry Pattern

The Registry Pattern is used to maintain a registry of available tools from all connected servers. This allows the client to provide a unified interface for discovering and calling tools across multiple servers.

### Implementation

- Tool registry in NexusClient
- Tool discovery and registration
- Tool lookup and execution

### Benefits

- Centralizes tool management
- Simplifies tool discovery and usage
- Enables cross-server tool orchestration

### Example

```typescript
// Discover tools from all servers
await nexusClient.discoverTools('ollama');
await nexusClient.discoverTools('comfyui');

// Get all available tools
const tools = nexusClient.getTools();
```

## 5. Model Management Pattern

The Model Management Pattern is used to handle model discovery, pulling, and optimization. This allows the client to efficiently manage models across different servers.

### Implementation

- Model caching in adapters
- Model discovery and pulling
- Model-specific parameter optimization

### Benefits

- Reduces redundant model loading
- Optimizes model usage
- Simplifies model management

### Example

```typescript
// Cache models
await ollamaAdapter.cacheModels();

// Get available models
const models = await ollamaAdapter.getModels();

// Pull a new model
await ollamaAdapter.pullModel('llama3');
```

## 6. Workflow Management Pattern

The Workflow Management Pattern is used to support workflow discovery, import, and execution. This allows the client to work with complex workflows, particularly in ComfyUI.

### Implementation

- Workflow import and export
- Workflow execution
- Workflow templates

### Benefits

- Enables complex operations
- Supports reusable workflows
- Simplifies workflow management

### Example

```typescript
// Import a workflow
await comfyuiAdapter.importWorkflowFromUrl('https://example.com/workflow.json', 'my-workflow');

// Execute a workflow
const result = await comfyuiAdapter.executeWorkflow('my-workflow', { prompt: 'A beautiful landscape' });
```

## 7. Parameter Handling Pattern

The Parameter Handling Pattern is used to normalize and validate parameters between the client and server. This ensures that parameters are correctly formatted and validated before being sent to the server.

### Implementation

- Parameter normalization
- Parameter validation
- Default parameter handling

### Benefits

- Reduces errors from invalid parameters
- Provides sensible defaults
- Handles complex parameter types

### Example

```typescript
// Parameter normalization and validation
const result = await comfyuiAdapter.generateImageFromText(prompt, {
  width: options.width || 512,
  height: options.height || 512,
  model: options.model || 'sd_xl_base_1.0.safetensors',
  steps: options.steps || 30,
  cfg: options.cfg || 7.5,
  sampler: options.sampler || 'euler_ancestral',
  seed: options.seed || Math.floor(Math.random() * 2147483647)
});
```

## 8. Asset Management Pattern

The Asset Management Pattern is used to handle assets like generated images. This allows the client to manage assets across different servers and provide a consistent interface for working with them.

### Implementation

- Asset storage and retrieval
- Asset metadata management
- Asset transformation

### Benefits

- Centralizes asset management
- Simplifies asset handling
- Enables cross-server asset usage

### Example

```typescript
// Generate an image
const imageResult = await comfyuiAdapter.generateImageFromText('A beautiful landscape');

// Use the image in another operation
const upscaledResult = await comfyuiAdapter.upscaleImage(imageResult.image_url);
```

## 9. Combined Usage Pattern

The Combined Usage Pattern is used to combine the capabilities of multiple servers to perform complex tasks. This allows the client to leverage the strengths of each server type in a unified workflow.

### Implementation

- Cross-server orchestration
- Result passing between servers
- Unified error handling

### Benefits

- Enables complex workflows
- Leverages the strengths of each server
- Provides a unified experience

### Example

```typescript
// Generate a description with Ollama
const description = await ollamaAdapter.generateText('llama3', 'Describe a fantasy landscape with a castle.');

// Generate an image based on the description with ComfyUI
const image = await comfyuiAdapter.generateImageFromText(description.generated_text);

// Generate a story about the image with Ollama
const story = await ollamaAdapter.generateText('llama3', `Write a short story about this image: ${description.generated_text}`);
```

## Conclusion

These integration patterns provide a solid foundation for building a flexible and powerful MCP client that can leverage the unique capabilities of different MCP servers. By implementing these patterns, the Nexus MCP client can provide a unified interface for working with Ollama and ComfyUI servers while still allowing for specialized functionality.
