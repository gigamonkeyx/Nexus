"use strict";
/**
 * Agent Creator
 *
 * Creates new agents based on templates and specifications.
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
exports.AgentCreator = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const TemplateManager_1 = require("./TemplateManager");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
class AgentCreator {
    constructor(nexusClient, adapterManager, agentCommunication, agentRegistry, config) {
        this.nexusClient = nexusClient;
        this.adapterManager = adapterManager;
        this.agentCommunication = agentCommunication;
        this.agentRegistry = agentRegistry;
        this.config = config;
        this.templateManager = new TemplateManager_1.TemplateManager(this.config.templatePath);
    }
    /**
     * Initialize the agent creator
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing agent creator...');
        try {
            // Ensure output directory exists
            if (!fs.existsSync(this.config.outputPath)) {
                fs.mkdirSync(this.config.outputPath, { recursive: true });
            }
            // Initialize template manager
            await this.templateManager.initialize();
            bootstrap_core_1.logger.info('Agent creator initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize agent creator: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create a new agent
     */
    async createAgent(name, type, capabilities, config = {}) {
        bootstrap_core_1.logger.info(`Creating agent: ${name} (${type})`);
        try {
            // Generate agent ID
            const agentId = this.generateAgentId(name, type);
            // Get template for agent type
            const template = await this.templateManager.getTemplate(type);
            if (!template) {
                throw new Error(`No template found for agent type: ${type}`);
            }
            // Create agent directory
            const agentDir = path.join(this.config.outputPath, agentId);
            if (!fs.existsSync(agentDir)) {
                fs.mkdirSync(agentDir, { recursive: true });
            }
            // Create agent files
            await this.createAgentFiles(agentDir, template, {
                name,
                type,
                capabilities,
                agentId,
                ...config
            });
            // Register agent
            await this.agentRegistry.registerAgent({
                id: agentId,
                name,
                type,
                capabilities,
                status: 'offline'
            }, {
                path: agentDir,
                config
            });
            bootstrap_core_1.logger.info(`Agent created: ${name} (${agentId})`);
            return agentId;
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create agent files
     */
    async createAgentFiles(agentDir, template, variables) {
        bootstrap_core_1.logger.debug(`Creating agent files in ${agentDir}`);
        try {
            // Create each file from template
            for (const file of template.files) {
                // Replace variables in file path
                const filePath = this.replaceVariables(file.path, variables);
                const fullPath = path.join(agentDir, filePath);
                // Ensure directory exists
                const dirPath = path.dirname(fullPath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                // Replace variables in file content
                const content = this.replaceVariables(file.content, variables);
                // Write file
                fs.writeFileSync(fullPath, content);
                bootstrap_core_1.logger.debug(`Created file: ${fullPath}`);
            }
            // Create package.json if not included in template
            const packageJsonPath = path.join(agentDir, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                const packageJson = {
                    name: variables.name.toLowerCase().replace(/\s+/g, '-'),
                    version: '0.1.0',
                    description: `${variables.name} - ${variables.type} agent`,
                    main: 'dist/index.js',
                    scripts: {
                        build: 'tsc',
                        start: 'node dist/index.js',
                        dev: 'ts-node src/index.ts',
                        test: 'jest'
                    },
                    dependencies: {
                        'bootstrap-core': 'file:../../../bootstrap-core',
                        typescript: '^4.7.4'
                    },
                    devDependencies: {
                        '@types/node': '^18.6.3',
                        'ts-node': '^10.9.1'
                    }
                };
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
                bootstrap_core_1.logger.debug(`Created package.json: ${packageJsonPath}`);
            }
            // Create tsconfig.json if not included in template
            const tsconfigPath = path.join(agentDir, 'tsconfig.json');
            if (!fs.existsSync(tsconfigPath)) {
                const tsconfig = {
                    compilerOptions: {
                        target: 'es2020',
                        module: 'commonjs',
                        outDir: './dist',
                        rootDir: './src',
                        strict: true,
                        esModuleInterop: true,
                        skipLibCheck: true,
                        forceConsistentCasingInFileNames: true
                    },
                    include: ['src/**/*'],
                    exclude: ['node_modules', '**/*.test.ts']
                };
                fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
                bootstrap_core_1.logger.debug(`Created tsconfig.json: ${tsconfigPath}`);
            }
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create agent files: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Replace variables in a string
     */
    replaceVariables(str, variables) {
        let result = str;
        // Replace variables in the format {{variableName}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, String(value));
        }
        return result;
    }
    /**
     * Generate a unique agent ID
     */
    generateAgentId(name, type) {
        const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
        const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `${normalizedType}-${normalizedName}-${timestamp}-${random}`;
    }
}
exports.AgentCreator = AgentCreator;
