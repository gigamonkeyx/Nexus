/**
 * Agent Creator
 * 
 * Creates new agents based on templates and specifications.
 */

import {
  NexusClient,
  AdapterManager,
  AgentCommunication,
  logger,
  AgentInfo
} from 'bootstrap-core';
import { AgentRegistry } from '../registry/AgentRegistry';
import { AgentTemplate } from './AgentTemplate';
import { TemplateManager } from './TemplateManager';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface AgentCreatorConfig {
  templatePath: string;
  outputPath: string;
}

export class AgentCreator {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private agentCommunication: AgentCommunication;
  private agentRegistry: AgentRegistry;
  private templateManager: TemplateManager;
  private config: AgentCreatorConfig;
  
  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    agentCommunication: AgentCommunication,
    agentRegistry: AgentRegistry,
    config: AgentCreatorConfig
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.agentCommunication = agentCommunication;
    this.agentRegistry = agentRegistry;
    this.config = config;
    this.templateManager = new TemplateManager(this.config.templatePath);
  }
  
  /**
   * Initialize the agent creator
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing agent creator...');
    
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.config.outputPath)) {
        fs.mkdirSync(this.config.outputPath, { recursive: true });
      }
      
      // Initialize template manager
      await this.templateManager.initialize();
      
      logger.info('Agent creator initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize agent creator: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create a new agent
   */
  public async createAgent(
    name: string,
    type: string,
    capabilities: string[],
    config: any = {}
  ): Promise<string> {
    logger.info(`Creating agent: ${name} (${type})`);
    
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
      await this.agentRegistry.registerAgent(
        {
          id: agentId,
          name,
          type,
          capabilities,
          status: 'offline'
        },
        {
          path: agentDir,
          config
        }
      );
      
      logger.info(`Agent created: ${name} (${agentId})`);
      
      return agentId;
    } catch (error) {
      logger.error(`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Create agent files
   */
  private async createAgentFiles(
    agentDir: string,
    template: AgentTemplate,
    variables: any
  ): Promise<void> {
    logger.debug(`Creating agent files in ${agentDir}`);
    
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
        
        logger.debug(`Created file: ${fullPath}`);
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
        
        logger.debug(`Created package.json: ${packageJsonPath}`);
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
        
        logger.debug(`Created tsconfig.json: ${tsconfigPath}`);
      }
    } catch (error) {
      logger.error(`Failed to create agent files: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Replace variables in a string
   */
  private replaceVariables(str: string, variables: any): string {
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
  private generateAgentId(name: string, type: string): string {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
    const normalizedType = type.toLowerCase().replace(/\s+/g, '-');
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    
    return `${normalizedType}-${normalizedName}-${timestamp}-${random}`;
  }
}
