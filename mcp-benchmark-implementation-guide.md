# MCP Benchmark Implementation Guide

This guide provides practical instructions for implementing benchmark tools within the MCP testing framework. It focuses on the technical details of integrating HumanEval, CodeXGLUE, τ-bench, AgentBench, and MLE-bench with our Nexus MCP infrastructure.

## 1. MCP Benchmark Server Implementation

### 1.1 Server Structure

```
mcp-benchmark-server/
├── src/
│   ├── server.py                 # Main server implementation
│   ├── benchmarks/               # Benchmark implementations
│   │   ├── __init__.py
│   │   ├── base.py               # Base benchmark class
│   │   ├── humaneval.py          # HumanEval benchmark
│   │   ├── codexglue.py          # CodeXGLUE benchmark
│   │   ├── tau_bench.py          # τ-bench benchmark
│   │   ├── agent_bench.py        # AgentBench benchmark
│   │   └── mle_bench.py          # MLE-bench benchmark
│   ├── tools/                    # MCP tool implementations
│   │   ├── __init__.py
│   │   ├── benchmark_tools.py    # Benchmark-related tools
│   │   └── reporting_tools.py    # Reporting-related tools
│   ├── utils/                    # Utility functions
│   │   ├── __init__.py
│   │   ├── mcp_client.py         # MCP client for testing agents
│   │   └── result_processor.py   # Process benchmark results
│   └── data/                     # Data management
│       ├── __init__.py
│       ├── storage.py            # Result storage
│       └── export.py             # Result export
└── tests/                        # Tests for the server
    ├── __init__.py
    ├── test_server.py
    └── test_benchmarks.py
```

### 1.2 Base Benchmark Class

```python
# src/benchmarks/base.py

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger("mcp-benchmark")

class BaseBenchmark(ABC):
    """Base class for all benchmarks."""
    
    def __init__(self, benchmark_id: str, name: str, description: str):
        self.benchmark_id = benchmark_id
        self.name = name
        self.description = description
        self.results_dir = os.path.join("data", "results", benchmark_id)
        
        # Create results directory if it doesn't exist
        os.makedirs(self.results_dir, exist_ok=True)
    
    @abstractmethod
    async def run(self, agent_url: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run the benchmark against an agent."""
        pass
    
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about the benchmark."""
        pass
    
    def save_result(self, agent_id: str, result: Dict[str, Any]) -> str:
        """Save benchmark result to disk."""
        timestamp = datetime.now().isoformat()
        result_id = f"{agent_id}_{timestamp}"
        
        # Add metadata to result
        result_with_metadata = {
            "result_id": result_id,
            "benchmark_id": self.benchmark_id,
            "agent_id": agent_id,
            "timestamp": timestamp,
            "result": result
        }
        
        # Save result to file
        result_path = os.path.join(self.results_dir, f"{result_id}.json")
        with open(result_path, "w") as f:
            json.dump(result_with_metadata, f, indent=2)
        
        logger.info(f"Saved benchmark result to {result_path}")
        
        return result_id
    
    def load_result(self, result_id: str) -> Optional[Dict[str, Any]]:
        """Load benchmark result from disk."""
        result_path = os.path.join(self.results_dir, f"{result_id}.json")
        
        if not os.path.exists(result_path):
            logger.warning(f"Result {result_id} not found")
            return None
        
        with open(result_path, "r") as f:
            return json.load(f)
    
    def get_results_for_agent(self, agent_id: str) -> List[Dict[str, Any]]:
        """Get all results for a specific agent."""
        results = []
        
        for filename in os.listdir(self.results_dir):
            if not filename.endswith(".json"):
                continue
            
            if not filename.startswith(f"{agent_id}_"):
                continue
            
            result_id = filename[:-5]  # Remove .json extension
            result = self.load_result(result_id)
            
            if result:
                results.append(result)
        
        return results
```

### 1.3 HumanEval Benchmark Implementation

