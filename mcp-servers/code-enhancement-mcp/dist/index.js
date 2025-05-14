"use strict";
/**
 * Code Enhancement MCP Server
 *
 * This server implements the Model Context Protocol (MCP) for code enhancement.
 * It provides code generation, refactoring, and analysis capabilities.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const express_sse_1 = __importDefault(require("express-sse"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Constants
const PORT = process.env.PORT || 3020;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
// Create Express app
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Create SSE instance for server-sent events
const sse = new express_sse_1.default();
// Initialize server state
const serverState = {
    id: 'code-enhancement-mcp',
    name: 'Code Enhancement MCP Server',
    version: '1.0.0',
    status: 'initializing',
    capabilities: [
        'code_generation',
        'code_refactoring',
        'code_analysis'
    ],
    models: [],
    resources: [],
    tools: [
        {
            id: 'generate-code',
            name: 'Generate Code',
            description: 'Generate code based on a description',
            parameters: {
                type: 'object',
                properties: {
                    description: {
                        type: 'string',
                        description: 'Description of the code to generate'
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language'
                    },
                    model: {
                        type: 'string',
                        description: 'Model to use for generation'
                    }
                },
                required: ['description', 'language']
            }
        },
        {
            id: 'refactor-code',
            name: 'Refactor Code',
            description: 'Refactor code based on instructions',
            parameters: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to refactor'
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language'
                    },
                    instructions: {
                        type: 'string',
                        description: 'Refactoring instructions'
                    },
                    model: {
                        type: 'string',
                        description: 'Model to use for refactoring'
                    }
                },
                required: ['code', 'language', 'instructions']
            }
        },
        {
            id: 'analyze-code',
            name: 'Analyze Code',
            description: 'Analyze code for issues and improvements',
            parameters: {
                type: 'object',
                properties: {
                    code: {
                        type: 'string',
                        description: 'Code to analyze'
                    },
                    language: {
                        type: 'string',
                        description: 'Programming language'
                    },
                    model: {
                        type: 'string',
                        description: 'Model to use for analysis'
                    }
                },
                required: ['code', 'language']
            }
        }
    ],
    prompts: []
};
// Initialize models
let availableModels = [];
// Routes
// SSE endpoint for MCP events
app.get('/sse', (req, res) => {
    console.log('Client connected to SSE');
    sse.init(req, res);
});
// MCP initialization endpoint
app.post('/mcp/initialize', async (req, res) => {
    try {
        console.log('Initializing MCP server');
        // Get available models from Ollama
        try {
            const response = await axios_1.default.get(`${OLLAMA_API_URL}/api/tags`);
            availableModels = response.data.models
                .map((model) => model.name)
                .filter((name) => name.toLowerCase().includes('code') || name.toLowerCase().includes('starcoder'));
            serverState.models = availableModels.map(name => ({
                id: name,
                name: name,
                capabilities: ['code_generation', 'code_refactoring', 'code_analysis']
            }));
            console.log(`Available models: ${availableModels.join(', ')}`);
        }
        catch (error) {
            console.error('Error fetching models from Ollama:', error);
            // Continue with empty models list
        }
        // Update server state
        serverState.status = 'ready';
        // Send initialization response
        res.json({
            id: serverState.id,
            name: serverState.name,
            version: serverState.version,
            status: serverState.status,
            capabilities: serverState.capabilities,
            models: serverState.models,
            resources: serverState.resources,
            tools: serverState.tools,
            prompts: serverState.prompts
        });
        // Notify clients that the server is ready
        sse.send({
            type: 'server_status',
            status: 'ready'
        }, 'status');
        console.log('MCP server initialized');
    }
    catch (error) {
        console.error('Error initializing MCP server:', error);
        res.status(500).json({
            error: 'Failed to initialize MCP server',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// MCP status endpoint
app.get('/mcp/status', (req, res) => {
    res.json({
        id: serverState.id,
        status: serverState.status
    });
});
// MCP models endpoint
app.get('/mcp/models', (req, res) => {
    res.json({
        models: serverState.models
    });
});
// MCP tools endpoint
app.get('/mcp/tools', (req, res) => {
    res.json({
        tools: serverState.tools
    });
});
// MCP tool call endpoint
app.post('/mcp/tools/call', async (req, res) => {
    try {
        const { tool_id, parameters } = req.body;
        if (!tool_id || !parameters) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'Tool ID and parameters are required'
            });
        }
        // Handle different tools
        switch (tool_id) {
            case 'generate-code':
                return await handleGenerateCode(req, res);
            case 'refactor-code':
                return await handleRefactorCode(req, res);
            case 'analyze-code':
                return await handleAnalyzeCode(req, res);
            default:
                return res.status(404).json({
                    error: 'Tool not found',
                    details: `Tool ${tool_id} is not available`
                });
        }
    }
    catch (error) {
        console.error('Error calling tool:', error);
        res.status(500).json({
            error: 'Failed to call tool',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Tool handlers
async function handleGenerateCode(req, res) {
    const { description, language, model } = req.body.parameters;
    if (!description || !language) {
        return res.status(400).json({
            error: 'Missing required parameters',
            details: 'Description and language are required'
        });
    }
    // Use default model if not specified
    const selectedModel = model || availableModels[0] || 'codellama';
    // Generate prompt for code generation
    const prompt = `Generate ${language} code for the following description:\n\n${description}\n\nPlease provide only the code without explanations.`;
    try {
        // Send the request to Ollama
        const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/generate`, {
            model: selectedModel,
            prompt: prompt,
            options: {
                temperature: 0.3,
                num_predict: 2000
            }
        });
        // Extract code from response
        const generatedCode = ollamaResponse.data.response;
        res.json({
            id: (0, uuid_1.v4)(),
            tool_id: 'generate-code',
            result: {
                code: generatedCode,
                language: language
            }
        });
    }
    catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({
            error: 'Failed to generate code',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
async function handleRefactorCode(req, res) {
    const { code, language, instructions, model } = req.body.parameters;
    if (!code || !language || !instructions) {
        return res.status(400).json({
            error: 'Missing required parameters',
            details: 'Code, language, and instructions are required'
        });
    }
    // Use default model if not specified
    const selectedModel = model || availableModels[0] || 'codellama';
    // Generate prompt for code refactoring
    const prompt = `Refactor the following ${language} code according to these instructions: ${instructions}\n\nOriginal code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nRefactored code (provide only the code without explanations):`;
    try {
        // Send the request to Ollama
        const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/generate`, {
            model: selectedModel,
            prompt: prompt,
            options: {
                temperature: 0.3,
                num_predict: 2000
            }
        });
        // Extract code from response
        const refactoredCode = ollamaResponse.data.response;
        res.json({
            id: (0, uuid_1.v4)(),
            tool_id: 'refactor-code',
            result: {
                original_code: code,
                refactored_code: refactoredCode,
                language: language
            }
        });
    }
    catch (error) {
        console.error('Error refactoring code:', error);
        res.status(500).json({
            error: 'Failed to refactor code',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
async function handleAnalyzeCode(req, res) {
    const { code, language, model } = req.body.parameters;
    if (!code || !language) {
        return res.status(400).json({
            error: 'Missing required parameters',
            details: 'Code and language are required'
        });
    }
    // Use default model if not specified
    const selectedModel = model || availableModels[0] || 'codellama';
    // Generate prompt for code analysis
    const prompt = `Analyze the following ${language} code for issues, bugs, and potential improvements. Provide a detailed analysis with specific recommendations.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nAnalysis:`;
    try {
        // Send the request to Ollama
        const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/generate`, {
            model: selectedModel,
            prompt: prompt,
            options: {
                temperature: 0.3,
                num_predict: 2000
            }
        });
        // Extract analysis from response
        const analysis = ollamaResponse.data.response;
        res.json({
            id: (0, uuid_1.v4)(),
            tool_id: 'analyze-code',
            result: {
                code: code,
                language: language,
                analysis: analysis
            }
        });
    }
    catch (error) {
        console.error('Error analyzing code:', error);
        res.status(500).json({
            error: 'Failed to analyze code',
            details: error instanceof Error ? error.message : String(error)
        });
    }
}
// Start the server
app.listen(PORT, () => {
    console.log(`Code Enhancement MCP Server running on port ${PORT}`);
    console.log(`Server-Sent Events endpoint: http://localhost:${PORT}/sse`);
    console.log(`Ollama API URL: ${OLLAMA_API_URL}`);
    // Register with Nexus MCP Hub
    registerWithNexusHub();
});
// Function to register with Nexus MCP Hub
async function registerWithNexusHub() {
    try {
        const NEXUS_HUB_URL = process.env.NEXUS_HUB_URL || 'http://localhost:8000';
        console.log(`Registering with Nexus MCP Hub at ${NEXUS_HUB_URL}`);
        const response = await axios_1.default.post(`${NEXUS_HUB_URL}/api/servers/register`, {
            id: serverState.id,
            name: serverState.name,
            url: `http://localhost:${PORT}`,
            capabilities: serverState.capabilities
        });
        if (response.data.success) {
            console.log('Successfully registered with Nexus MCP Hub');
        }
        else {
            console.error('Failed to register with Nexus MCP Hub:', response.data.error);
        }
    }
    catch (error) {
        console.error('Error registering with Nexus MCP Hub:', error);
    }
}
