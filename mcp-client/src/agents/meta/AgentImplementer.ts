/**
 * AgentImplementer - Component responsible for implementing agent designs
 * 
 * This component takes an agent design and generates the actual code for the agent,
 * including all modules, interfaces, and dependencies.
 */

import { NexusClient } from '../../core/NexusClient';
import { AdapterManager } from '../../adapters/AdapterManager';
import { OllamaMCPAdapter } from '../../adapters/OllamaMCPAdapter';
import { CodeEnhancementMCPAdapter } from '../../adapters/CodeEnhancementMCPAdapter';
import { logger } from '../../utils/logger';
import { AgentDesign } from './AgentDesigner';
import { EventBus } from '../../core/EventBus';
import { ErrorHandling, ErrorSeverity, ErrorSource } from '../../core/ErrorHandling';
import { ProgrammingLanguage } from '../modules/CodingModule';
import * as fs from 'fs';
import * as path from 'path';

export interface AgentImplementation {
  agentId: string;
  name: string;
  type: string;
  version: string;
  files: string[];
  linesOfCode: number;
  modules: string[];
  basePath: string;
}

export interface CodeGenerationRequest {
  fileName: string;
  description: string;
  interfaces: string[];
  dependencies: string[];
  capabilities: string[];
  language: ProgrammingLanguage;
}

