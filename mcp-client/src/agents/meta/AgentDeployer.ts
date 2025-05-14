/**
 * AgentDeployer - Component responsible for deploying agents
 * 
 * This component handles the deployment of agents to production environments,
 * including packaging, publishing, and configuration.
 */

import { NexusClient } from '../../core/NexusClient';
import { AdapterManager } from '../../adapters/AdapterManager';
import { GitHubMCPAdapter } from '../../adapters/GitHubMCPAdapter';
import { logger } from '../../utils/logger';
import { AgentImplementation } from './AgentImplementer';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  registry?: string;
  repository?: string;
  owner?: string;
  token?: string;
  packageManager?: 'npm' | 'yarn';
  additionalOptions?: Record<string, any>;
}

export interface DeploymentResult {
  agentId: string;
  version: string;
  environment: string;
  packageName: string;
  packageVersion: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  timestamp: string;
}

export class AgentDeployer {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private githubAdapter?: GitHubMCPAdapter;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private config: Record<string, any>;
  private defaultConfig: DeploymentConfig;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    config: Record<string, any>
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.config = config;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    
    // Set default deployment config
    this.defaultConfig = {
      environment: 'development',
      registry: 'https://registry.npmjs.org',
      packageManager: 'npm',
      owner: config.githubOwner || 'gigamonkeyx'
    };
  }

  /**
   * Initialize the AgentDeployer
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing AgentDeployer...');
    
    try {
      // Get GitHub adapter
      this.githubAdapter = this.adapterManager.getFirstGitHubAdapter();
      
      if (!this.githubAdapter) {
        logger.warn('No GitHub adapter found. GitHub integration will be limited.');
      }
      
      logger.info('AgentDeployer initialized successfully');
    } catch (error) {
      const deployerError = this.errorHandling.createError(
        `Failed to initialize AgentDeployer: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined
      );
      
      await this.errorHandling.handleError(deployerError);
      throw error;
    }
  }

  /**
   * Deploy an agent to the specified environment
   */
  public async deployAgent(
    implementation: AgentImplementation,
    config?: Partial<DeploymentConfig>
  ): Promise<DeploymentResult> {
    logger.info(`Deploying agent: ${implementation.name} (${implementation.agentId})`);
    
    try {
      // Merge config with defaults
      const deploymentConfig: DeploymentConfig = {
        ...this.defaultConfig,
        ...config
      };
      
      // Build the agent
      logger.info('Building agent...');
      await this.buildAgent(implementation);
      
      // Package the agent
      logger.info('Packaging agent...');
      const packageInfo = await this.packageAgent(implementation, deploymentConfig);
      
      // Publish to GitHub if adapter is available
      let repositoryUrl: string | undefined;
      if (this.githubAdapter && deploymentConfig.owner) {
        logger.info('Publishing to GitHub...');
        repositoryUrl = await this.publishToGitHub(implementation, deploymentConfig);
      }
      
      // Create deployment result
      const result: DeploymentResult = {
        agentId: implementation.agentId,
        version: implementation.version,
        environment: deploymentConfig.environment,
        packageName: packageInfo.name,
        packageVersion: packageInfo.version,
        repositoryUrl,
        deploymentUrl: this.getDeploymentUrl(implementation, deploymentConfig),
        timestamp: new Date().toISOString()
      };
      
      // Emit deployment completed event
      this.eventBus.publish('agent:deployment:completed', {
        agentId: implementation.agentId,
        version: implementation.version,
        environment: deploymentConfig.environment
      });
      
      logger.info(`Agent ${implementation.name} deployed successfully to ${deploymentConfig.environment}`);
      
      return result;
    } catch (error) {
      const deployerError = this.errorHandling.createError(
        `Failed to deploy agent ${implementation.name}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { implementation }
      );
      
      await this.errorHandling.handleError(deployerError);
      throw error;
    }
  }

  /**
   * Build the agent
   */
  private async buildAgent(implementation: AgentImplementation): Promise<void> {
    try {
      // Run npm build
      await execAsync('npm run build', { cwd: implementation.basePath });
      
      logger.debug(`Agent ${implementation.name} built successfully`);
    } catch (error) {
      logger.error(`Failed to build agent: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to build agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Package the agent
   */
  private async packageAgent(
    implementation: AgentImplementation,
    config: DeploymentConfig
  ): Promise<{ name: string; version: string }> {
    try {
      // Read package.json
      const packageJsonPath = path.join(implementation.basePath, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Update version
      packageJson.version = implementation.version;
      
      // Write updated package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      // Run npm pack
      await execAsync(`${config.packageManager} pack`, { cwd: implementation.basePath });
      
      logger.debug(`Agent ${implementation.name} packaged successfully`);
      
      return {
        name: packageJson.name,
        version: packageJson.version
      };
    } catch (error) {
      logger.error(`Failed to package agent: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to package agent: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Publish the agent to GitHub
   */
  private async publishToGitHub(
    implementation: AgentImplementation,
    config: DeploymentConfig
  ): Promise<string> {
    if (!this.githubAdapter) {
      throw new Error('GitHub adapter not available');
    }
    
    if (!config.owner) {
      throw new Error('GitHub owner not specified');
    }
    
    try {
      // Create repository name
      const repoName = `agent-${implementation.name.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Check if repository exists
      let repoExists = false;
      try {
        await this.githubAdapter.getRepository(config.owner, repoName);
        repoExists = true;
      } catch (error) {
        // Repository doesn't exist
        repoExists = false;
      }
      
      // Create repository if it doesn't exist
      if (!repoExists) {
        await this.githubAdapter.createRepository({
          name: repoName,
          description: `${implementation.name} - An AI agent created by Meta-Agent`,
          private: false,
          auto_init: true
        });
        
        logger.debug(`Created GitHub repository: ${config.owner}/${repoName}`);
      }
      
      // Create a new branch for the version
      const branchName = `v${implementation.version}`;
      
      try {
        await this.githubAdapter.createBranch(
          config.owner,
          repoName,
          branchName,
          'main'
        );
        
        logger.debug(`Created branch: ${branchName}`);
      } catch (error) {
        // Branch might already exist
        logger.warn(`Failed to create branch ${branchName}: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Upload files
      for (const file of implementation.files) {
        const filePath = path.join(implementation.basePath, file);
        
        // Skip directories
        if (fs.statSync(filePath).isDirectory()) {
          continue;
        }
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        await this.githubAdapter.createOrUpdateFile(
          config.owner,
          repoName,
          file,
          content,
          `Add ${file}`,
          branchName
        );
        
        logger.debug(`Uploaded file: ${file}`);
      }
      
      // Create a pull request
      await this.githubAdapter.createPullRequest(
        config.owner,
        repoName,
        {
          title: `Deploy ${implementation.name} v${implementation.version}`,
          body: `This PR deploys version ${implementation.version} of ${implementation.name}`,
          head: branchName,
          base: 'main'
        }
      );
      
      logger.debug(`Created pull request for ${branchName}`);
      
      // Return repository URL
      return `https://github.com/${config.owner}/${repoName}`;
    } catch (error) {
      logger.error(`Failed to publish to GitHub: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to publish to GitHub: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the deployment URL for an agent
   */
  private getDeploymentUrl(
    implementation: AgentImplementation,
    config: DeploymentConfig
  ): string {
    // In a real implementation, this would return the URL where the agent is deployed
    // For now, we'll just return a dummy URL
    
    return `https://agents.nexus.io/${config.environment}/${implementation.agentId}`;
  }
}
