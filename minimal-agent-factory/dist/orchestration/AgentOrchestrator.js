"use strict";
/**
 * Agent Orchestrator
 *
 * Orchestrates the execution of agents and manages their lifecycle.
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
exports.AgentOrchestrator = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class AgentOrchestrator {
    constructor(agentCommunication, agentRegistry) {
        this.runningAgents = new Map();
        this.agentCommunication = agentCommunication;
        this.agentRegistry = agentRegistry;
    }
    /**
     * Initialize the orchestrator
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing agent orchestrator...');
        try {
            // No initialization needed for now
            bootstrap_core_1.logger.info('Agent orchestrator initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Start the orchestrator
     */
    async start() {
        bootstrap_core_1.logger.info('Starting agent orchestrator...');
        try {
            // No startup needed for now
            bootstrap_core_1.logger.info('Agent orchestrator started successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to start agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Stop the orchestrator
     */
    async stop() {
        bootstrap_core_1.logger.info('Stopping agent orchestrator...');
        try {
            // Stop all running agents
            for (const [agentId, process] of this.runningAgents.entries()) {
                await this.stopAgent(agentId);
            }
            bootstrap_core_1.logger.info('Agent orchestrator stopped successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to stop agent orchestrator: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Start an agent
     */
    async startAgent(agentId) {
        bootstrap_core_1.logger.info(`Starting agent: ${agentId}`);
        try {
            // Check if agent is already running
            if (this.runningAgents.has(agentId)) {
                bootstrap_core_1.logger.warn(`Agent ${agentId} is already running`);
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
                bootstrap_core_1.logger.info(`Installing dependencies for agent ${agentId}...`);
                await new Promise((resolve, reject) => {
                    const npmInstall = (0, child_process_1.spawn)('npm', ['install'], {
                        cwd: agentMetadata.path,
                        shell: true
                    });
                    npmInstall.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        }
                        else {
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
                bootstrap_core_1.logger.info(`Building agent ${agentId}...`);
                await new Promise((resolve, reject) => {
                    const npmBuild = (0, child_process_1.spawn)('npm', ['run', 'build'], {
                        cwd: agentMetadata.path,
                        shell: true
                    });
                    npmBuild.on('close', (code) => {
                        if (code === 0) {
                            resolve();
                        }
                        else {
                            reject(new Error(`npm run build failed with code ${code}`));
                        }
                    });
                    npmBuild.on('error', (error) => {
                        reject(error);
                    });
                });
            }
            // Start the agent
            bootstrap_core_1.logger.info(`Starting agent process for ${agentId}...`);
            const agentProcess = (0, child_process_1.spawn)('node', ['dist/index.js'], {
                cwd: agentMetadata.path,
                shell: true,
                stdio: 'pipe'
            });
            // Store the process
            this.runningAgents.set(agentId, agentProcess);
            // Handle process events
            agentProcess.on('close', (code) => {
                bootstrap_core_1.logger.info(`Agent ${agentId} process exited with code ${code}`);
                this.runningAgents.delete(agentId);
                this.agentRegistry.updateAgentStatus(agentId, 'offline');
            });
            agentProcess.on('error', (error) => {
                bootstrap_core_1.logger.error(`Error in agent ${agentId} process: ${error.message}`);
                this.runningAgents.delete(agentId);
                this.agentRegistry.updateAgentStatus(agentId, 'offline');
            });
            // Capture stdout and stderr
            agentProcess.stdout?.on('data', (data) => {
                bootstrap_core_1.logger.debug(`[${agentId}] ${data.toString().trim()}`);
            });
            agentProcess.stderr?.on('data', (data) => {
                bootstrap_core_1.logger.error(`[${agentId}] ${data.toString().trim()}`);
            });
            // Update agent status
            this.agentRegistry.updateAgentStatus(agentId, 'busy');
            bootstrap_core_1.logger.info(`Agent ${agentId} started successfully`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to start agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Stop an agent
     */
    async stopAgent(agentId) {
        bootstrap_core_1.logger.info(`Stopping agent: ${agentId}`);
        try {
            // Check if agent is running
            if (!this.runningAgents.has(agentId)) {
                bootstrap_core_1.logger.warn(`Agent ${agentId} is not running`);
                return;
            }
            // Get the process
            const agentProcess = this.runningAgents.get(agentId);
            // Kill the process
            agentProcess.kill();
            // Remove from running agents
            this.runningAgents.delete(agentId);
            // Update agent status
            this.agentRegistry.updateAgentStatus(agentId, 'offline');
            bootstrap_core_1.logger.info(`Agent ${agentId} stopped successfully`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to stop agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Restart an agent
     */
    async restartAgent(agentId) {
        bootstrap_core_1.logger.info(`Restarting agent: ${agentId}`);
        try {
            // Stop the agent if it's running
            if (this.runningAgents.has(agentId)) {
                await this.stopAgent(agentId);
            }
            // Start the agent
            await this.startAgent(agentId);
            bootstrap_core_1.logger.info(`Agent ${agentId} restarted successfully`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to restart agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create a task for an agent
     */
    async createTask(agentId, taskName, taskDescription, taskData = {}) {
        bootstrap_core_1.logger.info(`Creating task for agent ${agentId}: ${taskName}`);
        try {
            // Check if agent exists
            const agent = this.agentRegistry.getAgent(agentId);
            if (!agent) {
                throw new Error(`Agent not found: ${agentId}`);
            }
            // Create task
            const taskId = this.agentCommunication.createSharedTask('factory', [agentId], taskName, taskDescription, {
                assignees: [agentId],
                ...taskData
            });
            bootstrap_core_1.logger.info(`Task created for agent ${agentId}: ${taskName} (${taskId})`);
            return taskId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create a collaborative task for multiple agents
     */
    async createCollaborativeTask(agentIds, taskName, taskDescription, taskData = {}) {
        bootstrap_core_1.logger.info(`Creating collaborative task for agents ${agentIds.join(', ')}: ${taskName}`);
        try {
            // Check if all agents exist
            for (const agentId of agentIds) {
                const agent = this.agentRegistry.getAgent(agentId);
                if (!agent) {
                    throw new Error(`Agent not found: ${agentId}`);
                }
            }
            // Create task
            const taskId = this.agentCommunication.createSharedTask('factory', agentIds, taskName, taskDescription, {
                assignees: agentIds,
                ...taskData
            });
            bootstrap_core_1.logger.info(`Collaborative task created: ${taskName} (${taskId})`);
            return taskId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create collaborative task: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get running agents
     */
    getRunningAgents() {
        return Array.from(this.runningAgents.keys());
    }
    /**
     * Check if an agent is running
     */
    isAgentRunning(agentId) {
        return this.runningAgents.has(agentId);
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
