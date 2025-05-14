/**
 * AdapterManager
 *
 * Manages specialized adapters for different MCP server types.
 */

import { NexusClient } from '../core/NexusClient';
import { ServerConfig } from '../core/types';
import { OllamaAdapter } from './OllamaAdapter';
import { ComfyUIAdapter } from './ComfyUIAdapter';
import { OllamaMCPAdapter } from './OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from './CodeEnhancementMCPAdapter';
import { GitHubMCPAdapter } from './GitHubMCPAdapter';
import { LucidityMCPAdapter } from './LucidityMCPAdapter';
import { EventBus } from '../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../core/ErrorHandling';
import { logger } from '../utils/logger';

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  serverId?: string;
  [key: string]: any;
}

/**
 * Server type enum
 */
export enum ServerType {
  OLLAMA = 'ollama',
  COMFYUI = 'comfyui',
  OLLAMA_MCP = 'ollama-mcp',
  CODE_ENHANCEMENT = 'code-enhancement',
  GITHUB = 'github',
  LUCIDITY = 'lucidity',
  UNKNOWN = 'unknown'
}

/**
 * AdapterManager manages specialized adapters for different MCP server types.
 */
export class AdapterManager {
  private nexusClient: NexusClient;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private ollamaAdapters: Map<string, OllamaAdapter> = new Map();
  private comfyuiAdapters: Map<string, ComfyUIAdapter> = new Map();
  private ollamaMCPAdapters: Map<string, OllamaMCPAdapter> = new Map();
  private codeEnhancementAdapters: Map<string, CodeEnhancementMCPAdapter> = new Map();
  private githubAdapters: Map<string, GitHubMCPAdapter> = new Map();
  private lucidityAdapters: Map<string, LucidityMCPAdapter> = new Map();

  /**
   * Creates a new AdapterManager instance.
   * @param nexusClient NexusClient instance
   */
  constructor(nexusClient: NexusClient) {
    this.nexusClient = nexusClient;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
  }