export class AgentImplementer {
  private nexusClient: NexusClient;
  private adapterManager: AdapterManager;
  private ollamaAdapter?: OllamaMCPAdapter;
  private codeEnhancementAdapter?: CodeEnhancementMCPAdapter;
  private eventBus: EventBus;
  private errorHandling: ErrorHandling;
  private config: Record<string, any>;
  private basePath: string;

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
    this.basePath = config.agentOutputPath || path.join(process.cwd(), 'generated-agents');
  }

  /**
   * Initialize the AgentImplementer
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing AgentImplementer...');
    
    try {
      // Get adapters
      this.ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();
      this.codeEnhancementAdapter = this.adapterManager.getFirstCodeEnhancementAdapter();
      
      if (!this.ollamaAdapter) {
        logger.warn('No Ollama adapter found. Will use direct MCP calls for code generation.');
      }
      
      if (!this.codeEnhancementAdapter) {
        logger.warn('No CodeEnhancement adapter found. Code will not be enhanced.');
      }
      
      // Ensure output directory exists
      if (!fs.existsSync(this.basePath)) {
        fs.mkdirSync(this.basePath, { recursive: true });
      }
      
      logger.info('AgentImplementer initialized successfully');
    } catch (error) {
      const implementerError = this.errorHandling.createError(
        `Failed to initialize AgentImplementer: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined
      );
      
      await this.errorHandling.handleError(implementerError);
      throw error;
    }
  }

  /**
   * Implement an agent based on the provided design
   */
  public async implementAgent(design: AgentDesign): Promise<AgentImplementation> {
    logger.info(`Implementing agent: ${design.name} (${design.type})`);
    
    try {
      // Create agent directory
      const agentPath = path.join(this.basePath, design.agentId);
      if (!fs.existsSync(agentPath)) {
        fs.mkdirSync(agentPath, { recursive: true });
      }
      
      // Generate version
      const version = this.generateVersion();
      
      // Generate files for each module and interface
      const generatedFiles: string[] = [];
      let totalLinesOfCode = 0;
      
      // Generate interface files
      for (const iface of design.architecture.interfaces) {
        const fileName = `${iface.name}.ts`;
        const filePath = path.join(agentPath, fileName);
        
        const code = await this.generateInterfaceCode(iface, design);
        const enhancedCode = await this.enhanceCode(code, ProgrammingLanguage.TYPESCRIPT);
        
        fs.writeFileSync(filePath, enhancedCode);
        
        const linesOfCode = enhancedCode.split('\n').length;
        totalLinesOfCode += linesOfCode;
        
        generatedFiles.push(fileName);
        
        logger.debug(`Generated interface file: ${fileName} (${linesOfCode} lines)`);
      }
      
      // Generate module files
      for (const module of design.architecture.modules) {
        const fileName = `${module.name}.ts`;
        const filePath = path.join(agentPath, fileName);
        
        const code = await this.generateModuleCode(module, design);
        const enhancedCode = await this.enhanceCode(code, ProgrammingLanguage.TYPESCRIPT);
        
        fs.writeFileSync(filePath, enhancedCode);
        
        const linesOfCode = enhancedCode.split('\n').length;
        totalLinesOfCode += linesOfCode;
        
        generatedFiles.push(fileName);
        
        logger.debug(`Generated module file: ${fileName} (${linesOfCode} lines)`);
      }
      
      // Generate main agent file
      const mainFileName = `${design.name.replace(/\s+/g, '')}Agent.ts`;
      const mainFilePath = path.join(agentPath, mainFileName);
      
      const mainCode = await this.generateMainAgentCode(design);
      const enhancedMainCode = await this.enhanceCode(mainCode, ProgrammingLanguage.TYPESCRIPT);
      
      fs.writeFileSync(mainFilePath, enhancedMainCode);
      
      const mainLinesOfCode = enhancedMainCode.split('\n').length;
      totalLinesOfCode += mainLinesOfCode;
      
      generatedFiles.push(mainFileName);
      
      logger.debug(`Generated main agent file: ${mainFileName} (${mainLinesOfCode} lines)`);
      
      // Generate package.json
      const packageJsonPath = path.join(agentPath, 'package.json');
      const packageJson = this.generatePackageJson(design, version);
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      generatedFiles.push('package.json');
      
      // Generate README.md
      const readmePath = path.join(agentPath, 'README.md');
      const readme = this.generateReadme(design);
      
      fs.writeFileSync(readmePath, readme);
      
      generatedFiles.push('README.md');
      
      // Create implementation result
      const implementation: AgentImplementation = {
        agentId: design.agentId,
        name: design.name,
        type: design.type,
        version,
        files: generatedFiles,
        linesOfCode: totalLinesOfCode,
        modules: design.architecture.modules.map(m => m.name),
        basePath: agentPath
      };
      
      logger.info(`Agent implementation completed for ${design.name}`);
      
      // Emit implementation completed event
      this.eventBus.publish('agent:implementation:completed', {
        agentId: design.agentId,
        name: design.name,
        type: design.type,
        version,
        files: generatedFiles.length,
        linesOfCode: totalLinesOfCode
      });
      
      return implementation;
    } catch (error) {
      const implementerError = this.errorHandling.createError(
        `Failed to implement agent ${design.name}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorSeverity.ERROR,
        ErrorSource.MODULE,
        error instanceof Error ? error : undefined,
        { design }
      );
      
      await this.errorHandling.handleError(implementerError);
      throw error;
    }
  }

  /**
   * Generate code for an interface
   */
  private async generateInterfaceCode(
    iface: any,
    design: AgentDesign
  ): Promise<string> {
    if (this.ollamaAdapter) {
      return this.generateInterfaceCodeWithLLM(iface, design);
    }
    
    // Simple template-based generation
    let code = `/**\n * ${iface.description}\n */\n\n`;
    code += `export interface ${iface.name} {\n`;
    
    for (const method of iface.methods) {
      code += `  /**\n   * ${method.description}\n`;
      for (const param of method.parameters) {
        code += `   * @param ${param.name} ${param.description}\n`;
      }
      code += `   */\n`;
      
      const params = method.parameters.map(p => 
        `${p.name}${p.required ? '' : '?'}: ${p.type}`
      ).join(', ');
      
      code += `  ${method.name}(${params}): ${method.returnType};\n\n`;
    }
    
    code += `}\n`;
    
    return code;
  }

  /**
   * Generate code for a module
   */
  private async generateModuleCode(
    module: any,
    design: AgentDesign
  ): Promise<string> {
    if (this.ollamaAdapter) {
      return this.generateModuleCodeWithLLM(module, design);
    }
    
    // Simple template-based generation
    let code = `/**\n * ${module.description}\n */\n\n`;
    
    // Imports
    for (const interfaceName of module.interfaces) {
      code += `import { ${interfaceName} } from './${interfaceName}';\n`;
    }
    
    for (const dependencyName of module.dependencies) {
      code += `import { ${dependencyName} } from './${dependencyName}';\n`;
    }
    
    code += `\nexport class ${module.name} implements ${module.interfaces.join(', ')} {\n`;
    
    // Constructor
    code += `  constructor(\n`;
    for (const dependencyName of module.dependencies) {
      code += `    private ${this.camelCase(dependencyName)}: ${dependencyName},\n`;
    }
    code += `  ) {}\n\n`;
    
    // Methods
    const interfaces = design.architecture.interfaces.filter(i => 
      module.interfaces.includes(i.name)
    );
    
    for (const iface of interfaces) {
      for (const method of iface.methods) {
        code += `  /**\n   * ${method.description}\n`;
        for (const param of method.parameters) {
          code += `   * @param ${param.name} ${param.description}\n`;
        }
        code += `   */\n`;
        
        const params = method.parameters.map(p => 
          `${p.name}${p.required ? '' : '?'}: ${p.type}`
        ).join(', ');
        
        code += `  async ${method.name}(${params}): ${method.returnType} {\n`;
        code += `    // TODO: Implement ${method.name}\n`;
        code += `    throw new Error('Method not implemented.');\n`;
        code += `  }\n\n`;
      }
    }
    
    code += `}\n`;
    
    return code;
  }

  /**
   * Generate code for the main agent file
   */
  private async generateMainAgentCode(design: AgentDesign): Promise<string> {
    if (this.ollamaAdapter) {
      return this.generateMainAgentCodeWithLLM(design);
    }
    
    // Simple template-based generation
    let code = `/**\n * ${design.name} - ${design.description}\n */\n\n`;
    
    // Imports
    code += `import { NexusClient } from '../../core/NexusClient';\n`;
    code += `import { AdapterManager } from '../../adapters/AdapterManager';\n`;
    code += `import { BaseAgent } from '../BaseAgent';\n`;
    
    for (const module of design.architecture.modules) {
      code += `import { ${module.name} } from './${module.name}';\n`;
    }
    
    code += `\nexport interface ${design.name.replace(/\s+/g, '')}Config {\n`;
    code += `  name?: string;\n`;
    code += `  description?: string;\n`;
    code += `  // Add custom config properties here\n`;
    code += `}\n\n`;
    
    code += `export class ${design.name.replace(/\s+/g, '')}Agent extends BaseAgent {\n`;
    
    // Module properties
    for (const module of design.architecture.modules) {
      code += `  private ${this.camelCase(module.name)}: ${module.name};\n`;
    }
    
    // Constructor
    code += `\n  constructor(\n`;
    code += `    nexusClient: NexusClient,\n`;
    code += `    adapterManager: AdapterManager,\n`;
    code += `    config: ${design.name.replace(/\s+/g, '')}Config = {}\n`;
    code += `  ) {\n`;
    code += `    super(nexusClient, adapterManager, {\n`;
    code += `      ...config,\n`;
    code += `      name: config.name || '${design.name}',\n`;
    code += `      description: config.description || '${design.description}'\n`;
    code += `    });\n\n`;
    
    // Initialize modules
    for (const module of design.architecture.modules) {
      code += `    this.${this.camelCase(module.name)} = new ${module.name}(\n`;
      for (const dependency of module.dependencies) {
        if (dependency === 'Core') {
          code += `      this,\n`;
        } else {
          code += `      this.${this.camelCase(dependency)},\n`;
        }
      }
      code += `    );\n`;
    }
    
    code += `  }\n\n`;
    
    // Initialize method
    code += `  /**\n   * Initialize the agent\n   */\n`;
    code += `  public async initialize(): Promise<void> {\n`;
    code += `    // Initialize modules\n`;
    for (const module of design.architecture.modules) {
      code += `    await this.${this.camelCase(module.name)}.initialize?.();\n`;
    }
    code += `  }\n\n`;
    
    // Capability methods
    for (const capability of design.capabilities) {
      code += `  /**\n   * ${capability}\n   */\n`;
      code += `  public async ${this.camelCase(capability)}(params: Record<string, any>): Promise<Record<string, any>> {\n`;
      code += `    // TODO: Implement ${capability}\n`;
      code += `    throw new Error('Method not implemented.');\n`;
      code += `  }\n\n`;
    }
    
    code += `}\n`;
    
    return code;
  }

  /**
   * Generate interface code using LLM
   */
  private async generateInterfaceCodeWithLLM(
    iface: any,
    design: AgentDesign
  ): Promise<string> {
    const prompt = `
Generate TypeScript code for the following interface:

Interface Name: ${iface.name}
Description: ${iface.description}

Methods:
${iface.methods.map(m => `- ${m.name}: ${m.description}`).join('\n')}

Please include proper JSDoc comments for the interface and all methods.
Ensure the code follows TypeScript best practices.

The interface should be part of an agent with the following details:
Agent Name: ${design.name}
Agent Type: ${design.type}
Agent Description: ${design.description}
`;

    const code = await this.ollamaAdapter!.generateCode(prompt, ProgrammingLanguage.TYPESCRIPT);
    return code;
  }

  /**
   * Generate module code using LLM
   */
  private async generateModuleCodeWithLLM(
    module: any,
    design: AgentDesign
  ): Promise<string> {
    const interfaces = design.architecture.interfaces.filter(i => 
      module.interfaces.includes(i.name)
    );
    
    const prompt = `
Generate TypeScript code for the following module:

Module Name: ${module.name}
Description: ${module.description}
Responsibilities: ${module.responsibilities.join(', ')}
Interfaces: ${module.interfaces.join(', ')}
Dependencies: ${module.dependencies.join(', ')}

The module should implement these interfaces:
${interfaces.map(i => `
Interface ${i.name}:
${i.methods.map(m => `- ${m.name}(${m.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${m.returnType}`).join('\n')}
`).join('\n')}

Please include proper JSDoc comments for the class and all methods.
Ensure the code follows TypeScript best practices.
Include constructor that takes dependencies as parameters.
Implement stub methods that throw "Method not implemented" errors.

The module should be part of an agent with the following details:
Agent Name: ${design.name}
Agent Type: ${design.type}
Agent Description: ${design.description}
`;

    const code = await this.ollamaAdapter!.generateCode(prompt, ProgrammingLanguage.TYPESCRIPT);
    return code;
  }

  /**
   * Generate main agent code using LLM
   */
  private async generateMainAgentCodeWithLLM(design: AgentDesign): Promise<string> {
    const prompt = `
Generate TypeScript code for the main agent class:

Agent Name: ${design.name}
Agent Type: ${design.type}
Description: ${design.description}
Capabilities: ${design.capabilities.join(', ')}

Modules:
${design.architecture.modules.map(m => `- ${m.name}: ${m.description}`).join('\n')}

The agent should:
1. Extend BaseAgent
2. Have a constructor that takes NexusClient, AdapterManager, and a config object
3. Initialize all modules in the constructor
4. Have an initialize method that initializes all modules
5. Have methods for each capability

Please include proper JSDoc comments for the class and all methods.
Ensure the code follows TypeScript best practices.
`;

    const code = await this.ollamaAdapter!.generateCode(prompt, ProgrammingLanguage.TYPESCRIPT);
    return code;
  }

  /**
   * Enhance code using the CodeEnhancement adapter
   */
  private async enhanceCode(code: string, language: ProgrammingLanguage): Promise<string> {
    if (!this.codeEnhancementAdapter) {
      return code;
    }
    
    try {
      // Format the code
      const formattedCode = await this.codeEnhancementAdapter.formatCode(
        code,
        language,
        'standard'
      );
      
      // Generate documentation
      const documentedCode = await this.codeEnhancementAdapter.generateDocumentation(
        formattedCode,
        language,
        'jsdoc'
      );
      
      return documentedCode;
    } catch (error) {
      logger.warn(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
      return code;
    }
  }

  /**
   * Generate package.json for the agent
   */
  private generatePackageJson(design: AgentDesign, version: string): Record<string, any> {
    return {
      name: design.name.toLowerCase().replace(/\s+/g, '-'),
      version,
      description: design.description,
      main: `${design.name.replace(/\s+/g, '')}Agent.js`,
      scripts: {
        build: 'tsc',
        test: 'jest',
        start: `node ${design.name.replace(/\s+/g, '')}Agent.js`
      },
      dependencies: {
        '@nexus/client': '^1.0.0'
      },
      devDependencies: {
        typescript: '^4.5.4',
        jest: '^27.4.7',
        '@types/jest': '^27.4.0',
        'ts-jest': '^27.1.3'
      }
    };
  }

  /**
   * Generate README.md for the agent
   */
  private generateReadme(design: AgentDesign): string {
    return `# ${design.name}

${design.description}

## Capabilities

${design.capabilities.map(cap => `- ${cap}`).join('\n')}

## Architecture

### Modules

${design.architecture.modules.map(m => `- ${m.name}: ${m.description}`).join('\n')}

### Interfaces

${design.architecture.interfaces.map(i => `- ${i.name}: ${i.description}`).join('\n')}

## Usage

\`\`\`typescript
import { ${design.name.replace(/\s+/g, '')}Agent } from './${design.name.replace(/\s+/g, '')}Agent';
import { NexusClient } from '@nexus/client';

// Create NexusClient
const nexusClient = new NexusClient();

// Create agent
const agent = new ${design.name.replace(/\s+/g, '')}Agent(nexusClient, {
  name: '${design.name}',
  description: '${design.description}'
});

// Initialize agent
await agent.initialize();

// Use agent capabilities
const result = await agent.${this.camelCase(design.capabilities[0])}({
  // Parameters
});
\`\`\`

## License

MIT
`;
  }

  /**
   * Generate a version string
   */
  private generateVersion(): string {
    return '0.1.0';
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
