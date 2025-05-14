# Nexus MCP Hub

A modular system for creating, evaluating, and improving AI agents using the Model Context Protocol (MCP).

## Overview

The Nexus MCP Hub is a central hub for managing MCP servers and clients. It provides a registry for MCP servers, a client for connecting to MCP servers, and a framework for creating and managing AI agents.

### Key Components

1. **Nexus MCP Hub**: Central hub for managing MCP servers and clients
2. **MCP Servers**: Specialized servers that provide AI capabilities
   - **Ollama MCP**: Provides access to Ollama models for text generation, code generation, and embedding generation
   - **Code Enhancement MCP**: Provides code enhancement capabilities
   - **Lucidity MCP**: Provides reasoning and planning capabilities
   - **Benchmark MCP**: Provides benchmarking capabilities for evaluating agent performance
3. **Bootstrap Agents**: Specialized agents for enhancing the agent factory
   - **Factory Enhancer Agent**: Enhances the factory with advanced features
   - **Benchmarking Agent**: Implements and runs benchmarks for agents
   - **Continuous Learning Agent**: Improves agents through continuous learning
4. **Minimal Agent Factory**: Creates and manages agents using the specialized agents

## Setup Instructions

### Quick Start

To start the entire Nexus system with a single command:

```powershell
# Start the entire Nexus system
.\start-nexus-system.ps1
```

This script will:
1. Start the Nexus MCP Hub
2. Start all MCP servers
3. Start the bootstrap system
4. Create and test a simple agent

### Manual Setup

If you prefer to start each component manually:

#### 1. Start the Nexus MCP Hub

The Nexus MCP Hub must be started first before any other components:

```powershell
# Start the Nexus MCP Hub
.\start-nexus-hub.ps1
```

#### 2. Start the MCP Servers

Start the MCP servers:

```powershell
# Start the MCP servers
.\start-simplified-mcp-servers.ps1
```

#### 3. Start the Bootstrap System

Start the bootstrap agents and the Minimal Agent Factory:

```powershell
# Start the bootstrap system
.\start-bootstrap-system-fixed.ps1
```

#### 4. Create and Test an Agent

Create a simple agent and test the benchmark-driven improvement process:

```powershell
# Create and test an agent
.\create-simple-agent.ps1
```

## MCP Servers

### Ollama MCP Server

- **Port**: 3011
- **Capabilities**: Text generation, code generation, embedding generation
- **Models**: Llama, Mistral, Phi, and more

### Code Enhancement MCP Server

- **Port**: 3020
- **Capabilities**: Code generation, code refactoring, code analysis
- **Models**: CodeLlama, StarCoder, and more

### Lucidity MCP Server

- **Port**: 3021
- **Capabilities**: Reasoning, planning, problem-solving
- **Models**: Llama, Claude, and more

### Benchmark MCP Server

- **Port**: 8020
- **Capabilities**: HumanEval, τ-Bench, and custom benchmarks
- **Models**: N/A (uses other models for evaluation)

## Bootstrap Agents

### Factory Enhancer Agent

This agent enhances the factory with advanced features:

- τ-Bench integration
- Agent architecture improvements
- Factory workflow optimization
- Agent specialization framework
- Continuous integration pipeline

### Benchmarking Agent

This agent implements and runs benchmarks for evaluating agents:

- Basic benchmarking framework
- HumanEval benchmark implementation
- τ-Bench integration
- Agent comparison system
- Custom benchmark creation tools

### Continuous Learning Agent

This agent improves other agents through continuous learning:

- Feedback processing system
- Model fine-tuning pipeline
- Knowledge distillation framework
- Continuous improvement system
- Learning transfer system

## Minimal Agent Factory

This factory creates and manages agents:

- Agent creation from templates
- Agent lifecycle management
- Task assignment
- Agent orchestration

## Benchmark-Driven Improvement

The system uses a benchmark-driven improvement process:

1. Agents are created by the Minimal Agent Factory
2. The Benchmarking Agent evaluates their performance
3. The Continuous Learning Agent improves them based on benchmark results
4. The Factory Enhancer Agent optimizes the overall process

This creates a feedback loop that continuously improves the agents over time.

## Prerequisites

- Node.js (v14 or later)
- TypeScript
- Python 3.8 or later
- Ollama (for running LLMs locally)

## Documentation

Detailed documentation is available in the `docs` directory:

- [Minimal Agent Factory Guide](docs/minimal-agent-factory-guide.md)
- [Benchmark-Driven Improvement Guide](docs/benchmark-driven-improvement-guide.md)
- [Custom Agent Templates Guide](docs/custom-agent-templates-guide.md)
- [MCP Integration Guide](docs/mcp-integration-guide.md)

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) - The official MCP specification
