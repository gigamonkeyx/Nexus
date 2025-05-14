"use strict";
/**
 * Factory Enhancer Agent
 *
 * An agent specialized in enhancing the AI Agent Factory with advanced features
 * like τ-Bench integration, continuous learning, and architecture improvements.
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
const bootstrap_core_1 = require("bootstrap-core");
const FactoryEnhancerAgent_1 = require("./FactoryEnhancerAgent");
const path = __importStar(require("path"));
// Set log level to debug for more detailed logging
bootstrap_core_1.logger.setLevel(bootstrap_core_1.LogLevel.DEBUG);
/**
 * Main function
 */
async function main() {
    try {
        // Create NexusClient
        const nexusClient = new bootstrap_core_1.NexusClient();
        // Register servers
        const servers = ['ollama', 'code-enhancement', 'lucidity'];
        servers.forEach(server => {
            nexusClient.registerServer(server, {
                type: 'sse',
                url: `http://localhost:${getPortForServer(server)}/sse`
            });
        });
        // Connect to servers
        for (const server of servers) {
            try {
                await nexusClient.connectServer(server);
                bootstrap_core_1.logger.info(`Connected to ${server} server`);
            }
            catch (error) {
                bootstrap_core_1.logger.warn(`Failed to connect to ${server} server: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Create AdapterManager
        const adapterManager = new bootstrap_core_1.AdapterManager(nexusClient);
        // Create AgentCommunication
        const agentCommunication = new bootstrap_core_1.AgentCommunication(nexusClient, {
            workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace')
        });
        // Create FactoryEnhancerAgent
        const agentConfig = {
            name: 'Factory Enhancer Agent',
            description: 'An agent specialized in enhancing the AI Agent Factory',
            workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
            taskSpecsPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'tasks', 'factory-enhancer-tasks.md'),
            outputPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'src', 'benchmarks'),
            collaborators: {
                benchmarkingAgentId: 'benchmarking-agent',
                learningAgentId: 'continuous-learning-agent'
            }
        };
        const agent = new FactoryEnhancerAgent_1.FactoryEnhancerAgent(nexusClient, adapterManager, agentCommunication, agentConfig);
        // Initialize the agent
        await agent.initialize();
        // Start the agent
        await agent.start();
        // Keep the process running
        bootstrap_core_1.logger.info('Factory Enhancer Agent is running. Press Ctrl+C to stop.');
        // Handle process termination
        process.on('SIGINT', async () => {
            bootstrap_core_1.logger.info('Stopping Factory Enhancer Agent...');
            await agent.stop();
            process.exit(0);
        });
    }
    catch (error) {
        bootstrap_core_1.logger.error(`Error in main: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
/**
 * Get port for a server
 */
function getPortForServer(server) {
    // Default ports for common servers
    const serverPorts = {
        'ollama': 3011,
        'code-enhancement': 3020,
        'lucidity': 3021,
        'github': 3022,
        'mcp-benchmark-server': 8020
    };
    return serverPorts[server] || 3000;
}
// Run the main function
main().catch(error => {
    bootstrap_core_1.logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