  /**
   * Detects the server type based on the server info.
   * @param serverInfo Server info
   * @returns Server type
   */
  detectServerType(serverInfo: any): ServerType {
    if (!serverInfo) {
      return ServerType.UNKNOWN;
    }

    // Check for Ollama MCP server (new version)
    if (
      (serverInfo.name?.toLowerCase().includes('ollama') ||
       serverInfo.description?.toLowerCase().includes('ollama')) &&
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'ollama-generate' ||
        tool.name === 'ollama-chat' ||
        tool.name === 'ollama-list-models' ||
        tool.name === 'ollama-pull-model' ||
        tool.name === 'ollama-embedding'
      ))
    ) {
      return ServerType.OLLAMA_MCP;
    }

    // Check for traditional Ollama adapter
    if (
      serverInfo.name?.toLowerCase().includes('ollama') ||
      serverInfo.description?.toLowerCase().includes('ollama') ||
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'generate_text' ||
        tool.name === 'chat_completion' ||
        tool.name === 'list_models' ||
        tool.name === 'pull_model' ||
        tool.name === 'create_embedding'
      ))
    ) {
      return ServerType.OLLAMA;
    }

    // Check for ComfyUI MCP server
    if (
      serverInfo.name?.toLowerCase().includes('comfyui') ||
      serverInfo.description?.toLowerCase().includes('comfyui') ||
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'generate_image_from_text' ||
        tool.name === 'generate_image_from_image' ||
        tool.name === 'upscale_image' ||
        tool.name === 'inpaint_image' ||
        tool.name === 'apply_style_transfer'
      ))
    ) {
      return ServerType.COMFYUI;
    }

    // Check for Code Enhancement MCP server
    if (
      serverInfo.name?.toLowerCase().includes('code enhancement') ||
      serverInfo.description?.toLowerCase().includes('code enhancement') ||
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'format-code' ||
        tool.name === 'analyze-code' ||
        tool.name === 'generate-documentation' ||
        tool.name === 'generate-tests' ||
        tool.name === 'refactor-code'
      ))
    ) {
      return ServerType.CODE_ENHANCEMENT;
    }

    // Check for GitHub MCP server
    if (
      serverInfo.name?.toLowerCase().includes('github') ||
      serverInfo.description?.toLowerCase().includes('github') ||
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'github-create-repository' ||
        tool.name === 'github-get-repositories' ||
        tool.name === 'github-create-pull-request' ||
        tool.name === 'github-get-pull-requests' ||
        tool.name === 'github-create-issue'
      ))
    ) {
      return ServerType.GITHUB;
    }

    // Check for Lucidity MCP server
    if (
      serverInfo.name?.toLowerCase().includes('lucidity') ||
      serverInfo.description?.toLowerCase().includes('lucidity') ||
      (serverInfo.tools && serverInfo.tools.some((tool: any) =>
        tool.name === 'analyze-code' ||
        tool.name === 'analyze-security' ||
        tool.name === 'analyze-performance' ||
        tool.name === 'calculate-complexity' ||
        tool.name === 'analyze-changes'
      ))
    ) {
      return ServerType.LUCIDITY;
    }

    return ServerType.UNKNOWN;
  }

  /**
   * Creates a specialized adapter for a server.
   * @param serverId Server identifier
   * @param config Server configuration or adapter configuration
   * @returns Promise resolving to the created adapter
   */
  async createAdapter(serverId: string, config: ServerConfig | AdapterConfig): Promise<any> {
    try {
      logger.info(`Creating adapter for server: ${serverId}`);

      // If config is a ServerConfig, connect to the server to get server info
      if ('type' in config) {
        // Connect to the server to get server info
        await this.nexusClient.connectServer(serverId, config as ServerConfig);

        // Get server info
        const serverInfo = await this.nexusClient.getServerInfo(serverId);

        // Detect server type
        const serverType = this.detectServerType(serverInfo);

        // Create appropriate adapter
        switch (serverType) {
          case ServerType.OLLAMA:
            logger.info(`Detected Ollama MCP server (traditional): ${serverId}`);
            const ollamaAdapter = new OllamaAdapter(this.nexusClient, serverId, config as ServerConfig);
            this.ollamaAdapters.set(serverId, ollamaAdapter);
            return ollamaAdapter;

          case ServerType.COMFYUI:
            logger.info(`Detected ComfyUI MCP server: ${serverId}`);
            const comfyuiAdapter = new ComfyUIAdapter(this.nexusClient, serverId, config as ServerConfig);
            this.comfyuiAdapters.set(serverId, comfyuiAdapter);
            return comfyuiAdapter;

          case ServerType.OLLAMA_MCP:
            logger.info(`Detected Ollama MCP server: ${serverId}`);
            const ollamaMCPAdapter = new OllamaMCPAdapter(this.nexusClient, {
              serverId,
              ...config
            });
            await ollamaMCPAdapter.initialize();
            this.ollamaMCPAdapters.set(serverId, ollamaMCPAdapter);
            return ollamaMCPAdapter;

          case ServerType.CODE_ENHANCEMENT:
            logger.info(`Detected Code Enhancement MCP server: ${serverId}`);
            const codeEnhancementAdapter = new CodeEnhancementMCPAdapter(this.nexusClient, {
              serverId,
              ...config
            });
            await codeEnhancementAdapter.initialize();
            this.codeEnhancementAdapters.set(serverId, codeEnhancementAdapter);
            return codeEnhancementAdapter;

          case ServerType.GITHUB:
            logger.info(`Detected GitHub MCP server: ${serverId}`);
            const githubAdapter = new GitHubMCPAdapter(this.nexusClient, {
              serverId,
              ...config
            });
            await githubAdapter.initialize();
            this.githubAdapters.set(serverId, githubAdapter);
            return githubAdapter;

          case ServerType.LUCIDITY:
            logger.info(`Detected Lucidity MCP server: ${serverId}`);
            const lucidityAdapter = new LucidityMCPAdapter(this.nexusClient, {
              serverId,
              ...config
            });
            await lucidityAdapter.initialize();
            this.lucidityAdapters.set(serverId, lucidityAdapter);
            return lucidityAdapter;

          default:
            logger.warn(`Unknown server type for server: ${serverId}`);
            return null;
        }
      } else {
        // If config is an AdapterConfig, create the adapter directly
        const adapterConfig = config as AdapterConfig;

        // Create appropriate adapter based on the adapter type
        if ('defaultModel' in adapterConfig && adapterConfig.serverId?.includes('ollama')) {
          logger.info(`Creating Ollama MCP adapter: ${serverId}`);
          const ollamaMCPAdapter = new OllamaMCPAdapter(this.nexusClient, {
            serverId,
            ...adapterConfig
          });
          await ollamaMCPAdapter.initialize();
          this.ollamaMCPAdapters.set(serverId, ollamaMCPAdapter);
          return ollamaMCPAdapter;
        } else if ('defaultLanguage' in adapterConfig && adapterConfig.serverId?.includes('code')) {
          logger.info(`Creating Code Enhancement MCP adapter: ${serverId}`);
          const codeEnhancementAdapter = new CodeEnhancementMCPAdapter(this.nexusClient, {
            serverId,
            ...adapterConfig
          });
          await codeEnhancementAdapter.initialize();
          this.codeEnhancementAdapters.set(serverId, codeEnhancementAdapter);
          return codeEnhancementAdapter;
        } else if ('defaultOwner' in adapterConfig && adapterConfig.serverId?.includes('github')) {
          logger.info(`Creating GitHub MCP adapter: ${serverId}`);
          const githubAdapter = new GitHubMCPAdapter(this.nexusClient, {
            serverId,
            ...adapterConfig
          });
          await githubAdapter.initialize();
          this.githubAdapters.set(serverId, githubAdapter);
          return githubAdapter;
        } else if ('defaultLanguage' in adapterConfig && adapterConfig.serverId?.includes('lucidity')) {
          logger.info(`Creating Lucidity MCP adapter: ${serverId}`);
          const lucidityAdapter = new LucidityMCPAdapter(this.nexusClient, {
            serverId,
            ...adapterConfig
          });
          await lucidityAdapter.initialize();
          this.lucidityAdapters.set(serverId, lucidityAdapter);
          return lucidityAdapter;
        } else {
          logger.warn(`Unknown adapter type for server: ${serverId}`);
          return null;
        }
      }
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create adapter for server ${serverId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.FRAMEWORK,
        error instanceof Error ? error : undefined,
        { serverId }
      );
      await this.errorHandling.handleError(agentError);
      return null;
    }
  }

  /**
   * Gets an Ollama adapter by server ID.
   * @param serverId Server identifier
   * @returns Ollama adapter or null if not found
   */
  getOllamaAdapter(serverId: string): OllamaAdapter | null {
    return this.ollamaAdapters.get(serverId) || null;
  }

  /**
   * Gets a ComfyUI adapter by server ID.
   * @param serverId Server identifier
   * @returns ComfyUI adapter or null if not found
   */
  getComfyUIAdapter(serverId: string): ComfyUIAdapter | null {
    return this.comfyuiAdapters.get(serverId) || null;
  }

  /**
   * Gets all Ollama adapters.
   * @returns Map of server ID to Ollama adapter
   */
  getAllOllamaAdapters(): Map<string, OllamaAdapter> {
    return this.ollamaAdapters;
  }

  /**
   * Gets all ComfyUI adapters.
   * @returns Map of server ID to ComfyUI adapter
   */
  getAllComfyUIAdapters(): Map<string, ComfyUIAdapter> {
    return this.comfyuiAdapters;
  }

  /**
   * Gets the first available Ollama adapter.
   * @returns First available Ollama adapter or null if none found
   */
  getFirstOllamaAdapter(): OllamaAdapter | null {
    const adapters = Array.from(this.ollamaAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Gets the first available ComfyUI adapter.
   * @returns First available ComfyUI adapter or null if none found
   */
  getFirstComfyUIAdapter(): ComfyUIAdapter | null {
    const adapters = Array.from(this.comfyuiAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Gets an Ollama MCP adapter by server ID.
   * @param serverId Server identifier
   * @returns Ollama MCP adapter or null if not found
   */
  getOllamaMCPAdapter(serverId: string): OllamaMCPAdapter | null {
    return this.ollamaMCPAdapters.get(serverId) || null;
  }

  /**
   * Gets a Code Enhancement MCP adapter by server ID.
   * @param serverId Server identifier
   * @returns Code Enhancement MCP adapter or null if not found
   */
  getCodeEnhancementAdapter(serverId: string): CodeEnhancementMCPAdapter | null {
    return this.codeEnhancementAdapters.get(serverId) || null;
  }

  /**
   * Gets a GitHub MCP adapter by server ID.
   * @param serverId Server identifier
   * @returns GitHub MCP adapter or null if not found
   */
  getGitHubAdapter(serverId: string): GitHubMCPAdapter | null {
    return this.githubAdapters.get(serverId) || null;
  }

  /**
   * Gets a Lucidity MCP adapter by server ID.
   * @param serverId Server identifier
   * @returns Lucidity MCP adapter or null if not found
   */
  getLucidityAdapter(serverId: string): LucidityMCPAdapter | null {
    return this.lucidityAdapters.get(serverId) || null;
  }

  /**
   * Gets all Ollama MCP adapters.
   * @returns Map of server ID to Ollama MCP adapter
   */
  getAllOllamaMCPAdapters(): Map<string, OllamaMCPAdapter> {
    return this.ollamaMCPAdapters;
  }

  /**
   * Gets all Code Enhancement MCP adapters.
   * @returns Map of server ID to Code Enhancement MCP adapter
   */
  getAllCodeEnhancementAdapters(): Map<string, CodeEnhancementMCPAdapter> {
    return this.codeEnhancementAdapters;
  }

  /**
   * Gets all GitHub MCP adapters.
   * @returns Map of server ID to GitHub MCP adapter
   */
  getAllGitHubAdapters(): Map<string, GitHubMCPAdapter> {
    return this.githubAdapters;
  }

  /**
   * Gets all Lucidity MCP adapters.
   * @returns Map of server ID to Lucidity MCP adapter
   */
  getAllLucidityAdapters(): Map<string, LucidityMCPAdapter> {
    return this.lucidityAdapters;
  }

  /**
   * Gets the first available Ollama MCP adapter.
   * @returns First available Ollama MCP adapter or null if none found
   */
  getFirstOllamaMCPAdapter(): OllamaMCPAdapter | null {
    const adapters = Array.from(this.ollamaMCPAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Gets the first available Code Enhancement MCP adapter.
   * @returns First available Code Enhancement MCP adapter or null if none found
   */
  getFirstCodeEnhancementAdapter(): CodeEnhancementMCPAdapter | null {
    const adapters = Array.from(this.codeEnhancementAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Gets the first available GitHub MCP adapter.
   * @returns First available GitHub MCP adapter or null if none found
   */
  getFirstGitHubAdapter(): GitHubMCPAdapter | null {
    const adapters = Array.from(this.githubAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Gets the first available Lucidity MCP adapter.
   * @returns First available Lucidity MCP adapter or null if none found
   */
  getFirstLucidityAdapter(): LucidityMCPAdapter | null {
    const adapters = Array.from(this.lucidityAdapters.values());
    return adapters.length > 0 ? adapters[0] : null;
  }

  /**
   * Removes an adapter by server ID.
   * @param serverId Server identifier
   * @returns True if the adapter was removed, false otherwise
   */
  removeAdapter(serverId: string): boolean {
    const ollamaRemoved = this.ollamaAdapters.delete(serverId);
    const comfyuiRemoved = this.comfyuiAdapters.delete(serverId);
    const ollamaMCPRemoved = this.ollamaMCPAdapters.delete(serverId);
    const codeEnhancementRemoved = this.codeEnhancementAdapters.delete(serverId);
    const githubRemoved = this.githubAdapters.delete(serverId);
    const lucidityRemoved = this.lucidityAdapters.delete(serverId);
    return ollamaRemoved || comfyuiRemoved || ollamaMCPRemoved || codeEnhancementRemoved || githubRemoved || lucidityRemoved;
  }

  /**
   * Clears all adapters.
   */
  clearAdapters(): void {
    this.ollamaAdapters.clear();
    this.comfyuiAdapters.clear();
    this.ollamaMCPAdapters.clear();
    this.codeEnhancementAdapters.clear();
    this.githubAdapters.clear();
    this.lucidityAdapters.clear();
  }
}
