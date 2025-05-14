/**
 * Tests for the NexusClient class.
 */

import { NexusClient } from './NexusClient';
import { ServerConfig } from './types';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    listTools: jest.fn().mockResolvedValue({
      tools: [
        {
          name: 'test-tool',
          description: 'A test tool',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }),
    callTool: jest.fn().mockResolvedValue({ content: 'Tool result' }),
    request: jest.fn().mockResolvedValue({ status: 'ok' })
  }))
}));

// Mock the transports
jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: jest.fn().mockImplementation(() => ({}))
}));

describe('NexusClient', () => {
  let client: NexusClient;

  beforeEach(() => {
    client = new NexusClient();
  });

  describe('connectServer', () => {
    it('should connect to a stdio server', async () => {
      const serverId = 'test-stdio-server';
      const config: ServerConfig = {
        type: 'stdio',
        command: 'node',
        args: ['server.js']
      };

      await client.connectServer(serverId, config);

      // Check that the server was registered
      expect(client.getServers().has(serverId)).toBe(true);
    });

    it('should connect to an HTTP server', async () => {
      const serverId = 'test-http-server';
      const config: ServerConfig = {
        type: 'sse',
        url: 'http://localhost:3000'
      };

      await client.connectServer(serverId, config);

      // Check that the server was registered
      expect(client.getServers().has(serverId)).toBe(true);
    });
  });

  describe('discoverTools', () => {
    it('should discover tools from a connected server', async () => {
      const serverId = 'test-server';
      const config: ServerConfig = {
        type: 'stdio',
        command: 'node',
        args: ['server.js']
      };

      await client.connectServer(serverId, config);
      const tools = await client.discoverTools(serverId);

      // Check that the tools were discovered
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should throw an error if the server is not connected', async () => {
      await expect(client.discoverTools('non-existent-server')).rejects.toThrow();
    });
  });

  describe('callTool', () => {
    it('should call a tool on a connected server', async () => {
      const serverId = 'test-server';
      const config: ServerConfig = {
        type: 'stdio',
        command: 'node',
        args: ['server.js']
      };

      await client.connectServer(serverId, config);
      await client.discoverTools(serverId);

      const result = await client.callTool('test-tool', {});

      // Check that the tool was called
      expect(result.content).toBe('Tool result');
    });

    it('should throw an error if the tool is not found', async () => {
      await expect(client.callTool('non-existent-tool', {})).rejects.toThrow();
    });
  });
});
