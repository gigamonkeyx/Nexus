/**
 * MetaAgent - An agent specialized in creating and optimizing other AI agents
 *
 * This agent leverages multiple MCP servers to design, implement, test, and optimize
 * other AI agents based on specified requirements.
 */

import { NexusClient } from '../../core/NexusClient';
import { AdapterManager } from '../../adapters/AdapterManager';
import { BaseAgent, AgentConfig, AgentCapability } from '../BaseAgent';
import { AgentTemplate } from './AgentTemplate';
import { AgentDesigner } from './AgentDesigner';
import { AgentImplementer } from './AgentImplementer';
import { AgentTester } from './AgentTester';
import { AgentOptimizer } from './AgentOptimizer';
import { AgentDeployer } from './AgentDeployer';
import { AgentRegistry } from './AgentRegistry';
import { logger } from '../../utils/logger';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';

export interface MetaAgentConfig extends AgentConfig {
  templatePath?: string;
  benchmarkServerUrl?: string;
  githubServerUrl?: string;
  ollamaServerUrl?: string;
  codeEnhancementServerUrl?: string;
  lucidityServerUrl?: string;
}

export interface AgentCreationRequest {
  agentType: string;
  name: string;
  description: string;
  specialization?: string;
  capabilities: string[];
  performanceTargets?: Record<string, Record<string, number>>;
  mcpServers: string[];
  additionalConfig?: Record<string, any>;
}

export interface AgentCreationResult {
  agentId: string;
  name: string;
  type: string;
  capabilities: string[];
  implementationDetails: {
    files: string[];
    linesOfCode: number;
    modules: string[];
  };
  testResults?: Record<string, any>;
  benchmarkResults?: Record<string, any>;
  deploymentDetails?: Record<string, any>;
}

export class MetaAgent extends BaseAgent {
  private designer: AgentDesigner;
  private implementer: AgentImplementer;
  private tester: AgentTester;
  private optimizer: AgentOptimizer;
  private deployer: AgentDeployer;
  private registry: AgentRegistry;
  private templates: Map<string, AgentTemplate> = new Map();
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;

  constructor(
    nexusClient: NexusClient,
    adapterManager: AdapterManager,
    config: MetaAgentConfig
  ) {
    super(nexusClient, adapterManager, {
      ...config,
      name: config.name || 'Meta-Agent',
      description: config.description || 'Agent specialized in creating and optimizing other AI agents'
    });

    this.eventBus = EventBus.getInstance();
    this.errorHandling = ErrorHandling.getInstance();

    // Initialize components
    this.designer = new AgentDesigner(nexusClient, adapterManager, config);
    this.implementer = new AgentImplementer(nexusClient, adapterManager, config);
    this.tester = new AgentTester(nexusClient, adapterManager, config);
    this.optimizer = new AgentOptimizer(nexusClient, adapterManager, config);
    this.deployer = new AgentDeployer(nexusClient, adapterManager, config);
    this.registry = new AgentRegistry(nexusClient, config);

    // Load templates
    this.loadTemplates(config.templatePath || './templates');
  }

