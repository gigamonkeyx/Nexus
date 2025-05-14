# Cloudflare Worker API for Nexus Agent Portal

## Overview

The Cloudflare Worker API serves as a proxy between the Nexus Agent Portal frontend and the local Nexus MCP Hub. It handles authentication, routing, and communication with the local MCP servers, allowing for remote access to the Nexus MCP Hub while keeping the MCP workloads running locally.

## Architecture

The Cloudflare Worker API consists of the following components:

1. **Authentication Handler**: Handles user authentication and token validation
2. **API Router**: Routes API requests to the appropriate endpoints
3. **CORS Handler**: Handles Cross-Origin Resource Sharing for secure communication
4. **Mock Data Provider**: Provides mock data for development and testing

## API Endpoints

### Authentication

#### POST /api/auth/login

Authenticates a user and returns a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/register

Registers a new user.

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### GET /api/auth/profile

Returns the profile of the authenticated user.

**Response:**
```json
{
  "id": "1",
  "name": "Admin User",
  "email": "admin@example.com",
  "role": "admin"
}
```

### Agents

#### GET /api/agents

Returns a list of all agents.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Research Assistant",
    "type": "research",
    "status": "running",
    "description": "An agent that helps with research tasks",
    "capabilities": ["research", "reasoning", "planning"],
    "createdAt": "2023-06-15T10:30:00Z"
  },
  {
    "id": "2",
    "name": "Code Helper",
    "type": "coding",
    "status": "stopped",
    "description": "An agent that helps with coding tasks",
    "capabilities": ["code_generation", "reasoning"],
    "createdAt": "2023-06-20T14:45:00Z"
  }
]
```

#### GET /api/agents/:id

Returns a specific agent by ID.

**Response:**
```json
{
  "id": "1",
  "name": "Research Assistant",
  "type": "research",
  "status": "running",
  "description": "An agent that helps with research tasks",
  "capabilities": ["research", "reasoning", "planning"],
  "createdAt": "2023-06-15T10:30:00Z"
}
```

#### POST /api/agents

Creates a new agent.

**Request:**
```json
{
  "name": "Data Analyst",
  "type": "data",
  "description": "An agent that helps with data analysis",
  "capabilities": ["data_analysis", "reasoning"]
}
```

**Response:**
```json
{
  "id": "3",
  "name": "Data Analyst",
  "type": "data",
  "status": "stopped",
  "description": "An agent that helps with data analysis",
  "capabilities": ["data_analysis", "reasoning"],
  "createdAt": "2023-07-05T09:15:00Z"
}
```

#### PUT /api/agents/:id

Updates an existing agent.

**Request:**
```json
{
  "name": "Research Assistant Pro",
  "description": "An enhanced agent that helps with research tasks"
}
```

**Response:**
```json
{
  "id": "1",
  "name": "Research Assistant Pro",
  "type": "research",
  "status": "running",
  "description": "An enhanced agent that helps with research tasks",
  "capabilities": ["research", "reasoning", "planning"],
  "createdAt": "2023-06-15T10:30:00Z"
}
```

#### DELETE /api/agents/:id

Deletes an agent.

**Response:**
```json
{
  "message": "Agent deleted successfully"
}
```

#### POST /api/agents/:id/start

Starts an agent.

**Response:**
```json
{
  "id": "2",
  "name": "Code Helper",
  "type": "coding",
  "status": "running",
  "description": "An agent that helps with coding tasks",
  "capabilities": ["code_generation", "reasoning"],
  "createdAt": "2023-06-20T14:45:00Z"
}
```

#### POST /api/agents/:id/stop

Stops an agent.

**Response:**
```json
{
  "id": "1",
  "name": "Research Assistant",
  "type": "research",
  "status": "stopped",
  "description": "An agent that helps with research tasks",
  "capabilities": ["research", "reasoning", "planning"],
  "createdAt": "2023-06-15T10:30:00Z"
}
```

#### GET /api/agents/:id/logs

Returns the logs for a specific agent.

**Response:**
```json
[
  {
    "timestamp": "2023-06-16T10:30:00Z",
    "level": "info",
    "message": "Agent started"
  },
  {
    "timestamp": "2023-06-16T10:35:00Z",
    "level": "info",
    "message": "Task assigned: Research quantum computing"
  },
  {
    "timestamp": "2023-06-16T11:45:00Z",
    "level": "info",
    "message": "Task completed: Research quantum computing"
  }
]
```

### Tasks

#### GET /api/tasks

Returns a list of all tasks.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Research quantum computing",
    "description": "Gather information about recent advances in quantum computing",
    "status": "completed",
    "priority": "high",
    "agentId": "1",
    "agentName": "Research Assistant",
    "createdAt": "2023-06-16T10:30:00Z",
    "completedAt": "2023-06-16T11:45:00Z"
  },
  {
    "id": "2",
    "name": "Optimize database queries",
    "description": "Review and optimize slow database queries",
    "status": "in_progress",
    "priority": "medium",
    "agentId": "2",
    "agentName": "Code Helper",
    "createdAt": "2023-06-21T14:45:00Z"
  }
]
```

