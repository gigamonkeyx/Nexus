/**
 * NexusClient
 * 
 * Core client that manages connections to MCP servers and provides a unified
 * interface for interacting with them.
 */

import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { ServerConfig, Tool } from './types';

/**
 * NexusClient is the core client for interacting with MCP servers.
 * It manages connections to multiple servers and provides a unified interface
 * for discovering and calling tools.
 */
export class NexusClient {
  private servers: Map<string, {
    client: MCPClient;
    config: ServerConfig;
    tools: string[];
  }>;
  private tools: Map<string, Tool & { serverId: string }>;
  private options: any;

  /**
   * Creates a new NexusClient instance.
   * @param options Client options
   */
  constructor(options: any = {}) {
    this.servers = new Map();
    this.tools = new Map();
    this.options = options;
  }

  /**
   * Connects to an MCP server.
   * @param serverId Unique identifier for the server
   * @param serverConfig Server configuration
   * @returns The MCP client instance
   */
  async connectServer(serverId: string, serverConfig: ServerConfig): Promise<MCPClient> {
    // Create appropriate transport (stdio or HTTP/SSE)
    const transport = this.createTransport(serverConfig);
    
    // Initialize MCP client
    const client = new MCPClient({
      name: "nexus-hub-client",
      version: "1.0.0"
    });
    
    // Connect to server
    await client.connect(transport);
    
    // Register server
    this.servers.set(serverId, {
      client,
      config: serverConfig,
      tools: []
    });
    
    // Discover and register tools
    await this.discoverTools(serverId);
    
    return client;
  }

  /**
   * Discovers tools from a connected server.
   * @param serverId Server identifier
   * @returns List of discovered tools
   */
  async discoverTools(serverId: string): Promise<any[]> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Server ${serverId} not connected`);
    
    // List tools from server
    const toolsResponse = await server.client.listTools();
    
    // Register tools
    for (const tool of toolsResponse.tools) {
      this.tools.set(tool.name, {
        ...tool,
        serverId
      });
      server.tools.push(tool.name);
    }
    
    return toolsResponse.tools;
  }

  /**
   * Calls a tool by name.
   * @param toolName Name of the tool to call
   * @param args Arguments to pass to the tool
   * @returns Tool execution result
   */
  async callTool(toolName: string, args: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool ${toolName} not found`);
    
    const server = this.servers.get(tool.serverId);
    if (!server) throw new Error(`Server for tool ${toolName} not connected`);
    
    // Call tool on server
    return await server.client.callTool({
      name: toolName,
      arguments: args
    });
  }

  /**
   * Gets all available tools.
   * @returns Map of tool name to tool definition
   */
  getTools(): Map<string, Tool & { serverId: string }> {
    return this.tools;
  }

  /**
   * Gets all connected servers.
   * @returns Map of server ID to server information
   */
  getServers(): Map<string, {
    client: MCPClient;
    config: ServerConfig;
    tools: string[];
  }> {
    return this.servers;
  }

  /**
   * Creates an appropriate transport based on server configuration.
   * @param config Server configuration
   * @returns Transport instance
   */
  private createTransport(config: ServerConfig): StdioClientTransport | SSEClientTransport {
    if (config.type === "stdio") {
      return new StdioClientTransport({
        command: config.command,
        args: config.args || [],
        env: config.env
      });
    } else if (config.type === "sse") {
      return new SSEClientTransport({
        url: config.url,
        headers: config.headers
      });
    } else {
      throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}
