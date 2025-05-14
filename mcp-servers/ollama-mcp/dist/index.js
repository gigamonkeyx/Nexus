"use strict";
/**
 * Ollama MCP Server
 *
 * This server implements the Model Context Protocol (MCP) for Ollama.
 * It provides access to Ollama models for text generation, code generation, and embedding generation.
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
const PORT = process.env.PORT || 3011;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
// Create Express app
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Create SSE instance for server-sent events
const sse = new express_sse_1.default();
// Initialize server state
const serverState = {
    id: 'ollama-mcp',
    name: 'Ollama MCP Server',
    version: '1.0.0',
    status: 'initializing',
    capabilities: [
        'text_generation',
        'code_generation',
        'embedding_generation'
    ],
    models: [],
    resources: [],
    tools: [],
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
            availableModels = response.data.models.map((model) => model.name);
            serverState.models = availableModels.map(name => ({
                id: name,
                name: name,
                capabilities: ['text_generation', 'code_generation', 'embedding_generation']
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
// MCP sample endpoint
app.post('/mcp/sample', async (req, res) => {
    try {
        const { model, prompt, options } = req.body;
        if (!model || !prompt) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'Model and prompt are required'
            });
        }
        // Check if model exists
        if (!availableModels.includes(model)) {
            return res.status(404).json({
                error: 'Model not found',
                details: `Model ${model} is not available`
            });
        }
        // Set default options
        const defaultOptions = {
            temperature: 0.7,
            max_tokens: 1000,
            stop: [],
            stream: false
        };
        // Merge default options with provided options
        const mergedOptions = { ...defaultOptions, ...options };
        // If streaming is requested, handle it differently
        if (mergedOptions.stream) {
            // Set headers for streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            // Generate a unique ID for this request
            const requestId = (0, uuid_1.v4)();
            // Send the request to Ollama
            const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/generate`, {
                model: model,
                prompt: prompt,
                stream: true,
                options: {
                    temperature: mergedOptions.temperature,
                    num_predict: mergedOptions.max_tokens
                }
            }, { responseType: 'stream' });
            // Stream the response
            ollamaResponse.data.on('data', (chunk) => {
                const data = JSON.parse(chunk.toString());
                res.write(`data: ${JSON.stringify({
                    id: requestId,
                    model: model,
                    output: data.response,
                    done: data.done
                })}\n\n`);
                if (data.done) {
                    res.end();
                }
            });
            // Handle errors
            ollamaResponse.data.on('error', (error) => {
                console.error('Error streaming from Ollama:', error);
                res.write(`data: ${JSON.stringify({
                    id: requestId,
                    error: error.message,
                    done: true
                })}\n\n`);
                res.end();
            });
        }
        else {
            // Non-streaming request
            const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/generate`, {
                model: model,
                prompt: prompt,
                options: {
                    temperature: mergedOptions.temperature,
                    num_predict: mergedOptions.max_tokens
                }
            });
            res.json({
                id: (0, uuid_1.v4)(),
                model: model,
                output: ollamaResponse.data.response
            });
        }
    }
    catch (error) {
        console.error('Error sampling from Ollama:', error);
        res.status(500).json({
            error: 'Failed to sample from model',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// MCP embedding endpoint
app.post('/mcp/embedding', async (req, res) => {
    try {
        const { model, input } = req.body;
        if (!model || !input) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'Model and input are required'
            });
        }
        // Check if model exists
        if (!availableModels.includes(model)) {
            return res.status(404).json({
                error: 'Model not found',
                details: `Model ${model} is not available`
            });
        }
        // Send the request to Ollama
        const ollamaResponse = await axios_1.default.post(`${OLLAMA_API_URL}/api/embeddings`, {
            model: model,
            prompt: input
        });
        res.json({
            id: (0, uuid_1.v4)(),
            model: model,
            embedding: ollamaResponse.data.embedding
        });
    }
    catch (error) {
        console.error('Error generating embedding from Ollama:', error);
        res.status(500).json({
            error: 'Failed to generate embedding',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Ollama MCP Server running on port ${PORT}`);
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
