# API Reference

## Introduction

The Nexus MCP Hub provides a comprehensive REST API for managing servers, agents, tasks, and other resources. This reference documents all available endpoints, request/response formats, and authentication methods.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/api
```

For production deployments, replace `localhost:3000` with your server's domain and port.

## Authentication

### Authentication Methods

The API supports two authentication methods:

1. **API Key**: Simple key-based authentication
2. **JWT**: Token-based authentication with claims

### API Key Authentication

To authenticate using an API key, include the key in the `X-API-Key` header:

```
X-API-Key: your-api-key
```

### JWT Authentication

To authenticate using JWT, include the token in the `Authorization` header:

```
Authorization: Bearer your-jwt-token
```

### Obtaining a JWT Token

To obtain a JWT token, use the login endpoint:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your-username",
  "password": "your-password"
}
```

Response:

```json
{
  "token": "your-jwt-token",
  "expiresIn": 3600
}
```

## Error Handling

All API errors follow a standard format:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message",
    "details": {
      "additional": "error details"
    }
  }
}
```

Common error codes:

- `unauthorized`: Authentication failed
- `forbidden`: Insufficient permissions
- `not_found`: Resource not found
- `validation_error`: Invalid request parameters
- `server_error`: Internal server error

## Rate Limiting

The API implements rate limiting to prevent abuse. Rate limits are specified in the response headers:

- `X-RateLimit-Limit`: Maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time (in seconds) until the rate limit resets

When a rate limit is exceeded, the API returns a `429 Too Many Requests` status code.

## Endpoints

### MCP Servers

#### List MCP Servers

```http
GET /api/mcp-servers
```

Response:

```json
{
  "servers": [
    {
      "id": "ollama-mcp",
      "name": "Ollama MCP",
      "description": "Language model inference through Ollama",
      "url": "http://localhost",
      "port": 3011,
      "transport": "http",
      "status": "active",
      "capabilities": ["text-generation", "code-generation"],
      "lastActive": "2023-06-18T14:30:00Z"
    },
    {
      "id": "comfyui-mcp",
      "name": "ComfyUI MCP",
      "description": "Image generation and editing",
      "url": "http://localhost",
      "port": 3020,
      "transport": "http",
      "status": "active",
      "capabilities": ["image-generation", "image-editing"],
      "lastActive": "2023-06-18T15:45:00Z"
    }
  ]
}
```

#### Get MCP Server

```http
GET /api/mcp-servers/{serverId}
```

Response:

```json
{
  "id": "ollama-mcp",
  "name": "Ollama MCP",
  "description": "Language model inference through Ollama",
  "url": "http://localhost",
  "port": 3011,
  "transport": "http",
  "status": "active",
  "capabilities": ["text-generation", "code-generation"],
  "lastActive": "2023-06-18T14:30:00Z",
  "metrics": {
    "requestCount": 1250,
    "averageResponseTime": 450,
    "errorRate": 0.02
  },
  "tools": [
    {
      "name": "generate",
      "description": "Generate text using a language model",
      "parameters": {
        "type": "object",
        "properties": {
          "prompt": {
            "type": "string",
            "description": "The prompt to generate text from"
          },
          "model": {
            "type": "string",
            "description": "The model to use for generation"
          }
        },
        "required": ["prompt"]
      }
    }
  ]
}
```

#### Register MCP Server

```http
POST /api/mcp-servers
Content-Type: application/json

{
  "id": "my-mcp-server",
  "name": "My MCP Server",
  "description": "Custom MCP server implementation",
  "url": "http://localhost",
  "port": 3025,
  "transport": "http",
  "capabilities": ["custom-capability-1", "custom-capability-2"],
  "tools": [
    {
      "name": "custom-tool",
      "description": "A custom tool",
      "parameters": {
        "type": "object",
        "properties": {
          "param1": {
            "type": "string",
            "description": "Parameter description"
          }
        },
        "required": ["param1"]
      }
    }
  ]
}
```

Response:

```json
{
  "id": "my-mcp-server",
  "name": "My MCP Server",
  "status": "registered"
}
```

#### Update MCP Server

```http
PUT /api/mcp-servers/{serverId}
Content-Type: application/json

