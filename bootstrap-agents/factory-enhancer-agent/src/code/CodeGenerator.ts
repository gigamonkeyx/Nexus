/**
 * Code Generator
 *
 * Generates code for various components of the AI Agent Factory.
 */

import {
  AdapterManager,
  logger
} from 'bootstrap-core';
import * as fs from 'fs';
import * as path from 'path';

export interface CodeGenerationRequest {
  type: 'class' | 'interface' | 'function' | 'module';
  name: string;
  description: string;
  language: 'typescript' | 'javascript' | 'python';
  requirements: string[];
  dependencies?: string[];
  examples?: string[];
  outputPath?: string;
}

export interface CodeGenerationResult {
  code: string;
  language: string;
  path?: string;
  dependencies: string[];
}

export class CodeGenerator {
  private adapterManager: AdapterManager;

  constructor(adapterManager: AdapterManager) {
    this.adapterManager = adapterManager;
  }

  /**
   * Generate code based on a request
   */
  public async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult> {
    logger.info(`Generating ${request.type} ${request.name} in ${request.language}`);

    try {
      const ollamaAdapter = this.adapterManager.getFirstOllamaMCPAdapter();

      if (!ollamaAdapter) {
        throw new Error('No Ollama adapter available for code generation');
      }

      // Generate prompt
      const prompt = this.createPrompt(request);

      // Generate code
      const code = await ollamaAdapter.generateCode(prompt, request.language);

      // Enhance code if possible
      let enhancedCode = code;

      const codeEnhancementAdapter = this.adapterManager.getFirstCodeEnhancementAdapter();

      if (codeEnhancementAdapter) {
        try {
          enhancedCode = await codeEnhancementAdapter.enhanceCode(code, request.language);
        } catch (error) {
          logger.warn(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Save code if output path is provided
      let outputPath: string | undefined;

      if (request.outputPath) {
        outputPath = this.saveCode(enhancedCode, request);
      }

      return {
        code: enhancedCode,
        language: request.language,
        path: outputPath,
        dependencies: request.dependencies || []
      };
    } catch (error) {
      logger.error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate a class
   */
  public async generateClass(
    name: string,
    description: string,
    requirements: string[],
    language: 'typescript' | 'javascript' | 'python' = 'typescript',
    outputPath?: string
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'class',
      name,
      description,
      language,
      requirements,
      outputPath
    });
  }

  /**
   * Generate an interface
   */
  public async generateInterface(
    name: string,
    description: string,
    requirements: string[],
    language: 'typescript' | 'javascript' | 'python' = 'typescript',
    outputPath?: string
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'interface',
      name,
      description,
      language,
      requirements,
      outputPath
    });
  }

  /**
   * Generate a function
   */
  public async generateFunction(
    name: string,
    description: string,
    requirements: string[],
    language: 'typescript' | 'javascript' | 'python' = 'typescript',
    outputPath?: string
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'function',
      name,
      description,
      language,
      requirements,
      outputPath
    });
  }

  /**
   * Generate a module
   */
  public async generateModule(
    name: string,
    description: string,
    requirements: string[],
    language: 'typescript' | 'javascript' | 'python' = 'typescript',
    outputPath?: string
  ): Promise<CodeGenerationResult> {
    return this.generateCode({
      type: 'module',
      name,
      description,
      language,
      requirements,
      outputPath
    });
  }

  /**
   * Create a prompt for code generation
   */
  private createPrompt(request: CodeGenerationRequest): string {
    const { type, name, description, language, requirements, dependencies, examples } = request;

    let prompt = `
You are an expert ${language} developer. Generate a ${type} called ${name} with the following description:

${description}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}
`;

    if (dependencies && dependencies.length > 0) {
      prompt += `\nDependencies:
${dependencies.map(dep => `- ${dep}`).join('\n')}
`;
    }

    if (examples && examples.length > 0) {
      prompt += `\nExamples:
${examples.join('\n\n')}
`;
    }

    prompt += `\nGenerate clean, well-documented ${language} code for this ${type}.
Include comprehensive error handling and logging.
The code should be ready to use without further modifications.

Only return the code, no explanations.
`;

    return prompt;
  }

  /**
   * Save generated code to a file
   */
  private saveCode(code: string, request: CodeGenerationRequest): string {
    const { name, language, outputPath } = request;

    if (!outputPath) {
      throw new Error('Output path is required to save code');
    }

    // Determine file extension
    let extension = '.ts';

    if (language === 'javascript') {
      extension = '.js';
    } else if (language === 'python') {
      extension = '.py';
    }

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    // Determine file name
    const fileName = `${name.replace(/\s+/g, '')}${extension}`;
    const filePath = path.join(outputPath, fileName);

    // Write code to file
    fs.writeFileSync(filePath, code);

    logger.info(`Code saved to ${filePath}`);

    return filePath;
  }
}