```python
# src/benchmarks/humaneval.py

import os
import json
import tempfile
import subprocess
from typing import Dict, Any, List, Optional
import aiohttp
import asyncio

from .base import BaseBenchmark
from ..utils.mcp_client import MCPClient

class HumanEvalBenchmark(BaseBenchmark):
    """HumanEval benchmark implementation."""
    
    def __init__(self):
        super().__init__(
            benchmark_id="humaneval",
            name="HumanEval",
            description="Evaluates code generation capabilities using 164 programming problems"
        )
        self.dataset_path = os.path.join("data", "datasets", "humaneval")
        self.problems = self._load_problems()
    
    def _load_problems(self) -> Dict[str, Any]:
        """Load HumanEval problems from the dataset."""
        if not os.path.exists(self.dataset_path):
            self._download_dataset()
        
        problems = {}
        data_path = os.path.join(self.dataset_path, "data", "HumanEval.jsonl")
        
        with open(data_path, "r") as f:
            for line in f:
                problem = json.loads(line)
                problems[problem["task_id"]] = problem
        
        return problems
    
    def _download_dataset(self) -> None:
        """Download the HumanEval dataset."""
        os.makedirs(self.dataset_path, exist_ok=True)
        
        # Clone the repository
        subprocess.run([
            "git", "clone",
            "https://github.com/openai/human-eval.git",
            self.dataset_path
        ], check=True)
        
        # Install the package
        subprocess.run([
            "pip", "install", "-e", self.dataset_path
        ], check=True)
    
    async def run(self, agent_url: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run the HumanEval benchmark against an agent."""
        options = options or {}
        k_value = options.get("k", 1)
        num_samples = options.get("num_samples", k_value)
        problem_ids = options.get("problem_ids", list(self.problems.keys()))
        
        # Create MCP client
        client = MCPClient(agent_url)
        
        # Run problems
        results = []
        for problem_id in problem_ids:
            problem = self.problems.get(problem_id)
            if not problem:
                continue
            
            # Generate multiple samples for pass@k
            samples = []
            for _ in range(num_samples):
                code = await self._generate_code(client, problem)
                passed = await self._evaluate_code(problem, code)
                samples.append({"code": code, "passed": passed})
            
            results.append({
                "problem_id": problem_id,
                "samples": samples,
                "passed": any(sample["passed"] for sample in samples)
            })
        
        # Calculate pass@k
        pass_at_k = self._calculate_pass_at_k(results, k_value, num_samples)
        
        return {
            "score": pass_at_k,
            "metrics": {
                "pass@k": pass_at_k,
                "k": k_value,
                "num_samples": num_samples,
                "problems_attempted": len(problem_ids),
                "problems_passed": sum(1 for r in results if r["passed"])
            },
            "detailed_results": results
        }
    
    async def _generate_code(self, client: MCPClient, problem: Dict[str, Any]) -> str:
        """Generate code for a problem using the agent."""
        response = await client.call_tool("generate_code", {
            "description": problem["prompt"],
            "language": "python"
        })
        
        if "error" in response:
            raise Exception(f"Error generating code: {response['error']}")
        
        return response["result"]["code"]
    
    async def _evaluate_code(self, problem: Dict[str, Any], code: str) -> bool:
        """Evaluate code against test cases."""
        # Create a temporary file with the code
        with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
            f.write(code)
            f.write("\n\n")
            f.write(problem["test"])
            temp_file = f.name
        
        try:
            # Run the code
            result = subprocess.run(
                ["python", temp_file],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Check if the code passed
            return result.returncode == 0
        except subprocess.TimeoutExpired:
            return False
        finally:
            # Clean up
            os.unlink(temp_file)
    
    def _calculate_pass_at_k(self, results: List[Dict[str, Any]], k: int, n: int) -> float:
        """Calculate pass@k metric."""
        if n < k:
            raise ValueError(f"n ({n}) must be greater than or equal to k ({k})")
        
        total = 0
        for result in results:
            samples = result["samples"]
            c = sum(1 for sample in samples if sample["passed"])
            
            if c == 0:
                # No samples passed, so pass@k is 0
                pass_at_k = 0
            else:
                # Calculate pass@k using the formula
                # pass@k = 1 - (n-c)! * (n-k)! / (n! * (n-k-c)!)
                import math
                
                if n - c < k:
                    # All samples will be included in k, so pass@k is 1
                    pass_at_k = 1
                else:
                    # Calculate using the formula
                    pass_at_k = 1 - (math.comb(n - c, k) / math.comb(n, k))
            
            total += pass_at_k
        
        return total / len(results) if results else 0
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about the benchmark."""
        return {
            "id": self.benchmark_id,
            "name": self.name,
            "description": self.description,
            "num_problems": len(self.problems),
            "problem_ids": list(self.problems.keys())
        }
```

