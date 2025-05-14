/**
 * MinimalAgentFactory - A streamlined version of the AI Agent Factory
 *
 * This is a minimal implementation focused on quickly generating functional
 * agents that can help enhance the factory itself.
 */

import { NexusClient } from '../../core/NexusClient';
import { AdapterManager } from '../../adapters/AdapterManager';
import { OllamaMCPAdapter } from '../../adapters/OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from '../../adapters/CodeEnhancementMCPAdapter';
import { logger, LogLevel } from '../../utils/logger';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import { AgentCommunication } from './AgentCommunication';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

export interface AgentTemplate {
  name: string;
  description: string;
  capabilities: string[];
  files: {
    path: string;
    content: string;
  }[];
  dependencies: string[];
  setupInstructions: string[];
}

export interface AgentRequest {
  name: string;
  description: string;
  type: string;
  specialization: string;
  capabilities: string[];
  mcpServers: string[];
}

export interface AgentResult {
  agentId: string;
  name: string;
  type: string;
  basePath: string;
  files: string[];
  capabilities: string[];
}

export class MinimalAgentFactory {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private ollamaAdapter?: OllamaMCPAdapter;
  private codeEnhancementAdapter?: CodeEnhancementMCPAdapter;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private templates: Map<string, AgentTemplate> = new Map();
  private outputDir: string;
  private agentCommunication: AgentCommunication;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    config: {
      outputDir?: string;
      workspacePath?: string;
    } = {}
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.outputDir = config.outputDir || path.join(process.cwd(), 'generated-agents');

