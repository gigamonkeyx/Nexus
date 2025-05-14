"use strict";
/**
 * Code Generator
 *
 * Generates code for various components of the AI Agent Factory.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeGenerator = void 0;
const bootstrap_core_1 = require("bootstrap-core");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class CodeGenerator {
    constructor(adapterManager) {
        this.adapterManager = adapterManager;
    }
    /**
     * Generate code based on a request
     */
    async generateCode(request) {
        bootstrap_core_1.logger.info(`Generating ${request.type} ${request.name} in ${request.language}`);
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
                }
                catch (error) {
                    bootstrap_core_1.logger.warn(`Failed to enhance code: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
            // Save code if output path is provided
            let outputPath;
            if (request.outputPath) {
                outputPath = this.saveCode(enhancedCode, request);
            }
            return {
                code: enhancedCode,
                language: request.language,
                path: outputPath,
                dependencies: request.dependencies || []
            };
        }
        catch (error) {
            bootstrap_core_1.logger.error(`Failed to generate code: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    /**
     * Generate a class
     */
    async generateClass(name, description, requirements, language = 'typescript', outputPath) {
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
    async generateInterface(name, description, requirements, language = 'typescript', outputPath) {
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
    async generateFunction(name, description, requirements, language = 'typescript', outputPath) {
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
    async generateModule(name, description, requirements, language = 'typescript', outputPath) {
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
    createPrompt(request) {
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
    saveCode(code, request) {
        const { name, language, outputPath } = request;
        if (!outputPath) {
            throw new Error('Output path is required to save code');
        }
        // Determine file extension
        let extension = '.ts';
        if (language === 'javascript') {
            extension = '.js';
        }
        else if (language === 'python') {
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
        bootstrap_core_1.logger.info(`Code saved to ${filePath}`);
        return filePath;
    }
}
exports.CodeGenerator = CodeGenerator;
