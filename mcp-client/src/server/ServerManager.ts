/**
 * ServerManager
 * 
 * Manages MCP server connections and configurations.
 */

import { NexusClient } from '../core/NexusClient';
import { ServerConfig } from '../core/types';

/**
 * ServerManager handles the registration and management of MCP servers.
 */
export class ServerManager {
  private nexusClient: NexusClient;
  private serverConfigs: Map<string, ServerConfig>;

  /**
   * Creates a new ServerManager instance.
   * @param nexusClient NexusClient instance
   */
  constructor(nexusClient: NexusClient) {
    this.nexusClient = nexusClient;
    this.serverConfigs = new Map();
  }

  /**
   * Registers a server configuration.
   * @param serverId Server identifier
   * @param config Server configuration
   */
  registerServer(serverId: string, config: ServerConfig): void {
    this.serverConfigs.set(serverId, config);
  }

  /**
   * Connects to all registered servers.
   * @returns Map of server ID to connection result
   */
  async connectAll(): Promise<Record<string, { success: boolean; error?: string }>> {
    const results: Record<string, { success: boolean; error?: string }> = {};
    
    for (const [serverId, config] of this.serverConfigs.entries()) {
      try {
        await this.nexusClient.connectServer(serverId, config);
        results[serverId] = { success: true };
      } catch (error) {
        results[serverId] = { 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return results;
  }

  /**
   * Gets the health status of all connected servers.
   * @returns Map of server ID to health status
   */
  async getServerStatus(): Promise<Record<string, { 
    connected: boolean; 
    health?: string; 
    toolCount?: number;
    error?: string;
  }>> {
    const status: Record<string, { 
      connected: boolean; 
      health?: string; 
      toolCount?: number;
      error?: string;
    }> = {};
    
    for (const [serverId, server] of this.nexusClient.getServers().entries()) {
      try {
        const healthResponse = await server.client.request({ method: "health" });
        status[serverId] = {
          connected: true,
          health: healthResponse.status || "unknown",
          toolCount: server.tools.length
        };
      } catch (error) {
        status[serverId] = {
          connected: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    return status;
  }

  /**
   * Gets all registered server configurations.
   * @returns Map of server ID to server configuration
   */
  getServerConfigs(): Map<string, ServerConfig> {
    return this.serverConfigs;
  }
}
