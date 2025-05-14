/**
 * EnhancedModularAgentFramework
 * 
 * An enhanced framework for creating and managing modular AI agents.
 */

import { NexusClient } from './NexusClient';
import { Agent, AgentConfig } from '../agents/Agent';
import { LLMAdapter } from '../agents/LLMAdapter';
import { Module, ModuleConfig } from '../agents/modules/Module';
import { EventBus } from './EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource, AgentError } from './ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Enhanced modular agent configuration
 */
export interface EnhancedModularAgentConfig extends AgentConfig {
  modules?: ModuleConfig[];
  maxConcurrentTasks?: number;
  enableFallbacks?: boolean;
}

/**
 * Task status
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Task priority
 */
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Task interface
 */
export interface Task {
  id: string;
  agentName: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: AgentError;
  result?: any;
  execute: () => Promise<any>;
}

/**
 * EnhancedModularAgentFramework provides an enhanced framework for creating and managing modular AI agents.
 */
export class EnhancedModularAgentFramework {
  private nexusClient: NexusClient;
  private llmAdapter: LLMAdapter;
  private agents: Map<string, Agent> = new Map();
  private modules: Map<string, Module> = new Map();
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private taskQueue: Task[] = [];
  private runningTasks: Set<string> = new Set();
  private maxConcurrentTasks: number;
  private enableFallbacks: boolean;
  private pluginRegistry: Map<string, any> = new Map();

  /**
   * Creates a new EnhancedModularAgentFramework instance.
   * @param nexusClient NexusClient instance
   * @param llmAdapter LLMAdapter instance
   * @param config Framework configuration
   */
  constructor(
    nexusClient: NexusClient, 
    llmAdapter: LLMAdapter,
    config: {
      maxConcurrentTasks?: number;
      enableFallbacks?: boolean;
    } = {}
  ) {
    this.nexusClient = nexusClient;
    this.llmAdapter = llmAdapter;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.maxConcurrentTasks = config.maxConcurrentTasks || 5;
    this.enableFallbacks = config.enableFallbacks !== undefined ? config.enableFallbacks : true;
    
    // Register error handlers
    this.registerErrorHandlers();
    
    // Start task processor
    this.processTaskQueue();
  }

  /**
   * Register error handlers
   */
  private registerErrorHandlers(): void {
    // Register handler for MCP server errors
    this.errorHandling.registerHandler(ErrorSeverity.ERROR, (error: AgentError) => {
      if (error.source === ErrorSource.MCP_SERVER && this.enableFallbacks) {
        logger.warn(`Attempting fallback for MCP server error: ${error.message}`);
        this.eventBus.publish('mcp-server-error', error);
        return true;
      }
      return false;
    });
    
    // Register handler for module errors
    this.errorHandling.registerHandler(ErrorSeverity.ERROR, (error: AgentError) => {
      if (error.source === ErrorSource.MODULE) {
        logger.error(`Module error: ${error.message}`);
        this.eventBus.publish('module-error', error);
        return true;
      }
      return false;
    });
  }

