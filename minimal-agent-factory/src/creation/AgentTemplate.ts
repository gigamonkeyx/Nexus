/**
 * Agent Template
 * 
 * Defines the structure of an agent template.
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