### 1.4 MCP Tool Implementation

```python
# src/tools/benchmark_tools.py

from typing import Dict, Any
import asyncio
import uuid
import logging

from ..benchmarks.humaneval import HumanEvalBenchmark
from ..benchmarks.codexglue import CodeXGLUEBenchmark
from ..benchmarks.tau_bench import TauBenchBenchmark
from ..benchmarks.agent_bench import AgentBenchBenchmark
from ..benchmarks.mle_bench import MLEBenchBenchmark

logger = logging.getLogger("mcp-benchmark")

# Initialize benchmarks
benchmarks = {
    "humaneval": HumanEvalBenchmark(),
    "codexglue": CodeXGLUEBenchmark(),
    "tau_bench": TauBenchBenchmark(),
    "agent_bench": AgentBenchBenchmark(),
    "mle_bench": MLEBenchBenchmark()
}

async def run_benchmark(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Run a benchmark against an agent."""
    benchmark_id = parameters.get("benchmark_id")
    agent_url = parameters.get("agent_url")
    agent_id = parameters.get("agent_id", str(uuid.uuid4()))
    options = parameters.get("options", {})
    
    if not benchmark_id:
        return {"error": "Missing required parameter: benchmark_id"}
    
    if not agent_url:
        return {"error": "Missing required parameter: agent_url"}
    
    if benchmark_id not in benchmarks:
        return {"error": f"Unknown benchmark: {benchmark_id}"}
    
    benchmark = benchmarks[benchmark_id]
    
    try:
        # Run the benchmark
        logger.info(f"Running benchmark {benchmark_id} against agent {agent_id}")
        result = await benchmark.run(agent_url, options)
        
        # Save the result
        result_id = benchmark.save_result(agent_id, result)
        
        return {
            "result_id": result_id,
            "benchmark_id": benchmark_id,
            "agent_id": agent_id,
            "score": result["score"],
            "metrics": result["metrics"],
            "detailed_results_available": True
        }
    except Exception as e:
        logger.exception(f"Error running benchmark {benchmark_id}")
        return {
            "error": str(e),
            "benchmark_id": benchmark_id,
            "agent_id": agent_id
        }

async def get_benchmark_result(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Get a benchmark result."""
    benchmark_id = parameters.get("benchmark_id")
    result_id = parameters.get("result_id")
    
    if not benchmark_id:
        return {"error": "Missing required parameter: benchmark_id"}
    
    if not result_id:
        return {"error": "Missing required parameter: result_id"}
    
    if benchmark_id not in benchmarks:
        return {"error": f"Unknown benchmark: {benchmark_id}"}
    
    benchmark = benchmarks[benchmark_id]
    
    # Load the result
    result = benchmark.load_result(result_id)
    
    if not result:
        return {"error": f"Result not found: {result_id}"}
    
    return result

async def list_benchmarks(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """List available benchmarks."""
    return {
        "benchmarks": [
            benchmark.get_metadata()
            for benchmark in benchmarks.values()
        ]
    }

async def compare_benchmark_results(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Compare benchmark results."""
    benchmark_id = parameters.get("benchmark_id")
    result_ids = parameters.get("result_ids", [])
    
    if not benchmark_id:
        return {"error": "Missing required parameter: benchmark_id"}
    
    if not result_ids:
        return {"error": "Missing required parameter: result_ids"}
    
    if benchmark_id not in benchmarks:
        return {"error": f"Unknown benchmark: {benchmark_id}"}
    
    benchmark = benchmarks[benchmark_id]
    
    # Load results
    results = []
    for result_id in result_ids:
        result = benchmark.load_result(result_id)
        if result:
            results.append(result)
    
    if not results:
        return {"error": "No valid results found"}
    
    # Compare results
    comparison = {
        "benchmark_id": benchmark_id,
        "result_ids": result_ids,
        "scores": {
            result["agent_id"]: result["result"]["score"]
            for result in results
        },
        "metrics": {
            result["agent_id"]: result["result"]["metrics"]
            for result in results
        },
        "best_agent": max(
            results,
            key=lambda r: r["result"]["score"]
        )["agent_id"]
    }
    
    return comparison
```

### 1.5 Main Server Implementation

