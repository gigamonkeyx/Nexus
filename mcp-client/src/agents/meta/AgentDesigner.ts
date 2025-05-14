/**
 * AgentDesigner - Component responsible for designing agent architectures
 * 
 * This component analyzes requirements and creates detailed agent designs,
 * including module structure, dependencies, and interfaces.
 */

import { NexusClient } from '../../core/NexusClient';
import { AdapterManager } from '../../adapters/AdapterManager';
import { OllamaMCPAdapter } from '../../adapters/OllamaMCPAdapter';
import { logger } from '../../utils/logger';
import { AgentCreationRequest } from './MetaAgent';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';

export interface AgentDesign {
  agentId: string;
  name: string;
  type: string;
  description: string;
  architecture: {
    modules: AgentModule[];
    interfaces: AgentInterface[];
    dependencies: AgentDependency[];
  };
  capabilities: string[];
  mcpServers: string[];
  specialization?: string;
  performanceTargets?: Record<string, Record<string, number>>;
  additionalConfig?: Record<string, any>;
}

export interface AgentModule {
  name: string;
  description: string;
  responsibilities: string[];
  interfaces: string[];
  dependencies: string[];
}

export interface AgentInterface {
  name: string;
  description: string;
  methods: AgentMethod[];
}

export interface AgentMethod {
  name: string;
  description: string;
  parameters: AgentParameter[];
  returnType: string;
}

export interface AgentParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface AgentDependency {
  name: string;
  type: 'internal' | 'external' | 'mcp';
  description: string;
}

