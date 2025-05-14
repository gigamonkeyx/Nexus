/**
 * Nexus Client
 * 
 * Client for interacting with the Nexus MCP server hub.
 */

import axios from 'axios';
import EventSource from 'eventsource';
import { EventBus } from './EventBus';
import { logger } from '../utils/logger';

export interface ServerConfig {
  type: 'sse' | 'websocket' | 'http';
  url: string;
  headers?: Record<string, string>;
  options?: any;
}

export class NexusClient {
  private servers: Map<string, ServerConfig> = new Map();
  private connections: Map<string, EventSource | WebSocket | null> = new Map();
  private eventBus: EventBus;
  private requestId: number = 0;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map();
  
  constructor() {
    this.eventBus = new EventBus();
  }
  
  /**
   * Register a server
   */
  public registerServer(serverId: string, config: ServerConfig): void {
    this.servers.set(serverId, config);
    this.connections.set(serverId, null);
    logger.info(`Registered server: ${serverId}`);
  }
  
  /**
   * Unregister a server
   */
  public unregisterServer(serverId: string): void {
    // Disconnect if connected
    if (this.connections.get(serverId)) {
      this.disconnectServer(serverId);
    }
    
    this.servers.delete(serverId);
    this.connections.delete(serverId);
    logger.info(`Unregistered server: ${serverId}`);
  }
  