```python
# src/server.py

import os
import json
import logging
import asyncio
from typing import Dict, Any, Optional
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from tools.benchmark_tools import (
    run_benchmark,
    get_benchmark_result,
    list_benchmarks,
    compare_benchmark_results
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("mcp-benchmark-server")

# Create FastAPI app
app = FastAPI(title="MCP Benchmark Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCP tools
MCP_TOOLS = {
    "run_benchmark": run_benchmark,
    "get_benchmark_result": get_benchmark_result,
    "list_benchmarks": list_benchmarks,
    "compare_benchmark_results": compare_benchmark_results
}

@app.post("/")
async def handle_mcp_request(request: Request) -> Response:
    """Handle MCP requests."""
    # Parse request
    request_data = await request.json()
    request_id = request_data.get("id", "")
    tool = request_data.get("tool", "")
    parameters = request_data.get("parameters", {})
    
    logger.info(f"Received request: {request_id} - {tool}")
    
    # Check if tool exists
    if tool not in MCP_TOOLS:
        return Response(
            content=json.dumps({
                "id": request_id,
                "error": {
                    "type": "tool_not_found",
                    "message": f"Tool '{tool}' not found"
                }
            }),
            media_type="application/json"
        )
    
    try:
        # Execute tool
        result = await MCP_TOOLS[tool](parameters)
        
        # Check for error
        if "error" in result:
            return Response(
                content=json.dumps({
                    "id": request_id,
                    "error": {
                        "type": "tool_execution_error",
                        "message": result["error"]
                    }
                }),
                media_type="application/json"
            )
        
        # Return result
        return Response(
            content=json.dumps({
                "id": request_id,
                "result": result
            }),
            media_type="application/json"
        )
    except Exception as e:
        logger.exception(f"Error executing tool {tool}")
        return Response(
            content=json.dumps({
                "id": request_id,
                "error": {
                    "type": "internal_error",
                    "message": str(e)
                }
            }),
            media_type="application/json"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8020)
```

## 2. Integration with Nexus MCP Hub

### 2.1 Register the Benchmark Server

```python
# In nexus/src/server_registry.py

def register_benchmark_server():
    """Register the benchmark server with the Nexus MCP Hub."""
    server_config = {
        "id": "mcp-benchmark-server",
        "name": "MCP Benchmark Server",
        "description": "Server for running benchmarks against agents",
        "url": "http://localhost:8020",
        "type": "http",
        "tools": [
            "run_benchmark",
            "get_benchmark_result",
            "list_benchmarks",
            "compare_benchmark_results"
        ]
    }
    
    # Register the server
    registry.register_server(server_config["id"], server_config)
    
    logger.info(f"Registered benchmark server: {server_config['id']}")
```

### 2.2 Client Integration

```typescript
// In src/agents/CodingAgent.ts

/**
 * Run benchmarks against the Coding Agent
 */
async runBenchmarks(options: BenchmarkOptions = {}): Promise<BenchmarkResults> {
  const benchmarkServer = options.benchmarkServer || "mcp-benchmark-server";
  const benchmarks = options.benchmarks || ["humaneval"];
  
  const results: BenchmarkResults = {
    timestamp: new Date().toISOString(),
    agent: this.getName(),
    benchmarks: {}
  };
  
  for (const benchmark of benchmarks) {
    try {
      // Run the benchmark using the MCP Benchmark Server
      const benchmarkResult = await this.nexusClient.callTool("run_benchmark", {
        benchmark_id: benchmark,
        agent_url: options.agentUrl || "http://localhost:8000",
        agent_id: this.getId(),
        options: options.benchmarkOptions?.[benchmark] || {}
      }, benchmarkServer);
      
      results.benchmarks[benchmark] = benchmarkResult;
    } catch (error) {
      console.error(`Error running benchmark ${benchmark}:`, error);
      results.benchmarks[benchmark] = { error: String(error) };
    }
  }
  
  // Save benchmark results
  await this.saveBenchmarkResults(results);
  
  return results;
}
```

## 3. Running Benchmarks

### 3.1 Command Line Interface