#### GET /api/tasks/:id

Returns a specific task by ID.

**Response:**
```json
{
  "id": "1",
  "name": "Research quantum computing",
  "description": "Gather information about recent advances in quantum computing",
  "status": "completed",
  "priority": "high",
  "agentId": "1",
  "agentName": "Research Assistant",
  "createdAt": "2023-06-16T10:30:00Z",
  "completedAt": "2023-06-16T11:45:00Z",
  "result": "Quantum computing has seen significant advances in the past year...",
  "output": "Detailed research findings on quantum computing..."
}
```

#### POST /api/tasks

Creates a new task.

**Request:**
```json
{
  "name": "Analyze sales data",
  "description": "Analyze Q2 sales data and generate insights",
  "priority": "high",
  "agentId": "3"
}
```

**Response:**
```json
{
  "id": "3",
  "name": "Analyze sales data",
  "description": "Analyze Q2 sales data and generate insights",
  "status": "pending",
  "priority": "high",
  "agentId": "3",
  "agentName": "Data Analyst",
  "createdAt": "2023-07-06T09:15:00Z"
}
```

#### PUT /api/tasks/:id

Updates an existing task.

**Request:**
```json
{
  "name": "Research quantum computing advancements",
  "priority": "medium"
}
```

**Response:**
```json
{
  "id": "1",
  "name": "Research quantum computing advancements",
  "description": "Gather information about recent advances in quantum computing",
  "status": "completed",
  "priority": "medium",
  "agentId": "1",
  "agentName": "Research Assistant",
  "createdAt": "2023-06-16T10:30:00Z",
  "completedAt": "2023-06-16T11:45:00Z"
}
```

#### DELETE /api/tasks/:id

Deletes a task.

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

#### POST /api/tasks/:id/assign

Assigns a task to an agent.

**Request:**
```json
{
  "agentId": "2"
}
```

**Response:**
```json
{
  "id": "3",
  "name": "Analyze sales data",
  "description": "Analyze Q2 sales data and generate insights",
  "status": "pending",
  "priority": "high",
  "agentId": "2",
  "agentName": "Code Helper",
  "createdAt": "2023-07-06T09:15:00Z"
}
```

#### POST /api/tasks/:id/complete

Marks a task as completed.

**Response:**
```json
{
  "id": "2",
  "name": "Optimize database queries",
  "description": "Review and optimize slow database queries",
  "status": "completed",
  "priority": "medium",
  "agentId": "2",
  "agentName": "Code Helper",
  "createdAt": "2023-06-21T14:45:00Z",
  "completedAt": "2023-06-22T10:30:00Z"
}
```

### Benchmarks

#### GET /api/benchmarks

Returns a list of all benchmarks.

**Response:**
```json
[
  {
    "id": "1",
    "name": "HumanEval Benchmark",
    "type": "humaneval",
    "agentId": "2",
    "agentName": "Code Helper",
    "score": 0.75,
    "date": "2023-06-25T10:30:00Z"
  },
  {
    "id": "2",
    "name": "τ-Bench Reasoning",
    "type": "taubench",
    "agentId": "1",
    "agentName": "Research Assistant",
    "score": 0.82,
    "date": "2023-07-10T14:45:00Z"
  }
]
```

#### GET /api/benchmarks/:id

Returns a specific benchmark by ID.

**Response:**
```json
{
  "id": "1",
  "name": "HumanEval Benchmark",
  "type": "humaneval",
  "agentId": "2",
  "agentName": "Code Helper",
  "score": 0.75,
  "date": "2023-06-25T10:30:00Z",
  "duration": 120,
  "categoryScores": [
    {
      "name": "Code Generation",
      "score": 0.8
    },
    {
      "name": "Code Correctness",
      "score": 0.7
    }
  ],
  "analysis": {
    "summary": "The agent performed well on code generation tasks but struggled with complex algorithms.",
    "strengths": [
      "Strong performance on simple coding tasks",
      "Good understanding of basic programming concepts"
    ],
    "weaknesses": [
      "Difficulty with complex algorithms",
      "Inconsistent code style"
    ],
    "recommendations": [
      "Improve algorithm understanding",
      "Enhance code style consistency"
    ]
  }
}
```

#### POST /api/benchmarks/run

Runs a new benchmark.

**Request:**
```json
{
  "name": "Custom Data Analysis",
  "type": "custom",
  "agentId": "3",
  "parameters": {
    "custom_config": "{\"test_cases\": 10, \"timeout\": 30}"
  }
}
```

