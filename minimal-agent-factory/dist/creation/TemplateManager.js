"use strict";
/**
 * Template Manager
 *
 * Manages agent templates for creating new agents.
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
exports.TemplateManager = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TemplateManager {
    constructor(templatePath) {
        this.templates = new Map();
        this.templatePath = templatePath;
    }
    /**
     * Initialize the template manager
     */
    async initialize() {
        bootstrap_core_1.logger.info('Initializing template manager...');
        try {
            // Ensure template directory exists
            if (!fs.existsSync(this.templatePath)) {
                fs.mkdirSync(this.templatePath, { recursive: true });
            }
            // Load templates
            await this.loadTemplates();
            // Create default templates if none exist
            if (this.templates.size === 0) {
                await this.createDefaultTemplates();
            }
            bootstrap_core_1.logger.info('Template manager initialized successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to initialize template manager: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get a template by type
     */
    async getTemplate(type) {
        // Check if template exists
        if (this.templates.has(type)) {
            return this.templates.get(type);
        }
        // Check if template file exists
        const templatePath = path.join(this.templatePath, `${type}.json`);
        if (fs.existsSync(templatePath)) {
            try {
                const content = fs.readFileSync(templatePath, 'utf-8');
                const template = JSON.parse(content);
                // Store template
                this.templates.set(type, template);
                return template;
            }
            catch (error) {
                bootstrap_core_1.logger.error(`Failed to load template: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        // Try to find a similar template
        const similarType = Array.from(this.templates.keys()).find(t => t.toLowerCase().includes(type.toLowerCase()) ||
            type.toLowerCase().includes(t.toLowerCase()));
        if (similarType) {
            bootstrap_core_1.logger.info(`Using similar template ${similarType} for type ${type}`);
            return this.templates.get(similarType);
        }
        // Use generic template as fallback
        if (this.templates.has('generic')) {
            bootstrap_core_1.logger.info(`Using generic template for type ${type}`);
            return this.templates.get('generic');
        }
        return null;
    }
    /**
     * Create a new template
     */
    async createTemplate(template) {
        bootstrap_core_1.logger.info(`Creating template: ${template.name}`);
        try {
            // Store template
            this.templates.set(template.name, template);
            // Save to file
            const templatePath = path.join(this.templatePath, `${template.name}.json`);
            fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
            bootstrap_core_1.logger.info(`Template created: ${template.name}`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create template: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Get all templates
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }
    /**
     * Load templates from storage
     */
    async loadTemplates() {
        try {
            // Check if template directory exists
            if (!fs.existsSync(this.templatePath)) {
                return;
            }
            // Get all template files
            const files = fs.readdirSync(this.templatePath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.templatePath, file);
                    const content = fs.readFileSync(filePath, 'utf-8');
                    try {
                        const template = JSON.parse(content);
                        this.templates.set(template.name, template);
                    }
                    catch (error) {
                        bootstrap_core_1.logger.warn(`Failed to parse template file: ${filePath}`);
                    }
                }
            }
            bootstrap_core_1.logger.info(`Loaded ${this.templates.size} templates from storage`);
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to load templates: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Create default templates
     */
    async createDefaultTemplates() {
        bootstrap_core_1.logger.info('Creating default templates...');
        try {
            // Create generic template
            const genericTemplate = {
                name: 'generic',
                description: 'Generic agent template',
                capabilities: ['basic_agent'],
                files: [
                    {
                        path: 'src/index.ts',
                        content: `/**
 * {{name}}
 * 
 * {{description}}
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  TaskManager,
  logger,
  LogLevel,
  BaseAgentConfig
} from 'bootstrap-core';
import * as path from 'path';

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
    const servers = ['ollama'];
    
    servers.forEach(server => {
      nexusClient.registerServer(server, {
        type: 'sse',
        url: \`http://localhost:\${getPortForServer(server)}/sse\`
      });
    });
    
    // Connect to servers
    for (const server of servers) {
      try {
        await nexusClient.connectServer(server);
        logger.info(\`Connected to \${server} server\`);
      } catch (error) {
        logger.warn(\`Failed to connect to \${server} server: \${error instanceof Error ? error.message : String(error)}\`);
      }
    }
    
    // Create AdapterManager
    const adapterManager = new AdapterManager(nexusClient);
    
    // Create AgentCommunication
    const agentCommunication = new AgentCommunication(nexusClient, {
      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace')
    });
    
    // Create Agent
    const agentConfig: BaseAgentConfig = {
      name: '{{name}}',
      description: '{{description}}',
      workspacePath: path.join(process.cwd(), '..', '..', 'agent-workspace'),
      taskSpecsPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'tasks', '{{agentId}}-tasks.md'),
      outputPath: path.join(process.cwd(), '..', '..', 'mcp-client', 'src', 'output'),
      collaborators: {}
    };
    
    // TODO: Implement agent-specific logic
    
    // Keep the process running
    logger.info('{{name}} is running. Press Ctrl+C to stop.');
    
    // Handle process termination
    process.on('SIGINT', async () => {
      logger.info('Stopping {{name}}...');
      process.exit(0);
    });
  } catch (error) {
    logger.error(\`Error in main: \${error instanceof Error ? error.message : String(error)}\`);
    process.exit(1);
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
  process.exit(1);
});`
                    },
                    {
                        path: 'src/Agent.ts',
                        content: `/**
 * {{name}}
 * 
 * {{description}}
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  TaskManager,
  Message,
  BaseAgentConfig,
  logger,
  LogLevel,
  AgentInfo,
  TaskSpecification
} from 'bootstrap-core';
import * as fs from 'fs';
import * as path from 'path';

// Extend the base agent config with agent-specific properties
export interface AgentConfig extends BaseAgentConfig {
  // Add agent-specific configuration properties here
}

export class Agent {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentCommunication: AgentCommunication;
  private taskManager: TaskManager;
  private config: AgentConfig;
  private agentId: string;
  private tasks: TaskSpecification[] = [];
  private currentTask: TaskSpecification | null = null;
  private messageCheckInterval: NodeJS.Timeout | null = null;
  
  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    agentCommunication: AgentCommunication,
    config: AgentConfig
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.agentCommunication = agentCommunication;
    this.config = config;
    this.agentId = \`{{agentId}}\`;
    
    // Initialize task manager
    this.taskManager = new TaskManager(this.agentId, this.agentCommunication);
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    logger.info(\`Initializing \${this.config.name}...\`);
    
    try {
      // Register with communication system
      this.agentCommunication.registerAgent({
        id: this.agentId,
        name: this.config.name,
        type: '{{type}}',
        capabilities: {{capabilities}},
        status: 'idle'
      });
      
      // Load task specifications
      await this.loadTaskSpecifications();
      
      // Start message checking
      this.startMessageChecking();
      
      logger.info(\`\${this.config.name} initialized successfully\`);
    } catch (error) {
      logger.error(\`Failed to initialize \${this.config.name}: \${error instanceof Error ? error.message : String(error)}\`);
      throw error;
    }
  }
  
  /**
   * Start the agent
   */
  public async start(): Promise<void> {
    logger.info(\`Starting \${this.config.name}...\`);
    
    try {
      // Update status
      this.agentCommunication.updateAgentStatus(this.agentId, 'busy');
      
      // Process any existing messages
      await this.processMessages();
      
      // Start working on tasks
      await this.startWorking();
      
      logger.info(\`\${this.config.name} started successfully\`);
    } catch (error) {
      logger.error(\`Error starting \${this.config.name}: \${error instanceof Error ? error.message : String(error)}\`);
      this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
    }
  }
  
  /**
   * Stop the agent
   */
  public async stop(): Promise<void> {
    logger.info(\`Stopping \${this.config.name}...\`);
    
    // Stop message checking
    if (this.messageCheckInterval) {
      clearInterval(this.messageCheckInterval);
      this.messageCheckInterval = null;
    }
    
    // Update status
    this.agentCommunication.updateAgentStatus(this.agentId, 'offline');
    
    logger.info(\`\${this.config.name} stopped successfully\`);
  }
  
  /**
   * Load task specifications
   */
  private async loadTaskSpecifications(): Promise<void> {
    try {
      // Check if task specs file exists
      if (fs.existsSync(this.config.taskSpecsPath)) {
        const content = fs.readFileSync(this.config.taskSpecsPath, 'utf-8');
        
        // Parse tasks from markdown
        this.tasks = this.parseTasksFromMarkdown(content);
        
        logger.info(\`Loaded \${this.tasks.length} tasks from specifications\`);
      } else {
        logger.warn(\`Task specifications file not found: \${this.config.taskSpecsPath}\`);
      }
    } catch (error) {
      logger.error(\`Error loading task specifications: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }
  
  /**
   * Parse tasks from markdown
   */
  private parseTasksFromMarkdown(markdown: string): TaskSpecification[] {
    // Use the TaskManager's parseTasksFromMarkdown method
    return this.taskManager.parseTasksFromMarkdown(markdown);
  }
  
  /**
   * Start message checking
   */
  private startMessageChecking(): void {
    // Check for new messages every 5 seconds
    this.messageCheckInterval = setInterval(async () => {
      await this.processMessages();
    }, 5000);
  }
  
  /**
   * Process messages
   */
  private async processMessages(): Promise<void> {
    try {
      // Get unread messages
      const messages = this.agentCommunication.getUnreadMessagesForAgent(this.agentId);
      
      for (const message of messages) {
        await this.handleMessage(message);
        
        // Mark as read
        this.agentCommunication.markMessageAsRead(message.id, this.agentId);
      }
    } catch (error) {
      logger.error(\`Error processing messages: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }
  
  /**
   * Handle a message
   */
  private async handleMessage(message: Message): Promise<void> {
    logger.info(\`Handling message: \${message.subject} from \${message.from}\`);
    
    try {
      // Handle different message types
      switch (message.type) {
        case 'request':
          await this.handleRequestMessage(message);
          break;
        case 'response':
          await this.handleResponseMessage(message);
          break;
        case 'notification':
          await this.handleNotificationMessage(message);
          break;
        case 'update':
          await this.handleUpdateMessage(message);
          break;
      }
    } catch (error) {
      logger.error(\`Error handling message: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }
  
  /**
   * Handle a request message
   */
  private async handleRequestMessage(message: Message): Promise<void> {
    // TODO: Implement agent-specific message handling
  }
  
  /**
   * Handle a response message
   */
  private async handleResponseMessage(message: Message): Promise<void> {
    // TODO: Implement agent-specific message handling
  }
  
  /**
   * Handle a notification message
   */
  private async handleNotificationMessage(message: Message): Promise<void> {
    // TODO: Implement agent-specific message handling
  }
  
  /**
   * Handle an update message
   */
  private async handleUpdateMessage(message: Message): Promise<void> {
    // TODO: Implement agent-specific message handling
  }
  
  /**
   * Start working on tasks
   */
  private async startWorking(): Promise<void> {
    logger.info('Starting work on tasks...');
    
    // TODO: Implement agent-specific task processing
    
    // Set agent to idle when done
    this.agentCommunication.updateAgentStatus(this.agentId, 'idle');
  }
}`
                    }
                ],
                dependencies: [
                    'bootstrap-core'
                ],
                setupInstructions: [
                    'npm install',
                    'npm run build',
                    'npm start'
                ]
            };
            await this.createTemplate(genericTemplate);
            // Create specialized templates
            const specializedTemplates = [
                {
                    name: 'data-processing',
                    description: 'Agent for processing and analyzing data',
                    capabilities: ['data_processing', 'data_analysis', 'data_visualization']
                },
                {
                    name: 'code-generation',
                    description: 'Agent for generating and refactoring code',
                    capabilities: ['code_generation', 'code_analysis', 'refactoring']
                },
                {
                    name: 'research',
                    description: 'Agent for conducting research and gathering information',
                    capabilities: ['research', 'information_retrieval', 'summarization']
                }
            ];
            for (const template of specializedTemplates) {
                // Clone the generic template
                const specializedTemplate = {
                    ...genericTemplate,
                    name: template.name,
                    description: template.description,
                    capabilities: template.capabilities
                };
                await this.createTemplate(specializedTemplate);
            }
            bootstrap_core_1.logger.info('Default templates created successfully');
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to create default templates: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
}
exports.TemplateManager = TemplateManager;
