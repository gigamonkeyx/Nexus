/**
 * AgentTemplate - Interface for agent templates
 * 
 * Agent templates provide a starting point for creating agents of a specific type.
 * They define the architecture, capabilities, and dependencies of the agent.
 */

import { AgentDesign } from './AgentDesigner';
import { AgentCreationRequest } from './MetaAgent';

export interface AgentTemplate {
  /**
   * Get the type of agent this template creates
   */
  getType(): string;
  
  /**
   * Get a description of this template
   */
  getDescription(): string;
  
  /**
   * Create an agent design based on the request
   */
  createDesign(request: AgentCreationRequest): AgentDesign;
}
