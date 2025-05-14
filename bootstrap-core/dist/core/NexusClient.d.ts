/**
 * Nexus Client
 *
 * Client for interacting with the Nexus MCP server hub.
 */
export interface ServerConfig {
    type: 'sse' | 'websocket' | 'http';
    url: string;
    headers?: Record<string, string>;
    options?: any;
}
export declare class NexusClient {
    private servers;
    private connections;
    private eventBus;
    private requestId;
    private pendingRequests;
    constructor();
    /**
     * Register a server
     */
    registerServer(serverId: string, config: ServerConfig): void;
    /**
     * Unregister a server
     */
    unregisterServer(serverId: string): void;
    /**
     * Connect to a server
     */
    connectServer(serverId: string): Promise<void>;
    /**
     * Disconnect from a server
     */
    disconnectServer(serverId: string): void;
    /**
     * Send a request to a server
     */
    sendRequest(serverId: string, method: string, params: any): Promise<any>;
    /**
     * Get all registered servers
     */
    getServers(): string[];
    /**
     * Get connected servers
     */
    getConnectedServers(): string[];
    /**
     * Check if connected to a server
     */
    isConnected(serverId: string): boolean;
    /**
     * Subscribe to events
     */
    subscribe(event: string, callback: (data: any) => void): () => void;
    /**
     * Connect to a server using SSE
     */
    private connectSSE;
    /**
     * Connect to a server using WebSocket
     */
    private connectWebSocket;
    /**
     * Send a request to a server using HTTP
     */
    private sendHTTPRequest;
    /**
     * Send a request to a server using a stream (SSE or WebSocket)
     */
    private sendStreamRequest;
}
