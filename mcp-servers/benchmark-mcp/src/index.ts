/**
 * Benchmark MCP Server
 * 
 * This server implements the Model Context Protocol (MCP) for benchmarking and evaluation.
 * It provides benchmarking capabilities for evaluating agent performance.
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import SSE from 'express-sse';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 8020;
const RESULTS_PATH = process.env.RESULTS_PATH || './benchmark-results';

// Create results directory if it doesn't exist
if (!fs.existsSync(RESULTS_PATH)) {
  fs.mkdirSync(RESULTS_PATH, { recursive: true });
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create SSE instance for server-sent events
const sse = new SSE();

// Initialize server state
const serverState = {
  id: 'benchmark-mcp',
  name: 'Benchmark MCP Server',
  version: '1.0.0',
  status: 'initializing',
  capabilities: [
    'benchmarking',
    'evaluation',
    'performance_tracking'
  ],
  models: [],
  resources: [],
  tools: [
    {
      id: 'run-benchmark',
      name: 'Run Benchmark',
      description: 'Run a benchmark on an agent',
      parameters: {
        type: 'object',
        properties: {
          benchmark_type: {
            type: 'string',
            description: 'Type of benchmark to run (humaneval, taubench)'
          },
          agent_id: {
            type: 'string',
            description: 'ID of the agent to benchmark'
          },
          options: {
            type: 'object',
            description: 'Benchmark options'
          }
        },
        required: ['benchmark_type', 'agent_id']
      }
    },
    {
      id: 'compare-benchmark-results',
      name: 'Compare Benchmark Results',
      description: 'Compare two benchmark results',
      parameters: {
        type: 'object',
        properties: {
          result_id_1: {
            type: 'string',
            description: 'ID of the first benchmark result'
          },
          result_id_2: {
            type: 'string',
            description: 'ID of the second benchmark result'
          }
        },
        required: ['result_id_1', 'result_id_2']
      }
    },
    {
      id: 'get-progress-report',
      name: 'Get Progress Report',
      description: 'Get a progress report for an agent',
      parameters: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'ID of the agent'
          },
          benchmark_type: {
            type: 'string',
            description: 'Type of benchmark to report on'
          }
        },
        required: ['agent_id']
      }
    }
  ],
  prompts: []
};

// Initialize benchmarks
const benchmarks = {
  humaneval: {
    name: 'HumanEval',
    description: 'Evaluates code generation capabilities',
    metrics: ['pass@k', 'average_time_per_problem', 'completion_rate', 'error_rate'],
    problems: [
      {
        id: 'HumanEval/1',
        name: 'factorial',
        description: 'Write a function to calculate the factorial of a number',
        language: 'python'
      },
      {
        id: 'HumanEval/2',
        name: 'fibonacci',
        description: 'Write a function to calculate the nth Fibonacci number',
        language: 'python'
      },
      // More problems would be added in a real implementation
    ]
  },
  taubench: {
    name: 'τ-Bench',
    description: 'Evaluates reasoning, planning, and adaptation capabilities',
    metrics: ['reasoning_score', 'planning_score', 'adaptation_score', 'overall_score'],
    scenarios: [
      {
        id: 'TauBench/1',
        name: 'travel_planning',
        description: 'Plan a trip to a foreign country with specific constraints'
      },
      {
        id: 'TauBench/2',
        name: 'budget_optimization',
        description: 'Optimize a budget for a small business with competing priorities'
      },
      // More scenarios would be added in a real implementation
    ]
  }
};

// Store benchmark results
const benchmarkResults: Record<string, any> = {};

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
      case 'run-benchmark':
        return await handleRunBenchmark(req, res);
      case 'compare-benchmark-results':
        return await handleCompareBenchmarkResults(req, res);
      case 'get-progress-report':
        return await handleGetProgressReport(req, res);
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
async function handleRunBenchmark(req: express.Request, res: express.Response) {
  const { benchmark_type, agent_id, options } = req.body.parameters;
  
  if (!benchmark_type || !agent_id) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Benchmark type and agent ID are required'
    });
  }
  
  // Check if benchmark type exists
  if (!benchmarks[benchmark_type]) {
    return res.status(404).json({
      error: 'Benchmark not found',
      details: `Benchmark ${benchmark_type} is not available`
    });
  }
  
  // Set default options
  const defaultOptions = {
    maxProblems: 5,
    timeout: 60000
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  try {
    // In a real implementation, this would run the benchmark on the agent
    // For now, we'll simulate a benchmark run
    
    console.log(`Running ${benchmark_type} benchmark on agent ${agent_id}`);
    
    // Generate a unique ID for this benchmark run
    const benchmarkId = `benchmark_${Date.now()}`;
    
    // Simulate benchmark execution
    const result = simulateBenchmarkRun(benchmark_type, agent_id, mergedOptions);
    
    // Store the result
    benchmarkResults[benchmarkId] = result;
    
    // Save the result to disk
    const resultPath = path.join(RESULTS_PATH, `${benchmarkId}.json`);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    
    // Return the result
    res.json({
      id: uuidv4(),
      tool_id: 'run-benchmark',
      result: {
        benchmark_id: benchmarkId,
        benchmark_type: benchmark_type,
        agent_id: agent_id,
        score: result.score,
        metrics: result.metrics,
        timestamp: result.timestamp
      }
    });
    
    // Notify clients about the benchmark result
    sse.send({
      type: 'benchmark_result',
      benchmark_id: benchmarkId,
      benchmark_type: benchmark_type,
      agent_id: agent_id,
      score: result.score
    }, 'benchmark');
  } catch (error) {
    console.error('Error running benchmark:', error);
    res.status(500).json({
      error: 'Failed to run benchmark',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleCompareBenchmarkResults(req: express.Request, res: express.Response) {
  const { result_id_1, result_id_2 } = req.body.parameters;
  
  if (!result_id_1 || !result_id_2) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Both result IDs are required'
    });
  }
  
  try {
    // Get the benchmark results
    const result1 = benchmarkResults[result_id_1];
    const result2 = benchmarkResults[result_id_2];
    
    if (!result1) {
      return res.status(404).json({
        error: 'Benchmark result not found',
        details: `Benchmark result ${result_id_1} is not available`
      });
    }
    
    if (!result2) {
      return res.status(404).json({
        error: 'Benchmark result not found',
        details: `Benchmark result ${result_id_2} is not available`
      });
    }
    
    // Compare the results
    const comparison = compareBenchmarkResults(result1, result2);
    
    res.json({
      id: uuidv4(),
      tool_id: 'compare-benchmark-results',
      result: comparison
    });
  } catch (error) {
    console.error('Error comparing benchmark results:', error);
    res.status(500).json({
      error: 'Failed to compare benchmark results',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleGetProgressReport(req: express.Request, res: express.Response) {
  const { agent_id, benchmark_type } = req.body.parameters;
  
  if (!agent_id) {
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'Agent ID is required'
    });
  }
  
  try {
    // Get all benchmark results for the agent
    const agentResults = Object.values(benchmarkResults)
      .filter((result: any) => result.agentId === agent_id)
      .filter((result: any) => !benchmark_type || result.benchmarkType === benchmark_type)
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Generate a progress report
    const progressReport = {
      agent_id: agent_id,
      benchmark_type: benchmark_type || 'all',
      results: agentResults.map((result: any) => ({
        benchmark_id: result.id,
        benchmark_type: result.benchmarkType,
        score: result.score,
        timestamp: result.timestamp
      })),
      improvement: agentResults.length > 1 ? 
        (agentResults[agentResults.length - 1].score - agentResults[0].score) / agentResults[0].score * 100 : 
        0
    };
    
    res.json({
      id: uuidv4(),
      tool_id: 'get-progress-report',
      result: progressReport
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({
      error: 'Failed to generate progress report',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// Helper functions
function simulateBenchmarkRun(benchmarkType: string, agentId: string, options: any) {
  // In a real implementation, this would run the benchmark on the agent
  // For now, we'll simulate a benchmark run
  
  const timestamp = new Date().toISOString();
  
  if (benchmarkType === 'humaneval') {
    // Simulate HumanEval benchmark
    const score = Math.random() * 0.5 + 0.3; // Random score between 0.3 and 0.8
    
    return {
      id: `benchmark_${Date.now()}`,
      agentId: agentId,
      benchmarkType: 'humaneval',
      score: score,
      metrics: {
        pass_at_k: {
          pass_at_1: score - 0.1,
          pass_at_3: score,
          pass_at_5: score + 0.1
        },
        average_time_per_problem: Math.random() * 2000 + 1000,
        completion_rate: Math.random() * 0.2 + 0.8,
        error_rate: Math.random() * 0.3
      },
      details: {
        problems: benchmarks.humaneval.problems.slice(0, options.maxProblems).map(problem => ({
          id: problem.id,
          name: problem.name,
          passed: Math.random() > 0.3,
          time_taken: Math.random() * 2000 + 500
        }))
      },
      timestamp: timestamp
    };
  } else if (benchmarkType === 'taubench') {
    // Simulate τ-Bench benchmark
    const reasoningScore = Math.random() * 0.5 + 0.3;
    const planningScore = Math.random() * 0.5 + 0.3;
    const adaptationScore = Math.random() * 0.5 + 0.3;
    const overallScore = (reasoningScore + planningScore + adaptationScore) / 3;
    
    return {
      id: `benchmark_${Date.now()}`,
      agentId: agentId,
      benchmarkType: 'taubench',
      score: overallScore,
      metrics: {
        reasoning_score: reasoningScore,
        planning_score: planningScore,
        adaptation_score: adaptationScore,
        overall_score: overallScore
      },
      details: {
        scenarios: benchmarks.taubench.scenarios.slice(0, options.maxProblems).map(scenario => ({
          id: scenario.id,
          name: scenario.name,
          reasoning_score: Math.random() * 0.5 + 0.3,
          planning_score: Math.random() * 0.5 + 0.3,
          adaptation_score: Math.random() * 0.5 + 0.3
        }))
      },
      timestamp: timestamp
    };
  } else {
    throw new Error(`Unsupported benchmark type: ${benchmarkType}`);
  }
}

function compareBenchmarkResults(result1: any, result2: any) {
  // Compare two benchmark results
  
  if (result1.benchmarkType !== result2.benchmarkType) {
    throw new Error('Cannot compare results from different benchmark types');
  }
  
  const comparison = {
    benchmark_type: result1.benchmarkType,
    overall: {
      before: result1.score,
      after: result2.score,
      change: result2.score - result1.score,
      percent_change: (result2.score - result1.score) / result1.score * 100
    },
    metrics: {}
  };
  
  // Compare metrics
  for (const metric in result1.metrics) {
    if (typeof result1.metrics[metric] === 'object') {
      comparison.metrics[metric] = {};
      
      for (const subMetric in result1.metrics[metric]) {
        comparison.metrics[metric][subMetric] = {
          before: result1.metrics[metric][subMetric],
          after: result2.metrics[metric][subMetric],
          change: result2.metrics[metric][subMetric] - result1.metrics[metric][subMetric],
          percent_change: (result2.metrics[metric][subMetric] - result1.metrics[metric][subMetric]) / result1.metrics[metric][subMetric] * 100
        };
      }
    } else {
      comparison.metrics[metric] = {
        before: result1.metrics[metric],
        after: result2.metrics[metric],
        change: result2.metrics[metric] - result1.metrics[metric],
        percent_change: (result2.metrics[metric] - result1.metrics[metric]) / result1.metrics[metric] * 100
      };
    }
  }
  
  return comparison;
}

// Start the server
app.listen(PORT, () => {
  console.log(`Benchmark MCP Server running on port ${PORT}`);
  console.log(`Server-Sent Events endpoint: http://localhost:${PORT}/sse`);
  console.log(`Results path: ${RESULTS_PATH}`);
  
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
