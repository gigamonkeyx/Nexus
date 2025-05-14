/**
 * Factory Enhancer Agent
 *
 * An agent specialized in enhancing the AI Agent Factory with advanced features
 * like τ-Bench integration, continuous learning, and architecture improvements.
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
import { CodeGenerator } from './code/CodeGenerator';
import { CodeAnalyzer } from './code/CodeAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

// Extend the base agent config with factory enhancer specific properties
export interface FactoryEnhancerConfig extends BaseAgentConfig {
  collaborators: {
    benchmarkingAgentId?: string;
    learningAgentId?: string;
  };
}

export class FactoryEnhancerAgent {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentCommunication: AgentCommunication;
  private taskManager: TaskManager;
  private codeGenerator: CodeGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private config: FactoryEnhancerConfig;
  private agentId: string;
  private tasks: TaskSpecification[] = [];
  private currentTask: TaskSpecification | null = null;
  private messageCheckInterval: NodeJS.Timeout | null = null;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    agentCommunication: AgentCommunication,
    config: FactoryEnhancerConfig
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.agentCommunication = agentCommunication;
    this.config = config;
    this.agentId = `factory-enhancer-${Date.now()}`;

    // Initialize task manager
    this.taskManager = new TaskManager(this.agentId, this.agentCommunication);

    // Initialize code tools
    this.codeGenerator = new CodeGenerator(adapterManager);
    this.codeAnalyzer = new CodeAnalyzer(adapterManager);
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
        type: 'factory-enhancer',
        capabilities: [
          'code_generation',
          'code_analysis',
          'refactoring',
          'factory_enhancement'
        ],
        status: 'idle'
      });

      // Load task specifications
      await this.loadTaskSpecifications();

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
      if (task.name.includes('τ-Bench Integration')) {
        await this.implementTauBenchIntegration();
      } else if (task.name.includes('Continuous Learning Module')) {
        await this.implementContinuousLearningModule();
      } else if (task.name.includes('Enhance Agent Factory Architecture')) {
        await this.enhanceAgentFactoryArchitecture();
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
   * Implement τ-Bench integration
   */
  private async implementTauBenchIntegration(): Promise<void> {
    logger.info('Implementing τ-Bench integration...');

    try {
      // Create output directory
      const outputDir = path.join(this.config.outputPath, 'tau-bench');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // 1. Implement TauBenchAdapter
      logger.info('Generating TauBenchAdapter...');

      const adapterResult = await this.codeGenerator.generateClass(
        'TauBenchAdapter',
        'Adapter for the τ-bench framework that interfaces between our AI Agent Factory and τ-bench',
        [
          'Configuration options for domain, number of runs, max turns, etc.',
          'Method to run benchmarks for an agent',
          'Method to run individual scenarios',
          'Integration with other τ-bench components'
        ],
        'typescript',
        outputDir
      );

      // 2. Implement UserSimulator
      logger.info('Generating UserSimulator...');

      const userSimulatorResult = await this.codeGenerator.generateClass(
        'UserSimulator',
        'Simulates realistic user interactions with agents',
        [
          'Method to generate initial user messages',
          'Method to generate follow-up messages based on conversation history',
          'Integration with Ollama for LLM-based user simulation'
        ],
        'typescript',
        outputDir
      );

      // 3. Implement ToolAPIManager
      logger.info('Generating ToolAPIManager...');

      const toolAPIManagerResult = await this.codeGenerator.generateClass(
        'ToolAPIManager',
        'Manages simulated tool APIs for agents to interact with',
        [
          'Methods to initialize state for scenarios',
          'Methods to execute tool calls and update state',
          'Support for at least one domain (e.g., retail)'
        ],
        'typescript',
        outputDir
      );

      // 4. Implement PolicyEngine
      logger.info('Generating PolicyEngine...');

      const policyEngineResult = await this.codeGenerator.generateClass(
        'PolicyEngine',
        'Enforces domain-specific policies and guidelines',
        [
          'Methods to evaluate conversations against policies',
          'Support for different policy types (regex, semantic, LLM)',
          'Scoring mechanism for policy adherence'
        ],
        'typescript',
        outputDir
      );

      // 5. Implement TestScenarioManager
      logger.info('Generating TestScenarioManager...');

      const testScenarioManagerResult = await this.codeGenerator.generateClass(
        'TestScenarioManager',
        'Manages test scenarios for τ-bench',
        [
          'Methods to load scenarios from files',
          'Methods to get scenarios by domain',
          'Methods to create new scenarios'
        ],
        'typescript',
        outputDir
      );

      // 6. Implement ResultsAnalyzer
      logger.info('Generating ResultsAnalyzer...');

      const resultsAnalyzerResult = await this.codeGenerator.generateClass(
        'ResultsAnalyzer',
        'Analyzes results from τ-bench benchmarks',
        [
          'Methods to calculate pass^k metrics',
          'Methods to analyze benchmark results',
          'Methods to compare states'
        ],
        'typescript',
        outputDir
      );

      // 7. Create interfaces
      logger.info('Generating interfaces...');

      const interfacesResult = await this.codeGenerator.generateModule(
        'TauBenchInterfaces',
        'Interfaces for τ-bench components',
        [
          'Interface for τ-bench configuration',
          'Interface for test scenarios',
          'Interface for benchmark results',
          'Interface for conversation messages'
        ],
        'typescript',
        outputDir
      );

      // 8. Create index file
      logger.info('Generating index file...');

      const indexContent = `/**
 * τ-Bench Integration
 *
 * This module provides integration with the τ-bench framework for evaluating
 * agents in dynamic real-world settings with user and tool interactions.
 */

export * from './TauBenchAdapter';
export * from './UserSimulator';
export * from './ToolAPIManager';
export * from './PolicyEngine';
export * from './TestScenarioManager';
export * from './ResultsAnalyzer';
export * from './TauBenchInterfaces';
`;

      fs.writeFileSync(path.join(outputDir, 'index.ts'), indexContent);

      // 9. Create a retail domain scenario
      logger.info('Generating retail domain scenario...');

      const retailScenarioDir = path.join(outputDir, 'scenarios', 'retail');

      if (!fs.existsSync(retailScenarioDir)) {
        fs.mkdirSync(retailScenarioDir, { recursive: true });
      }

      const retailScenarioContent = `/**
 * Retail Domain Scenario
 *
 * This scenario tests an agent's ability to handle a retail customer service interaction.
 */

import { TestScenario } from '../TauBenchInterfaces';

export const retailOrderScenario: TestScenario = {
  id: 'retail-order-scenario',
  name: 'Retail Order Processing',
  description: 'A customer wants to place an order for a product and check its availability',
  domain: 'retail',
  userGoal: 'Place an order for a product and check its availability',
  userPersona: {
    name: 'Alex',
    preferences: ['quick delivery', 'quality products'],
    constraints: ['limited budget', 'needs product within a week']
  },
  initialState: {
    inventory: {
      'product-123': {
        name: 'Premium Headphones',
        price: 129.99,
        inStock: 5,
        deliveryTime: '3-5 days'
      },
      'product-456': {
        name: 'Wireless Keyboard',
        price: 79.99,
        inStock: 0,
        deliveryTime: '7-10 days'
      },
      'product-789': {
        name: 'Ergonomic Mouse',
        price: 49.99,
        inStock: 12,
        deliveryTime: '2-3 days'
      }
    },
    cart: [],
    user: {
      id: 'user-123',
      name: 'Alex Thompson',
      address: '123 Main St, Anytown, USA',
      paymentMethods: ['credit-card-1', 'paypal']
    }
  },
  expectedFinalState: {
    inventory: {
      'product-123': {
        name: 'Premium Headphones',
        price: 129.99,
        inStock: 4,
        deliveryTime: '3-5 days'
      },
      'product-456': {
        name: 'Wireless Keyboard',
        price: 79.99,
        inStock: 0,
        deliveryTime: '7-10 days'
      },
      'product-789': {
        name: 'Ergonomic Mouse',
        price: 49.99,
        inStock: 12,
        deliveryTime: '2-3 days'
      }
    },
    cart: [
      {
        productId: 'product-123',
        quantity: 1,
        price: 129.99
      }
    ],
    order: {
      id: 'order-123',
      userId: 'user-123',
      items: [
        {
          productId: 'product-123',
          quantity: 1,
          price: 129.99
        }
      ],
      total: 129.99,
      status: 'placed',
      deliveryEstimate: '3-5 days'
    },
    user: {
      id: 'user-123',
      name: 'Alex Thompson',
      address: '123 Main St, Anytown, USA',
      paymentMethods: ['credit-card-1', 'paypal']
    }
  },
  tools: [
    'search_products',
    'get_product_details',
    'check_inventory',
    'add_to_cart',
    'place_order'
  ],
  policies: [
    {
      id: 'policy-1',
      name: 'Customer Privacy',
      description: 'Do not share customer personal information',
      type: 'regex',
      pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b|\\b\\d{16}\\b',
      severity: 'critical'
    },
    {
      id: 'policy-2',
      name: 'Product Availability',
      description: 'Accurately communicate product availability',
      type: 'semantic',
      severity: 'high'
    },
    {
      id: 'policy-3',
      name: 'Pricing Accuracy',
      description: 'Accurately communicate product pricing',
      type: 'semantic',
      severity: 'high'
    }
  ],
  maxTurns: 10
};
`;

      fs.writeFileSync(path.join(retailScenarioDir, 'RetailOrderScenario.ts'), retailScenarioContent);

      // 10. Create a scenario index file
      const scenarioIndexContent = `/**
 * τ-Bench Scenarios
 *
 * This module provides scenarios for τ-bench benchmarks.
 */

export * from './retail/RetailOrderScenario';
`;

      fs.writeFileSync(path.join(outputDir, 'scenarios', 'index.ts'), scenarioIndexContent);

      // 11. Update AgentTester to integrate with τ-bench
      logger.info('Updating AgentTester to integrate with τ-bench...');

      // Check if AgentTester exists
      const agentTesterPath = path.join(this.config.outputPath, '..', 'agents', 'meta', 'AgentTester.ts');

      if (fs.existsSync(agentTesterPath)) {
        // Read the file
        const agentTesterContent = fs.readFileSync(agentTesterPath, 'utf-8');

        // Check if τ-bench is already integrated
        if (!agentTesterContent.includes('TauBenchAdapter')) {
          // Generate integration code
          const integrationCode = await this.codeGenerator.generateCode({
            type: 'function',
            name: 'runTauBench',
            description: 'Run τ-bench benchmarks for an agent',
            language: 'typescript',
            requirements: [
              'Add τ-bench adapter to AgentTester',
              'Implement method to run τ-bench benchmarks',
              'Update testAgent method to include τ-bench'
            ]
          });

          // Analyze the file to find the best place to add the code
          const analysis = await this.codeAnalyzer.analyzeCode({
            code: agentTesterContent,
            language: 'typescript',
            analysisTypes: ['maintainability']
          });

          // For now, we'll just notify about the needed changes
          logger.info(`AgentTester needs to be updated to integrate with τ-bench. Analysis: ${analysis.summary}`);

          // Share the integration code with the user
          this.agentCommunication.sendMessage({
            from: this.agentId,
            to: 'system',
            type: 'notification',
            subject: 'τ-Bench Integration Code for AgentTester',
            content: {
              code: integrationCode.code,
              analysis: analysis.summary,
              filePath: agentTesterPath
            }
          });
        } else {
          logger.info('AgentTester already has τ-bench integration');
        }
      } else {
        logger.warn(`AgentTester not found at ${agentTesterPath}`);
      }

      // 12. Notify collaborators
      logger.info('Notifying collaborators about τ-bench integration...');

      if (this.config.collaborators.benchmarkingAgentId) {
        this.agentCommunication.sendMessage({
          from: this.agentId,
          to: this.config.collaborators.benchmarkingAgentId,
          type: 'notification',
          subject: 'τ-Bench Integration Completed',
          content: {
            message: 'I have implemented the τ-bench integration. You can now use it to create scenarios and run benchmarks.',
            components: [
              'TauBenchAdapter',
              'UserSimulator',
              'ToolAPIManager',
              'PolicyEngine',
              'TestScenarioManager',
              'ResultsAnalyzer'
            ],
            outputDir
          }
        });
      }

      logger.info('τ-Bench integration completed successfully');
    } catch (error) {
      logger.error(`Failed to implement τ-Bench integration: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Implement continuous learning module
   */
  private async implementContinuousLearningModule(): Promise<void> {
    logger.info('Implementing continuous learning module...');

    // Implementation will be added in the next step
    // This is a placeholder
  }

  /**
   * Enhance agent factory architecture
   */
  private async enhanceAgentFactoryArchitecture(): Promise<void> {
    logger.info('Enhancing agent factory architecture...');

    // Implementation will be added in the next step
    // This is a placeholder
  }
}
