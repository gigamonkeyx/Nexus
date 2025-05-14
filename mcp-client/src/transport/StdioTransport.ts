/**
 * StdioTransport
 * 
 * stdio transport implementation for MCP clients.
 */

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ChildProcess, spawn } from 'child_process';

/**
 * StdioTransport provides a wrapper around the StdioClientTransport from the MCP SDK.
 * It adds additional functionality like process management and error handling.
 */
export class StdioTransport {
  private transport: StdioClientTransport;
  private command: string;
  private args: string[];
  private env: Record<string, string>;
  private process: ChildProcess | null;
  private connected: boolean;
  private onExitCallback: ((code: number | null) => void) | null;

  /**
   * Creates a new StdioTransport instance.
   * @param options Transport options
   */
  constructor(options: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }) {
    this.command = options.command;
    this.args = options.args || [];
    this.env = options.env || {};
    this.process = null;
    this.connected = false;
    this.onExitCallback = null;
    
    this.transport = new StdioClientTransport({
      command: this.command,
      args: this.args,
      env: this.env
    });
  }

  /**
   * Connects to the MCP server.
   * @returns The transport instance
   */
  async connect(): Promise<StdioClientTransport> {
    try {
      // The StdioClientTransport automatically spawns the process,
      // but we'll also keep track of it ourselves for better management
      this.process = spawn(this.command, this.args, {
        env: { ...process.env, ...this.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Set up process event handlers
      this.process.on('exit', (code) => {
        this.connected = false;
        if (this.onExitCallback) {
          this.onExitCallback(code);
        }
      });
      
      this.process.on('error', (error) => {
        this.connected = false;
        console.error(`Process error: ${error.message}`);
      });
      
      this.connected = true;
      return this.transport;
    } catch (error) {
      throw new Error(`Failed to connect to MCP server: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnects from the MCP server.
   */
  async disconnect(): Promise<void> {
    if (this.process) {
      // Kill the process
      this.process.kill();
      this.process = null;
    }
    
    this.connected = false;
  }

  /**
   * Sets a callback to be called when the process exits.
   * @param callback Callback function
   */
  onExit(callback: (code: number | null) => void): void {
    this.onExitCallback = callback;
  }

  /**
   * Gets the underlying transport.
   * @returns The transport instance
   */
  getTransport(): StdioClientTransport {
    return this.transport;
  }

  /**
   * Gets the underlying process.
   * @returns The process instance
   */
  getProcess(): ChildProcess | null {
    return this.process;
  }

  /**
   * Checks if the transport is connected.
   * @returns True if connected, false otherwise
   */
  isConnected(): boolean {
    return this.connected;
  }
}