    // Initialize agent communication
    this.agentCommunication = new AgentCommunication(nexusClient, {
      workspacePath: config.workspacePath || path.join(process.cwd(), 'agent-workspace')
    });
  }

  /**
   * Initialize the MinimalAgentFactory
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing MinimalAgentFactory...');

    try {
      // Get adapters
      this.ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
      this.codeEnhancementAdapter = this.adapterManager.getFirstCodeEnhancementAdapter();

      if (!this.ollamaAdapter) {
        logger.warn('No Ollama adapter found. Will use direct MCP calls for code generation.');
      }

      if (!this.codeEnhancementAdapter) {
        logger.warn('No CodeEnhancement adapter found. Code will not be enhanced.');
      }

      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Load built-in templates
      await this.loadBuiltInTemplates();

      logger.info('MinimalAgentFactory initialized successfully');
    } catch (error) {
      const factoryError = this.errorHandling.createError(
        `Failed to initialize MinimalAgentFactory: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined
      );

      await this.errorHandling.handleError(factoryError);
      throw error;
    }
  }

  /**
   * Register a new agent template
   */
  public registerTemplate(type: string, template: AgentTemplate): void {
    this.templates.set(type, template);
    logger.info(`Registered template for agent type: ${type}`);
  }

  /**
   * Create a new agent based on the specified request
   */
  public async createAgent(request: AgentRequest): Promise<AgentResult> {
    logger.info(`Creating new agent: ${request.name} (${request.type})`);

    try {
      // Generate agent ID
      const agentId = this.generateAgentId(request.name);

      // Create agent directory
      const agentDir = path.join(this.outputDir, agentId);
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }

      // Get template
      const template = this.templates.get(request.type);

      if (!template) {
        throw new Error(`No template found for agent type: ${request.type}`);
      }

      // Generate agent files
      const files = await this.generateAgentFiles(request, template, agentDir);

      // Install dependencies
      await this.installDependencies(agentDir, template.dependencies);

      // Run setup instructions
      await this.runSetupInstructions(agentDir, template.setupInstructions);

      // Create result
      const result: AgentResult = {
        agentId,
        name: request.name,
        type: request.type,
        basePath: agentDir,
        files,
        capabilities: request.capabilities
      };

      // Register agent with communication system
      this.agentCommunication.registerAgent({
        id: agentId,
        name: request.name,
        type: request.type,
        capabilities: request.capabilities,
        status: 'idle'
      });

      // Emit agent created event
      this.eventBus.publish('agent:created', {
        agentId,
        name: request.name,
        type: request.type,
        capabilities: request.capabilities
      });

      logger.info(`Agent ${request.name} created successfully with ID ${agentId}`);

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create agent ${request.name}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.AGENT,
        error instanceof Error ? error : undefined,
        { request }
      );

      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Generate agent files based on the template
   */
  private async generateAgentFiles(
    request: AgentRequest,
    template: AgentTemplate,
    agentDir: string
  ): Promise<string[]> {
    const files: string[] = [];

    // Process each file in the template
    for (const file of template.files) {
      // Generate file content
      let content = file.content;

      // Replace placeholders
      content = content.replace(/\{\{agentName\}\}/g, request.name);
      content = content.replace(/\{\{agentDescription\}\}/g, request.description);
      content = content.replace(/\{\{agentType\}\}/g, request.type);
      content = content.replace(/\{\{agentSpecialization\}\}/g, request.specialization);
      content = content.replace(/\{\{agentCapabilities\}\}/g, JSON.stringify(request.capabilities, null, 2));
      content = content.replace(/\{\{mcpServers\}\}/g, JSON.stringify(request.mcpServers, null, 2));

      // Generate specialized code if needed
      if (content.includes('{{generatedCode}}')) {
        const generatedCode = await this.generateSpecializedCode(request, file.path);
        content = content.replace(/\{\{generatedCode\}\}/g, generatedCode);
      }

      // Ensure directory exists
      const filePath = path.join(agentDir, file.path);
      const fileDir = path.dirname(filePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(filePath, content);

      // Add to files list
      files.push(file.path);

      logger.debug(`Generated file: ${file.path}`);
    }

    return files;
  }

  /**
   * Generate specialized code for an agent
   */
  private async generateSpecializedCode(request: AgentRequest, filePath: string): Promise<string> {
    if (!this.ollamaAdapter) {
      return '// TODO: Implement specialized code';
    }

    // Determine the file type
    const fileExt = path.extname(filePath);
    let language = 'typescript';

    if (fileExt === '.py') {
      language = 'python';
    } else if (fileExt === '.js') {
      language = 'javascript';
    }

    // Get other agents for collaboration
    const otherAgents = this.agentCommunication.getAgents()
      .filter(agent => agent.name !== request.name)
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        capabilities: agent.capabilities
      }));

    // Generate prompt
    const prompt = `
You are an expert ${language} developer specializing in ${request.specialization}.
Create the implementation for a ${request.type} agent with the following details:

Name: ${request.name}
Description: ${request.description}
Capabilities: ${request.capabilities.join(', ')}

The agent should be able to use the following MCP servers:
${request.mcpServers.map(server => `- ${server}`).join('\n')}

The agent will collaborate with other agents:
${otherAgents.length > 0
  ? otherAgents.map(agent => `- ${agent.name} (${agent.type}): ${agent.capabilities.join(', ')}`).join('\n')
  : '- No other agents available yet'}

The agent should use the AgentCommunication module to communicate with other agents.
Include methods to:
1. Send and receive messages
2. Share files and data
3. Coordinate on shared tasks
4. Update status and progress

Generate clean, well-documented ${language} code for this agent.
Focus on implementing the core functionality related to ${request.specialization}.
Include error handling and logging.

The code should be ready to use without further modifications.
`;

    // Generate code
    const code = await this.ollamaAdapter.generateCode(prompt, language);

    // Enhance code if possible
    if (this.codeEnhancementAdapter) {
      try {
        const enhancedCode = await this.codeEnhancementAdapter.enhanceCode(code, language);
        return enhancedCode;
      } catch (error) {
        logger.warn(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
        return code;
      }
    }

    return code;
  }

  /**
   * Install dependencies for an agent
   */
  private async installDependencies(agentDir: string, dependencies: string[]): Promise<void> {
    if (dependencies.length === 0) {
      return;
    }

    try {
      // Create package.json if it doesn't exist
      const packageJsonPath = path.join(agentDir, 'package.json');

      if (!fs.existsSync(packageJsonPath)) {
        const packageJson = {
          name: path.basename(agentDir),
          version: '0.1.0',
          private: true,
          dependencies: {}
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }

      // Install dependencies
      const dependenciesStr = dependencies.join(' ');
      await execAsync(`npm install ${dependenciesStr}`, { cwd: agentDir });

      logger.debug(`Installed dependencies: ${dependenciesStr}`);
    } catch (error) {
      logger.warn(`Failed to install dependencies: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Run setup instructions for an agent
   */
  private async runSetupInstructions(agentDir: string, instructions: string[]): Promise<void> {
    if (instructions.length === 0) {
      return;
    }

    try {
      for (const instruction of instructions) {
        await execAsync(instruction, { cwd: agentDir });
        logger.debug(`Ran setup instruction: ${instruction}`);
      }
    } catch (error) {
      logger.warn(`Failed to run setup instructions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a unique agent ID
   */
  private generateAgentId(name: string): string {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);

    return `${normalizedName}-${timestamp}-${random}`;
  }

  /**
   * Load built-in templates
   */
  private async loadBuiltInTemplates(): Promise<void> {
    // Load coding agent template
    this.registerTemplate('coding', {
      name: 'Coding Agent',
      description: 'An agent specialized in generating and analyzing code',
      capabilities: ['code_generation', 'code_analysis', 'refactoring'],
      files: [
        {
          path: 'src/index.ts',
          content: `/**
 * {{agentName}}
 * {{agentDescription}}
 */

import { NexusClient } from './core/NexusClient';
import { AdapterManager } from './adapters/AdapterManager';
import { logger, LogLevel } from './utils/logger';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

/**
 * Main function
 */
async function main() {
  try {
    // Create NexusClient
    const nexusClient = new NexusClient();

    // Register servers
    {{mcpServers}}.forEach(server => {
      nexusClient.registerServer(server, {
        type: 'sse',
        url: \`http://localhost:\${getPortForServer(server)}/sse\`
      });
    });

    // Connect to servers
    for (const server of {{mcpServers}}) {
      await nexusClient.connectServer(server);
    }

    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);

    // TODO: Add agent-specific code here
    {{generatedCode}}

    logger.info('{{agentName}} started successfully');
  } catch (error) {
    logger.error(\`Error in main: \${error instanceof Error ? error.message : String(error)}\`);
  }
}

/**
 * Get port for a server
 */
function getPortForServer(server: string): number {
  // Default ports for common servers
  const serverPorts: Record<string, number> = {
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
  logger.error(\`Unhandled error: \${error instanceof Error ? error.message : String(error)}\`);
});`
        },
        {
          path: 'package.json',
          content: `{
  "name": "{{agentType}}-agent",
  "version": "0.1.0",
  "description": "{{agentDescription}}",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^0.27.2",
    "eventsource": "^2.0.2",
    "typescript": "^4.7.4"
  },
  "devDependencies": {
    "@types/eventsource": "^1.1.10",
    "@types/jest": "^28.1.6",
    "@types/node": "^18.6.3",
    "jest": "^28.1.3",
    "ts-jest": "^28.0.7",
    "ts-node": "^10.9.1"
  }
}`
        },
        {
          path: 'tsconfig.json',
          content: `{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}`
        }
      ],
      dependencies: ['axios', 'eventsource', 'typescript'],
      setupInstructions: ['npm run build']
    });

    // Load factory enhancer template
    this.registerTemplate('factory-enhancer', {
      name: 'Factory Enhancer Agent',
      description: 'An agent specialized in enhancing the AI Agent Factory',
      capabilities: ['code_generation', 'code_analysis', 'refactoring'],
      files: [
        {
          path: 'src/index.ts',
          content: `/**
 * {{agentName}}
 * {{agentDescription}}
 */

import { NexusClient } from './core/NexusClient';
import { AdapterManager } from './adapters/AdapterManager';
import { logger, LogLevel } from './utils/logger';

// Set log level to debug for more detailed logging
logger.setLevel(LogLevel.DEBUG);

/**
 * Main function
 */
async function main() {
  try {
    // Create NexusClient
    const nexusClient = new NexusClient();

    // Register servers
    {{mcpServers}}.forEach(server => {
      nexusClient.registerServer(server, {
        type: 'sse',
        url: \`http://localhost:\${getPortForServer(server)}/sse\`
      });
    });

    // Connect to servers
    for (const server of {{mcpServers}}) {
      await nexusClient.connectServer(server);
    }

    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);

    // Factory enhancer specific code
    {{generatedCode}}

    logger.info('{{agentName}} started successfully');
  } catch (error) {
    logger.error(\`Error in main: \${error instanceof Error ? error.message : String(error)}\`);
  }
}

/**
 * Get port for a server
 */
function getPortForServer(server: string): number {
  // Default ports for common servers
  const serverPorts: Record<string, number> = {
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
  logger.error(\`Unhandled error: \${error instanceof Error ? error.message : String(error)}\`);
});`
        },
        {
          path: 'package.json',
          content: `{
  "name": "{{agentType}}-agent",
  "version": "0.1.0",
  "description": "{{agentDescription}}",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "axios": "^0.27.2",
    "eventsource": "^2.0.2",
    "typescript": "^4.7.4"
  },
  "devDependencies": {
    "@types/eventsource": "^1.1.10",
    "@types/jest": "^28.1.6",
    "@types/node": "^18.6.3",
    "jest": "^28.1.3",
    "ts-jest": "^28.0.7",
    "ts-node": "^10.9.1"
  }
}`
        },
        {
          path: 'tsconfig.json',
          content: `{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}`
        }
      ],
      dependencies: ['axios', 'eventsource', 'typescript'],
      setupInstructions: ['npm run build']
    });

    logger.info('Loaded built-in templates');
  }
}