export class AgentDesigner {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private ollamaAdapter?: OllamaMCPAdapter;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private config: Record<string, any>;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    config: Record<string, any>
  ) {
    this.nexusClient = nexusClient;
    this.adapterManager = adapterManager;
    this.config = config;
    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();
  }

  /**
   * Initialize the AgentDesigner
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing AgentDesigner...');
    
    try {
      // Get Ollama adapter for LLM-based design
      this.ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
      
      if (!this.ollamaAdapter) {
        logger.warn('No Ollama adapter found. Will use direct MCP calls for agent design.');
      }
      
      logger.info('AgentDesigner initialized successfully');
    } catch (error) {
      const designerError = this.errorHandling.createError(
        `Failed to initialize AgentDesigner: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined
      );
      
      await this.errorHandling.handleError(designerError);
      throw error;
    }
  }

  /**
   * Design an agent based on the specified requirements
   */
  public async designAgent(request: AgentCreationRequest): Promise<AgentDesign> {
    logger.info(`Designing agent: ${request.name} (${request.agentType})`);
    
    try {
      // Generate a unique agent ID
      const agentId = this.generateAgentId(request.name, request.agentType);
      
      // Design the agent architecture
      const architecture = await this.designArchitecture(request);
      
      // Create the agent design
      const design: AgentDesign = {
        agentId,
        name: request.name,
        type: request.agentType,
        description: request.description,
        architecture,
        capabilities: request.capabilities,
        mcpServers: request.mcpServers,
        specialization: request.specialization,
        performanceTargets: request.performanceTargets,
        additionalConfig: request.additionalConfig
      };
      
      logger.info(`Agent design completed for ${request.name}`);
      
      // Emit design completed event
      this.eventBus.publish('agent:design:completed', {
        agentId,
        name: request.name,
        type: request.agentType
      });
      
      return design;
    } catch (error) {
      const designerError = this.errorHandling.createError(
        `Failed to design agent ${request.name}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { request }
      );
      
      await this.errorHandling.handleError(designerError);
      throw error;
    }
  }

  /**
   * Design the architecture for an agent
   */
  private async designArchitecture(request: AgentCreationRequest): Promise<{
    modules: AgentModule[];
    interfaces: AgentInterface[];
    dependencies: AgentDependency[];
  }> {
    // If we have an Ollama adapter, use it to generate the architecture
    if (this.ollamaAdapter) {
      return this.designArchitectureWithLLM(request);
    }
    
    // Otherwise, use a template-based approach
    return this.designArchitectureWithTemplate(request);
  }

  /**
   * Design agent architecture using an LLM
   */
  private async designArchitectureWithLLM(request: AgentCreationRequest): Promise<{
    modules: AgentModule[];
    interfaces: AgentInterface[];
    dependencies: AgentDependency[];
  }> {
    logger.info('Designing agent architecture using LLM...');
    
    // Create a prompt for the LLM
    const prompt = this.createArchitecturePrompt(request);
    
    // Generate the architecture using the LLM
    const response = await this.ollamaAdapter!.generateText(prompt, 'llama3', {
      temperature: 0.2,
      max_tokens: 2000
    });
    
    // Parse the response
    return this.parseArchitectureResponse(response);
  }

  /**
   * Design agent architecture using templates
   */
  private async designArchitectureWithTemplate(request: AgentCreationRequest): Promise<{
    modules: AgentModule[];
    interfaces: AgentInterface[];
    dependencies: AgentDependency[];
  }> {
    logger.info('Designing agent architecture using templates...');
    
    // In a real implementation, we would:
    // 1. Load a template for the agent type
    // 2. Customize it based on the request
    // 3. Return the customized architecture
    
    // For now, we'll return a basic architecture
    return {
      modules: [
        {
          name: 'Core',
          description: 'Core functionality for the agent',
          responsibilities: ['Manage agent lifecycle', 'Handle events'],
          interfaces: ['IAgentCore'],
          dependencies: []
        },
        {
          name: `${request.agentType}Module`,
          description: `Main module for ${request.agentType} functionality`,
          responsibilities: request.capabilities.map(cap => `Handle ${cap}`),
          interfaces: [`I${request.agentType}Module`],
          dependencies: ['Core']
        }
      ],
      interfaces: [
        {
          name: 'IAgentCore',
          description: 'Interface for core agent functionality',
          methods: [
            {
              name: 'initialize',
              description: 'Initialize the agent',
              parameters: [],
              returnType: 'Promise<void>'
            },
            {
              name: 'shutdown',
              description: 'Shutdown the agent',
              parameters: [],
              returnType: 'Promise<void>'
            }
          ]
        },
        {
          name: `I${request.agentType}Module`,
          description: `Interface for ${request.agentType} functionality`,
          methods: request.capabilities.map(cap => ({
            name: this.camelCase(cap),
            description: `Handle ${cap}`,
            parameters: [
              {
                name: 'params',
                type: 'Record<string, any>',
                description: 'Parameters for the capability',
                required: true
              }
            ],
            returnType: 'Promise<Record<string, any>>'
          }))
        }
      ],
      dependencies: [
        ...request.mcpServers.map(server => ({
          name: server,
          type: 'mcp' as const,
          description: `MCP server: ${server}`
        })),
        {
          name: 'NexusClient',
          type: 'internal' as const,
          description: 'Client for interacting with Nexus'
        }
      ]
    };
  }

  /**
   * Create a prompt for the LLM to design an agent architecture
   */
  private createArchitecturePrompt(request: AgentCreationRequest): string {
    return `
Design an architecture for an AI agent with the following specifications:

Name: ${request.name}
Type: ${request.agentType}
Description: ${request.description}
Specialization: ${request.specialization || 'None'}
Capabilities: ${request.capabilities.join(', ')}
MCP Servers: ${request.mcpServers.join(', ')}

The architecture should include:
1. Modules - Each with a name, description, responsibilities, interfaces, and dependencies
2. Interfaces - Each with a name, description, and methods
3. Dependencies - Each with a name, type (internal, external, or mcp), and description

Please format your response as a JSON object with the following structure:
{
  "modules": [
    {
      "name": "string",
      "description": "string",
      "responsibilities": ["string"],
      "interfaces": ["string"],
      "dependencies": ["string"]
    }
  ],
  "interfaces": [
    {
      "name": "string",
      "description": "string",
      "methods": [
        {
          "name": "string",
          "description": "string",
          "parameters": [
            {
              "name": "string",
              "type": "string",
              "description": "string",
              "required": boolean
            }
          ],
          "returnType": "string"
        }
      ]
    }
  ],
  "dependencies": [
    {
      "name": "string",
      "type": "internal | external | mcp",
      "description": "string"
    }
  ]
}

Ensure the architecture is modular, follows best practices, and efficiently leverages the specified MCP servers.
`;
  }

  /**
   * Parse the LLM response to extract the agent architecture
   */
  private parseArchitectureResponse(response: string): {
    modules: AgentModule[];
    interfaces: AgentInterface[];
    dependencies: AgentDependency[];
  } {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/) ||
                        response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from LLM response');
      }
      
      const jsonStr = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
      const architecture = JSON.parse(jsonStr);
      
      // Validate the architecture
      if (!architecture.modules || !Array.isArray(architecture.modules)) {
        throw new Error('Invalid architecture: missing or invalid modules');
      }
      
      if (!architecture.interfaces || !Array.isArray(architecture.interfaces)) {
        throw new Error('Invalid architecture: missing or invalid interfaces');
      }
      
      if (!architecture.dependencies || !Array.isArray(architecture.dependencies)) {
        throw new Error('Invalid architecture: missing or invalid dependencies');
      }
      
      return architecture;
    } catch (error) {
      logger.error('Failed to parse architecture response:', error);
      throw new Error(`Failed to parse architecture response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a unique agent ID
   */
  private generateAgentId(name: string, type: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const nameSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    return `${type}-${nameSlug}-${timestamp}-${randomStr}`;
  }

  /**
   * Convert a string to camelCase
   */
  private camelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^[A-Z]/, c => c.toLowerCase());
  }
}
