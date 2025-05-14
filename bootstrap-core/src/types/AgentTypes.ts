/**
 * Agent Types
 * 
 * Type definitions for agents in the bootstrapping approach.
 */

/**
 * Agent information
 */
export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'offline';
}

/**
 * Base agent configuration
 */
export interface BaseAgentConfig {
  name: string;
  description: string;
  workspacePath: string;
  taskSpecsPath: string;
  outputPath: string;
  collaborators?: Record<string, string>;
}

/**
 * Agent creation result
 */
export interface AgentCreationResult {
  agentId: string;
  name: string;
  type: string;
  basePath: string;
  files: string[];
  capabilities: string[];
}

/**
 * Agent template
 */
export interface AgentTemplate {
  name: string;
  description: string;
  capabilities: string[];
  files: {
    path: string;
    content: string;
  }[];
  dependencies: string[];
  setupInstructions: string[];
}

/**
 * Agent request
 */
export interface AgentRequest {
  name: string;
  description: string;
  type: string;
  specialization: string;
  capabilities: string[];
  mcpServers: string[];
}