{
  "name": "Updated MCP Server",
  "description": "Updated description",
  "capabilities": ["updated-capability-1", "updated-capability-2"]
}
```

Response:

```json
{
  "id": "my-mcp-server",
  "name": "Updated MCP Server",
  "status": "updated"
}
```

#### Delete MCP Server

```http
DELETE /api/mcp-servers/{serverId}
```

Response:

```json
{
  "id": "my-mcp-server",
  "status": "deleted"
}
```

### Agents

#### List Agents

```http
GET /api/agents
```

Response:

```json
{
  "agents": [
    {
      "id": "code-assistant",
      "name": "CodeAssistant",
      "description": "Advanced coding agent for software development tasks",
      "type": "coding",
      "model": "claude-3-sonnet",
      "status": "active",
      "mcpServers": ["ollama-mcp"],
      "capabilities": ["code-generation", "code-review", "code-explanation"]
    },
    {
      "id": "librarian",
      "name": "Librarian",
      "description": "Research agent for information retrieval and analysis",
      "type": "research",
      "model": "claude-3-opus",
      "status": "active",
      "mcpServers": ["supabase-mcp", "terminal-mcp"],
      "capabilities": ["web-search", "document-retrieval", "document-summarization"]
    }
  ]
}
```

#### Get Agent

```http
GET /api/agents/{agentId}
```

Response:

```json
{
  "id": "code-assistant",
  "name": "CodeAssistant",
  "description": "Advanced coding agent for software development tasks",
  "type": "coding",
  "model": "claude-3-sonnet",
  "status": "active",
  "mcpServers": ["ollama-mcp"],
  "capabilities": ["code-generation", "code-review", "code-explanation"],
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 8192,
    "topP": 0.95
  },
  "metrics": {
    "taskCount": 850,
    "averageResponseTime": 2300,
    "successRate": 0.98
  },
  "benchmarks": {
    "humanEval": 78.5,
    "codeXGLUE": 72.3,
    "mbpp": 81.2
  }
}
```

#### Create Agent

```http
POST /api/agents
Content-Type: application/json

{
  "id": "my-agent",
  "name": "My Agent",
  "description": "Custom agent for specific tasks",
  "type": "custom",
  "model": "claude-3-sonnet",
  "mcpServers": ["ollama-mcp", "terminal-mcp"],
  "capabilities": ["custom-capability-1", "custom-capability-2"],
  "parameters": {
    "temperature": 0.8,
    "maxTokens": 4096,
    "topP": 0.9
  }
}
```

Response:

```json
{
  "id": "my-agent",
  "name": "My Agent",
  "status": "created"
}
```

#### Update Agent

```http
PUT /api/agents/{agentId}
Content-Type: application/json

{
  "name": "Updated Agent",
  "description": "Updated description",
  "mcpServers": ["ollama-mcp", "comfyui-mcp"],
  "parameters": {
    "temperature": 0.6
  }
}
```

Response:

```json
{
  "id": "my-agent",
  "name": "Updated Agent",
  "status": "updated"
}
```

#### Delete Agent

```http
DELETE /api/agents/{agentId}
```

Response:

```json
{
  "id": "my-agent",
  "status": "deleted"
}
```

### Tasks

#### List Tasks

```http
GET /api/tasks
```

Response:

```json
{
  "tasks": [
    {
      "id": "task-123",
      "agentId": "code-assistant",
      "status": "completed",
      "createdAt": "2023-06-18T14:30:00Z",
      "completedAt": "2023-06-18T14:32:00Z",
      "input": "Generate a function to calculate Fibonacci numbers"
    },
    {
      "id": "task-124",
      "agentId": "librarian",
      "status": "in_progress",
      "createdAt": "2023-06-18T15:00:00Z",
      "input": "Research recent advances in quantum computing"
    }
  ]
}
```

#### Get Task

```http
GET /api/tasks/{taskId}
```

Response:

```json
{
  "id": "task-123",
  "agentId": "code-assistant",
  "status": "completed",
  "createdAt": "2023-06-18T14:30:00Z",
  "completedAt": "2023-06-18T14:32:00Z",
  "input": "Generate a function to calculate Fibonacci numbers",
  "output": "```javascript\nfunction fibonacci(n) {\n  if (n <= 0) return [];\n  if (n === 1) return [0];\n  if (n === 2) return [0, 1];\n  \n  const result = [0, 1];\n  for (let i = 2; i < n; i++) {\n    result.push(result[i-1] + result[i-2]);\n  }\n  \n  return result;\n}\n```",
  "metrics": {
    "processingTime": 2000,
    "tokenCount": 150,
    "toolCalls": 3
  }
}
```

#### Create Task

```http
POST /api/tasks
Content-Type: application/json

