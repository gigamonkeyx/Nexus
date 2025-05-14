"use strict";
/**
 * Minimal Agent Factory
 *
 * A minimal factory for creating and managing AI agents.
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
exports.MinimalAgentFactory = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const AgentCreator_1 = require("./creation/AgentCreator");
const AgentRegistry_1 = require("./registry/AgentRegistry");
const AgentOrchestrator_1 = require("./orchestration/AgentOrchestrator");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class MinimalAgentFactory {
    constructor(nexusClient, adapterManager, agentCommunication, config) {
        this.nexusClient = nexusClient;
        this.adapterManager = adapterManager;
        this.agentCommunication = agentCommunication;
        this.config = config;
        this.factoryId = `minimal-agent-factory-${Date.now()}`;
        // Initialize components
        this.agentRegistry = new AgentRegistry_1.AgentRegistry(this.agentCommunication, path.join(this.config.workspacePath, 'registry'));
        this.agentCreator = new AgentCreator_1.AgentCreator(this.nexusClient, this.adapterManager, this.agentCommunication, this.agentRegistry, {
            templatePath: this.config.templatePath,
            outputPath: this.config.outputPath
        });
        this.agentOrchestrator = new AgentOrchestrator_1.AgentOrchestrator(this.agentCommunication, this.agentRegistry);
    }
    /**
     * Initialize the factory
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing Minimal Agent Factory...');
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
            bootstrap_core_1.logger.info('Minimal Agent Factory initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Start the factory
     */
    async start() {
        bootstrap_core_1.logger.info('Starting Minimal Agent Factory...');
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Start orchestrator
            await this.agentOrchestrator.start();
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info('Minimal Agent Factory started successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Error starting Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
        }
    }
    /**
     * Stop the factory
     */
    async stop() {
        bootstrap_core_1.logger.info('Stopping Minimal Agent Factory...');
        try {
            // Stop orchestrator
            await this.agentOrchestrator.stop();
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'offline');
            bootstrap_core_1.logger.info('Minimal Agent Factory stopped successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Error stopping Minimal Agent Factory: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Create an agent
     */
    async createAgent(name, type, capabilities, config = {}) {
        bootstrap_core_1.logger.info(`Creating agent: ${name} (${type})`);
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Create agent
            const agentId = await this.agentCreator.createAgent(name, type, capabilities, config);
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info(`Agent created: ${name} (${agentId})`);
            return agentId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            throw error;
        }
    }
    /**
     * Start an agent
     */
    async startAgent(agentId) {
        bootstrap_core_1.logger.info(`Starting agent: ${agentId}`);
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Start agent
            await this.agentOrchestrator.startAgent(agentId);
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info(`Agent started: ${agentId}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to start agent: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            throw error;
        }
    }
    /**
     * Stop an agent
     */
    async stopAgent(agentId) {
        bootstrap_core_1.logger.info(`Stopping agent: ${agentId}`);
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Stop agent
            await this.agentOrchestrator.stopAgent(agentId);
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info(`Agent stopped: ${agentId}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to stop agent: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            throw error;
        }
    }
    /**
     * Get all agents
     */
    async getAgents() {
        return this.agentRegistry.getAgents();
    }
    /**
     * Get agent by ID
     */
    async getAgent(agentId) {
        return this.agentRegistry.getAgent(agentId);
    }
    /**
     * Create a task for an agent
     */
    async createTask(agentId, taskName, taskDescription, taskData = {}) {
        bootstrap_core_1.logger.info(`Creating task for agent ${agentId}: ${taskName}`);
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Create task
            const taskId = await this.agentOrchestrator.createTask(agentId, taskName, taskDescription, taskData);
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info(`Task created for agent ${agentId}: ${taskName} (${taskId})`);
            return taskId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            throw error;
        }
    }
    /**
     * Create a collaborative task for multiple agents
     */
    async createCollaborativeTask(agentIds, taskName, taskDescription, taskData = {}) {
        bootstrap_core_1.logger.info(`Creating collaborative task for agents ${agentIds.join(', ')}: ${taskName}`);
        try {
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'busy');
            // Create collaborative task
            const taskId = await this.agentOrchestrator.createCollaborativeTask(agentIds, taskName, taskDescription, taskData);
            // Update status
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            bootstrap_core_1.logger.info(`Collaborative task created: ${taskName} (${taskId})`);
            return taskId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create collaborative task: ${error instanceof Error ? error.message : String(error)}`);
            this.agentCommunication.updateAgentStatus(this.factoryId, 'idle');
            throw error;
        }
    }
    /**
     * Ensure directories exist
     */
    ensureDirectories() {
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
    async registerBootstrapAgents() {
        bootstrap_core_1.logger.info('Registering bootstrap agents...');
        try {
            // Get all agents from communication system
            const agents = this.agentCommunication.getAgents();
            // Register factory enhancer agent
            if (this.config.bootstrapAgents.factoryEnhancerAgentId) {
                const factoryEnhancerAgent = agents.find(agent => agent.id === this.config.bootstrapAgents.factoryEnhancerAgentId ||
                    agent.type === 'factory-enhancer');
                if (factoryEnhancerAgent) {
                    await this.agentRegistry.registerAgent(factoryEnhancerAgent);
                    bootstrap_core_1.logger.info(`Registered factory enhancer agent: ${factoryEnhancerAgent.id}`);
                }
                else {
                    bootstrap_core_1.logger.warn('Factory enhancer agent not found');
                }
            }
            // Register benchmarking agent
            if (this.config.bootstrapAgents.benchmarkingAgentId) {
                const benchmarkingAgent = agents.find(agent => agent.id === this.config.bootstrapAgents.benchmarkingAgentId ||
                    agent.type === 'benchmarking');
                if (benchmarkingAgent) {
                    await this.agentRegistry.registerAgent(benchmarkingAgent);
                    bootstrap_core_1.logger.info(`Registered benchmarking agent: ${benchmarkingAgent.id}`);
                }
                else {
                    bootstrap_core_1.logger.warn('Benchmarking agent not found');
                }
            }
            // Register continuous learning agent
            if (this.config.bootstrapAgents.continuousLearningAgentId) {
                const continuousLearningAgent = agents.find(agent => agent.id === this.config.bootstrapAgents.continuousLearningAgentId ||
                    agent.type === 'continuous-learning');
                if (continuousLearningAgent) {
                    await this.agentRegistry.registerAgent(continuousLearningAgent);
                    bootstrap_core_1.logger.info(`Registered continuous learning agent: ${continuousLearningAgent.id}`);
                }
                else {
                    bootstrap_core_1.logger.warn('Continuous learning agent not found');
                }
            }
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to register bootstrap agents: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.MinimalAgentFactory = MinimalAgentFactory;
