/**
 * Agent Orchestrator
 * 
 * Orchestrates the execution of agents and manages their lifecycle.
 */

import { AgentCommunication, logger } from 'bootstrap-core';
import { AgentRegistry } from '../registry/AgentRegistry';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class AgentOrchestrator {
  private agentCommunication: AgentCommunication;
  private agentRegistry: AgentRegistry;
  private runningAgents: Map<string, ChildProcess> = new Map();
  
  constructor(
    agentCommunication: AgentCommunication,
    agentRegistry: AgentRegistry
  ) {
    this.agentCommunication = agentCommunication;
    this.agentRegistry = agentRegistry;
  }
  
  /**
   * Initialize the orchestrator
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing agent orchestrator...');
    
    try {
      // No initialization needed for now
      logger.info('Agent orchestrator initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Start the orchestrator
   */
  public async start(): Promise<void> {
    logger.info('Starting agent orchestrator...');
    
    try {
      // No startup needed for now
      logger.info('Agent orchestrator started successfully');
    } catch (error) {
      logger.error(`Failed to start agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Stop the orchestrator
   */
  public async stop(): Promise<void> {
    logger.info('Stopping agent orchestrator...');
    
    try {
      // Stop all running agents
      for (const [agentId, process] of this.runningAgents.entries()) {
        await this.stopAgent(agentId);
      }
      
      logger.info('Agent orchestrator stopped successfully');
    } catch (error) {
      logger.error(`Failed to stop agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Start an agent
   */
  public async startAgent(agentId: string): Promise<void> {
    logger.info(`Starting agent: ${agentId}`);
    
    try {
      // Check if agent is already running
      if (this.runningAgents.has(agentId)) {
        logger.warn(`Agent ${agentId} is already running`);
        return;
      }
      
      // Get agent metadata
      const agentMetadata = this.agentRegistry.getAgentMetadata(agentId);
      
      if (!agentMetadata) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      // Check if agent has a path
      if (!agentMetadata.path) {
        throw new Error(`Agent ${agentId} has no path`);
      }
      
      // Check if agent directory exists
      if (!fs.existsSync(agentMetadata.path)) {
        throw new Error(`Agent directory not found: ${agentMetadata.path}`);
      }
      
      // Check if package.json exists
      const packageJsonPath = path.join(agentMetadata.path, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found for agent ${agentId}`);
      }
      
      // Install dependencies if node_modules doesn't exist
      const nodeModulesPath = path.join(agentMetadata.path, 'node_modules');
      
      if (!fs.existsSync(nodeModulesPath)) {
        logger.info(`Installing dependencies for agent ${agentId}...`);
        
        await new Promise<void>((resolve, reject) => {
          const npmInstall = spawn('npm', ['install'], {
            cwd: agentMetadata.path,
            shell: true
          });
          
          npmInstall.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`npm install failed with code ${code}`));
            }
          });
          
          npmInstall.on('error', (error) => {
            reject(error);
          });
        });
      }
      
      // Build the agent if dist directory doesn't exist
      const distPath = path.join(agentMetadata.path, 'dist');
      
      if (!fs.existsSync(distPath)) {
        logger.info(`Building agent ${agentId}...`);
        
        await new Promise<void>((resolve, reject) => {
          const npmBuild = spawn('npm', ['run', 'build'], {
            cwd: agentMetadata.path,
            shell: true
          });
          
          npmBuild.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`npm run build failed with code ${code}`));
            }
          });
          
          npmBuild.on('error', (error) => {
            reject(error);
          });
        });
      }
      
      // Start the agent
      logger.info(`Starting agent process for ${agentId}...`);
      
      const agentProcess = spawn('node', ['dist/index.js'], {
        cwd: agentMetadata.path,
        shell: true,
        stdio: 'pipe'
      });
      
      // Store the process
      this.runningAgents.set(agentId, agentProcess);
      
      // Handle process events
      agentProcess.on('close', (code) => {
        logger.info(`Agent ${agentId} process exited with code ${code}`);
        this.runningAgents.delete(agentId);
        this.agentRegistry.updateAgentStatus(agentId, 'offline');
      });
      
      agentProcess.on('error', (error) => {
        logger.error(`Error in agent ${agentId} process: ${error.message}`);
        this.runningAgents.delete(agentId);
        this.agentRegistry.updateAgentStatus(agentId, 'offline');
      });
      
      // Capture stdout and stderr
      agentProcess.stdout?.on('data', (data) => {
        logger.debug(`[${agentId}] ${data.toString().trim()}`);
      });
      
      agentProcess.stderr?.on('data', (data) => {
        logger.error(`[${agentId}] ${data.toString().trim()}`);
      });
      
      // Update agent status
      this.agentRegistry.updateAgentStatus(agentId, 'busy');
      
      logger.info(`Agent ${agentId} started successfully`);
    } catch (error) {
      logger.error(`Failed to start agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Stop an agent
   */
  public async stopAgent(agentId: string): Promise<void> {
    logger.info(`Stopping agent: ${agentId}`);
    
    try {
      // Check if agent is running
      if (!this.runningAgents.has(agentId)) {
        logger.warn(`Agent ${agentId} is not running`);
        return;
      }
      
      // Get the process
      const agentProcess = this.runningAgents.get(agentId)!;
      
      // Kill the process
      agentProcess.kill();
      
      // Remove from running agents
      this.runningAgents.delete(agentId);
      
      // Update agent status
      this.agentRegistry.updateAgentStatus(agentId, 'offline');
      
      logger.info(`Agent ${agentId} stopped successfully`);
    } catch (error) {
      logger.error(`Failed to stop agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Restart an agent
   */
  public async restartAgent(agentId: string): Promise<void> {
    logger.info(`Restarting agent: ${agentId}`);
    
    try {
      // Stop the agent if it's running
      if (this.runningAgents.has(agentId)) {
        await this.stopAgent(agentId);
      }
      
      // Start the agent
      await this.startAgent(agentId);
      
      logger.info(`Agent ${agentId} restarted successfully`);
    } catch (error) {
      logger.error(`Failed to restart agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
      // Check if agent exists
      const agent = this.agentRegistry.getAgent(agentId);
      
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      // Create task
      const taskId = this.agentCommunication.createSharedTask(
        'factory',
        [agentId],
        taskName,
        taskDescription,
        {
          assignees: [agentId],
          ...taskData
        }
      );
      
      logger.info(`Task created for agent ${agentId}: ${taskName} (${taskId})`);
      
      return taskId;
    } catch (error) {
      logger.error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
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
      // Check if all agents exist
      for (const agentId of agentIds) {
        const agent = this.agentRegistry.getAgent(agentId);
        
        if (!agent) {
          throw new Error(`Agent not found: ${agentId}`);
        }
      }
      
      // Create task
      const taskId = this.agentCommunication.createSharedTask(
        'factory',
        agentIds,
        taskName,
        taskDescription,
        {
          assignees: agentIds,
          ...taskData
        }
      );
      
      logger.info(`Collaborative task created: ${taskName} (${taskId})`);
      
      return taskId;
    } catch (error) {
      logger.error(`Failed to create collaborative task: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get running agents
   */
  public getRunningAgents(): string[] {
    return Array.from(this.runningAgents.keys());
  }
  
  /**
   * Check if an agent is running
   */
  public isAgentRunning(agentId: string): boolean {
    return this.runningAgents.has(agentId);
  }
}
