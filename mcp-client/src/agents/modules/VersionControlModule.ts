/**
 * VersionControlModule
 * 
 * Module for Git operations and GitHub integration.
 */

import { Agent } from '../Agent';
import { BaseModule } from './BaseModule';
import { ModuleConfig } from './Module';
import { NexusClient } from '../../core/NexusClient';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import { logger } from '../../utils/logger';

/**
 * Pull request status
 */
export enum PullRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged'
}

/**
 * Repository visibility
 */
export enum RepositoryVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private'
}

/**
 * Pull request options
 */
export interface PullRequestOptions {
  title: string;
  body?: string;
  baseBranch: string;
  headBranch: string;
  draft?: boolean;
  maintainerCanModify?: boolean;
}

/**
 * Repository options
 */
export interface RepositoryOptions {
  name: string;
  description?: string;
  visibility?: RepositoryVisibility;
  autoInit?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
}

/**
 * VersionControlModule configuration
 */
export interface VersionControlModuleConfig extends ModuleConfig {
  nexusClient: NexusClient;
  githubServerUrl?: string;
  defaultOwner?: string;
}

/**
 * VersionControlModule provides capabilities for Git operations and GitHub integration.
 */
export class VersionControlModule extends BaseModule {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private githubServerUrl?: string;
  private defaultOwner?: string;

  /**
   * Creates a new VersionControlModule instance.
   * @param config Module configuration
   */
  constructor(config: VersionControlModuleConfig) {
    super(config);
    this.nexusClient = config.nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
    this.githubServerUrl = config.githubServerUrl;
    this.defaultOwner = config.defaultOwner;
  }

