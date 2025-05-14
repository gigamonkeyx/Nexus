/**
 * GitHubMCPAdapter
 * 
 * Adapter for the GitHub MCP Server.
 */

import { NexusClient } from '../core/NexusClient';
import { BaseAdapter } from './BaseAdapter';
import { AdapterConfig } from './AdapterManager';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Repository visibility
 */
export enum RepositoryVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

/**
 * Pull request status
 */
export enum PullRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged'
}

/**
 * Issue status
 */
export enum IssueStatus {
  OPEN = 'open',
  CLOSED = 'closed'
}

/**
 * GitHub adapter configuration
 */
export interface GitHubAdapterConfig extends AdapterConfig {
  defaultOwner?: string;
  defaultRepo?: string;
}

/**
 * GitHubMCPAdapter provides an adapter for the GitHub MCP Server.
 */
export class GitHubMCPAdapter extends BaseAdapter {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private defaultOwner: string;
  private defaultRepo: string;
  private serverId: string;

  /**
   * Creates a new GitHubMCPAdapter instance.
   * @param nexusClient NexusClient instance
   * @param config Adapter configuration
   */
  constructor(nexusClient: NexusClient, config: GitHubAdapterConfig) {
    super(config);
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.defaultOwner = config.defaultOwner || '';
    this.defaultRepo = config.defaultRepo || '';
    this.serverId = config.serverId || 'github';
    
    // Register event handlers
    this.registerEventHandlers();
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    // Handle server errors
    this.eventBus.subscribe('mcp-server-error', async (error) => {
      if (error.context.serverId === this.serverId) {
        logger.warn(`GitHub MCP server error: ${error.message}`);
      }
    });
  }

  /**
   * Initializes the adapter.
   * @returns Promise resolving when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing GitHub MCP adapter');
      
      // Check if server is connected
      const servers = this.nexusClient.getServers();
      if (!servers.has(this.serverId)) {
        throw new Error(`GitHub MCP server not found: ${this.serverId}`);
      }
      
      // Get authenticated user
      const user = await this.getAuthenticatedUser();
      logger.info(`Authenticated as GitHub user: ${user.login}`);
      
      // If no default owner is set, use the authenticated user
      if (!this.defaultOwner) {
        this.defaultOwner = user.login;
        logger.info(`Setting default owner to: ${this.defaultOwner}`);
      }
      
      logger.info('GitHub MCP adapter initialized successfully');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize GitHub MCP adapter: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets the authenticated user.
   * @returns Promise resolving to the authenticated user
   */
  async getAuthenticatedUser(): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('github-get-authenticated-user', {}, this.serverId);
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get authenticated user: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a repository.
   * @param name Repository name
   * @param options Repository options
   * @returns Promise resolving to the created repository
   */
  async createRepository(name: string, options: {
    description?: string;
    visibility?: RepositoryVisibility;
    autoInit?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  } = {}): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('github-create-repository', {
        name,
        description: options.description || '',
        private: options.visibility === RepositoryVisibility.PRIVATE,
        auto_init: options.autoInit || false,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create repository: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, name }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets repositories.
   * @param owner Repository owner
   * @returns Promise resolving to the repositories
   */
  async getRepositories(owner?: string): Promise<any[]> {
    try {
      const result = await this.nexusClient.callTool('github-get-repositories', {
        owner: owner || this.defaultOwner
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get repositories: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a branch.
   * @param repo Repository name
   * @param branch Branch name
   * @param fromBranch Branch to create from
   * @param owner Repository owner
   * @returns Promise resolving to the created branch
   */
  async createBranch(repo: string, branch: string, fromBranch: string = 'main', owner?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('github-create-branch', {
        owner: owner || this.defaultOwner,
        repo,
        branch,
        from: fromBranch
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo, branch }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets branches.
   * @param repo Repository name
   * @param owner Repository owner
   * @returns Promise resolving to the branches
   */
  async getBranches(repo: string, owner?: string): Promise<any[]> {
    try {
      const result = await this.nexusClient.callTool('github-get-branches', {
        owner: owner || this.defaultOwner,
        repo
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get branches: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a pull request.
   * @param repo Repository name
   * @param title Pull request title
   * @param body Pull request body
   * @param head Head branch
   * @param base Base branch
   * @param owner Repository owner
   * @returns Promise resolving to the created pull request
   */
  async createPullRequest(repo: string, title: string, body: string, head: string, base: string = 'main', owner?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('github-create-pull-request', {
        owner: owner || this.defaultOwner,
        repo,
        title,
        body,
        head,
        base
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo, title }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets pull requests.
   * @param repo Repository name
   * @param status Pull request status
   * @param owner Repository owner
   * @returns Promise resolving to the pull requests
   */
  async getPullRequests(repo: string, status: PullRequestStatus = PullRequestStatus.OPEN, owner?: string): Promise<any[]> {
    try {
      const result = await this.nexusClient.callTool('github-get-pull-requests', {
        owner: owner || this.defaultOwner,
        repo,
        state: status
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get pull requests: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo, status }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates an issue.
   * @param repo Repository name
   * @param title Issue title
   * @param body Issue body
   * @param labels Issue labels
   * @param owner Repository owner
   * @returns Promise resolving to the created issue
   */
  async createIssue(repo: string, title: string, body: string, labels: string[] = [], owner?: string): Promise<any> {
    try {
      const result = await this.nexusClient.callTool('github-create-issue', {
        owner: owner || this.defaultOwner,
        repo,
        title,
        body,
        labels
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create issue: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo, title }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets issues.
   * @param repo Repository name
   * @param status Issue status
   * @param owner Repository owner
   * @returns Promise resolving to the issues
   */
  async getIssues(repo: string, status: IssueStatus = IssueStatus.OPEN, owner?: string): Promise<any[]> {
    try {
      const result = await this.nexusClient.callTool('github-get-issues', {
        owner: owner || this.defaultOwner,
        repo,
        state: status
      }, this.serverId);
      
      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get issues: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.EXTERNAL,
        error instanceof Error ? error : undefined,
        { serverId: this.serverId, owner: owner || this.defaultOwner, repo, status }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets the default owner.
   * @returns Default owner
   */
  getDefaultOwner(): string {
    return this.defaultOwner;
  }

  /**
   * Sets the default owner.
   * @param owner Default owner
   */
  setDefaultOwner(owner: string): void {
    this.defaultOwner = owner;
  }

  /**
   * Gets the default repository.
   * @returns Default repository
   */
  getDefaultRepo(): string {
    return this.defaultRepo;
  }

  /**
   * Sets the default repository.
   * @param repo Default repository
   */
  setDefaultRepo(repo: string): void {
    this.defaultRepo = repo;
  }

  /**
   * Gets the server ID.
   * @returns Server ID
   */
  getServerId(): string {
    return this.serverId;
  }

  /**
   * Sets the server ID.
   * @param serverId Server ID
   */
  setServerId(serverId: string): void {
    this.serverId = serverId;
  }
}
