#!/usr/bin/env python3
"""
MCP Test Server - A specialized MCP server that provides testing tools as MCP functions.
This server implements the Model Context Protocol and provides tools for testing other MCP servers.
"""

import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mcp-test-server")

# Create FastAPI app
app = FastAPI(title="MCP Test Server", description="A server for testing MCP implementations")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MCP Protocol Models
class MCPRequest(BaseModel):
    tool: str
    parameters: Dict[str, Any] = {}
    id: Optional[str] = None

class MCPResponse(BaseModel):
    id: str
    result: Dict[str, Any]
    error: Optional[Dict[str, Any]] = None

class TestResult(BaseModel):
    passed: bool
    message: str
    details: Optional[Dict[str, Any]] = None

class TestSuite(BaseModel):
    name: str
    tests: List[Dict[str, Any]]
    results: Optional[List[TestResult]] = None

# In-memory storage for test results and test suites
test_results = {}
test_suites = {}

# MCP Testing Tools
async def validate_mcp_request(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Validates an MCP request against the specification."""
    request_data = parameters.get("request", {})
    
    # Basic validation
    validation_errors = []
    
    # Check for required fields
    if "tool" not in request_data:
        validation_errors.append("Missing required field: 'tool'")
    
    # Check types
    if "parameters" in request_data and not isinstance(request_data["parameters"], dict):
        validation_errors.append("Field 'parameters' must be an object")
    
    # Check ID format if present
    if "id" in request_data and not isinstance(request_data["id"], str):
        validation_errors.append("Field 'id' must be a string")
    
    return {
        "valid": len(validation_errors) == 0,
        "errors": validation_errors
    }

async def validate_mcp_response(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Validates an MCP response against the specification."""
    response_data = parameters.get("response", {})
    
    # Basic validation
    validation_errors = []
    
    # Check for required fields
    if "id" not in response_data:
        validation_errors.append("Missing required field: 'id'")
    
    if "result" not in response_data and "error" not in response_data:
        validation_errors.append("Response must contain either 'result' or 'error'")
    
    # Check types
    if "id" in response_data and not isinstance(response_data["id"], str):
        validation_errors.append("Field 'id' must be a string")
    
    if "result" in response_data and not isinstance(response_data["result"], dict):
        validation_errors.append("Field 'result' must be an object")
    
    if "error" in response_data and not isinstance(response_data["error"], dict):
        validation_errors.append("Field 'error' must be an object")
    
    return {
        "valid": len(validation_errors) == 0,
        "errors": validation_errors
    }

async def test_mcp_server(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Tests an MCP server by sending requests and validating responses."""
    server_url = parameters.get("server_url")
    test_requests = parameters.get("requests", [])
    
    if not server_url:
        return {"error": "Missing required parameter: server_url"}
    
    if not test_requests:
        return {"error": "No test requests provided"}
    
    results = []
    
    for i, request_data in enumerate(test_requests):
        try:
            # Send request to the server
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    server_url,
                    json=request_data,
                    headers={"Content-Type": "application/json"}
                )
                
                # Validate response
                response_data = response.json()
                validation_result = await validate_mcp_response({"response": response_data})
                
                results.append({
                    "request_index": i,
                    "request": request_data,
                    "response": response_data,
                    "status_code": response.status_code,
                    "validation": validation_result
                })
        except Exception as e:
            results.append({
                "request_index": i,
                "request": request_data,
                "error": str(e),
                "validation": {"valid": False, "errors": [str(e)]}
            })
    
    # Store test results
    test_id = str(uuid.uuid4())
    test_results[test_id] = {
        "timestamp": datetime.now().isoformat(),
        "server_url": server_url,
        "results": results
    }
    
    return {
        "test_id": test_id,
        "timestamp": datetime.now().isoformat(),
        "server_url": server_url,
        "total_tests": len(test_requests),
        "passed": sum(1 for r in results if r.get("validation", {}).get("valid", False)),
        "results": results
    }

async def create_test_suite(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Creates a test suite for MCP testing."""
    name = parameters.get("name", f"Test Suite {len(test_suites) + 1}")
    tests = parameters.get("tests", [])
    
    if not tests:
        return {"error": "No tests provided for the test suite"}
    
    suite_id = str(uuid.uuid4())
    test_suites[suite_id] = {
        "id": suite_id,
        "name": name,
        "tests": tests,
        "created_at": datetime.now().isoformat()
    }
    
    return {
        "suite_id": suite_id,
        "name": name,
        "test_count": len(tests)
    }

async def run_test_suite(parameters: Dict[str, Any]) -> Dict[str, Any]:
    """Runs a test suite against an MCP server."""
    suite_id = parameters.get("suite_id")
    server_url = parameters.get("server_url")
    
    if not suite_id:
        return {"error": "Missing required parameter: suite_id"}
    
    if not server_url:
        return {"error": "Missing required parameter: server_url"}
    
    if suite_id not in test_suites:
        return {"error": f"Test suite not found: {suite_id}"}
    
    suite = test_suites[suite_id]
    tests = suite["tests"]
    
    # Run the test suite
    test_result = await test_mcp_server({
        "server_url": server_url,
        "requests": [test["request"] for test in tests]
    })
    
    # Update the test suite with results
    run_id = test_result["test_id"]
    suite["runs"] = suite.get("runs", []) + [run_id]
    
    return {
        "suite_id": suite_id,
        "run_id": run_id,
        "name": suite["name"],
        "server_url": server_url,
        "results": test_result
    }

# Map of available tools
MCP_TOOLS = {
    "validate_mcp_request": validate_mcp_request,
    "validate_mcp_response": validate_mcp_response,
    "test_mcp_server": test_mcp_server,
    "create_test_suite": create_test_suite,
    "run_test_suite": run_test_suite,
}

@app.post("/")
async def handle_mcp_request(request: MCPRequest):
    """Handle MCP requests according to the specification."""
    request_id = request.id or str(uuid.uuid4())
    
    # Check if the requested tool exists
    if request.tool not in MCP_TOOLS:
        return MCPResponse(
            id=request_id,
            result={},
            error={
                "type": "tool_not_found",
                "message": f"Tool '{request.tool}' not found"
            }
        )
    
    try:
        # Execute the tool
        tool_func = MCP_TOOLS[request.tool]
        result = await tool_func(request.parameters)
        
        # Check if the result contains an error
        if "error" in result:
            return MCPResponse(
                id=request_id,
                result={},
                error={
                    "type": "tool_execution_error",
                    "message": result["error"]
                }
            )
        
        return MCPResponse(
            id=request_id,
            result=result
        )
    except Exception as e:
        logger.exception(f"Error executing tool {request.tool}")
        return MCPResponse(
            id=request_id,
            result={},
            error={
                "type": "internal_error",
                "message": str(e)
            }
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/tools")
async def list_tools():
    """List available MCP tools."""
    return {"tools": list(MCP_TOOLS.keys())}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCP Test Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8020, help="Port to bind to")
    
    args = parser.parse_args()
    
    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port)
