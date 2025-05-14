/**
 * Simple Code Enhancement MCP Server
 * 
 * A simplified version of the Code Enhancement MCP Server to ensure it works correctly.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Constants
const PORT = process.env.PORT || 3020;

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize server state
const serverState = {
  id: 'code-enhancement-mcp',
  name: 'Code Enhancement MCP Server',
  version: '1.0.0',
  status: 'ready',
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
let availableModels = ['codellama', 'starcoder', 'phi3'];

// Routes

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Code Enhancement MCP Server is running',
    status: 'ok'
  });
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
        return handleGenerateCode(req, res);
      case 'refactor-code':
        return handleRefactorCode(req, res);
      case 'analyze-code':
        return handleAnalyzeCode(req, res);
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
      details: error.message
    });
  }
});

// Tool handlers
function handleGenerateCode(req, res) {
  const { description, language, model } = req.body.parameters;
  
  if (!description || !language) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Description and language are required'
    });
  }
  
  console.log(`Generating ${language} code for: ${description}`);
  
  // Mock code generation
  let generatedCode = '';
  
  if (language === 'javascript' || language === 'js') {
    generatedCode = `// Generated code for: ${description}\n\nfunction main() {\n  console.log("Hello, world!");\n  // TODO: Implement ${description}\n}\n\nmain();`;
  } else if (language === 'python' || language === 'py') {
    generatedCode = `# Generated code for: ${description}\n\ndef main():\n    print("Hello, world!")\n    # TODO: Implement ${description}\n\nif __name__ == "__main__":\n    main()`;
  } else {
    generatedCode = `// Generated code for: ${description}\n// Language: ${language}\n\n// TODO: Implement ${description}`;
  }
  
  res.json({
    id: uuidv4(),
    tool_id: 'generate-code',
    result: {
      code: generatedCode,
      language: language
    }
  });
}

function handleRefactorCode(req, res) {
  const { code, language, instructions, model } = req.body.parameters;
  
  if (!code || !language || !instructions) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Code, language, and instructions are required'
    });
  }
  
  console.log(`Refactoring ${language} code according to: ${instructions}`);
  
  // Mock code refactoring
  const refactoredCode = `// Refactored code based on: ${instructions}\n\n${code}\n\n// TODO: Implement refactoring`;
  
  res.json({
    id: uuidv4(),
    tool_id: 'refactor-code',
    result: {
      original_code: code,
      refactored_code: refactoredCode,
      language: language
    }
  });
}

function handleAnalyzeCode(req, res) {
  const { code, language, model } = req.body.parameters;
  
  if (!code || !language) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Code and language are required'
    });
  }
  
  console.log(`Analyzing ${language} code`);
  
  // Mock code analysis
  const analysis = `# Code Analysis\n\n## Overview\nThe provided ${language} code appears to be ${code.length < 100 ? 'very short' : 'of moderate length'}.\n\n## Issues\n- No major issues detected\n\n## Recommendations\n- Consider adding more comments\n- Consider adding error handling`;
  
  res.json({
    id: uuidv4(),
    tool_id: 'analyze-code',
    result: {
      code: code,
      language: language,
      analysis: analysis
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Code Enhancement MCP Server running on port ${PORT}`);
  
  // Add mock models
  serverState.models = availableModels.map(name => ({
    id: name,
    name: name,
    capabilities: ['code_generation', 'code_refactoring', 'code_analysis']
  }));
  console.log(`Available models (mock): ${availableModels.join(', ')}`);
  
  // Register with Nexus MCP Hub
  try {
    const NEXUS_HUB_URL = process.env.NEXUS_HUB_URL || 'http://localhost:8000';
    console.log(`Attempting to register with Nexus MCP Hub at ${NEXUS_HUB_URL}`);
    
    axios.post(`${NEXUS_HUB_URL}/api/servers/register`, {
      id: serverState.id,
      name: serverState.name,
      url: `http://localhost:${PORT}`,
      capabilities: serverState.capabilities
    })
    .then(response => {
      if (response.data.success) {
        console.log('Successfully registered with Nexus MCP Hub');
      } else {
        console.error('Failed to register with Nexus MCP Hub:', response.data.error);
      }
    })
    .catch(error => {
      console.error('Error registering with Nexus MCP Hub:', error.message);
    });
  } catch (error) {
    console.error('Error setting up registration with Nexus MCP Hub:', error.message);
  }
});
