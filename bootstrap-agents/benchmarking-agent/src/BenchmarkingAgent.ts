/**
 * Benchmarking Agent
 *
 * An agent specialized in implementing and running benchmarks for other agents.
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  TaskManager,
  Message,
  BaseAgentConfig,
  logger,
  LogLevel,
  AgentInfo,
  TaskSpecification
} from 'bootstrap-core';
import { BenchmarkFramework } from './benchmarks/BenchmarkFramework';
import { HumanEvalBenchmark } from './benchmarks/HumanEvalBenchmark';
import * as fs from 'fs';
import * as path from 'path';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

// Extend the base agent config with benchmarking specific properties
export interface BenchmarkingConfig extends BaseAgentConfig {
  benchmarkServerUrl?: string;
  collaborators: {
    factoryEnhancerAgentId?: string;
    learningAgentId?: string;
  };
}

export class BenchmarkingAgent {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentCommunication: AgentCommunication;
  private taskManager: TaskManager;
  private benchmarkFramework: BenchmarkFramework;
  private config: BenchmarkingConfig;
  private agentId: string;
  private tasks: TaskSpecification[] = [];
  private currentTask: TaskSpecification | null = null;
  private messageCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    agentCommunication: AgentCommunication,
    config: BenchmarkingConfig
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.agentCommunication = agentCommunication;
    this.config = config;
    this.agentId = `benchmarking-agent-${Date.now()}`;

    // Initialize task manager
    this.taskManager = new TaskManager(this.agentId, this.agentCommunication);

    // Initialize benchmark framework
    this.benchmarkFramework = new BenchmarkFramework(adapterManager, this.agentCommunication);
  }

  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    logger.info(`Initializing ${this.config.name}...`);

    try {
      // Register with communication system
      this.agentCommunication.registerAgent({
        id: this.agentId,
        name: this.config.name,
        type: 'benchmarking',
        capabilities: [
          'code_generation',
          'benchmarking',
          'test_generation',
          'performance_analysis'
        ],
        status: 'idle'
      });

      // Load task specifications
      await this.loadTaskSpecifications();

      // Initialize benchmark framework
      await this.benchmarkFramework.initialize();

      // Start message checking
      this.startMessageChecking();

      logger.info(`${this.config.name} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Start the agent
   */
  public async start(): Promise<void> {
    logger.info(`Starting ${this.config.name}...`);

    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.agentId, 'busy');

      // Process any existing messages
      await this.processMessages();

      // Start working on tasks
      await this.startWorking();

      logger.info(`${this.config.name} started successfully`);
    } catch (error) {
      logger.error(`Error starting ${this.config.name}: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
    }
  }

  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    logger.info(`Stopping ${this.config.name}...`);

    // Stop message checking
    if (this.messageCheckInterval) {
      clearInterval(this.messageCheckInterval);
      this.messageCheckInterval = null;
    }

    // Update status
    this.agentCommunication.updateAgentStatus(this.agentId, 'offline');

    logger.info(`${this.config.name} stopped successfully`);
  }

  /**
   * Load task specifications
   */
  private async loadTaskSpecifications(): Promise<void> {
    try {
      // Check if task specs file exists
      if (fs.existsSync(this.config.taskSpecsPath)) {
        const content = fs.readFileSync(this.config.taskSpecsPath, 'utf-8');

        // Parse tasks from markdown
        this.tasks = this.parseTasksFromMarkdown(content);

        logger.info(`Loaded ${this.tasks.length} tasks from specifications`);
      } else {
        logger.warn(`Task specifications file not found: ${this.config.taskSpecsPath}`);

        // Check for messages with task specifications
        const messages = this.agentCommunication.getMessagesForAgent(this.agentId);

        for (const message of messages) {
          if (message.subject.includes('task') && message.content.filePath) {
            const filePath = message.content.filePath;

            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf-8');

              // Parse tasks from markdown
              this.tasks = this.parseTasksFromMarkdown(content);

              logger.info(`Loaded ${this.tasks.length} tasks from message: ${message.id}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      logger.error(`Error loading task specifications: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse tasks from markdown
   */
  private parseTasksFromMarkdown(markdown: string): TaskSpecification[] {
    // Use the TaskManager's parseTasksFromMarkdown method
    return this.taskManager.parseTasksFromMarkdown(markdown);
  }

  /**
   * Start message checking
   */
  private startMessageChecking(): void {
    // Check for new messages every 5 seconds
    this.messageCheckInterval = setInterval(async () => {
      await this.processMessages();
    }, 5000);
  }

  /**
   * Process messages
   */
  private async processMessages(): Promise<void> {
    try {
      // Get unread messages
      const messages = this.agentCommunication.getUnreadMessagesForAgent(this.agentId);

      for (const message of messages) {
        await this.handleMessage(message);

        // Mark as read
        this.agentCommunication.markMessageAsRead(message.id, this.agentId);
      }
    } catch (error) {
      logger.error(`Error processing messages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle a message
   */
  private async handleMessage(message: Message): Promise<void> {
    logger.info(`Handling message: ${message.subject} from ${message.from}`);

    try {
      // Handle different message types
      switch (message.type) {
        case 'request':
          await this.handleRequestMessage(message);
          break;
        case 'response':
          await this.handleResponseMessage(message);
          break;
        case 'notification':
          await this.handleNotificationMessage(message);
          break;
        case 'update':
          await this.handleUpdateMessage(message);
          break;
      }
    } catch (error) {
      logger.error(`Error handling message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle a request message
   */
  private async handleRequestMessage(message: Message): Promise<void> {
    // Check if it's a task assignment
    if (message.subject.includes('Task assignment')) {
      const taskContent = message.content;

      // Add to task manager
      this.taskManager.addTask({
        id: taskContent.taskId,
        name: taskContent.taskName,
        description: taskContent.taskDescription,
        assignees: taskContent.assignees,
        status: 'assigned'
      });

      // Send acknowledgment
      this.agentCommunication.replyToMessage(
        message.id,
        this.agentId,
        {
          status: 'accepted',
          message: `Task "${taskContent.taskName}" accepted`
        }
      );

      logger.info(`Accepted task: ${taskContent.taskName}`);
    }
    // Check if it's a benchmark request
    else if (message.subject.includes('Benchmark request')) {
      const benchmarkContent = message.content;

      // Run benchmark
      const result = await this.benchmarkFramework.runBenchmark(
        benchmarkContent.agentId,
        benchmarkContent.benchmarkType,
        benchmarkContent.options
      );

      // Send response
      this.agentCommunication.replyToMessage(
        message.id,
        this.agentId,
        {
          status: 'completed',
          result
        }
      );

      logger.info(`Completed benchmark for agent ${benchmarkContent.agentId}`);
    }
  }

  /**
   * Handle a response message
   */
  private async handleResponseMessage(message: Message): Promise<void> {
    // Implementation depends on what responses we expect
    logger.debug(`Received response: ${JSON.stringify(message.content)}`);
  }

  /**
   * Handle a notification message
   */
  private async handleNotificationMessage(message: Message): Promise<void> {
    // Check if it's a file share
    if (message.subject.includes('Shared file')) {
      const fileContent = message.content;

      logger.info(`Received shared file: ${fileContent.filePath}`);

      // If it's a task specification, load it
      if (fileContent.description.includes('task specification')) {
        if (fs.existsSync(fileContent.filePath)) {
          const content = fs.readFileSync(fileContent.filePath, 'utf-8');

          // Parse tasks from markdown
          const newTasks = this.parseTasksFromMarkdown(content);

          // Add to existing tasks
          this.tasks.push(...newTasks);

          logger.info(`Loaded ${newTasks.length} tasks from shared file`);

          // Send acknowledgment
          this.agentCommunication.replyToMessage(
            message.id,
            this.agentId,
            {
              status: 'received',
              message: `Loaded ${newTasks.length} tasks from shared file`
            }
          );
        }
      }
    }
    // Check if it's a τ-Bench integration notification
    else if (message.subject.includes('τ-Bench Integration Completed')) {
      logger.info('Received τ-Bench integration notification');

      // Store the τ-Bench components information
      const tauBenchInfo = message.content;

      // Send acknowledgment
      this.agentCommunication.replyToMessage(
        message.id,
        this.agentId,
        {
          status: 'received',
          message: 'Thank you for the τ-Bench integration. I will use it for benchmarking.'
        }
      );

      // Update benchmark framework with τ-Bench information
      this.benchmarkFramework.setTauBenchInfo(tauBenchInfo);
    }
  }

  /**
   * Handle an update message
   */
  private async handleUpdateMessage(message: Message): Promise<void> {
    // Check if it's a task status update
    if (message.subject.includes('Task status update')) {
      const updateContent = message.content;

      // Update task in task manager
      this.taskManager.updateTaskStatus(
        updateContent.taskId,
        updateContent.agentId,
        updateContent.status,
        updateContent.message
      );

      logger.info(`Task ${updateContent.taskId} status updated to ${updateContent.status} by ${updateContent.agentId}`);
    }
  }

  /**
   * Start working on tasks
   */
  private async startWorking(): Promise<void> {
    logger.info('Starting work on tasks...');

    // Get the first task
    if (this.tasks.length > 0) {
      this.currentTask = this.tasks[0];
      this.currentTask.status = 'in_progress';

      logger.info(`Working on task: ${this.currentTask.name}`);

      // Update task status
      this.taskManager.updateCurrentTaskStatus('in_progress', `Started working on ${this.currentTask.name}`);

      // Implement the task
      await this.implementTask(this.currentTask);
    } else {
      logger.info('No tasks to work on');
      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
    }
  }

  /**
   * Implement a task
   */
  private async implementTask(task: any): Promise<void> {
    logger.info(`Implementing task: ${task.name}`);

    try {
      // Different implementation based on task name
      if (task.name.includes('Basic Benchmarking Framework')) {
        await this.implementBenchmarkingFramework();
      } else if (task.name.includes('HumanEval Benchmark')) {
        await this.implementHumanEvalBenchmark();
      } else if (task.name.includes('τ-Bench Scenarios')) {
        await this.implementTauBenchScenarios();
      } else {
        logger.warn(`Unknown task: ${task.name}`);
      }

      // Mark task as completed
      task.status = 'completed';

      // Update task status
      this.taskManager.updateCurrentTaskStatus('completed', `Completed ${task.name}`);

      // Move to next task
      const taskIndex = this.tasks.findIndex(t => t.name === task.name);
      if (taskIndex >= 0 && taskIndex < this.tasks.length - 1) {
        this.currentTask = this.tasks[taskIndex + 1];
        this.currentTask.status = 'in_progress';

        logger.info(`Moving to next task: ${this.currentTask.name}`);

        // Update task status
        this.taskManager.updateCurrentTaskStatus('in_progress', `Started working on ${this.currentTask.name}`);

        // Implement the next task
        await this.implementTask(this.currentTask);
      } else {
        logger.info('All tasks completed');
        this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
      }
    } catch (error) {
      logger.error(`Error implementing task ${task.name}: ${error instanceof Error ? error.message : String(error)}`);

      // Mark task as failed
      task.status = 'failed';

      // Update task status
      this.taskManager.updateCurrentTaskStatus('blocked', `Failed to implement ${task.name}: ${error instanceof Error ? error.message : String(error)}`);

      // Set agent status to idle
      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
    }
  }

  /**
   * Implement benchmarking framework
   */
  private async implementBenchmarkingFramework(): Promise<void> {
    logger.info('Implementing basic benchmarking framework...');

    // Implementation will be added in the next step
    // This is a placeholder
  }

  /**
   * Implement HumanEval benchmark
   */
  private async implementHumanEvalBenchmark(): Promise<void> {
    logger.info('Implementing HumanEval benchmark...');

    // Implementation will be added in the next step
    // This is a placeholder
  }

  /**
   * Implement τ-Bench scenarios
   */
  private async implementTauBenchScenarios(): Promise<void> {
    logger.info('Implementing τ-Bench scenarios...');

    // Implementation will be added in the next step
    // This is a placeholder
  }
}