**Response:**
```json
{
  "id": "3",
  "name": "Custom Data Analysis",
  "type": "custom",
  "agentId": "3",
  "agentName": "Data Analyst",
  "score": 0.91,
  "date": "2023-07-15T09:15:00Z"
}
```

#### GET /api/benchmarks/:id/results

Returns the results for a specific benchmark.

**Response:**
```json
{
  "id": "1",
  "name": "HumanEval Benchmark",
  "testCases": [
    {
      "id": "1",
      "name": "Test Case 1",
      "problem": "Write a function to reverse a string",
      "passed": true,
      "score": 1.0,
      "duration": 1200,
      "expectedOutput": "function reverse(str) { return str.split('').reverse().join(''); }",
      "actualOutput": "function reverse(str) { return str.split('').reverse().join(''); }"
    },
    {
      "id": "2",
      "name": "Test Case 2",
      "problem": "Write a function to find the maximum number in an array",
      "passed": false,
      "score": 0.5,
      "duration": 1500,
      "expectedOutput": "function findMax(arr) { return Math.max(...arr); }",
      "actualOutput": "function findMax(arr) { let max = arr[0]; for(let i=1; i<arr.length; i++) { if(arr[i] > max) max = arr[i]; } return max; }"
    }
  ]
}
```

#### GET /api/benchmarks/compare

Compares two benchmarks.

**Query Parameters:**
- `result1`: ID of the first benchmark
- `result2`: ID of the second benchmark

**Response:**
```json
{
  "benchmark1": {
    "id": "1",
    "name": "HumanEval Benchmark",
    "score": 0.75
  },
  "benchmark2": {
    "id": "2",
    "name": "HumanEval Benchmark (Rerun)",
    "score": 0.82
  },
  "categoryComparison": [
    {
      "name": "Code Generation",
      "score1": 0.8,
      "score2": 0.85,
      "difference": 0.05
    },
    {
      "name": "Code Correctness",
      "score1": 0.7,
      "score2": 0.79,
      "difference": 0.09
    }
  ],
  "summary": "The agent showed significant improvement in the second benchmark run, particularly in code correctness."
}
```

### MCP Servers

#### GET /api/servers

Returns a list of all MCP servers.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Ollama MCP",
    "type": "ollama",
    "url": "http://localhost:3011",
    "status": "connected",
    "capabilities": ["text_generation", "code_generation", "embedding_generation"]
  },
  {
    "id": "2",
    "name": "ComfyUI MCP",
    "type": "comfyui",
    "url": "http://localhost:3020",
    "status": "connected",
    "capabilities": ["image_generation", "image_editing"]
  }
]
```

#### GET /api/servers/:id

Returns a specific MCP server by ID.

**Response:**
```json
{
  "id": "1",
  "name": "Ollama MCP",
  "type": "ollama",
  "url": "http://localhost:3011",
  "status": "connected",
  "capabilities": ["text_generation", "code_generation", "embedding_generation"],
  "models": [
    {
      "id": "llama2",
      "name": "Llama 2",
      "description": "A large language model by Meta"
    },
    {
      "id": "codellama",
      "name": "Code Llama",
      "description": "A code-specialized language model by Meta"
    }
  ]
}
```

#### POST /api/servers/register

Registers a new MCP server.

**Request:**
```json
{
  "name": "Terminal MCP",
  "type": "terminal",
  "url": "http://localhost:3014"
}
```

**Response:**
```json
{
  "id": "3",
  "name": "Terminal MCP",
  "type": "terminal",
  "url": "http://localhost:3014",
  "status": "connected",
  "capabilities": ["command_execution", "file_system"]
}
```

#### DELETE /api/servers/:id

Unregisters an MCP server.

**Response:**
```json
{
  "message": "Server unregistered successfully"
}
```

#### GET /api/servers/:id/status

Returns the status of a specific MCP server.

**Response:**
```json
{
  "id": "1",
  "name": "Ollama MCP",
  "status": "connected",
  "lastSeen": "2023-07-15T10:30:00Z",
  "uptime": 86400,
  "metrics": {
    "requestsPerMinute": 10,
    "averageResponseTime": 250,
    "errorRate": 0.01
  }
}
```

## Security

The Cloudflare Worker API implements several security measures:

1. **JWT Authentication**: All protected endpoints require a valid JWT token
2. **CORS Protection**: Only allows requests from whitelisted origins
3. **Rate Limiting**: Limits the number of requests from a single IP address
4. **Input Validation**: Validates all input data to prevent injection attacks

## Deployment

The Cloudflare Worker API is deployed using Wrangler, Cloudflare's command-line tool for managing Workers. The deployment process is automated through GitHub Actions, which builds and deploys the Worker whenever changes are pushed to the main branch.

## Local Development

For local development, the Cloudflare Worker API can be run using Wrangler's local development server:

```bash
wrangler dev
```

This will start a local server that mimics the Cloudflare Workers environment, allowing for testing and debugging without deploying to production.
