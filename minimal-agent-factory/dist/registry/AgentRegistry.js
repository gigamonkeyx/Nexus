"use strict";
/**
 * Agent Registry
 *
 * Manages the registry of agents in the system.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class AgentRegistry {
    constructor(agentCommunication, storagePath) {
        this.agents = new Map();
        this.agentCommunication = agentCommunication;
        this.storagePath = storagePath;
    }
    /**
     * Initialize the registry
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing agent registry...');
        try {
            // Ensure storage directory exists
            if (!fs.existsSync(this.storagePath)) {
                fs.mkdirSync(this.storagePath, { recursive: true });
            }
            // Load existing agents
            await this.loadAgents();
            bootstrap_core_1.logger.info('Agent registry initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize agent registry: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Register an agent
     */
    async registerAgent(agent, metadata = {}) {
        bootstrap_core_1.logger.info(`Registering agent: ${agent.name} (${agent.id})`);
        try {
            // Create agent metadata
            const agentMetadata = {
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
            bootstrap_core_1.logger.info(`Agent registered: ${agent.name} (${agent.id})`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to register agent: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Unregister an agent
     */
    async unregisterAgent(agentId) {
        bootstrap_core_1.logger.info(`Unregistering agent: ${agentId}`);
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
            bootstrap_core_1.logger.info(`Agent unregistered: ${agentId}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to unregister agent: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Update agent status
     */
    async updateAgentStatus(agentId, status) {
        bootstrap_core_1.logger.debug(`Updating agent status: ${agentId} -> ${status}`);
        try {
            // Check if agent exists
            if (!this.agents.has(agentId)) {
                throw new Error(`Agent not found: ${agentId}`);
            }
            // Update status
            const agent = this.agents.get(agentId);
            agent.status = status;
            // Update timestamps
            if (status === 'busy') {
                agent.lastStartedAt = new Date().toISOString();
            }
            else if (status === 'offline') {
                agent.lastStoppedAt = new Date().toISOString();
            }
            // Save to file
            await this.saveAgent(agent);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to update agent status: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Update agent metadata
     */
    async updateAgentMetadata(agentId, metadata) {
        bootstrap_core_1.logger.debug(`Updating agent metadata: ${agentId}`);
        try {
            // Check if agent exists
            if (!this.agents.has(agentId)) {
                throw new Error(`Agent not found: ${agentId}`);
            }
            // Update metadata
            const agent = this.agents.get(agentId);
            // Merge metadata
            Object.assign(agent, metadata);
            // Save to file
            await this.saveAgent(agent);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to update agent metadata: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get all agents
     */
    getAgents() {
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
    getAgent(agentId) {
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
    getAgentMetadata(agentId) {
        return this.agents.get(agentId) || null;
    }
    /**
     * Get agents by type
     */
    getAgentsByType(type) {
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
    getAgentsByCapability(capability) {
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
    getAgentsByStatus(status) {
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
    async loadAgents() {
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
                        const agent = JSON.parse(content);
                        this.agents.set(agent.id, agent);
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse agent file: ${filePath}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.agents.size} agents from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load agents: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Save agent to storage
     */
    async saveAgent(agent) {
        try {
            const filePath = path.join(this.storagePath, `${agent.id}.json`);
            fs.writeFileSync(filePath, JSON.stringify(agent, null, 2));
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to save agent: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.AgentRegistry = AgentRegistry;
