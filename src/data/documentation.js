/**
 * Documentation data for the Nexus MCP Hub
 */

import {
  Architecture as ArchitectureIcon,
  Code as CodeIcon,
  Storage as DatabaseIcon,
  Terminal as TerminalIcon,
  Image as ImageIcon,
  Psychology as AgentIcon,
  Settings as ConfigIcon,
  Biotech as BenchmarkIcon,
} from '@mui/icons-material';

// Documentation categories
export const DOCUMENTATION_CATEGORIES = {
  ARCHITECTURE: 'architecture',
  MCP_SERVERS: 'mcp-servers',
  AGENTS: 'agents',
  BENCHMARKS: 'benchmarks',
  CONFIGURATION: 'configuration',
};

// Documentation data
export const documentationData = [
  {
    id: DOCUMENTATION_CATEGORIES.ARCHITECTURE,
    name: 'Architecture',
    icon: <ArchitectureIcon />,
    docs: [
      {
        id: 'architecture-overview',
        name: 'Overview',
        content: `# Nexus MCP Hub Architecture

The Nexus MCP Hub is designed as a central hub for managing multiple Model Context Protocol (MCP) servers. It follows a modular architecture that allows for easy integration of new MCP servers and agents.

## Core Components

### Nexus Hub

The central component that manages all MCP servers and agents. It provides:

- Registration and discovery of MCP servers
- Routing of requests to appropriate MCP servers
- Authentication and authorization
- Monitoring and logging

### MCP Client

Integrated into the Nexus Hub, the MCP client:

- Communicates with MCP servers using the Model Context Protocol
- Handles request/response formatting
- Manages connections and retries
- Provides a unified interface for agents

### Agent Framework

Provides the foundation for building AI agents that can:

- Utilize multiple MCP servers
- Chain operations across different servers
- Maintain context and state
- Execute complex workflows

## Communication Flow

1. User or system initiates a request to an agent
2. Agent determines required MCP servers for the task
3. Nexus Hub routes requests to appropriate MCP servers
4. MCP servers process requests and return results
5. Agent integrates results and provides response

## Deployment Architecture

The Nexus MCP Hub can be deployed in various configurations:

- **Local Development**: All components run on the developer's machine
- **Hybrid**: Nexus Hub runs locally, connecting to both local and remote MCP servers
- **Cloud**: All components run in cloud environments

## Security Model

- Authentication using JWT tokens
- Role-based access control for MCP servers and agents
- Encrypted communication between components
- Audit logging of all operations`,
      },
      {
        id: 'architecture-protocols',
        name: 'Protocols',
        content: `# Nexus MCP Hub Protocols

The Nexus MCP Hub uses several protocols for communication between components.

## Model Context Protocol (MCP)

The primary protocol used for communication between the Nexus Hub and MCP servers. It is based on the official specification at [modelcontextprotocol.io](https://modelcontextprotocol.io).

### Key Features

- **Transport Agnostic**: Supports HTTP, WebSockets, and stdio
- **Structured Messages**: Uses JSON for message formatting
- **Context Management**: Maintains context across multiple requests
- **Tool Calling**: Supports tool calling and function execution
- **Streaming**: Supports streaming responses for real-time interaction

### Message Types

- **Request**: Sent from client to server
- **Response**: Sent from server to client
- **Error**: Sent from server to client when an error occurs
- **Event**: Sent from server to client for asynchronous notifications

## Internal API

Used for communication between components within the Nexus Hub.

### Endpoints

- **/api/mcp-servers**: Manage MCP server registrations
- **/api/agents**: Manage agent configurations
- **/api/tasks**: Manage task execution
- **/api/benchmarks**: Manage benchmark execution and results

## External API

Used for communication with external systems and clients.

### Endpoints

- **/api/v1/agents**: Access agent capabilities
- **/api/v1/tasks**: Submit and monitor tasks
- **/api/v1/auth**: Authentication and authorization

## WebSocket API

Used for real-time communication with clients.

### Events

- **task:update**: Sent when a task status changes
- **agent:update**: Sent when an agent status changes
- **mcp-server:update**: Sent when an MCP server status changes`,
      },
    ],
  },
  {
    id: DOCUMENTATION_CATEGORIES.MCP_SERVERS,
    name: 'MCP Servers',
    icon: <TerminalIcon />,
    docs: [
      {
        id: 'mcp-servers-overview',
        name: 'Overview',
        content: `# MCP Servers Overview

The Nexus MCP Hub integrates with various MCP servers, each providing specific capabilities to agents.

## What is an MCP Server?

An MCP server is a service that implements the Model Context Protocol (MCP) and provides specific capabilities to agents. These capabilities can include:

- Language model inference
- Image generation
- Database access
- File system operations
- Terminal command execution
- And more

## Supported MCP Servers

The Nexus MCP Hub currently supports the following MCP servers:

### Ollama MCP (Port 3011)

Provides access to open-source language models through Ollama.

### ComfyUI MCP (Port 3020)

Enables image generation and editing using ComfyUI workflows.

### Supabase MCP (Port 3007)

Provides database access and operations through Supabase.

### Terminal MCP (Port 3014)

Allows execution of terminal commands in a controlled environment.

### Memory Server (stdio)

Manages agent memory and context using stdio transport.

### File Explorer (stdio)

Provides file system access and operations using stdio transport.

### Code Sandbox (stdio)

Enables code execution in a sandboxed environment using stdio transport.

## Adding New MCP Servers

The Nexus MCP Hub is designed to be extensible, allowing new MCP servers to be added easily. To add a new MCP server:

1. Implement the MCP specification in your server
2. Register the server with the Nexus Hub
3. Configure access controls and capabilities
4. Test integration with existing agents

## MCP Server Health Monitoring

The Nexus Hub continuously monitors the health of connected MCP servers and provides:

- Status indicators
- Performance metrics
- Error logging
- Automatic reconnection`,
      },
      {
        id: 'ollama-mcp',
        name: 'Ollama MCP',
        content: `# Ollama MCP Server

The Ollama MCP Server provides access to open-source language models through Ollama.

## Overview

Ollama MCP allows agents to use various open-source language models for tasks such as:

- Text generation
- Code generation
- Question answering
- Summarization
- Translation
- And more

## Configuration

### Server Details

- **Port**: 3011
- **Transport**: HTTP
- **Base URL**: http://localhost:3011

### Available Models

- Llama 3 (70B, 8B)
- Mistral
- Phi-3
- Gemma
- Stable Code
- And more

## Usage

### Direct API Access

\`\`\`javascript
const response = await fetch('http://localhost:3011/v1/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'llama3:8b',
    prompt: 'Write a function to calculate the Fibonacci sequence',
    stream: false,
  }),
});

const result = await response.json();
console.log(result.response);
\`\`\`

### Through Nexus Hub

\`\`\`javascript
const task = await nexusClient.createTask({
  agentId: 'coding-agent-1',
  input: 'Write a function to calculate the Fibonacci sequence',
  mcpServers: ['ollama-mcp'],
});

const result = await nexusClient.waitForTask(task.id);
console.log(result.output);
\`\`\`

## Performance Considerations

- Model loading time: 5-30 seconds depending on model size
- Inference speed: 1-20 tokens/second depending on model and hardware
- Memory usage: 8-50GB depending on model size

## Security

- Local execution only (no data sent to external services)
- Access control through Nexus Hub
- Resource limits configurable`,
      },
      {
        id: 'comfyui-mcp',
        name: 'ComfyUI MCP',
        content: `# ComfyUI MCP Server

The ComfyUI MCP Server enables image generation and editing using ComfyUI workflows.

## Overview

ComfyUI MCP allows agents to:

- Generate images from text descriptions
- Edit existing images
- Apply styles and effects
- Create variations of images
- Combine multiple images

## Configuration

### Server Details

- **Port**: 3020
- **Transport**: HTTP
- **Base URL**: http://localhost:3020

### Available Models

- Stable Diffusion XL
- Stable Diffusion 1.5
- ControlNet
- IP-Adapter
- And more

## Usage

### Direct API Access

\`\`\`javascript
const response = await fetch('http://localhost:3020/v1/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'A beautiful landscape with mountains and a lake',
    negative_prompt: 'blurry, low quality',
    model: 'sdxl',
    width: 1024,
    height: 1024,
  }),
});

const result = await response.json();
console.log(result.image_url);
\`\`\`

### Through Nexus Hub

\`\`\`javascript
const task = await nexusClient.createTask({
  agentId: 'creative-agent-1',
  input: 'Generate an image of a beautiful landscape with mountains and a lake',
  mcpServers: ['comfyui-mcp'],
});

const result = await nexusClient.waitForTask(task.id);
console.log(result.output);
\`\`\`

## Performance Considerations

- Generation time: 5-30 seconds depending on image size and model
- Memory usage: 8-16GB depending on model and image size

## Security

- Local execution only (no data sent to external services)
- Access control through Nexus Hub
- Resource limits configurable`,
      },
      {
        id: 'supabase-mcp',
        name: 'Supabase MCP',
        content: `# Supabase MCP Server

The Supabase MCP Server provides database access and operations through Supabase.

## Overview

Supabase MCP allows agents to:

- Query databases
- Insert, update, and delete data
- Create and modify database structures
- Manage users and authentication
- Access storage for files

## Configuration

### Server Details

- **Port**: 3007
- **Transport**: HTTP
- **Base URL**: http://localhost:3007

### Features

- PostgreSQL database access
- Row-level security
- Real-time subscriptions
- Storage for files
- Authentication and authorization

## Usage

### Direct API Access

\`\`\`javascript
const response = await fetch('http://localhost:3007/v1/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'SELECT * FROM users WHERE email = $1',
    params: ['user@example.com'],
  }),
});

const result = await response.json();
console.log(result.data);
\`\`\`

### Through Nexus Hub

\`\`\`javascript
const task = await nexusClient.createTask({
  agentId: 'database-agent-1',
  input: 'Find all users who signed up in the last month',
  mcpServers: ['supabase-mcp'],
});

const result = await nexusClient.waitForTask(task.id);
console.log(result.output);
\`\`\`

## Security

- Row-level security policies
- Access control through Nexus Hub
- Query parameter binding to prevent SQL injection
- Audit logging of all operations`,
      },
      {
        id: 'terminal-mcp',
        name: 'Terminal MCP',
        content: `# Terminal MCP Server

The Terminal MCP Server allows execution of terminal commands in a controlled environment.

## Overview

Terminal MCP enables agents to:

- Execute shell commands
- Run scripts
- Access system information
- Manage files and directories
- Install and configure software

## Configuration

### Server Details

- **Port**: 3014
- **Transport**: HTTP
- **Base URL**: http://localhost:3014

### Features

- Command execution with timeout
- Output streaming
- Working directory management
- Environment variable control
- Command whitelisting

## Usage

### Direct API Access

\`\`\`javascript
const response = await fetch('http://localhost:3014/v1/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    command: 'ls -la',
    workingDir: '/home/user/projects',
    timeout: 5000,
  }),
});

const result = await response.json();
console.log(result.output);
\`\`\`

### Through Nexus Hub

\`\`\`javascript
const task = await nexusClient.createTask({
  agentId: 'terminal-agent-1',
  input: 'List all files in the projects directory',
  mcpServers: ['terminal-mcp'],
});

const result = await nexusClient.waitForTask(task.id);
console.log(result.output);
\`\`\`

## Security

- Command whitelisting
- Resource limits (CPU, memory, time)
- Working directory restrictions
- Environment variable sanitization
- Access control through Nexus Hub`,
      },
    ],
  },
  {
    id: DOCUMENTATION_CATEGORIES.AGENTS,
    name: 'Agents',
    icon: <AgentIcon />,
    docs: [
      {
        id: 'agents-overview',
        name: 'Overview',
        content: `# Agents Overview

Agents are AI-powered assistants that can perform specific tasks using one or more MCP servers.

## What is an Agent?

An agent is a specialized AI assistant that:

- Has a specific focus and capabilities
- Can use multiple MCP servers
- Maintains context and memory
- Can execute complex workflows
- Adapts to user needs

## Agent Types

The Nexus MCP Hub supports various types of agents:

### Coding Agents

Specialized in software development tasks such as code generation, review, and debugging.

### Research Agents

Focused on information retrieval, analysis, and synthesis from various sources.

### Database Agents

Experts in data management, querying, and analysis.

### Creative Agents

Specialized in content generation, including text and images.

### Cognitive Agents

Focused on problem-solving, decision-making, and reasoning.

## Agent Capabilities

Agents can have various capabilities depending on their type and the MCP servers they use:

- Code generation and analysis
- Web search and information retrieval
- Document summarization
- Data analysis
- Image generation
- Terminal command execution
- Database operations
- And more

## Creating Custom Agents

The Nexus MCP Hub allows creating custom agents by:

1. Defining the agent's purpose and capabilities
2. Selecting the required MCP servers
3. Configuring the agent's parameters
4. Testing and refining the agent's performance

## Agent Evaluation

Agents can be evaluated using various benchmarks to measure their performance in specific tasks. See the Benchmarks section for more details.`,
      },
      {
        id: 'coding-agents',
        name: 'Coding Agents',
        content: `# Coding Agents

Coding agents are specialized AI assistants that help with software development tasks.

## Overview

Coding agents can:

- Generate code based on natural language descriptions
- Review existing code for bugs, security issues, and style violations
- Explain complex code snippets
- Refactor code for better performance and maintainability
- Debug issues in code

## Available Coding Agents

### CodeAssistant

An advanced coding agent powered by Claude 3 Sonnet.

- **Capabilities**: Code generation, review, explanation, refactoring, debugging
- **MCP Servers**: Ollama MCP
- **Performance**: HumanEval (78.5%), CodeXGLUE (72.3%), MBPP (81.2%)

## Usage Examples

### Code Generation

\`\`\`
Task: "Create a function that calculates the Fibonacci sequence up to n terms"

Response:
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [0, 1];
  
  const result = [0, 1];
  for (let i = 2; i < n; i++) {
    result.push(result[i-1] + result[i-2]);
  }
  
  return result;
}
\`\`\`

### Code Review

\`\`\`
Task: "Review this authentication function for security issues"

Response:
Issues found:
1. Passwords are stored in plain text
2. No rate limiting for login attempts
3. No input validation
4. SQL injection vulnerability in the query
5. No CSRF protection

Recommendations:
1. Use bcrypt or Argon2 for password hashing
2. Implement rate limiting
3. Add input validation
4. Use parameterized queries
5. Implement CSRF tokens
\`\`\`

## Best Practices

- Provide clear and detailed task descriptions
- Include context about the codebase and requirements
- Specify the programming language and framework
- Review and test generated code before using it
- Provide feedback to improve agent performance`,
      },
      {
        id: 'research-agents',
        name: 'Research Agents',
        content: `# Research Agents

Research agents are specialized AI assistants that help with information retrieval and analysis.

## Overview

Research agents can:

- Search the web for information
- Retrieve and analyze documents
- Summarize lengthy content
- Build knowledge graphs
- Synthesize information from multiple sources

## Available Research Agents

### Librarian

An advanced research agent powered by Claude 3 Opus.

- **Capabilities**: Web search, document retrieval, document summarization, knowledge graph
- **MCP Servers**: Supabase MCP, Terminal MCP
- **Performance**: MMLU (86.7%), TruthfulQA (92.1%), GSM8K (79.8%)

## Usage Examples

### Web Search

\`\`\`
Task: "Find recent research on quantum computing applications in cryptography"

Response:
Recent Research on Quantum Computing Applications in Cryptography (2022-2023):

1. "Post-Quantum Cryptography: Current State and Quantum Mitigation Techniques" (2023)
   - Authors: Zhang et al.
   - Key findings: Comprehensive review of quantum-resistant algorithms

2. "Quantum Key Distribution: From Theory to Application" (2022)
   - Authors: Johnson et al.
   - Key findings: Practical implementation of QKD in existing networks

3. "Lattice-Based Cryptography Against Quantum Attacks" (2023)
   - Authors: Patel et al.
   - Key findings: New lattice-based schemes with improved security margins

4. "Quantum-Safe Blockchain: Protecting Distributed Ledgers" (2022)
   - Authors: Kim et al.
   - Key findings: Integration of post-quantum signatures in blockchain
\`\`\`

### Document Summarization

\`\`\`
Task: "Summarize this 50-page research paper on climate change"

Response:
Summary of "Climate Change Mitigation Strategies: A Global Perspective" (2023):

Key Points:
1. Global temperatures have risen 1.1°C above pre-industrial levels
2. Current policies put us on track for 2.7°C warming by 2100
3. Carbon emissions must decrease 45% by 2030 to limit warming to 1.5°C

Major Findings:
- Renewable energy costs have decreased 85% since 2010
- Electric vehicle adoption is accelerating but still below needed levels
- Carbon capture technology remains costly but essential
- Methane reduction offers quick wins for climate mitigation

Recommendations:
1. Accelerate renewable energy deployment
2. Implement carbon pricing globally
3. Increase investment in public transportation
4. Protect and restore natural carbon sinks
5. Develop international cooperation frameworks
\`\`\`

## Best Practices

- Provide specific research questions
- Specify the type and depth of information needed
- Include any relevant context or background
- Request citations and sources
- Provide feedback to improve agent performance`,
      },
    ],
  },
  {
    id: DOCUMENTATION_CATEGORIES.BENCHMARKS,
    name: 'Benchmarks',
    icon: <BenchmarkIcon />,
    docs: [
      {
        id: 'benchmarks-overview',
        name: 'Overview',
        content: `# Benchmarks Overview

Benchmarks are standardized tests used to evaluate the performance of agents in specific tasks.

## Why Benchmarks Matter

Benchmarks provide:

- Objective measures of agent performance
- Comparison between different agents
- Tracking of improvements over time
- Identification of strengths and weaknesses
- Guidance for agent development

## Benchmark Categories

The Nexus MCP Hub uses various benchmark categories:

### Coding Benchmarks

Evaluate an agent's ability to generate, understand, and debug code.

- **HumanEval**: Tests code generation from function descriptions
- **CodeXGLUE**: A collection of tasks for code understanding
- **MBPP**: Measures basic programming abilities

### Knowledge Benchmarks

Assess an agent's general knowledge and reasoning abilities.

- **MMLU**: Tests knowledge across 57 subjects
- **TruthfulQA**: Measures truthfulness in question answering
- **ARC**: Evaluates reasoning on grade-school science questions

### Math Benchmarks

Evaluate an agent's mathematical reasoning abilities.

- **GSM8K**: Tests grade school math word problems
- **MATH**: Assesses high school competition math problems

### Creative Benchmarks

Measure an agent's creative capabilities.

- **Creative Writing**: Evaluates story generation and writing quality
- **Idea Generation**: Assesses the originality and usefulness of ideas

## Running Benchmarks

Benchmarks can be run through the Nexus MCP Hub:

1. Select an agent to evaluate
2. Choose appropriate benchmarks
3. Configure benchmark parameters
4. Run the benchmark
5. Review and analyze results

## Interpreting Results

Benchmark results should be interpreted with consideration for:

- The specific tasks being evaluated
- The limitations of the benchmark
- The agent's intended use case
- Comparison to relevant baselines
- Trends over time`,
      },
      {
        id: 'coding-benchmarks',
        name: 'Coding Benchmarks',
        content: `# Coding Benchmarks

Coding benchmarks evaluate an agent's ability to generate, understand, and debug code.

## HumanEval

HumanEval is a benchmark for evaluating code generation capabilities.

### Overview

- **Tasks**: 164 programming problems
- **Format**: Function signature and docstring, agent generates function body
- **Languages**: Python (primary), JavaScript, Java, C++
- **Metrics**: Pass@k (percentage of problems solved correctly)

### Example Task

\`\`\`python
def fibonacci(n: int) -> list:
    """
    Return the first n Fibonacci numbers.
    fibonacci(5) => [0, 1, 1, 2, 3]
    """
    # Agent generates code here
\`\`\`

### Interpretation

- **Pass@1**: Percentage of problems solved correctly on first attempt
- **Pass@10**: Percentage of problems where at least one of 10 attempts is correct
- **Pass@100**: Percentage of problems where at least one of 100 attempts is correct

## CodeXGLUE

CodeXGLUE is a collection of tasks for code understanding and generation.

### Overview

- **Tasks**: Code completion, translation, summarization, etc.
- **Languages**: Multiple (Python, Java, C#, etc.)
- **Metrics**: Varies by task (accuracy, BLEU score, etc.)

### Key Tasks

- **Code Completion**: Predict the next token or line of code
- **Code Translation**: Convert code from one language to another
- **Code Summarization**: Generate natural language description of code
- **Code Search**: Find relevant code given a natural language query
- **Code Repair**: Fix bugs in code

## MBPP (Mostly Basic Programming Problems)

MBPP evaluates basic programming abilities.

### Overview

- **Tasks**: 974 basic programming problems
- **Format**: Problem description, agent generates complete solution
- **Language**: Python
- **Metrics**: Pass@k (percentage of problems solved correctly)

### Example Task

\`\`\`
Write a function to find the sum of all even numbers in a list.
\`\`\`

### Interpretation

Similar to HumanEval, with focus on more basic programming tasks.

## Running Coding Benchmarks

To run coding benchmarks on an agent:

1. Select the agent to evaluate
2. Choose the benchmark (HumanEval, CodeXGLUE, MBPP)
3. Configure parameters (language, number of samples, etc.)
4. Run the benchmark
5. Review results and compare to baselines

## Current Performance

| Agent | HumanEval | CodeXGLUE | MBPP |
|-------|-----------|-----------|------|
| CodeAssistant | 78.5% | 72.3% | 81.2% |
| GPT-4 | 67.0% | 65.8% | 70.3% |
| Claude 3 Opus | 75.2% | 70.1% | 79.8% |`,
      },
    ],
  },
  {
    id: DOCUMENTATION_CATEGORIES.CONFIGURATION,
    name: 'Configuration',
    icon: <ConfigIcon />,
    docs: [
      {
        id: 'configuration-overview',
        name: 'Overview',
        content: `# Configuration Overview

The Nexus MCP Hub can be configured in various ways to suit different needs and environments.

## Configuration Files

The main configuration files are:

- **config.js**: Main configuration file
- **mcp-servers.js**: MCP server configurations
- **agents.js**: Agent configurations
- **.env**: Environment variables

## Environment Variables

Key environment variables include:

- **NODE_ENV**: Environment (development, production)
- **PORT**: Port for the Nexus Hub server
- **LOG_LEVEL**: Logging level (debug, info, warn, error)
- **AUTH_SECRET**: Secret for JWT authentication
- **DATABASE_URL**: URL for the database connection

## MCP Server Configuration

Each MCP server can be configured with:

- **id**: Unique identifier
- **name**: Display name
- **url**: Server URL
- **port**: Server port
- **transport**: Transport protocol (http, websocket, stdio)
- **capabilities**: List of capabilities provided
- **auth**: Authentication configuration
- **rateLimit**: Rate limiting settings

Example:

\`\`\`javascript
{
  id: 'ollama-mcp',
  name: 'Ollama MCP',
  url: 'http://localhost',
  port: 3011,
  transport: 'http',
  capabilities: ['text-generation', 'code-generation'],
  auth: {
    type: 'none'
  },
  rateLimit: {
    requests: 100,
    period: '1m'
  }
}
\`\`\`

## Agent Configuration

Agents can be configured with:

- **id**: Unique identifier
- **name**: Display name
- **description**: Brief description
- **type**: Agent type
- **model**: Model used
- **mcpServers**: List of MCP servers used
- **capabilities**: List of capabilities
- **parameters**: Model and behavior parameters

Example:

\`\`\`javascript
{
  id: 'coding-agent-1',
  name: 'CodeAssistant',
  description: 'Advanced coding agent for software development tasks',
  type: 'coding',
  model: 'claude-3-sonnet',
  mcpServers: ['ollama-mcp'],
  capabilities: ['code-generation', 'code-review', 'code-explanation'],
  parameters: {
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.95
  }
}
\`\`\`

## Security Configuration

Security settings include:

- **authentication**: User authentication methods
- **authorization**: Role-based access control
- **rateLimit**: API rate limiting
- **cors**: Cross-Origin Resource Sharing
- **helmet**: HTTP security headers

## Logging Configuration

Logging can be configured with:

- **level**: Minimum log level
- **format**: Log format
- **transports**: Output destinations
- **filters**: Log filtering rules`,
      },
    ],
  },
];

export default documentationData;
