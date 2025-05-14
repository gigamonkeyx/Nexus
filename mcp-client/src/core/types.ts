/**
 * Core types for the Nexus MCP Client
 */

/**
 * Server configuration for connecting to an MCP server
 */
export interface ServerConfig {
  /** Type of transport to use (stdio or sse) */
  type: 'stdio' | 'sse';
  
  /** Command to execute (for stdio transport) */
  command?: string;
  
  /** Arguments to pass to the command (for stdio transport) */
  args?: string[];
  
  /** Environment variables to set (for stdio transport) */
  env?: Record<string, string>;
  
  /** URL to connect to (for sse transport) */
  url?: string;
  
  /** Headers to include in the request (for sse transport) */
  headers?: Record<string, string>;
}

/**
 * Tool definition
 */
export interface Tool {
  /** Name of the tool */
  name: string;
  
  /** Description of the tool */
  description?: string;
  
  /** JSON Schema for the tool's input */
  inputSchema: any;
}

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  /** Provider name (anthropic, openai, ollama) */
  provider: 'anthropic' | 'openai' | 'ollama';
  
  /** API key for the provider */
  apiKey?: string;
  
  /** Model to use */
  model?: string;
  
  /** Base URL for the API */
  baseUrl?: string;
  
  /** Additional provider-specific options */
  options?: Record<string, any>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Name of the agent */
  name: string;
  
  /** Description of the agent */
  description?: string;
  
  /** LLM configuration for the agent */
  llm: LLMConfig;
  
  /** Tools to make available to the agent */
  tools?: string[];
  
  /** Additional agent-specific options */
  options?: Record<string, any>;
}