```python
# src/cli.py

import argparse
import asyncio
import json
import logging
from typing import Dict, Any, List

from utils.mcp_client import MCPClient

logger = logging.getLogger("mcp-benchmark-cli")

async def run_benchmark(args):
    """Run a benchmark against an agent."""
    client = MCPClient(args.benchmark_server)
    
    # Run the benchmark
    result = await client.call_tool("run_benchmark", {
        "benchmark_id": args.benchmark,
        "agent_url": args.agent_url,
        "agent_id": args.agent_id,
        "options": json.loads(args.options) if args.options else {}
    })
    
    # Print the result
    print(json.dumps(result, indent=2))
    
    return result

async def list_benchmarks(args):
    """List available benchmarks."""
    client = MCPClient(args.benchmark_server)
    
    # List benchmarks
    result = await client.call_tool("list_benchmarks", {})
    
    # Print the result
    print(json.dumps(result, indent=2))
    
    return result

async def get_benchmark_result(args):
    """Get a benchmark result."""
    client = MCPClient(args.benchmark_server)
    
    # Get the result
    result = await client.call_tool("get_benchmark_result", {
        "benchmark_id": args.benchmark,
        "result_id": args.result_id
    })
    
    # Print the result
    print(json.dumps(result, indent=2))
    
    return result

async def compare_benchmark_results(args):
    """Compare benchmark results."""
    client = MCPClient(args.benchmark_server)
    
    # Compare results
    result = await client.call_tool("compare_benchmark_results", {
        "benchmark_id": args.benchmark,
        "result_ids": args.result_ids.split(",")
    })
    
    # Print the result
    print(json.dumps(result, indent=2))
    
    return result

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="MCP Benchmark CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # Run benchmark command
    run_parser = subparsers.add_parser("run", help="Run a benchmark")
    run_parser.add_argument("benchmark", help="Benchmark ID")
    run_parser.add_argument("agent_url", help="Agent URL")
    run_parser.add_argument("--agent-id", help="Agent ID")
    run_parser.add_argument("--options", help="Benchmark options (JSON)")
    run_parser.add_argument("--benchmark-server", default="http://localhost:8020", help="Benchmark server URL")
    
    # List benchmarks command
    list_parser = subparsers.add_parser("list", help="List available benchmarks")
    list_parser.add_argument("--benchmark-server", default="http://localhost:8020", help="Benchmark server URL")
    
    # Get benchmark result command
    get_parser = subparsers.add_parser("get", help="Get a benchmark result")
    get_parser.add_argument("benchmark", help="Benchmark ID")
    get_parser.add_argument("result_id", help="Result ID")
    get_parser.add_argument("--benchmark-server", default="http://localhost:8020", help="Benchmark server URL")
    
    # Compare benchmark results command
    compare_parser = subparsers.add_parser("compare", help="Compare benchmark results")
    compare_parser.add_argument("benchmark", help="Benchmark ID")
    compare_parser.add_argument("result_ids", help="Comma-separated list of result IDs")
    compare_parser.add_argument("--benchmark-server", default="http://localhost:8020", help="Benchmark server URL")
    
    args = parser.parse_args()
    
    # Run the command
    if args.command == "run":
        asyncio.run(run_benchmark(args))
    elif args.command == "list":
        asyncio.run(list_benchmarks(args))
    elif args.command == "get":
        asyncio.run(get_benchmark_result(args))
    elif args.command == "compare":
        asyncio.run(compare_benchmark_results(args))
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
```

### 3.2 Example Usage

```bash
# List available benchmarks
python src/cli.py list

# Run HumanEval benchmark
python src/cli.py run humaneval http://localhost:8000 --agent-id coding-agent-v1

# Get benchmark result
python src/cli.py get humaneval coding-agent-v1_2023-05-14T12:34:56.789Z

# Compare benchmark results
python src/cli.py compare humaneval coding-agent-v1_2023-05-14T12:34:56.789Z,coding-agent-v2_2023-05-15T12:34:56.789Z
```

## 4. Next Steps

1. **Implement Remaining Benchmarks**
   - Complete the implementation of CodeXGLUE, τ-bench, AgentBench, and MLE-bench
   - Ensure consistent interface across all benchmarks

2. **Enhance Result Analysis**
   - Implement more sophisticated analysis of benchmark results
   - Create visualizations for benchmark comparisons

3. **Integrate with CI/CD Pipeline**
   - Set up automated benchmark runs for new agent versions
   - Create dashboards for tracking benchmark performance over time

4. **Expand Benchmark Coverage**
   - Add more benchmarks as they become available
   - Create custom benchmarks for specific agent capabilities
