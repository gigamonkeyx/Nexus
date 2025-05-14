# Custom Agent Templates Guide

This guide explains how to create custom agent templates for the Minimal Agent Factory.

## Table of Contents

1. [Introduction](#introduction)
2. [Template Structure](#template-structure)
3. [Template Variables](#template-variables)
4. [File Structure](#file-structure)
5. [Dependencies](#dependencies)
6. [Setup Instructions](#setup-instructions)
7. [Example Templates](#example-templates)
8. [Best Practices](#best-practices)
9. [Testing Templates](#testing-templates)
10. [Troubleshooting](#troubleshooting)

## Introduction

Agent templates are JSON files that define the structure and behavior of an agent. They are used by the Minimal Agent Factory to create new agents.

Templates provide several benefits:

- **Consistency**: Ensure that all agents have a consistent structure
- **Reusability**: Reuse common code and patterns across multiple agents
- **Customization**: Customize agents for specific tasks and domains
- **Maintainability**: Make it easier to maintain and update agents

## Template Structure

A template is a JSON file with the following structure:

```json
{
  "name": "template-name",
  "description": "Template description",
  "capabilities": ["capability1", "capability2"],
  "files": [
    {
      "path": "file/path.ts",
      "content": "file content with {{variables}}"
    }
  ],
  "dependencies": [
    "dependency1",
    "dependency2"
  ],
  "setupInstructions": [
    "instruction1",
    "instruction2"
  ]
}
```

### Fields

- **name**: The name of the template (required)
- **description**: A description of the template (required)
- **capabilities**: An array of capabilities that the agent will have (required)
- **files**: An array of files to create for the agent (required)
- **dependencies**: An array of dependencies to install for the agent (required)
- **setupInstructions**: An array of instructions for setting up the agent (required)

## Template Variables

Templates can include variables that are replaced when an agent is created. Variables are enclosed in double curly braces: `{{variableName}}`.

### Built-in Variables

The following variables are automatically available:

- **name**: The name of the agent
- **description**: The description of the agent
- **agentId**: The ID of the agent
- **type**: The type of the agent (same as the template name)
- **capabilities**: The capabilities of the agent (as a JSON array)

### Custom Variables

You can define custom variables in the agent configuration:

```javascript
const agentId = await factory.createAgent(
  'My Agent',
  'simple-agent',
  ['basic_agent', 'task_execution'],
  {
    description: 'A simple agent for testing',
    customVariable: 'custom value'
  }
);
```

These variables can then be used in the template:

```json
{
  "path": "src/index.ts",
  "content": "const customValue = '{{customVariable}}';"
}
```

## File Structure

The `files` field is an array of file objects, each with a `path` and `content`:

```json
"files": [
  {
    "path": "src/index.ts",
    "content": "// File content"
  },
  {
    "path": "src/Agent.ts",
    "content": "// File content"
  }
]
```

### File Paths

File paths are relative to the agent directory. They can include subdirectories, which will be created automatically.

### File Content

File content can include template variables, which will be replaced when the agent is created.

## Dependencies

The `dependencies` field is an array of dependencies to install for the agent:

```json
"dependencies": [
  "bootstrap-core",
  "axios",
  "eventsource"
]
```

These dependencies will be added to the agent's `package.json` file.

## Setup Instructions

The `setupInstructions` field is an array of instructions for setting up the agent:

```json
"setupInstructions": [
  "npm install",
  "npm run build",
  "npm start"
]
```

These instructions are included in the agent's README.md file.

## Example Templates

### Simple Agent Template

```json
{
  "name": "simple-agent",
  "description": "A simple agent template for basic tasks",
  "capabilities": ["basic_agent", "task_execution"],
  "files": [
    {
      "path": "src/index.ts",
      "content": "/**\n * {{name}}\n * \n * {{description}}\n */\n\nimport {\n  NexusClient,\n  AdapterManager,\n  AgentCommunication,\n  TaskManager,\n  logger,\n  LogLevel,\n  BaseAgentConfig\n} from 'bootstrap-core';\nimport { SimpleAgent } from './SimpleAgent';\nimport * as path from 'path';\n\n// Set log level to debug for more detailed logging\nlogger.setLevel(LogLevel.DEBUG);\n\n/**\n * Main function\n */\nasync function main() {\n  try {\n    // Create NexusClient\n    const nexusClient = new NexusClient();\n    \n    // Register servers\n    const servers = ['ollama'];\n    \n    servers.forEach(server => {\n      nexusClient.registerServer(server, {\n        type: 'sse',\n        url: `http://localhost:${getPortForServer(server)}/sse`\n      });\n    });\n    \n    // Connect to servers\n    for (const server of servers) {\n      try {\n        await nexusClient.connectServer(server);\n        logger.info(`Connected to ${server} server`);\n      } catch (error) {\n        logger.warn(`Failed to connect to ${server} server: ${error instanceof Error ? error.message : String(error)}`);\n      }\n    }\n    \n    // Create AdapterManager\n    const adapterManager = new AdapterManager(nexusClient);\n    \n    // Create AgentCommunication\n    const agentCommunication = new AgentCommunication(nexusClient, {\n      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace')\n    });\n    \n    // Create Agent\n    const agentConfig: BaseAgentConfig = {\n      name: '{{name}}',\n      description: '{{description}}',\n      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),\n      taskSpecsPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'tasks', '{{agentId}}-tasks.md'),\n      outputPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'src', 'output'),\n      collaborators: {}\n    };\n    \n    const agent = new SimpleAgent(\n      nexusClient,\n      adapterManager,\n      agentCommunication,\n      agentConfig\n    );\n    \n    // Initialize the agent\n    await agent.initialize();\n    \n    // Start the agent\n    await agent.start();\n    \n    // Keep the process running\n    logger.info('{{name}} is running. Press Ctrl+C to stop.');\n    \n    // Handle process termination\n    process.on('SIGINT', async () => {\n      logger.info('Stopping {{name}}...');\n      await agent.stop();\n      process.exit(0);\n    });\n  } catch (error) {\n    logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);\n    process.exit(1);\n  }\n}\n\n/**\n * Get port for a server\n */\nfunction getPortForServer(server: string): number {\n  // Default ports for common servers\n  const serverPorts: Record<string, number> = {\n    'ollama': 3011,\n    'code-enhancement': 3020,\n    'lucidity': 3021,\n    'github': 3022,\n    'mcp-benchmark-server': 8020\n  };\n  \n  return serverPorts[server] || 3000;\n}\n\n// Run the main function\nmain().catch(error => {\n  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);\n  process.exit(1);\n});"
    },
    {
      "path": "src/SimpleAgent.ts",
      "content": "/**\n * {{name}}\n * \n * {{description}}\n */\n\nimport {\n  NexusClient,\n  AdapterManager,\n  AgentCommunication,\n  TaskManager,\n  Message,\n  BaseAgentConfig,\n  logger,\n  LogLevel,\n  AgentInfo,\n  TaskSpecification\n} from 'bootstrap-core';\nimport * as fs from 'fs';\nimport * as path from 'path';\n\nexport class SimpleAgent {\n  private nexusClient: NexusClient;\n  private adapterManager: AdapterManager;\n  private agentCommunication: AgentCommunication;\n  private taskManager: TaskManager;\n  private config: BaseAgentConfig;\n  private agentId: string;\n  private tasks: TaskSpecification[] = [];\n  private currentTask: TaskSpecification | null = null;\n  private messageCheckInterval: NodeJS.Timeout | null = null;\n  \n  constructor(\n    nexusClient: NexusClient,\n    adapterManager: AdapterManager,\n    agentCommunication: AgentCommunication,\n    config: BaseAgentConfig\n  ) {\n    this.nexusClient = nexusClient;\n    this.adapterManager = adapterManager;\n    this.agentCommunication = agentCommunication;\n    this.config = config;\n    this.agentId = `{{agentId}}`;\n    \n    // Initialize task manager\n    this.taskManager = new TaskManager(this.agentId, this.agentCommunication);\n  }\n  \n  /**\n   * Initialize the agent\n   */\n  public async initialize(): Promise<void> {\n    logger.info(`Initializing ${this.config.name}...`);\n    \n    try {\n      // Register with communication system\n      this.agentCommunication.registerAgent({\n        id: this.agentId,\n        name: this.config.name,\n        type: 'simple-agent',\n        capabilities: ['basic_agent', 'task_execution'],\n        status: 'idle'\n      });\n      \n      // Load task specifications\n      await this.loadTaskSpecifications();\n      \n      // Start message checking\n      this.startMessageChecking();\n      \n      logger.info(`${this.config.name} initialized successfully`);\n    } catch (error) {\n      logger.error(`Failed to initialize ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`);\n      throw error;\n    }\n  }\n  \n  /**\n   * Start the agent\n   */\n  public async start(): Promise<void> {\n    logger.info(`Starting ${this.config.name}...`);\n    \n    try {\n      // Update status\n      this.agentCommunication.updateAgentStatus(this.agentId, 'busy');\n      \n      // Process any existing messages\n      await this.processMessages();\n      \n      // Start working on tasks\n      await this.startWorking();\n      \n      logger.info(`${this.config.name} started successfully`);\n    } catch (error) {\n      logger.error(`Error starting ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`);\n      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');\n    }\n  }\n  \n  /**\n   * Stop the agent\n   */\n  public async stop(): Promise<void> {\n    logger.info(`Stopping ${this.config.name}...`);\n    \n    // Stop message checking\n    if (this.messageCheckInterval) {\n      clearInterval(this.messageCheckInterval);\n      this.messageCheckInterval = null;\n    }\n    \n    // Update status\n    this.agentCommunication.updateAgentStatus(this.agentId, 'offline');\n    \n    logger.info(`${this.config.name} stopped successfully`);\n  }\n  \n  /**\n   * Load task specifications\n   */\n  private async loadTaskSpecifications(): Promise<void> {\n    try {\n      // Check if task specs file exists\n      if (fs.existsSync(this.config.taskSpecsPath)) {\n        const content = fs.readFileSync(this.config.taskSpecsPath, 'utf-8');\n        \n        // Parse tasks from markdown\n        this.tasks = this.parseTasksFromMarkdown(content);\n        \n        logger.info(`Loaded ${this.tasks.length} tasks from specifications`);\n      } else {\n        logger.warn(`Task specifications file not found: ${this.config.taskSpecsPath}`);\n      }\n    } catch (error) {\n      logger.error(`Error loading task specifications: ${error instanceof Error ? error.message : String(error)}`);\n    }\n  }\n  \n  /**\n   * Parse tasks from markdown\n   */\n  private parseTasksFromMarkdown(markdown: string): TaskSpecification[] {\n    // Use the TaskManager's parseTasksFromMarkdown method\n    return this.taskManager.parseTasksFromMarkdown(markdown);\n  }\n  \n  /**\n   * Start message checking\n   */\n  private startMessageChecking(): void {\n    // Check for new messages every 5 seconds\n    this.messageCheckInterval = setInterval(async () => {\n      await this.processMessages();\n    }, 5000);\n  }\n  \n  /**\n   * Process messages\n   */\n  private async processMessages(): Promise<void> {\n    try {\n      // Get unread messages\n      const messages = this.agentCommunication.getUnreadMessagesForAgent(this.agentId);\n      \n      for (const message of messages) {\n        await this.handleMessage(message);\n        \n        // Mark as read\n        this.agentCommunication.markMessageAsRead(message.id, this.agentId);\n      }\n    } catch (error) {\n      logger.error(`Error processing messages: ${error instanceof Error ? error.message : String(error)}`);\n    }\n  }\n  \n  /**\n   * Handle a message\n   */\n  private async handleMessage(message: Message): Promise<void> {\n    logger.info(`Handling message: ${message.subject} from ${message.from}`);\n    \n    try {\n      // Handle different message types\n      switch (message.type) {\n        case 'request':\n          await this.handleRequestMessage(message);\n          break;\n        case 'response':\n          await this.handleResponseMessage(message);\n          break;\n        case 'notification':\n          await this.handleNotificationMessage(message);\n          break;\n        case 'update':\n          await this.handleUpdateMessage(message);\n          break;\n      }\n    } catch (error) {\n      logger.error(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);\n    }\n  }\n  \n  /**\n   * Handle a request message\n   */\n  private async handleRequestMessage(message: Message): Promise<void> {\n    // Check if it's a task assignment\n    if (message.subject.includes('Task assignment')) {\n      const taskContent = message.content;\n      \n      // Add to task manager\n      this.taskManager.addTask({\n        id: taskContent.taskId,\n        name: taskContent.taskName,\n        description: taskContent.taskDescription,\n        assignees: taskContent.assignees,\n        status: 'assigned'\n      });\n      \n      // Send acknowledgment\n      this.agentCommunication.replyToMessage(\n        message.id,\n        this.agentId,\n        {\n          status: 'accepted',\n          message: `Task \"${taskContent.taskName}\" accepted`\n        }\n      );\n      \n      logger.info(`Accepted task: ${taskContent.taskName}`);\n      \n      // Start working on the task\n      this.startWorking();\n    }\n  }\n  \n  /**\n   * Handle a response message\n   */\n  private async handleResponseMessage(message: Message): Promise<void> {\n    // Implementation depends on what responses we expect\n    logger.debug(`Received response: ${JSON.stringify(message.content)}`);\n  }\n  \n  /**\n   * Handle a notification message\n   */\n  private async handleNotificationMessage(message: Message): Promise<void> {\n    // Check if it's a file share\n    if (message.subject.includes('Shared file')) {\n      const fileContent = message.content;\n      \n      logger.info(`Received shared file: ${fileContent.filePath}`);\n      \n      // Send acknowledgment\n      this.agentCommunication.replyToMessage(\n        message.id,\n        this.agentId,\n        {\n          status: 'received',\n          message: `File received: ${path.basename(fileContent.filePath)}`\n        }\n      );\n    }\n  }\n  \n  /**\n   * Handle an update message\n   */\n  private async handleUpdateMessage(message: Message): Promise<void> {\n    // Check if it's a task status update\n    if (message.subject.includes('Task status update')) {\n      const updateContent = message.content;\n      \n      // Update task in task manager\n      this.taskManager.updateTaskStatus(\n        updateContent.taskId,\n        updateContent.agentId,\n        updateContent.status,\n        updateContent.message\n      );\n      \n      logger.info(`Task ${updateContent.taskId} status updated to ${updateContent.status} by ${updateContent.agentId}`);\n    }\n  }\n  \n  /**\n   * Start working on tasks\n   */\n  private async startWorking(): Promise<void> {\n    logger.info('Starting work on tasks...');\n    \n    try {\n      // Get current task from task manager\n      const currentTask = this.taskManager.getCurrentTask();\n      \n      if (currentTask) {\n        // Update task status\n        this.taskManager.updateTaskStatus(\n          currentTask.id,\n          this.agentId,\n          'in_progress',\n          `Started working on ${currentTask.name}`\n        );\n        \n        // Execute the task\n        await this.executeTask(currentTask);\n        \n        // Update task status\n        this.taskManager.updateTaskStatus(\n          currentTask.id,\n          this.agentId,\n          'completed',\n          `Completed ${currentTask.name}`\n        );\n        \n        // Move to next task\n        if (this.taskManager.moveToNextTask()) {\n          // Continue working\n          await this.startWorking();\n        } else {\n          // No more tasks\n          this.agentCommunication.updateAgentStatus(this.agentId, 'idle');\n        }\n      } else {\n        // No tasks to work on\n        this.agentCommunication.updateAgentStatus(this.agentId, 'idle');\n      }\n    } catch (error) {\n      logger.error(`Error working on tasks: ${error instanceof Error ? error.message : String(error)}`);\n      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');\n    }\n  }\n  \n  /**\n   * Execute a task\n   */\n  private async executeTask(task: any): Promise<void> {\n    logger.info(`Executing task: ${task.name}`);\n    \n    try {\n      // Simple task execution - just wait for a bit\n      await new Promise(resolve => setTimeout(resolve, 5000));\n      \n      // Log task completion\n      logger.info(`Task ${task.name} executed successfully`);\n    } catch (error) {\n      logger.error(`Error executing task ${task.name}: ${error instanceof Error ? error.message : String(error)}`);\n      throw error;\n    }\n  }\n}"
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

## Best Practices

### Keep Templates Simple

Templates should be simple and focused on a specific type of agent. Avoid creating complex templates that try to do too much.

### Use Variables

Use variables to make templates more flexible and reusable. This allows the same template to be used for different agents with different configurations.

### Include Documentation

Include documentation in the template files to explain how the agent works and how to use it.

### Follow Naming Conventions

Follow consistent naming conventions for files, variables, and functions to make the template easier to understand and maintain.

### Test Templates

Test templates thoroughly before using them to create agents. Make sure they work as expected and produce valid agents.

## Testing Templates

To test a template:

1. Create a test agent using the template:

```javascript
const agentId = await factory.createAgent(
  'Test Agent',
  'my-template',
  ['test_capability'],
  {
    description: 'A test agent for testing the template'
  }
);
```

2. Check the generated files to make sure they are correct:

```javascript
const agentDir = path.join(factory.config.outputPath, agentId);
const files = fs.readdirSync(agentDir);
```

3. Start the agent to make sure it works:

```javascript
await factory.startAgent(agentId);
```

4. Create a task for the agent to make sure it can execute tasks:

```javascript
const taskId = await factory.createTask(
  agentId,
  'Test Task',
  'A test task for testing the agent'
);
```

5. Stop the agent when you're done:

```javascript
await factory.stopAgent(agentId);
```

## Troubleshooting

### Template Not Found

If the template is not found, make sure the template file exists in the `agent-templates` directory and has the correct name.

### Variable Not Replaced

If a variable is not replaced, make sure it is enclosed in double curly braces (`{{variableName}}`) and that the variable is defined in the agent configuration or is a built-in variable.

### File Not Created

If a file is not created, make sure the file path is correct and that the directory exists. The agent creator will create directories automatically, but it's a good idea to check the path.

### Dependency Not Installed

If a dependency is not installed, make sure it is listed in the `dependencies` array and that the dependency is available in the npm registry or as a local package.
