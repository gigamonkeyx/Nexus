/**
 * HttpTransport
 * 
 * HTTP transport implementation for MCP clients.
 */

import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

/**
 * HttpTransport provides a wrapper around the SSEClientTransport from the MCP SDK.
 * It adds additional functionality like automatic reconnection and error handling.
 */
export class HttpTransport {
  private transport: SSEClientTransport;
  private url: string;
  private headers: Record<string, string>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private connected: boolean;

  /**
   * Creates a new HttpTransport instance.
   * @param options Transport options
   */
  constructor(options: {
    url: string;
    headers?: Record<string, string>;
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
  }) {
    this.url = options.url;
    this.headers = options.headers || {};
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.reconnectAttempts = 0;
    this.connected = false;
    
    this.transport = new SSEClientTransport({
      url: this.url,
      headers: this.headers
    });
  }

  /**
   * Connects to the MCP server.
   * @returns The transport instance
   */
  async connect(): Promise<SSEClientTransport> {
    try {
      // The SSEClientTransport doesn't have a connect method,
      // but we'll include this for consistency with other transports
      this.connected = true;
      this.reconnectAttempts = 0;
      return this.transport;
    } catch (error) {
      throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnects from the MCP server.
   */
  async disconnect(): Promise<void> {
    // The SSEClientTransport doesn't have a disconnect method,
    // but we'll include this for consistency with other transports
    this.connected = false;
  }

  /**
   * Reconnects to the MCP server.
   * @returns The transport instance
   */
  async reconnect(): Promise<SSEClientTransport> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new Error(`Failed to reconnect to MCP server after ${this.maxReconnectAttempts} attempts`);
    }
    
    this.reconnectAttempts++;
    
    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
    
    // Create a new transport
    this.transport = new SSEClientTransport({
      url: this.url,
      headers: this.headers
    });
    
    return this.connect();
  }

  /**
   * Gets the underlying transport.
   * @returns The transport instance
   */
  getTransport(): SSEClientTransport {
    return this.transport;
  }

  /**
   * Checks if the transport is connected.
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
}
