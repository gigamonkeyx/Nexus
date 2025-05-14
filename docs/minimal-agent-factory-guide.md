# Minimal Agent Factory Guide

This guide provides detailed instructions for using the Minimal Agent Factory to create, manage, and improve AI agents.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Creating Agents](#creating-agents)
4. [Managing Agents](#managing-agents)
5. [Benchmarking Agents](#benchmarking-agents)
6. [Improving Agents](#improving-agents)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

## Introduction

The Minimal Agent Factory is a system for creating, managing, and improving AI agents. It uses a modularized bootstrapping approach with specialized agents:

- **Factory Enhancer Agent**: Enhances the factory with advanced features
- **Benchmarking Agent**: Implements and runs benchmarks for agents
- **Continuous Learning Agent**: Improves agents through continuous learning

These specialized agents work together to create a feedback loop that continuously improves the agents over time.

## Architecture

The Minimal Agent Factory consists of several components:

- **Agent Registry**: Keeps track of all agents and their metadata
- **Agent Creator**: Creates new agents from templates
- **Agent Orchestrator**: Manages the lifecycle of agents
- **Template Manager**: Manages templates for creating agents

These components interact with the specialized agents through the Agent Communication system.

## Creating Agents

### Using Templates

The Minimal Agent Factory uses templates to create new agents. Templates are JSON files that define the structure and behavior of an agent.

To create a new agent from a template:

```javascript
const agentId = await factory.createAgent(
  'My Agent',
  'simple-agent',
  ['basic_agent', 'task_execution'],
  {
    description: 'A simple agent for testing'
  }
);
```

### Available Templates

The system includes several built-in templates:

1. **simple-agent**: A basic agent for testing
2. **research-agent**: An agent specialized in conducting research
3. **code-generation-agent**: An agent specialized in generating code

### Creating Custom Templates

You can create custom templates by adding JSON files to the `agent-templates` directory. A template file should have the following structure:

```json
{
  "name": "my-custom-template",
  "description": "A custom agent template",
  "capabilities": ["custom_capability"],
  "files": [
    {
      "path": "src/index.ts",
      "content": "// Template content with {{variables}}"
    }
  ],
  "dependencies": [
    "bootstrap-core"
  ],
  "setupInstructions": [
    "npm install",
    "npm run build",
    "npm start"
  ]
}
```

## Managing Agents

### Starting Agents

To start an agent:

```javascript
await factory.startAgent(agentId);
```

### Stopping Agents

To stop an agent:

```javascript
await factory.stopAgent(agentId);
```

### Restarting Agents

To restart an agent:

```javascript
await factory.restartAgent(agentId);
```

### Creating Tasks

To create a task for an agent:

```javascript
const taskId = await factory.createTask(
  agentId,
  'Task Name',
  'Task Description',
  {
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
);
```

### Creating Collaborative Tasks

To create a collaborative task for multiple agents:

```javascript
const taskId = await factory.createCollaborativeTask(
  [agentId1, agentId2],
  'Collaborative Task',
  'A task for multiple agents',
  {
    priority: 'high',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }
);
```

## Benchmarking Agents

The Benchmarking Agent provides tools for evaluating the performance of agents.

### Running Benchmarks

To run a benchmark on an agent:

```javascript
const benchmarkResult = await benchmarkingAgent.runBenchmark(
  agentId,
  'humaneval',
  {
    maxProblems: 10,
    timeout: 60000
  }
);
```

### Available Benchmarks

The system includes several built-in benchmarks:

1. **humaneval**: Evaluates code generation capabilities
2. **taubench**: Evaluates reasoning, planning, and adaptation capabilities

### Creating Custom Benchmarks

You can create custom benchmarks by implementing the Benchmark interface:

```typescript
interface Benchmark {
  name: string;
  description: string;
  runBenchmark(agentId: string, options?: any): Promise<BenchmarkResult>;
}
```

## Improving Agents

The Continuous Learning Agent provides tools for improving agents based on feedback and benchmark results.

### Processing Benchmark Results

When an agent is benchmarked, the results are automatically sent to the Continuous Learning Agent, which generates improvement recommendations:

```javascript
const recommendations = await continuousLearningAgent.processBenchmarkResults(benchmarkResult);
```

### Implementing Recommendations

The Continuous Learning Agent can automatically implement the recommendations:

```javascript
await continuousLearningAgent.implementRecommendations(recommendations);
```

### Fine-Tuning Models

The Continuous Learning Agent can fine-tune models based on feedback:

```javascript
const result = await continuousLearningAgent.fineTuneModel(
  agentId,
  {
    learningRate: 0.0001,
    epochs: 3,
    batchSize: 4
  }
);
```

## Advanced Usage

### Customizing the Factory

You can customize the factory by modifying the `MinimalAgentFactoryConfig`:

```typescript
const config: MinimalAgentFactoryConfig = {
  workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
  outputPath: path.join(process.cwd(), '..', '..', 'agents'),
  templatePath: path.join(process.cwd(), '..', '..', 'agent-templates'),
  agentSpecsPath: path.join(process.cwd(), '..', '..', 'agent-specs'),
  bootstrapAgents: {
    factoryEnhancerAgentId: 'factory-enhancer-agent',
    benchmarkingAgentId: 'benchmarking-agent',
    continuousLearningAgentId: 'continuous-learning-agent'
  }
};
```

### Extending the Factory

You can extend the factory by creating a subclass of `MinimalAgentFactory`:

```typescript
class CustomAgentFactory extends MinimalAgentFactory {
  // Add custom methods and properties
}
```

## Troubleshooting

### Common Issues

1. **Agent creation fails**: Check if the template exists and is valid
2. **Agent startup fails**: Check if the agent directory exists and has all required files
3. **Benchmarking fails**: Check if the benchmark server is running
4. **Improvement fails**: Check if the continuous learning agent is running

### Logs

Check the logs in the `logs` directory for more information about errors.

### Restarting the System

If you encounter persistent issues, try restarting the entire system:

1. Stop all agents and servers
2. Start the MCP servers
3. Start the bootstrap agents
4. Start the Minimal Agent Factory