{
  "agentId": "code-assistant",
  "input": "Generate a function to calculate prime numbers",
  "parameters": {
    "priority": "high",
    "timeout": 30000
  }
}
```

Response:

```json
{
  "id": "task-125",
  "agentId": "code-assistant",
  "status": "created"
}
```

#### Cancel Task

```http
POST /api/tasks/{taskId}/cancel
```

Response:

```json
{
  "id": "task-125",
  "status": "cancelled"
}
```

### Users

#### List Users

```http
GET /api/users
```

Response:

```json
{
  "users": [
    {
      "id": "user-1",
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2023-01-01T00:00:00Z"
    },
    {
      "id": "user-2",
      "username": "user",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2023-01-02T00:00:00Z"
    }
  ]
}
```

#### Get User

```http
GET /api/users/{userId}
```

Response:

```json
{
  "id": "user-1",
  "username": "admin",
  "email": "admin@example.com",
  "role": "admin",
  "createdAt": "2023-01-01T00:00:00Z",
  "lastLogin": "2023-06-18T10:00:00Z",
  "permissions": ["read:all", "write:all", "delete:all"]
}
```

#### Create User

```http
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

Response:

```json
{
  "id": "user-3",
  "username": "newuser",
  "status": "created"
}
```

#### Update User

```http
PUT /api/users/{userId}
Content-Type: application/json

{
  "email": "updated@example.com",
  "role": "admin"
}
```

Response:

```json
{
  "id": "user-3",
  "username": "newuser",
  "status": "updated"
}
```

#### Delete User

```http
DELETE /api/users/{userId}
```

Response:

```json
{
  "id": "user-3",
  "status": "deleted"
}
```

### System

#### System Status

```http
GET /api/system/status
```

Response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 86400,
  "serverCount": 5,
  "agentCount": 3,
  "activeTaskCount": 2,
  "resources": {
    "cpu": 0.25,
    "memory": 0.4,
    "disk": 0.3
  }
}
```

#### System Metrics

```http
GET /api/system/metrics
```

Response:

```json
{
  "metrics": {
    "requests": {
      "total": 12500,
      "perMinute": 42
    },
    "tasks": {
      "total": 850,
      "perMinute": 3,
      "averageProcessingTime": 2300
    },
    "errors": {
      "total": 25,
      "perMinute": 0.1,
      "byType": {
        "server_error": 5,
        "validation_error": 15,
        "timeout": 5
      }
    }
  }
}
```

## Websocket API

In addition to the REST API, the Nexus MCP Hub provides a WebSocket API for real-time updates.

### Connection

Connect to the WebSocket endpoint:

```
ws://localhost:3000/api/ws
```

Authentication is required using a query parameter:

```
ws://localhost:3000/api/ws?token=your-jwt-token
```

### Events

The WebSocket API emits the following events:

#### Server Status Update

```json
{
  "type": "server_status",
  "data": {
    "id": "ollama-mcp",
    "status": "active"
  }
}
```

#### Agent Status Update

```json
{
  "type": "agent_status",
  "data": {
    "id": "code-assistant",
    "status": "active"
  }
}
```

#### Task Status Update

```json
{
  "type": "task_status",
  "data": {
    "id": "task-123",
    "status": "completed",
    "completedAt": "2023-06-18T14:32:00Z",
    "output": "Task output"
  }
}
```

#### System Status Update

```json
{
  "type": "system_status",
  "data": {
    "status": "healthy",
    "resources": {
      "cpu": 0.25,
      "memory": 0.4,
      "disk": 0.3
    }
  }
}
```

### Commands

You can send commands to the WebSocket API:

#### Subscribe to Events

```json
{
  "command": "subscribe",
  "events": ["server_status", "agent_status", "task_status"]
}
```

#### Unsubscribe from Events

```json
{
  "command": "unsubscribe",
  "events": ["system_status"]
}
```

## API Clients

The Nexus MCP Hub provides official client libraries for various programming languages:

- JavaScript/TypeScript: `@nexus-mcp/client`
- Python: `nexus-mcp-client`
- Java: `nexus-mcp-client-java`
- Go: `nexus-mcp-client-go`

Example usage (JavaScript):

```javascript
const { NexusClient } = require('@nexus-mcp/client');

const client = new NexusClient({
  baseUrl: 'http://localhost:3000/api',
  token: 'your-jwt-token'
});

async function main() {
  // Get all MCP servers
  const servers = await client.mcpServers.list();
  
  // Create a task
  const task = await client.tasks.create({
    agentId: 'code-assistant',
    input: 'Generate a function to calculate prime numbers'
  });
  
  // Wait for task completion
  const result = await client.tasks.waitForCompletion(task.id);
  console.log(result.output);
}

main().catch(console.error);
```