  /**
   * Creates an agent.
   * @param config Agent configuration
   * @returns Created agent
   */
  async createAgent(config: EnhancedModularAgentConfig): Promise<Agent> {
    try {
      logger.info(`Creating agent: ${config.name}`);

      // Create agent
      const agent = new Agent(this.nexusClient, this.llmAdapter, config);

      // Register basic capabilities
      this.registerBasicCapabilities(agent);

      // Initialize modules
      if (config.modules) {
        for (const moduleConfig of config.modules) {
          await this.initializeModule(agent, moduleConfig).catch(error => {
            const agentError = this.errorHandling.createError(
              `Failed to initialize module ${moduleConfig.name}: ${error instanceof Error ? error.message : String(error)}`,
              ErrorSeverity.ERROR,
              ErrorSource.FRAMEWORK,
              error instanceof Error ? error : undefined,
              { moduleName: moduleConfig.name, agentName: config.name }
            );
            this.errorHandling.handleError(agentError);
          });
        }
      }

      // Store agent
      this.agents.set(config.name, agent);
      
      // Publish agent created event
      this.eventBus.publish('agent-created', { agent: config.name });

      logger.info(`Agent created successfully: ${config.name}`);
      return agent;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { agentName: config.name }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Registers basic capabilities with an agent.
   * @param agent Agent to register capabilities with
   */
  private registerBasicCapabilities(agent: Agent): void {
    // Register callTool capability
    agent.registerCapability('callTool', async (parameters: any) => {
      try {
        const { tool, parameters: toolParameters } = parameters;
        return await this.errorHandling.retry(
          () => this.nexusClient.callTool(tool, toolParameters),
          {
            retryableErrors: [
              'Network error',
              'Connection timeout',
              'Server unavailable',
              /5\d\d/  // 5xx status codes
            ]
          }
        );
      } catch (error) {
        const agentError = this.errorHandling.createError(
          `Failed to call tool: ${error instanceof Error ? error.message : String(error)}`,
          ErrorSeverity.ERROR,
          ErrorSource.MCP_SERVER,
          error instanceof Error ? error : undefined,
          { tool, agentName: agent.getName() }
        );
        await this.errorHandling.handleError(agentError);
        throw error;
      }
    });

    // Register getTools capability
    agent.registerCapability('getTools', async () => {
      try {
        return await this.errorHandling.retry(
          () => this.nexusClient.getTools(),
          {
            retryableErrors: [
              'Network error',
              'Connection timeout',
              'Server unavailable'
            ]
          }
        );
      } catch (error) {
        const agentError = this.errorHandling.createError(
          `Failed to get tools: ${error instanceof Error ? error.message : String(error)}`,
          ErrorSeverity.ERROR,
          ErrorSource.MCP_SERVER,
          error instanceof Error ? error : undefined,
          { agentName: agent.getName() }
        );
        await this.errorHandling.handleError(agentError);
        throw error;
      }
    });

    // Register getServerInfo capability
    agent.registerCapability('getServerInfo', async (parameters: any) => {
      try {
        const { serverId } = parameters;
        return await this.errorHandling.retry(
          () => this.nexusClient.getServerInfo(serverId),
          {
            retryableErrors: [
              'Network error',
              'Connection timeout',
              'Server unavailable'
            ]
          }
        );
      } catch (error) {
        const agentError = this.errorHandling.createError(
          `Failed to get server info: ${error instanceof Error ? error.message : String(error)}`,
          ErrorSeverity.ERROR,
          ErrorSource.MCP_SERVER,
          error instanceof Error ? error : undefined,
          { serverId, agentName: agent.getName() }
        );
        await this.errorHandling.handleError(agentError);
        throw error;
      }
    });

    // Register getMemory capability
    agent.registerCapability('getMemory', async () => {
      try {
        return agent.getMemory();
      } catch (error) {
        const agentError = this.errorHandling.createError(
          `Failed to get memory: ${error instanceof Error ? error.message : String(error)}`,
          ErrorSeverity.ERROR,
          ErrorSource.FRAMEWORK,
          error instanceof Error ? error : undefined,
          { agentName: agent.getName() }
        );
        await this.errorHandling.handleError(agentError);
        throw error;
      }
    });

    // Register clearMemory capability
    agent.registerCapability('clearMemory', async () => {
      try {
        agent.clearMemory();
        return { success: true };
      } catch (error) {
        const agentError = this.errorHandling.createError(
          `Failed to clear memory: ${error instanceof Error ? error.message : String(error)}`,
          ErrorSeverity.ERROR,
          ErrorSource.FRAMEWORK,
          error instanceof Error ? error : undefined,
          { agentName: agent.getName() }
        );
        await this.errorHandling.handleError(agentError);
        throw error;
      }
    });
  }

  /**
   * Initializes a module for an agent.
   * @param agent Agent to initialize module for
   * @param moduleConfig Module configuration
   * @returns Initialized module
   */
  async initializeModule(agent: Agent, moduleConfig: ModuleConfig): Promise<Module> {
    try {
      logger.info(`Initializing module ${moduleConfig.name} for agent ${agent.getName()}`);

      // Check if module already exists
      let module = this.modules.get(moduleConfig.name);

      if (!module) {
        // Create module instance
        const ModuleClass = await this.loadModuleClass(moduleConfig.name);
        module = new ModuleClass(moduleConfig);
        this.modules.set(moduleConfig.name, module);
      }

      // Initialize module
      await module.initialize(agent);
      
      // Register module with agent
      agent.registerModule(moduleConfig.name);
      
      // Publish module initialized event
      this.eventBus.publish('module-initialized', { 
        module: moduleConfig.name, 
        agent: agent.getName() 
      });

      logger.info(`Module ${moduleConfig.name} initialized for agent ${agent.getName()}`);
      return module;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize module: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { moduleName: moduleConfig.name, agentName: agent.getName() }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Loads a module class by name.
   * @param moduleName Module name
   * @returns Module class
   */
  private async loadModuleClass(moduleName: string): Promise<any> {
    try {
      // Check plugin registry first
      if (this.pluginRegistry.has(moduleName)) {
        return this.pluginRegistry.get(moduleName);
      }
      
      // In a real implementation, this would dynamically load the module class
      // For now, we'll use a simple switch statement
      switch (moduleName) {
        case 'CodingModule':
          return (await import('../agents/modules/CodingModule')).CodingModule;
        case 'AnalysisModule':
          return (await import('../agents/modules/AnalysisModule')).AnalysisModule;
        case 'VersionControlModule':
          return (await import('../agents/modules/VersionControlModule')).VersionControlModule;
        case 'PresentationModule':
          return (await import('../agents/modules/PresentationModule')).PresentationModule;
        case 'TextGenerationModule':
          return (await import('../agents/modules/TextGenerationModule')).TextGenerationModule;
        case 'ImageGenerationModule':
          return (await import('../agents/modules/ImageGenerationModule')).ImageGenerationModule;
        case 'ResearchModule':
          return (await import('../agents/modules/ResearchModule')).ResearchModule;
        default:
          throw new Error(`Module not found: ${moduleName}`);
      }
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to load module class: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { moduleName }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Executes a task with an agent.
   * @param agentName Agent name
   * @param taskDescription Task description
   * @param options Additional options
   * @returns Task result
   */
  async executeTask(
    agentName: string, 
    taskDescription: string, 
    options: {
      priority?: TaskPriority;
      waitForCompletion?: boolean;
    } = {}
  ): Promise<any> {
    try {
      logger.info(`Executing task with agent ${agentName}: ${taskDescription}`);

      // Get agent
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      // Create task
      const task: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        agentName,
        description: taskDescription,
        status: TaskStatus.PENDING,
        priority: options.priority !== undefined ? options.priority : TaskPriority.NORMAL,
        createdAt: new Date(),
        execute: async () => {
          // Try to handle task with modules
          for (const module of this.modules.values()) {
            if (module.handleTask) {
              try {
                const handled = await module.handleTask(taskDescription, agent);
                if (handled) {
                  logger.info(`Task handled by module ${module.getName()}`);
                  return { handled: true, module: module.getName() };
                }
              } catch (error) {
                const agentError = this.errorHandling.createError(
                  `Module ${module.getName()} failed to handle task: ${error instanceof Error ? error.message : String(error)}`,
                  ErrorSeverity.ERROR,
                  ErrorSource.MODULE,
                  error instanceof Error ? error : undefined,
                  { moduleName: module.getName(), agentName, task: taskDescription }
                );
                await this.errorHandling.handleError(agentError);
                // Continue trying other modules
              }
            }
          }

          // If no module handled the task, execute it with the agent
          return await agent.executeTask(taskDescription, options);
        }
      };

      // Add task to queue
      this.taskQueue.push(task);
      
      // Sort queue by priority
      this.taskQueue.sort((a, b) => b.priority - a.priority);
      
      // Publish task queued event
      this.eventBus.publish('task-queued', { 
        taskId: task.id, 
        agent: agentName, 
        description: taskDescription 
      });

      // If waitForCompletion is true, wait for task to complete
      if (options.waitForCompletion !== false) {
        return new Promise((resolve, reject) => {
          const subscription = this.eventBus.subscribe(`task-completed:${task.id}`, (result) => {
            subscription.unsubscribe();
            resolve(result);
          });
          
          const errorSubscription = this.eventBus.subscribe(`task-failed:${task.id}`, (error) => {
            errorSubscription.unsubscribe();
            reject(error);
          });
        });
      }

      // Otherwise, return task ID
      return { taskId: task.id };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to execute task: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { agentName, task: taskDescription }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Process the task queue
   */
  private async processTaskQueue(): Promise<void> {
    // Process tasks continuously
    while (true) {
      try {
        // Check if there are tasks to process and we're not at max concurrent tasks
        if (this.taskQueue.length > 0 && this.runningTasks.size < this.maxConcurrentTasks) {
          // Get next task
          const task = this.taskQueue.shift()!;
          
          // Mark task as running
          task.status = TaskStatus.RUNNING;
          task.startedAt = new Date();
          this.runningTasks.add(task.id);
          
          // Publish task started event
          this.eventBus.publish('task-started', { 
            taskId: task.id, 
            agent: task.agentName, 
            description: task.description 
          });
          
          // Execute task
          this.executeTaskAsync(task);
        }
        
        // Wait a short time before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Error in task queue processor: ${error instanceof Error ? error.message : String(error)}`);
        
        // Wait a bit longer before retrying after an error
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Execute a task asynchronously
   * @param task Task to execute
   */
  private async executeTaskAsync(task: Task): Promise<void> {
    try {
      // Execute task
      const result = await task.execute();
      
      // Mark task as completed
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.result = result;
      this.runningTasks.delete(task.id);
      
      // Publish task completed event
      this.eventBus.publish('task-completed', { 
        taskId: task.id, 
        agent: task.agentName, 
        result 
      });
      
      // Publish task-specific completed event
      this.eventBus.publish(`task-completed:${task.id}`, result);
    } catch (error) {
      // Create agent error
      const agentError = this.errorHandling.createError(
        `Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { 
          taskId: task.id, 
          agentName: task.agentName, 
          description: task.description 
        }
      );
      
      // Mark task as failed
      task.status = TaskStatus.FAILED;
      task.completedAt = new Date();
      task.error = agentError;
      this.runningTasks.delete(task.id);
      
      // Handle error
      await this.errorHandling.handleError(agentError);
      
      // Publish task failed event
      this.eventBus.publish('task-failed', { 
        taskId: task.id, 
        agent: task.agentName, 
        error: agentError 
      });
      
      // Publish task-specific failed event
      this.eventBus.publish(`task-failed:${task.id}`, agentError);
    }
  }

  /**
   * Gets an agent by name.
   * @param name Agent name
   * @returns Agent or null if not found
   */
  getAgent(name: string): Agent | null {
    return this.agents.get(name) || null;
  }

  /**
   * Gets all agents.
   * @returns Map of agent name to agent
   */
  getAllAgents(): Map<string, Agent> {
    return this.agents;
  }

  /**
   * Gets a module by name.
   * @param name Module name
   * @returns Module or null if not found
   */
  getModule(name: string): Module | null {
    return this.modules.get(name) || null;
  }

  /**
   * Gets all modules.
   * @returns Map of module name to module
   */
  getAllModules(): Map<string, Module> {
    return this.modules;
  }

  /**
   * Removes an agent by name.
   * @param name Agent name
   * @returns True if the agent was removed, false otherwise
   */
  removeAgent(name: string): boolean {
    return this.agents.delete(name);
  }

  /**
   * Removes a module by name.
   * @param name Module name
   * @returns True if the module was removed, false otherwise
   */
  removeModule(name: string): boolean {
    return this.modules.delete(name);
  }

  /**
   * Clears all agents.
   */
  clearAgents(): void {
    this.agents.clear();
  }

  /**
   * Clears all modules.
   */
  clearModules(): void {
    this.modules.clear();
  }

  /**
   * Gets the LLM adapter.
   * @returns LLM adapter
   */
  getLLMAdapter(): LLMAdapter {
    return this.llmAdapter;
  }

  /**
   * Sets the LLM adapter.
   * @param llmAdapter LLM adapter
   */
  setLLMAdapter(llmAdapter: LLMAdapter): void {
    this.llmAdapter = llmAdapter;
  }

  /**
   * Gets the event bus.
   * @returns Event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Gets the error handling system.
   * @returns Error handling system
   */
  getErrorHandling(): ErrorHandling {
    return this.errorHandling;
  }

  /**
   * Registers a plugin module.
   * @param name Plugin name
   * @param moduleClass Module class
   */
  registerPlugin(name: string, moduleClass: any): void {
    this.pluginRegistry.set(name, moduleClass);
    logger.info(`Registered plugin module: ${name}`);
  }

  /**
   * Gets the task queue.
   * @returns Task queue
   */
  getTaskQueue(): Task[] {
    return [...this.taskQueue];
  }

  /**
   * Gets the running tasks.
   * @returns Running tasks
   */
  getRunningTasks(): string[] {
    return [...this.runningTasks];
  }

  /**
   * Gets a task by ID.
   * @param taskId Task ID
   * @returns Task or null if not found
   */
  getTask(taskId: string): Task | null {
    // Check running tasks
    const runningTask = this.taskQueue.find(task => task.id === taskId);
    if (runningTask) {
      return runningTask;
    }
    
    // Task not found
    return null;
  }

  /**
   * Cancels a task.
   * @param taskId Task ID
   * @returns True if the task was cancelled, false otherwise
   */
  cancelTask(taskId: string): boolean {
    // Find task in queue
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex >= 0) {
      // Remove task from queue
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      
      // Mark task as cancelled
      task.status = TaskStatus.CANCELLED;
      task.completedAt = new Date();
      
      // Publish task cancelled event
      this.eventBus.publish('task-cancelled', { 
        taskId: task.id, 
        agent: task.agentName 
      });
      
      return true;
    }
    
    // Task not found or already running
    return false;
  }
}
