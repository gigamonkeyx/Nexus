/**
 * Nexus MCP Client
 * 
 * This module provides an LLM-compatible client for MCP servers in the Nexus Hub.
 * It enables LLMs to interact with specialized MCP servers through a unified interface.
 */

// Export core components
export * from './core/NexusClient';
export * from './core/types';

// Export LLM adapters
export * from './llm/ClaudeAdapter';
export * from './llm/OpenAIAdapter';
export * from './llm/OllamaAdapter';

// Export server manager
export * from './server/ServerManager';

// Export agent framework
export * from './agent/AgentFramework';
export * from './agent/Agent';

// Export transport utilities
export * from './transport/StdioTransport';
export * from './transport/HttpTransport';
