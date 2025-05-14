/**
 * Lucidity MCP Server
 * 
 * This server implements the Model Context Protocol (MCP) for reasoning and planning.
 * It provides reasoning, planning, and problem-solving capabilities.
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import SSE from 'express-sse';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 3021;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create SSE instance for server-sent events
const sse = new SSE();

// Initialize server state
const serverState = {
  id: 'lucidity-mcp',
  name: 'Lucidity MCP Server',
  version: '1.0.0',
  status: 'initializing',
  capabilities: [
    'reasoning',
    'planning',
    'problem_solving'
  ],
  models: [],
  resources: [],
  tools: [
    {
      id: 'reason',
      name: 'Reason',
      description: 'Reason about a problem or situation',
      parameters: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'Problem or situation to reason about'
          },
          model: {
            type: 'string',
            description: 'Model to use for reasoning'
          }
        },
        required: ['problem']
      }
    },
    {
      id: 'create-plan',
      name: 'Create Plan',
      description: 'Create a plan for a goal',
      parameters: {
        type: 'object',
        properties: {
          goal: {
            type: 'string',
            description: 'Goal to create a plan for'
          },
          steps: {
            type: 'number',
            description: 'Number of steps in the plan'
          },
          format: {
            type: 'string',
            description: 'Format of the plan (text, markdown, json)'
          },
          model: {
            type: 'string',
            description: 'Model to use for planning'
          }
        },
        required: ['goal']
      }
    },
    {
      id: 'solve-problem',
      name: 'Solve Problem',
      description: 'Solve a problem',
      parameters: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'Problem to solve'
          },
          model: {
            type: 'string',
            description: 'Model to use for problem solving'
          }
        },
        required: ['problem']
      }
    }
  ],
  prompts: []
};

// Initialize models
let availableModels: string[] = [];

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
      const response = await axios.get(`${OLLAMA_API_URL}/api/tags`);
      availableModels = response.data.models
        .map((model: any) => model.name)
        .filter((name: string) => 
          name.toLowerCase().includes('llama') || 
          name.toLowerCase().includes('mistral') || 
          name.toLowerCase().includes('phi')
        );
      
      serverState.models = availableModels.map(name => ({
        id: name,
        name: name,
        capabilities: ['reasoning', 'planning', 'problem_solving']
      }));
      
      console.log(`Available models: ${availableModels.join(', ')}`);
    } catch (error) {
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
  } catch (error) {
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
      case 'reason':
        return await handleReason(req, res);
      case 'create-plan':
        return await handleCreatePlan(req, res);
      case 'solve-problem':
        return await handleSolveProblem(req, res);
      default:
        return res.status(404).json({
          error: 'Tool not found',
          details: `Tool ${tool_id} is not available`
        });
    }
  } catch (error) {
    console.error('Error calling tool:', error);
    res.status(500).json({
      error: 'Failed to call tool',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Tool handlers
async function handleReason(req: express.Request, res: express.Response) {
  const { problem, model } = req.body.parameters;
  
  if (!problem) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Problem is required'
    });
  }
  
  // Use default model if not specified
  const selectedModel = model || availableModels[0] || 'llama3';
  
  // Generate prompt for reasoning
  const prompt = `I need you to reason step by step about the following problem or situation:\n\n${problem}\n\nPlease provide a detailed, logical analysis with clear reasoning steps.`;
  
  try {
    // Send the request to Ollama
    const ollamaResponse = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model: selectedModel,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 2000
        }
      }
    );
    
    // Extract reasoning from response
    const reasoning = ollamaResponse.data.response;
    
    res.json({
      id: uuidv4(),
      tool_id: 'reason',
      result: {
        problem: problem,
        reasoning: reasoning
      }
    });
  } catch (error) {
    console.error('Error reasoning about problem:', error);
    res.status(500).json({
      error: 'Failed to reason about problem',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleCreatePlan(req: express.Request, res: express.Response) {
  const { goal, steps, format, model } = req.body.parameters;
  
  if (!goal) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Goal is required'
    });
  }
  
  // Use default model if not specified
  const selectedModel = model || availableModels[0] || 'llama3';
  
  // Set default values
  const numSteps = steps || 5;
  const outputFormat = format || 'markdown';
  
  // Generate prompt for planning
  let prompt = `I need you to create a detailed plan for the following goal:\n\n${goal}\n\n`;
  prompt += `Please provide a plan with ${numSteps} steps. `;
  
  if (outputFormat === 'json') {
    prompt += `Format the output as JSON with the following structure:
{
  "goal": "the goal",
  "steps": [
    {
      "number": 1,
      "title": "Step title",
      "description": "Step description",
      "resources": ["resource1", "resource2"]
    },
    ...
  ]
}`;
  } else if (outputFormat === 'markdown') {
    prompt += `Format the output as Markdown with clear headings, bullet points, and structure.`;
  } else {
    prompt += `Format the output as plain text with clear step numbers and descriptions.`;
  }
  
  try {
    // Send the request to Ollama
    const ollamaResponse = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model: selectedModel,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 2000
        }
      }
    );
    
    // Extract plan from response
    const plan = ollamaResponse.data.response;
    
    res.json({
      id: uuidv4(),
      tool_id: 'create-plan',
      result: {
        goal: goal,
        plan: plan,
        format: outputFormat
      }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({
      error: 'Failed to create plan',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleSolveProblem(req: express.Request, res: express.Response) {
  const { problem, model } = req.body.parameters;
  
  if (!problem) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Problem is required'
    });
  }
  
  // Use default model if not specified
  const selectedModel = model || availableModels[0] || 'llama3';
  
  // Generate prompt for problem solving
  const prompt = `I need you to solve the following problem:\n\n${problem}\n\nPlease provide a step-by-step solution with clear explanations.`;
  
  try {
    // Send the request to Ollama
    const ollamaResponse = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model: selectedModel,
        prompt: prompt,
        options: {
          temperature: 0.7,
          num_predict: 2000
        }
      }
    );
    
    // Extract solution from response
    const solution = ollamaResponse.data.response;
    
    res.json({
      id: uuidv4(),
      tool_id: 'solve-problem',
      result: {
        problem: problem,
        solution: solution
      }
    });
  } catch (error) {
    console.error('Error solving problem:', error);
    res.status(500).json({
      error: 'Failed to solve problem',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Lucidity MCP Server running on port ${PORT}`);
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
    
    const response = await axios.post(`${NEXUS_HUB_URL}/api/servers/register`, {
      id: serverState.id,
      name: serverState.name,
      url: `http://localhost:${PORT}`,
      capabilities: serverState.capabilities
    });
    
    if (response.data.success) {
      console.log('Successfully registered with Nexus MCP Hub');
    } else {
      console.error('Failed to register with Nexus MCP Hub:', response.data.error);
    }
  } catch (error) {
    console.error('Error registering with Nexus MCP Hub:', error);
  }
}
