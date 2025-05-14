/**
 * CodingAgentTemplate - Template for creating coding agents
 * 
 * This template provides a starting point for creating agents that specialize
 * in code generation, analysis, and management.
 */

import { AgentTemplate } from '../AgentTemplate';
import { AgentDesign } from '../AgentDesigner';
import { AgentCreationRequest } from '../MetaAgent';

export class CodingAgentTemplate implements AgentTemplate {
  /**
   * Get the type of agent this template creates
   */
  public getType(): string {
    return 'coding';
  }

  /**
   * Get a description of this template
   */
  public getDescription(): string {
    return 'Template for creating coding agents that can generate, analyze, and manage code';
  }

  /**
   * Create an agent design based on the request
   */
  public createDesign(request: AgentCreationRequest): AgentDesign {
    // Generate a unique agent ID
    const agentId = this.generateAgentId(request.name, request.agentType);
    
    // Create the agent design
    return {
      agentId,
      name: request.name,
      type: request.agentType,
      description: request.description,
      architecture: {
        modules: this.generateModules(request),
        interfaces: this.generateInterfaces(request),
        dependencies: this.generateDependencies(request)
      },
      capabilities: request.capabilities,
      mcpServers: request.mcpServers,
      specialization: request.specialization,
      performanceTargets: request.performanceTargets,
      additionalConfig: request.additionalConfig
    };
  }

  /**
   * Generate modules for the agent
   */
  private generateModules(request: AgentCreationRequest): any[] {
    const modules = [
      {
        name: 'Core',
        description: 'Core functionality for the agent',
        responsibilities: ['Manage agent lifecycle', 'Handle events'],
        interfaces: ['IAgentCore'],
        dependencies: []
      },
      {
        name: 'CodingModule',
        description: 'Module for code generation and manipulation',
        responsibilities: [
          'Generate code from descriptions',
          'Refactor existing code',
          'Format code according to style guidelines'
        ],
        interfaces: ['ICodingModule'],
        dependencies: ['Core']
      }
    ];
    
    // Add language-specific module if a specialization is specified
    if (request.specialization) {
      modules.push({
        name: `${this.capitalize(request.specialization)}Module`,
        description: `Module for ${request.specialization}-specific functionality`,
        responsibilities: [
          `Handle ${request.specialization}-specific code generation`,
          `Apply ${request.specialization}-specific best practices`,
          `Manage ${request.specialization} project structures`
        ],
        interfaces: [`I${this.capitalize(request.specialization)}Module`],
        dependencies: ['Core', 'CodingModule']
      });
    }
    
    // Add analysis module if the capabilities include code analysis
    if (request.capabilities.includes('code_analysis')) {
      modules.push({
        name: 'AnalysisModule',
        description: 'Module for code analysis and quality assessment',
        responsibilities: [
          'Analyze code quality',
          'Detect bugs and issues',
          'Suggest improvements'
        ],
        interfaces: ['IAnalysisModule'],
        dependencies: ['Core', 'CodingModule']
      });
    }
    
    // Add testing module if the capabilities include testing
    if (request.capabilities.includes('testing')) {
      modules.push({
        name: 'TestingModule',
        description: 'Module for generating and running tests',
        responsibilities: [
          'Generate unit tests',
          'Generate integration tests',
          'Run tests and report results'
        ],
        interfaces: ['ITestingModule'],
        dependencies: ['Core', 'CodingModule']
      });
    }
    
    return modules;
  }