  /**
   * Initialize the Meta-Agent
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing Meta-Agent...');

    try {
      // Initialize components
      await this.designer.initialize();
      await this.implementer.initialize();
      await this.tester.initialize();
      await this.optimizer.initialize();
      await this.deployer.initialize();
      await this.registry.initialize();

      // Register event handlers
      this.registerEventHandlers();

      logger.info('Meta-Agent initialized successfully');
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to initialize Meta-Agent: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.AGENT,
        error instanceof Error ? error : undefined
      );

      await this.errorHandling.handleError(agentError);
      throw error;
    }
  }

  /**
   * Create a new agent based on the specified requirements
   */
  public async createAgent(request: AgentCreationRequest): Promise<AgentCreationResult> {
    logger.info(`Creating new agent: ${request.name} (${request.agentType})`);

    try {
      // Check if a template exists for the agent type
      const template = this.templates.get(request.agentType);

      // 1. Design the agent architecture
      logger.info('Designing agent architecture...');
      let design;
      if (template) {
        // Use the template to create the design
        design = template.createDesign(request);
        logger.info(`Using ${request.agentType} template for design`);
      } else {
        // Use the designer to create the design
        design = await this.designer.designAgent(request);
        logger.info('Using dynamic design generation');
      }

      // 2. Implement the agent
      logger.info('Implementing agent...');
      const implementation = await this.implementer.implementAgent(design);

      // 3. Test the agent
      logger.info('Testing agent...');
      const testResults = await this.tester.testAgent(implementation);

      // 4. Optimize the agent if needed
      logger.info('Optimizing agent...');
      let optimizedImplementation = implementation;

      // Only optimize if tests didn't pass or performance targets weren't met
      if (!testResults.overallPassed || !testResults.performanceTargetsMet) {
        optimizedImplementation = await this.optimizer.optimizeAgent(
          implementation,
          testResults,
          request.performanceTargets
        );
        logger.info(`Agent optimized: ${optimizedImplementation.version}`);
      } else {
        logger.info('Agent already meets performance targets, skipping optimization');
      }

      // 5. Deploy the agent
      logger.info('Deploying agent...');
      const deploymentConfig = {
        environment: 'development', // Default to development environment
        owner: this.config.githubOwner,
        repository: `agent-${request.name.toLowerCase().replace(/\s+/g, '-')}`,
        packageManager: 'npm'
      };

      const deploymentDetails = await this.deployer.deployAgent(optimizedImplementation, deploymentConfig);

      // 6. Register the agent
      logger.info('Registering agent...');
      const registrationResult = await this.registry.registerAgent(
        optimizedImplementation.agentId,
        {
          name: request.name,
          description: request.description,
          type: request.agentType,
          version: optimizedImplementation.version,
          capabilities: request.capabilities,
          mcpServers: request.mcpServers,
          repositoryUrl: deploymentDetails.repositoryUrl,
          deploymentUrl: deploymentDetails.deploymentUrl,
          status: 'active',
          metadata: {
            specialization: request.specialization,
            performanceTargets: request.performanceTargets,
            additionalConfig: request.additionalConfig
          }
        }
      );

      // 7. Return the result
      const result: AgentCreationResult = {
        agentId: optimizedImplementation.agentId,
        name: request.name,
        type: request.agentType,
        capabilities: request.capabilities,
        implementationDetails: {
          files: optimizedImplementation.files,
          linesOfCode: optimizedImplementation.linesOfCode,
          modules: optimizedImplementation.modules
        },
        testResults: testResults.results,
        benchmarkResults: testResults.benchmarkResults,
        deploymentDetails
      };

      logger.info(`Agent ${request.name} created successfully with ID ${result.agentId}`);

      // Emit agent created event
      this.eventBus.publish('agent:created', {
        agentId: result.agentId,
        name: request.name,
        type: request.agentType,
        capabilities: request.capabilities
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to create agent ${request.name}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.AGENT,
        error instanceof Error ? error : undefined,
        { request }
      );

      await this.errorHandling.handleError(agentError);

      // Emit agent error event
      this.eventBus.publish('agent:error', {
        message: `Failed to create agent ${request.name}: ${error instanceof Error ? error.message : String(error)}`,
        request
      });

      throw error;
    }
  }

  /**
   * Optimize an existing agent based on benchmark results
   */
  public async optimizeAgent(
    agentId: string,
    benchmarkResults: Record<string, any>
  ): Promise<AgentCreationResult> {
    logger.info(`Optimizing agent: ${agentId}`);

    try {
      // 1. Get agent details
      const agentDetails = await this.registry.getAgent(agentId);

      // 2. Analyze benchmark results
      logger.info('Creating optimization plan...');
      const optimizationPlan = await this.optimizer.createOptimizationPlan(
        agentId,
        benchmarkResults
      );

      logger.info(`Optimization plan created with ${optimizationPlan.improvements.length} improvements`);

      // 3. Implement optimizations
      logger.info('Implementing optimizations...');
      const optimizedImplementation = await this.optimizer.implementOptimizations(
        agentId,
        optimizationPlan
      );

      // 4. Test the optimized agent
      logger.info('Testing optimized agent...');
      const testResults = await this.tester.testAgent(optimizedImplementation);

      // 5. Deploy the optimized agent
      logger.info('Deploying optimized agent...');
      const deploymentConfig = {
        environment: 'development', // Default to development environment
        owner: this.config.githubOwner,
        repository: `agent-${agentDetails.name.toLowerCase().replace(/\s+/g, '-')}`,
        packageManager: 'npm'
      };

      const deploymentDetails = await this.deployer.deployAgent(optimizedImplementation, deploymentConfig);

      // 6. Update the agent registration
      logger.info('Updating agent registration...');
      await this.registry.updateAgent(agentId, {
        version: optimizedImplementation.version,
        repositoryUrl: deploymentDetails.repositoryUrl,
        deploymentUrl: deploymentDetails.deploymentUrl,
        updated: new Date().toISOString()
      });

      // 7. Return the result
      const result: AgentCreationResult = {
        agentId: optimizedImplementation.agentId,
        name: agentDetails.name,
        type: agentDetails.type,
        capabilities: agentDetails.capabilities,
        implementationDetails: {
          files: optimizedImplementation.files,
          linesOfCode: optimizedImplementation.linesOfCode,
          modules: optimizedImplementation.modules
        },
        testResults: testResults.results,
        benchmarkResults: testResults.benchmarkResults,
        deploymentDetails
      };

      logger.info(`Agent ${agentId} optimized successfully`);

      // Emit agent optimized event
      this.eventBus.publish('agent:optimized', {
        agentId,
        name: agentDetails.name,
        type: agentDetails.type,
        version: optimizedImplementation.version,
        improvements: optimizationPlan.improvements.length
      });

      return result;
    } catch (error) {
      const agentError = this.errorHandling.createError(
        `Failed to optimize agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.AGENT,
        error instanceof Error ? error : undefined,
        { agentId, benchmarkResults }
      );

      await this.errorHandling.handleError(agentError);

      // Emit agent error event
      this.eventBus.publish('agent:error', {
        message: `Failed to optimize agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
        agentId,
        benchmarkResults
      });

      throw error;
    }
  }

  /**
   * Register a new agent template
   */
  public registerTemplate(type: string, template: AgentTemplate): void {
    this.templates.set(type, template);
    logger.info(`Registered template for agent type: ${type}`);
  }

  /**
   * Get available agent templates
   */
  public getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Load agent templates from the specified directory
   */
  private async loadTemplates(templatePath: string): Promise<void> {
    // Implementation will depend on file system access
    // For now, we'll just log that we're loading templates
    logger.info(`Loading agent templates from: ${templatePath}`);

    // In a real implementation, we would:
    // 1. Scan the template directory
    // 2. Load each template file
    // 3. Register the templates
  }

  /**
   * Register event handlers
   */
  private registerEventHandlers(): void {
    this.eventBus.subscribe('agent:created', (data) => {
      logger.info(`Event: Agent created - ${data.agentId}`);
    });

    this.eventBus.subscribe('agent:optimized', (data) => {
      logger.info(`Event: Agent optimized - ${data.agentId}`);
    });

    this.eventBus.subscribe('agent:error', (data) => {
      logger.error(`Event: Agent error - ${data.message}`);
    });
  }
}
