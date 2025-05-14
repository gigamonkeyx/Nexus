/**
 * AgentRegistry - Component responsible for managing agent registrations
 * 
 * This component handles the registration, discovery, and management of agents
 * within the Nexus ecosystem.
 */

import { NexusClient } from '../../core/NexusClient';
import { logger } from '../../utils/logger';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentRegistration {
  agentId: string;
  name: string;
  description: string;
  type: string;
  version: string;
  capabilities: string[];
  mcpServers: string[];
  repositoryUrl?: string;
  deploymentUrl?: string;
  created: string;
  updated: string;
  status: 'active' | 'inactive' | 'deprecated';
  metadata?: Record<string, any>;
}

export class AgentRegistry {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private config: Record<string, any>;
  private registryPath: string;
  private agents: Map<string, AgentRegistration> = new Map();

  constructor(
    nexusClient: NexusClient,
    config: Record<string, any>
  ) {
    this.nexusClient = nexusClient;
    this.config = config;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.registryPath = config.registryPath || path.join(process.cwd(), 'agent-registry');
  }

  /**
   * Initialize the AgentRegistry
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing AgentRegistry...');
    
    try {
      // Ensure registry directory exists
      if (!fs.existsSync(this.registryPath)) {
        fs.mkdirSync(this.registryPath, { recursive: true });
      }
      
      // Load existing agents
      await this.loadAgents();
      
      logger.info(`AgentRegistry initialized with ${this.agents.size} agents`);
    } catch (error) {
      const registryError = this.errorHandling.createError(
        `Failed to initialize AgentRegistry: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined
      );
      
      await this.errorHandling.handleError(registryError);
      throw error;
    }
  }

  /**
   * Register a new agent
   */
  public async registerAgent(
    agentId: string,
    registration: Partial<AgentRegistration>
  ): Promise<AgentRegistration> {
    logger.info(`Registering agent: ${registration.name} (${agentId})`);
    
    try {
      // Check if agent already exists
      if (this.agents.has(agentId)) {
        // Update existing agent
        return this.updateAgent(agentId, registration);
      }
      
      // Create new registration
      const now = new Date().toISOString();
      const newRegistration: AgentRegistration = {
        agentId,
        name: registration.name || 'Unnamed Agent',
        description: registration.description || '',
        type: registration.type || 'unknown',
        version: registration.version || '0.1.0',
        capabilities: registration.capabilities || [],
        mcpServers: registration.mcpServers || [],
        repositoryUrl: registration.repositoryUrl,
        deploymentUrl: registration.deploymentUrl,
        created: now,
        updated: now,
        status: 'active',
        metadata: registration.metadata
      };
      
      // Save registration
      this.agents.set(agentId, newRegistration);
      await this.saveAgent(agentId, newRegistration);
      
      // Register with Nexus
      await this.registerWithNexus(newRegistration);
      
      // Emit registration event
      this.eventBus.publish('agent:registered', {
        agentId,
        name: newRegistration.name,
        type: newRegistration.type
      });
      
      logger.info(`Agent ${newRegistration.name} registered successfully`);
      
      return newRegistration;
    } catch (error) {
      const registryError = this.errorHandling.createError(
        `Failed to register agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { agentId, registration }
      );
      
      await this.errorHandling.handleError(registryError);
      throw error;
    }
  }

  /**
   * Update an existing agent registration
   */
  public async updateAgent(
    agentId: string,
    updates: Partial<AgentRegistration>
  ): Promise<AgentRegistration> {
    logger.info(`Updating agent: ${agentId}`);
    
    try {
      // Check if agent exists
      const existingRegistration = this.agents.get(agentId);
      if (!existingRegistration) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Update registration
      const updatedRegistration: AgentRegistration = {
        ...existingRegistration,
        ...updates,
        agentId, // Ensure agentId doesn't change
        updated: new Date().toISOString()
      };
      
      // Save registration
      this.agents.set(agentId, updatedRegistration);
      await this.saveAgent(agentId, updatedRegistration);
      
      // Update with Nexus
      await this.updateWithNexus(updatedRegistration);
      
      // Emit update event
      this.eventBus.publish('agent:updated', {
        agentId,
        name: updatedRegistration.name,
        type: updatedRegistration.type
      });
      
      logger.info(`Agent ${updatedRegistration.name} updated successfully`);
      
      return updatedRegistration;
    } catch (error) {
      const registryError = this.errorHandling.createError(
        `Failed to update agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { agentId, updates }
      );
      
      await this.errorHandling.handleError(registryError);
      throw error;
    }
  }

