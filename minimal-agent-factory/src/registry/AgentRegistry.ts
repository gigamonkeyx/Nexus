/**
 * Agent Registry
 * 
 * Manages the registry of agents in the system.
 */

import { AgentCommunication, AgentInfo, logger } from 'bootstrap-core';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentMetadata {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline';
  path?: string;
  config?: any;
  createdAt: string;
  lastStartedAt?: string;
  lastStoppedAt?: string;
}

export class AgentRegistry {
  private agentCommunication: AgentCommunication;
  private storagePath: string;
  private agents: Map<string, AgentMetadata> = new Map();
  
  constructor(agentCommunication: AgentCommunication, storagePath: string) {
    this.agentCommunication = agentCommunication;
    this.storagePath = storagePath;
  }
  
  /**
   * Initialize the registry
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing agent registry...');
    
    try {
      // Ensure storage directory exists
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, { recursive: true });
      }
      
      // Load existing agents
      await this.loadAgents();
      
      logger.info('Agent registry initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize agent registry: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Register an agent
   */
  public async registerAgent(agent: AgentInfo, metadata: any = {}): Promise<void> {
    logger.info(`Registering agent: ${agent.name} (${agent.id})`);
    
    try {
      // Create agent metadata
      const agentMetadata: AgentMetadata = {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        status: agent.status,
        ...metadata,
        createdAt: new Date().toISOString()
      };
      
      // Store agent metadata
      this.agents.set(agent.id, agentMetadata);
      
      // Save to file
      await this.saveAgent(agentMetadata);
      
      logger.info(`Agent registered: ${agent.name} (${agent.id})`);
    } catch (error) {
      logger.error(`Failed to register agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Unregister an agent
   */
  public async unregisterAgent(agentId: string): Promise<void> {
    logger.info(`Unregistering agent: ${agentId}`);
    
    try {
      // Check if agent exists
      if (!this.agents.has(agentId)) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      // Remove agent
      this.agents.delete(agentId);
      
      // Remove from file
      const filePath = path.join(this.storagePath, `${agentId}.json`);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      logger.info(`Agent unregistered: ${agentId}`);
    } catch (error) {
      logger.error(`Failed to unregister agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update agent status
   */
  public async updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline'): Promise<void> {
    logger.debug(`Updating agent status: ${agentId} -> ${status}`);
    
    try {
      // Check if agent exists
      if (!this.agents.has(agentId)) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      // Update status
      const agent = this.agents.get(agentId)!;
      agent.status = status;
      
      // Update timestamps
      if (status === 'busy') {
        agent.lastStartedAt = new Date().toISOString();
      } else if (status === 'offline') {
        agent.lastStoppedAt = new Date().toISOString();
      }
      
      // Save to file
      await this.saveAgent(agent);
    } catch (error) {
      logger.error(`Failed to update agent status: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Update agent metadata
   */
  public async updateAgentMetadata(agentId: string, metadata: any): Promise<void> {
    logger.debug(`Updating agent metadata: ${agentId}`);
    
    try {
      // Check if agent exists
      if (!this.agents.has(agentId)) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      
      // Update metadata
      const agent = this.agents.get(agentId)!;
      
      // Merge metadata
      Object.assign(agent, metadata);
      
      // Save to file
      await this.saveAgent(agent);
    } catch (error) {
      logger.error(`Failed to update agent metadata: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all agents
   */
  public getAgents(): AgentInfo[] {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      capabilities: agent.capabilities,
      status: agent.status
    }));
  }
  
  /**
   * Get agent by ID
   */
  public getAgent(agentId: string): AgentInfo | null {
    const agent = this.agents.get(agentId);
    
    if (!agent) {
      return null;
    }
    
    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      capabilities: agent.capabilities,
      status: agent.status
    };
  }
  
  /**
   * Get agent metadata
   */
  public getAgentMetadata(agentId: string): AgentMetadata | null {
    return this.agents.get(agentId) || null;
  }
  
  /**
   * Get agents by type
   */
  public getAgentsByType(type: string): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.type === type)
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        status: agent.status
      }));
  }
  
  /**
   * Get agents by capability
   */
  public getAgentsByCapability(capability: string): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.capabilities.includes(capability))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        status: agent.status
      }));
  }
  
  /**
   * Get agents by status
   */
  public getAgentsByStatus(status: 'idle' | 'busy' | 'offline'): AgentInfo[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.status === status)
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities,
        status: agent.status
      }));
  }
  
  /**
   * Load agents from storage
   */
  private async loadAgents(): Promise<void> {
    try {
      // Check if storage directory exists
      if (!fs.existsSync(this.storagePath)) {
        return;
      }
      
      // Get all agent files
      const files = fs.readdirSync(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storagePath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          
          try {
            const agent = JSON.parse(content) as AgentMetadata;
            this.agents.set(agent.id, agent);
          } catch (error) {
            logger.warn(`Failed to parse agent file: ${filePath}`);
          }
        }
      }
      
      logger.info(`Loaded ${this.agents.size} agents from storage`);
    } catch (error) {
      logger.error(`Failed to load agents: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Save agent to storage
   */
  private async saveAgent(agent: AgentMetadata): Promise<void> {
    try {
      const filePath = path.join(this.storagePath, `${agent.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(agent, null, 2));
    } catch (error) {
      logger.error(`Failed to save agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