  /**
   * Generate interfaces for the agent
   */
  private generateInterfaces(request: AgentCreationRequest): any[] {
    const interfaces = [
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
        name: 'ICodingModule',
        description: 'Interface for code generation and manipulation',
        methods: [
          {
            name: 'generateCode',
            description: 'Generate code from a description',
            parameters: [
              {
                name: 'description',
                type: 'string',
                description: 'Description of the code to generate',
                required: true
              },
              {
                name: 'language',
                type: 'string',
                description: 'Programming language to use',
                required: true
              },
              {
                name: 'options',
                type: 'Record<string, any>',
                description: 'Additional options for code generation',
                required: false
              }
            ],
            returnType: 'Promise<{ code: string; language: string }>'
          },
          {
            name: 'refactorCode',
            description: 'Refactor existing code',
            parameters: [
              {
                name: 'code',
                type: 'string',
                description: 'Code to refactor',
                required: true
              },
              {
                name: 'goal',
                type: 'string',
                description: 'Goal of the refactoring',
                required: true
              },
              {
                name: 'options',
                type: 'Record<string, any>',
                description: 'Additional options for refactoring',
                required: false
              }
            ],
            returnType: 'Promise<{ code: string; goal: string }>'
          },
          {
            name: 'formatCode',
            description: 'Format code according to style guidelines',
            parameters: [
              {
                name: 'code',
                type: 'string',
                description: 'Code to format',
                required: true
              },
              {
                name: 'language',
                type: 'string',
                description: 'Programming language of the code',
                required: true
              },
              {
                name: 'style',
                type: 'string',
                description: 'Style guide to follow',
                required: false
              }
            ],
            returnType: 'Promise<string>'
          }
        ]
      }
    ];
    
    // Add language-specific interface if a specialization is specified
    if (request.specialization) {
      interfaces.push({
        name: `I${this.capitalize(request.specialization)}Module`,
        description: `Interface for ${request.specialization}-specific functionality`,
        methods: [
          {
            name: 'generateProject',
            description: `Generate a ${request.specialization} project structure`,
            parameters: [
              {
                name: 'name',
                type: 'string',
                description: 'Name of the project',
                required: true
              },
              {
                name: 'options',
                type: 'Record<string, any>',
                description: 'Additional options for project generation',
                required: false
              }
            ],
            returnType: 'Promise<{ files: Record<string, string>; entryPoint: string }>'
          }
        ]
      });
    }
    
    // Add analysis interface if the capabilities include code analysis
    if (request.capabilities.includes('code_analysis')) {
      interfaces.push({
        name: 'IAnalysisModule',
        description: 'Interface for code analysis and quality assessment',
        methods: [
          {
            name: 'analyzeCode',
            description: 'Analyze code quality',
            parameters: [
              {
                name: 'code',
                type: 'string',
                description: 'Code to analyze',
                required: true
              },
              {
                name: 'language',
                type: 'string',
                description: 'Programming language of the code',
                required: true
              },
              {
                name: 'dimensions',
                type: 'string[]',
                description: 'Dimensions to analyze',
                required: false
              }
            ],
            returnType: 'Promise<{ issues: any[]; metrics: Record<string, number>; score: number }>'
          }
        ]
      });
    }
    
    // Add testing interface if the capabilities include testing
    if (request.capabilities.includes('testing')) {
      interfaces.push({
        name: 'ITestingModule',
        description: 'Interface for generating and running tests',
        methods: [
          {
            name: 'generateTests',
            description: 'Generate tests for code',
            parameters: [
              {
                name: 'code',
                type: 'string',
                description: 'Code to generate tests for',
                required: true
              },
              {
                name: 'language',
                type: 'string',
                description: 'Programming language of the code',
                required: true
              },
              {
                name: 'framework',
                type: 'string',
                description: 'Testing framework to use',
                required: true
              }
            ],
            returnType: 'Promise<{ tests: string; language: string; framework: string }>'
          }
        ]
      });
    }
    
    return interfaces;
  }

  /**
   * Generate dependencies for the agent
   */
  private generateDependencies(request: AgentCreationRequest): any[] {
    const dependencies = [
      {
        name: 'NexusClient',
        type: 'internal',
        description: 'Client for interacting with Nexus'
      }
    ];
    
    // Add MCP server dependencies
    for (const server of request.mcpServers) {
      dependencies.push({
        name: server,
        type: 'mcp',
        description: `MCP server: ${server}`
      });
    }
    
    return dependencies;
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
   * Capitalize the first letter of a string
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