  /**
   * Deactivate an agent
   */
  public async deactivateAgent(agentId: string): Promise<AgentRegistration> {
    logger.info(`Deactivating agent: ${agentId}`);
    
    try {
      // Check if agent exists
      const existingRegistration = this.agents.get(agentId);
      if (!existingRegistration) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Update status
      const updatedRegistration: AgentRegistration = {
        ...existingRegistration,
        status: 'inactive',
        updated: new Date().toISOString()
      };
      
      // Save registration
      this.agents.set(agentId, updatedRegistration);
      await this.saveAgent(agentId, updatedRegistration);
      
      // Update with Nexus
      await this.updateWithNexus(updatedRegistration);
      
      // Emit deactivation event
      this.eventBus.publish('agent:deactivated', {
        agentId,
        name: updatedRegistration.name,
        type: updatedRegistration.type
      });
      
      logger.info(`Agent ${updatedRegistration.name} deactivated successfully`);
      
      return updatedRegistration;
    } catch (error) {
      const registryError = this.errorHandling.createError(
        `Failed to deactivate agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { agentId }
      );
      
      await this.errorHandling.handleError(registryError);
      throw error;
    }
  }

  /**
   * Get an agent registration
   */
  public async getAgent(agentId: string): Promise<AgentRegistration> {
    logger.debug(`Getting agent: ${agentId}`);
    
    const registration = this.agents.get(agentId);
    if (!registration) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    return registration;
  }

  /**
   * List all agents
   */
  public async listAgents(
    filter?: {
      type?: string;
      status?: 'active' | 'inactive' | 'deprecated';
      capability?: string;
    }
  ): Promise<AgentRegistration[]> {
    logger.debug('Listing agents');
    
    let agents = Array.from(this.agents.values());
    
    // Apply filters
    if (filter) {
      if (filter.type) {
        agents = agents.filter(agent => agent.type === filter.type);
      }
      
      if (filter.status) {
        agents = agents.filter(agent => agent.status === filter.status);
      }
      
      if (filter.capability) {
        agents = agents.filter(agent => agent.capabilities.includes(filter.capability!));
      }
    }
    
    return agents;
  }

  /**
   * Find agents by capability
   */
  public async findAgentsByCapability(capability: string): Promise<AgentRegistration[]> {
    logger.debug(`Finding agents with capability: ${capability}`);
    
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'active' && agent.capabilities.includes(capability));
  }

  /**
   * Find agents by MCP server
   */
  public async findAgentsByMCPServer(serverId: string): Promise<AgentRegistration[]> {
    logger.debug(`Finding agents using MCP server: ${serverId}`);
    
    return Array.from(this.agents.values())
      .filter(agent => agent.status === 'active' && agent.mcpServers.includes(serverId));
  }

  /**
   * Load agents from disk
   */
  private async loadAgents(): Promise<void> {
    logger.debug('Loading agents from registry');
    
    try {
      // Get all agent files
      const files = fs.readdirSync(this.registryPath);
      
      // Load each agent
      for (const file of files) {
        if (!file.endsWith('.json')) {
          continue;
        }
        
        const agentId = file.replace('.json', '');
        const filePath = path.join(this.registryPath, file);
        
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const registration = JSON.parse(content) as AgentRegistration;
          
          this.agents.set(agentId, registration);
          logger.debug(`Loaded agent: ${registration.name} (${agentId})`);
        } catch (error) {
          logger.warn(`Failed to load agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to load agents: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Save agent to disk
   */
  private async saveAgent(agentId: string, registration: AgentRegistration): Promise<void> {
    logger.debug(`Saving agent: ${registration.name} (${agentId})`);
    
    try {
      const filePath = path.join(this.registryPath, `${agentId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(registration, null, 2));
    } catch (error) {
      logger.error(`Failed to save agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Register agent with Nexus
   */
  private async registerWithNexus(registration: AgentRegistration): Promise<void> {
    logger.debug(`Registering agent with Nexus: ${registration.name} (${registration.agentId})`);
    
    try {
      // Register agent with Nexus
      await this.nexusClient.registerAgent(registration.agentId, {
        name: registration.name,
        description: registration.description,
        capabilities: registration.capabilities,
        mcpServers: registration.mcpServers
      });
    } catch (error) {
      logger.warn(`Failed to register agent with Nexus: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error, as this is not critical
    }
  }

  /**
   * Update agent with Nexus
   */
  private async updateWithNexus(registration: AgentRegistration): Promise<void> {
    logger.debug(`Updating agent with Nexus: ${registration.name} (${registration.agentId})`);
    
    try {
      // Update agent with Nexus
      await this.nexusClient.updateAgent(registration.agentId, {
        name: registration.name,
        description: registration.description,
        capabilities: registration.capabilities,
        mcpServers: registration.mcpServers,
        status: registration.status
      });
    } catch (error) {
      logger.warn(`Failed to update agent with Nexus: ${error instanceof Error ? error.message : String(error)}`);
      // Don't throw error, as this is not critical
    }
  }
}