  /**
   * Connect to a server
   */
  public async connectServer(serverId: string): Promise<void> {
    const config = this.servers.get(serverId);
    
    if (!config) {
      throw new Error(`Unknown server: ${serverId}`);
    }
    
    // Check if already connected
    if (this.connections.get(serverId)) {
      logger.warn(`Already connected to server: ${serverId}`);
      return;
    }
    
    try {
      if (config.type === 'sse') {
        await this.connectSSE(serverId, config);
      } else if (config.type === 'websocket') {
        await this.connectWebSocket(serverId, config);
      } else if (config.type === 'http') {
        // HTTP doesn't need a persistent connection
        this.connections.set(serverId, null);
        logger.info(`Connected to HTTP server: ${serverId}`);
      } else {
        throw new Error(`Unsupported server type: ${config.type}`);
      }
    } catch (error) {
      logger.error(`Failed to connect to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Disconnect from a server
   */
  public disconnectServer(serverId: string): void {
    const connection = this.connections.get(serverId);
    
    if (!connection) {
      logger.warn(`Not connected to server: ${serverId}`);
      return;
    }
    
    try {
      if (connection instanceof EventSource) {
        connection.close();
      } else if (connection instanceof WebSocket) {
        connection.close();
      }
      
      this.connections.set(serverId, null);
      logger.info(`Disconnected from server: ${serverId}`);
    } catch (error) {
      logger.error(`Failed to disconnect from server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Send a request to a server
   */
  public async sendRequest(serverId: string, method: string, params: any): Promise<any> {
    const config = this.servers.get(serverId);
    
    if (!config) {
      throw new Error(`Unknown server: ${serverId}`);
    }
    
    try {
      if (config.type === 'http') {
        return this.sendHTTPRequest(serverId, method, params);
      } else {
        return this.sendStreamRequest(serverId, method, params);
      }
    } catch (error) {
      logger.error(`Failed to send request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get all registered servers
   */
  public getServers(): string[] {
    return Array.from(this.servers.keys());
  }
  
  /**
   * Get connected servers
   */
  public getConnectedServers(): string[] {
    return Array.from(this.connections.entries())
      .filter(([_, connection]) => connection !== null)
      .map(([serverId, _]) => serverId);
  }
  
  /**
   * Check if connected to a server
   */
  public isConnected(serverId: string): boolean {
    return this.connections.get(serverId) !== null;
  }
  
  /**
   * Subscribe to events
   */
  public subscribe(event: string, callback: (data: any) => void): () => void {
    return this.eventBus.subscribe(event, callback);
  }
  
  /**
   * Connect to a server using SSE
   */
  private async connectSSE(serverId: string, config: ServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const eventSource = new EventSource(config.url, {
          headers: config.headers || {},
          ...config.options
        });
        
        eventSource.onopen = () => {
          this.connections.set(serverId, eventSource);
          logger.info(`Connected to SSE server: ${serverId}`);
          resolve();
        };
        
        eventSource.onerror = (error) => {
          logger.error(`Error from SSE server ${serverId}: ${JSON.stringify(error)}`);
          
          if (eventSource.readyState === EventSource.CLOSED) {
            this.connections.set(serverId, null);
            this.eventBus.publish(`${serverId}:disconnected`, { serverId });
          }
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check if it's a response to a request
            if (data.id && this.pendingRequests.has(data.id)) {
              const { resolve } = this.pendingRequests.get(data.id)!;
              this.pendingRequests.delete(data.id);
              resolve(data.result);
            } else {
              // Publish event
              this.eventBus.publish(`${serverId}:message`, data);
              
              if (data.event) {
                this.eventBus.publish(`${serverId}:${data.event}`, data);
              }
            }
          } catch (error) {
            logger.error(`Failed to parse message from SSE server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
          }
        };
        
        // Set up event listeners for specific events
        eventSource.addEventListener('error', (event) => {
          this.eventBus.publish(`${serverId}:error`, event);
        });
        
        eventSource.addEventListener('open', (event) => {
          this.eventBus.publish(`${serverId}:connected`, { serverId });
        });
      } catch (error) {
        logger.error(`Failed to connect to SSE server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      }
    });
  }
  
  /**
   * Connect to a server using WebSocket
   */
  private async connectWebSocket(serverId: string, config: ServerConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new WebSocket(config.url);
        
        socket.onopen = () => {
          this.connections.set(serverId, socket);
          logger.info(`Connected to WebSocket server: ${serverId}`);
          this.eventBus.publish(`${serverId}:connected`, { serverId });
          resolve();
        };
        
        socket.onerror = (error) => {
          logger.error(`Error from WebSocket server ${serverId}: ${JSON.stringify(error)}`);
          this.eventBus.publish(`${serverId}:error`, error);
        };
        
        socket.onclose = () => {
          this.connections.set(serverId, null);
          logger.info(`Disconnected from WebSocket server: ${serverId}`);
          this.eventBus.publish(`${serverId}:disconnected`, { serverId });
        };
        
        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check if it's a response to a request
            if (data.id && this.pendingRequests.has(data.id)) {
              const { resolve } = this.pendingRequests.get(data.id)!;
              this.pendingRequests.delete(data.id);
              resolve(data.result);
            } else {
              // Publish event
              this.eventBus.publish(`${serverId}:message`, data);
              
              if (data.event) {
                this.eventBus.publish(`${serverId}:${data.event}`, data);
              }
            }
          } catch (error) {
            logger.error(`Failed to parse message from WebSocket server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
          }
        };
      } catch (error) {
        logger.error(`Failed to connect to WebSocket server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      }
    });
  }
  
  /**
   * Send a request to a server using HTTP
   */
  private async sendHTTPRequest(serverId: string, method: string, params: any): Promise<any> {
    const config = this.servers.get(serverId);
    
    if (!config) {
      throw new Error(`Unknown server: ${serverId}`);
    }
    
    try {
      const response = await axios.post(config.url, {
        jsonrpc: '2.0',
        method,
        params,
        id: `${serverId}_${this.requestId++}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      });
      
      if (response.data.error) {
        throw new Error(response.data.error.message || 'Unknown error');
      }
      
      return response.data.result;
    } catch (error) {
      logger.error(`Failed to send HTTP request to server ${serverId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Send a request to a server using a stream (SSE or WebSocket)
   */
  private async sendStreamRequest(serverId: string, method: string, params: any): Promise<any> {
    const connection = this.connections.get(serverId);
    
    if (!connection && connection !== null) {
      throw new Error(`Not connected to server: ${serverId}`);
    }
    
    return new Promise((resolve, reject) => {
      const id = `${serverId}_${this.requestId++}`;
      
      // Store the promise callbacks
      this.pendingRequests.set(id, { resolve, reject });
      
      // Set a timeout to reject the promise if no response is received
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request to server ${serverId} timed out`));
        }
      }, 30000);
      
      try {
        const request = {
          jsonrpc: '2.0',
          method,
          params,
          id
        };
        
        if (connection instanceof WebSocket) {
          connection.send(JSON.stringify(request));
        } else {
          // For SSE, we need to use a separate HTTP request
          this.sendHTTPRequest(serverId, method, params)
            .then(resolve)
            .catch(reject)
            .finally(() => {
              clearTimeout(timeout);
              this.pendingRequests.delete(id);
            });
        }
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }
}