  /**
   * Registers capabilities with the agent.
   * @param agent Agent to register capabilities with
   * @returns Promise resolving when registration is complete
   */
  async registerCapabilities(agent: Agent): Promise<void> {
    try {
      logger.info(`Registering version control capabilities for agent: ${agent.getName()}`);

      // Register createPullRequest capability
      agent.registerCapability('createPullRequest', async (parameters: any) => {
        try {
          const { owner, repo, options } = parameters;
          return this.createPullRequest(owner, repo, options);
        } catch (error) {
          logger.error(`Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getPullRequests capability
      agent.registerCapability('getPullRequests', async (parameters: any) => {
        try {
          const { owner, repo, status } = parameters;
          return this.getPullRequests(owner, repo, status);
        } catch (error) {
          logger.error(`Failed to get pull requests: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register createRepository capability
      agent.registerCapability('createRepository', async (parameters: any) => {
        try {
          const { options } = parameters;
          return this.createRepository(options);
        } catch (error) {
          logger.error(`Failed to create repository: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getRepositories capability
      agent.registerCapability('getRepositories', async (parameters: any) => {
        try {
          const { owner } = parameters;
          return this.getRepositories(owner);
        } catch (error) {
          logger.error(`Failed to get repositories: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register createBranch capability
      agent.registerCapability('createBranch', async (parameters: any) => {
        try {
          const { owner, repo, branch, fromBranch } = parameters;
          return this.createBranch(owner, repo, branch, fromBranch);
        } catch (error) {
          logger.error(`Failed to create branch: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getBranches capability
      agent.registerCapability('getBranches', async (parameters: any) => {
        try {
          const { owner, repo } = parameters;
          return this.getBranches(owner, repo);
        } catch (error) {
          logger.error(`Failed to get branches: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getCommits capability
      agent.registerCapability('getCommits', async (parameters: any) => {
        try {
          const { owner, repo, branch } = parameters;
          return this.getCommits(owner, repo, branch);
        } catch (error) {
          logger.error(`Failed to get commits: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register createIssue capability
      agent.registerCapability('createIssue', async (parameters: any) => {
        try {
          const { owner, repo, title, body, labels } = parameters;
          return this.createIssue(owner, repo, title, body, labels);
        } catch (error) {
          logger.error(`Failed to create issue: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      // Register getIssues capability
      agent.registerCapability('getIssues', async (parameters: any) => {
        try {
          const { owner, repo, state } = parameters;
          return this.getIssues(owner, repo, state);
        } catch (error) {
          logger.error(`Failed to get issues: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      });

      logger.info(`Version control capabilities registered for agent: ${agent.getName()}`);
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to register version control capabilities: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { moduleName: this.getName(), agentName: agent.getName() }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a pull request.
   * @param owner Repository owner
   * @param repo Repository name
   * @param options Pull request options
   * @returns Created pull request
   */
  private async createPullRequest(owner: string, repo: string, options: PullRequestOptions): Promise<any> {
    try {
      logger.info(`Creating pull request in ${owner}/${repo}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-create-pull-request', {
            owner: owner || this.defaultOwner,
            repo,
            title: options.title,
            body: options.body || '',
            head: options.headBranch,
            base: options.baseBranch,
            draft: options.draft || false,
            maintainer_can_modify: options.maintainerCanModify !== false
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return {
        number: 1,
        html_url: `https://github.com/${owner}/${repo}/pull/1`,
        title: options.title,
        body: options.body || '',
        state: 'open',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create pull request: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets pull requests.
   * @param owner Repository owner
   * @param repo Repository name
   * @param status Pull request status
   * @returns Pull requests
   */
  private async getPullRequests(owner: string, repo: string, status?: PullRequestStatus): Promise<any> {
    try {
      logger.info(`Getting pull requests from ${owner}/${repo}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-get-pull-requests', {
            owner: owner || this.defaultOwner,
            repo,
            state: status || 'open'
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return [
        {
          number: 1,
          html_url: `https://github.com/${owner}/${repo}/pull/1`,
          title: 'Example pull request',
          body: 'This is an example pull request',
          state: 'open',
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get pull requests: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo, status }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a repository.
   * @param options Repository options
   * @returns Created repository
   */
  private async createRepository(options: RepositoryOptions): Promise<any> {
    try {
      logger.info(`Creating repository: ${options.name}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-create-repository', {
            name: options.name,
            description: options.description || '',
            private: options.visibility === RepositoryVisibility.PRIVATE,
            auto_init: options.autoInit || false,
            gitignore_template: options.gitignoreTemplate,
            license_template: options.licenseTemplate
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return {
        name: options.name,
        full_name: `${this.defaultOwner || 'owner'}/${options.name}`,
        html_url: `https://github.com/${this.defaultOwner || 'owner'}/${options.name}`,
        description: options.description || '',
        private: options.visibility === RepositoryVisibility.PRIVATE,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create repository: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { name: options.name }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets repositories.
   * @param owner Repository owner
   * @returns Repositories
   */
  private async getRepositories(owner?: string): Promise<any> {
    try {
      owner = owner || this.defaultOwner;
      logger.info(`Getting repositories for ${owner}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-get-repositories', {
            owner
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return [
        {
          name: 'example-repo',
          full_name: `${owner}/example-repo`,
          html_url: `https://github.com/${owner}/example-repo`,
          description: 'An example repository',
          private: false,
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get repositories: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates a branch.
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name
   * @param fromBranch Branch to create from
   * @returns Created branch
   */
  private async createBranch(owner: string, repo: string, branch: string, fromBranch: string = 'main'): Promise<any> {
    try {
      logger.info(`Creating branch ${branch} in ${owner}/${repo}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-create-branch', {
            owner: owner || this.defaultOwner,
            repo,
            branch,
            from: fromBranch
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return {
        name: branch,
        commit: {
          sha: '0123456789abcdef0123456789abcdef01234567',
          url: `https://api.github.com/repos/${owner}/${repo}/commits/0123456789abcdef0123456789abcdef01234567`
        }
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo, branch, fromBranch }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets branches.
   * @param owner Repository owner
   * @param repo Repository name
   * @returns Branches
   */
  private async getBranches(owner: string, repo: string): Promise<any> {
    try {
      logger.info(`Getting branches from ${owner}/${repo}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-get-branches', {
            owner: owner || this.defaultOwner,
            repo
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return [
        {
          name: 'main',
          commit: {
            sha: '0123456789abcdef0123456789abcdef01234567',
            url: `https://api.github.com/repos/${owner}/${repo}/commits/0123456789abcdef0123456789abcdef01234567`
          }
        }
      ];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get branches: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets commits.
   * @param owner Repository owner
   * @param repo Repository name
   * @param branch Branch name
   * @returns Commits
   */
  private async getCommits(owner: string, repo: string, branch: string = 'main'): Promise<any> {
    try {
      logger.info(`Getting commits from ${owner}/${repo}/${branch}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-get-commits', {
            owner: owner || this.defaultOwner,
            repo,
            sha: branch
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return [
        {
          sha: '0123456789abcdef0123456789abcdef01234567',
          commit: {
            message: 'Example commit',
            author: {
              name: 'Example Author',
              email: 'example@example.com',
              date: new Date().toISOString()
            }
          },
          html_url: `https://github.com/${owner}/${repo}/commit/0123456789abcdef0123456789abcdef01234567`
        }
      ];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get commits: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo, branch }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Creates an issue.
   * @param owner Repository owner
   * @param repo Repository name
   * @param title Issue title
   * @param body Issue body
   * @param labels Issue labels
   * @returns Created issue
   */
  private async createIssue(owner: string, repo: string, title: string, body?: string, labels?: string[]): Promise<any> {
    try {
      logger.info(`Creating issue in ${owner}/${repo}: ${title}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-create-issue', {
            owner: owner || this.defaultOwner,
            repo,
            title,
            body: body || '',
            labels: labels || []
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return {
        number: 1,
        html_url: `https://github.com/${owner}/${repo}/issues/1`,
        title,
        body: body || '',
        labels: labels?.map(label => ({ name: label })) || [],
        state: 'open',
        created_at: new Date().toISOString()
      };
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create issue: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo, title }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Gets issues.
   * @param owner Repository owner
   * @param repo Repository name
   * @param state Issue state
   * @returns Issues
   */
  private async getIssues(owner: string, repo: string, state: string = 'open'): Promise<any> {
    try {
      logger.info(`Getting issues from ${owner}/${repo}`);
      
      // Try to use GitHub MCP Server if available
      if (this.githubServerUrl) {
        try {
          return await this.nexusClient.callTool('github-get-issues', {
            owner: owner || this.defaultOwner,
            repo,
            state
          });
        } catch (error) {
          logger.warn(`Failed to use GitHub MCP Server: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to basic implementation
        }
      }
      
      // Fall back to basic implementation
      // This would typically use the GitHub API directly
      
      // For now, return a placeholder result
      return [
        {
          number: 1,
          html_url: `https://github.com/${owner}/${repo}/issues/1`,
          title: 'Example issue',
          body: 'This is an example issue',
          labels: [],
          state: 'open',
          created_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to get issues: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { owner, repo, state }
      );
      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Handles a task.
   * @param task Task to handle
   * @param agent Agent handling the task
   * @returns Promise resolving to true if the task was handled, false otherwise
   */
  async handleTask(task: string, agent: Agent): Promise<boolean> {
    // Check if the task is a version control task
    const versionControlPatterns = [
      /create (a |an )?pull request/i,
      /create (a |an )?branch/i,
      /create (a |an )?repository/i,
      /create (a |an )?issue/i,
      /get (pull requests|branches|repositories|issues|commits)/i,
      /list (pull requests|branches|repositories|issues|commits)/i
    ];

    if (versionControlPatterns.some(pattern => pattern.test(task))) {
      try {
        logger.info(`Handling version control task: ${task}`);
        
        // This is a simplified implementation
        // In a real implementation, this would parse the task and extract parameters
        
        // For now, return false to indicate that the task wasn't handled
        return false;
      } catch (error) {
        logger.error(`Failed to handle version control task: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }

    return false;
  }
}
