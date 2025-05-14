/**
 * Minimal Agent Factory
 * 
 * A minimal factory for creating and managing AI agents.
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  logger,
  LogLevel,
  AgentInfo,
  BaseAgentConfig
} from 'bootstrap-core';
import { AgentCreator } from './creation/AgentCreator';
import { AgentRegistry } from './registry/AgentRegistry';
import { AgentOrchestrator } from './orchestration/AgentOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

export interface MinimalAgentFactoryConfig {
  workspacePath: string;
  outputPath: string;
  templatePath: string;
  agentSpecsPath: string;
  bootstrapAgents: {
    factoryEnhancerAgentId?: string;
    benchmarkingAgentId?: string;
    continuousLearningAgentId?: string;
  };
}

export class MinimalAgentFactory {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentCommunication: AgentCommunication;
  private agentCreator: AgentCreator;
  private agentRegistry: AgentRegistry;
  private agentOrchestrator: AgentOrchestrator;
  private config: MinimalAgentFactoryConfig;
  private factoryId: string;
  
  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    agentCommunication: AgentCommunication,
    config: MinimalAgentFactoryConfig
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.agentCommunication = agentCommunication;
    this.config = config;
    this.factoryId = `minimal-agent-factory-${Date.now()}`;
    
    // Initialize components
    this.agentRegistry = new AgentRegistry(
      this.agentCommunication,
      path.join(this.config.workspacePath, 'registry')
    );
    
    this.agentCreator = new AgentCreator(
      this.nexusClient,
      this.adapterManager,
      this.agentCommunication,
      this.agentRegistry,
      {
        templatePath: this.config.templatePath,
        outputPath: this.config.outputPath
      }
    );
    
    this.agentOrchestrator = new AgentOrchestrator(
      this.agentCommunication,
      this.agentRegistry
    );
  }
  
  /**
   * Initialize the factory
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing Minimal Agent Factory...');
    
    try {
      // Ensure directories exist
      this.ensureDirectories();
      
      // Register with communication system
      this.agentCommunication.registerAgent({
        id: this.factoryId,
        name: 'Minimal Agent Factory',
        type: 'factory',
        capabilities: [
          'agent_creation',
          'agent_management',
          'agent_orchestration'
        ],
        status: 'idle'
      });
      
      // Initialize registry
      await this.agentRegistry.initialize();
      
      // Initialize creator
      await this.agentCreator.initialize();
      
      // Initialize orchestrator
      await this.agentOrchestrator.initialize();
      
      // Register bootstrap agents
      await this.registerBootstrapAgents();
      
      logger.info('Minimal Agent Factory initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Start the factory
   */
  public async start(): Promise<void> {
    logger.info('Starting Minimal Agent Factory...');
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Start orchestrator
      await this.agentOrchestrator.start();
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info('Minimal Agent Factory started successfully');
    } catch (error) {
      logger.error(`Error starting Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
    }
  }
  
  /**
   * Stop the factory
   */
  public async stop(): Promise<void> {
    logger.info('Stopping Minimal Agent Factory...');
    
    try {
      // Stop orchestrator
      await this.agentOrchestrator.stop();
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'offline');
      
      logger.info('Minimal Agent Factory stopped successfully');
    } catch (error) {
      logger.error(`Error stopping Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Create an agent
   */
  public async createAgent(
    name: string,
    type: string,
    capabilities: string[],
    config: any = {}
  ): Promise<string> {
    logger.info(`Creating agent: ${name} (${type})`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Create agent
      const agentId = await this.agentCreator.createAgent(
        name,
        type,
        capabilities,
        config
      );
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info(`Agent created: ${name} (${agentId})`);
      
      return agentId;
    } catch (error) {
      logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      throw error;
    }
  }
  
  /**
   * Start an agent
   */
  public async startAgent(agentId: string): Promise<void> {
    logger.info(`Starting agent: ${agentId}`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Start agent
      await this.agentOrchestrator.startAgent(agentId);
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info(`Agent started: ${agentId}`);
    } catch (error) {
      logger.error(`Failed to start agent: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      throw error;
    }
  }
  
  /**
   * Stop an agent
   */
  public async stopAgent(agentId: string): Promise<void> {
    logger.info(`Stopping agent: ${agentId}`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Stop agent
      await this.agentOrchestrator.stopAgent(agentId);
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info(`Agent stopped: ${agentId}`);
    } catch (error) {
      logger.error(`Failed to stop agent: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      throw error;
    }
  }
  
  /**
   * Get all agents
   */
  public async getAgents(): Promise<AgentInfo[]> {
    return this.agentRegistry.getAgents();
  }
  
  /**
   * Get agent by ID
   */
  public async getAgent(agentId: string): Promise<AgentInfo | null> {
    return this.agentRegistry.getAgent(agentId);
  }
  
  /**
   * Create a task for an agent
   */
  public async createTask(
    agentId: string,
    taskName: string,
    taskDescription: string,
    taskData: any = {}
  ): Promise<string> {
    logger.info(`Creating task for agent ${agentId}: ${taskName}`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Create task
      const taskId = await this.agentOrchestrator.createTask(
        agentId,
        taskName,
        taskDescription,
        taskData
      );
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info(`Task created for agent ${agentId}: ${taskName} (${taskId})`);
      
      return taskId;
    } catch (error) {
      logger.error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      throw error;
    }
  }
  
  /**
   * Create a collaborative task for multiple agents
   */
  public async createCollaborativeTask(
    agentIds: string[],
    taskName: string,
    taskDescription: string,
    taskData: any = {}
  ): Promise<string> {
    logger.info(`Creating collaborative task for agents ${agentIds.join(', ')}: ${taskName}`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
      
      // Create collaborative task
      const taskId = await this.agentOrchestrator.createCollaborativeTask(
        agentIds,
        taskName,
        taskDescription,
        taskData
      );
      
      // Update status
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      
      logger.info(`Collaborative task created: ${taskName} (${taskId})`);
      
      return taskId;
    } catch (error) {
      logger.error(`Failed to create collaborative task: ${error instanceof Error ? error.message : String(error)}`);
      this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
      throw error;
    }
  }
  
  /**
   * Ensure directories exist
   */
  private ensureDirectories(): void {
    // Ensure workspace directory exists
    if (!fs.existsSync(this.config.workspacePath)) {
      fs.mkdirSync(this.config.workspacePath, { recursive: true });
    }
    
    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputPath)) {
      fs.mkdirSync(this.config.outputPath, { recursive: true });
    }
    
    // Ensure template directory exists
    if (!fs.existsSync(this.config.templatePath)) {
      fs.mkdirSync(this.config.templatePath, { recursive: true });
    }
  }
  
  /**
   * Register bootstrap agents
   */
  private async registerBootstrapAgents(): Promise<void> {
    logger.info('Registering bootstrap agents...');
    
    try {
      // Get all agents from communication system
      const agents = this.agentCommunication.getAgents();
      
      // Register factory enhancer agent
      if (this.config.bootstrapAgents.factoryEnhancerAgentId) {
        const factoryEnhancerAgent = agents.find(agent => 
          agent.id === this.config.bootstrapAgents.factoryEnhancerAgentId ||
          agent.type === 'factory-enhancer'
        );
        
        if (factoryEnhancerAgent) {
          await this.agentRegistry.registerAgent(factoryEnhancerAgent);
          logger.info(`Registered factory enhancer agent: ${factoryEnhancerAgent.id}`);
        } else {
          logger.warn('Factory enhancer agent not found');
        }
      }
      
      // Register benchmarking agent
      if (this.config.bootstrapAgents.benchmarkingAgentId) {
        const benchmarkingAgent = agents.find(agent => 
          agent.id === this.config.bootstrapAgents.benchmarkingAgentId ||
          agent.type === 'benchmarking'
        );
        
        if (benchmarkingAgent) {
          await this.agentRegistry.registerAgent(benchmarkingAgent);
          logger.info(`Registered benchmarking agent: ${benchmarkingAgent.id}`);
        } else {
          logger.warn('Benchmarking agent not found');
        }
      }
      
      // Register continuous learning agent
      if (this.config.bootstrapAgents.continuousLearningAgentId) {
        const continuousLearningAgent = agents.find(agent => 
          agent.id === this.config.bootstrapAgents.continuousLearningAgentId ||
          agent.type === 'continuous-learning'
        );
        
        if (continuousLearningAgent) {
          await this.agentRegistry.registerAgent(continuousLearningAgent);
          logger.info(`Registered continuous learning agent: ${continuousLearningAgent.id}`);
        } else {
          logger.warn('Continuous learning agent not found');
        }
      }
    } catch (error) {
      logger.error(`Failed to register bootstrap agents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
