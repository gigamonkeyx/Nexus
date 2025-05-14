#!/usr/bin/env python3
"""
MCP Mock Server - A configurable mock server for simulating MCP responses.
This server can be configured to return specific responses for MCP requests,
making it useful for testing MCP clients without requiring a real model.
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
logger = logging.getLogger("mcp-mock-server")

# Create FastAPI app
app = FastAPI(title="MCP Mock Server", description="A configurable mock server for MCP testing")

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

class MockConfig(BaseModel):
    tool: str
    response: Dict[str, Any]
    parameters_matcher: Optional[Dict[str, Any]] = None
    delay_ms: Optional[int] = None
    error_rate: Optional[float] = 0.0

# In-memory storage for mock configurations
mock_configs = []
request_history = []

# Mock server management functions
def add_mock_config(config: MockConfig):
    """Add a mock configuration to the server."""
    mock_configs.append(config)

def clear_mock_configs():
    """Clear all mock configurations."""
    mock_configs.clear()

def get_matching_config(request: MCPRequest) -> Optional[MockConfig]:
    """Find a matching mock configuration for the request."""
    for config in mock_configs:
        if config.tool == request.tool:
            # If there's a parameters matcher, check if it matches
            if config.parameters_matcher:
                # Simple matching logic - could be enhanced for more complex matching
                matches = True
                for key, value in config.parameters_matcher.items():
                    if key not in request.parameters or request.parameters[key] != value:
                        matches = False
                        break
                
                if matches:
                    return config
            else:
                # If there's no parameters matcher, just match on the tool
                return config
    
    return None

@app.post("/")
async def handle_mcp_request(request: MCPRequest):
    """Handle MCP requests according to the mock configuration."""
    request_id = request.id or str(uuid.uuid4())
    
    # Record the request
    request_record = {
        "timestamp": datetime.now().isoformat(),
        "request": request.dict()
    }
    request_history.append(request_record)
    
    # Find a matching mock configuration
    config = get_matching_config(request)
    
    if not config:
        # No matching configuration found
        logger.warning(f"No mock configuration found for tool: {request.tool}")
        return MCPResponse(
            id=request_id,
            result={},
            error={
                "type": "tool_not_found",
                "message": f"No mock configuration found for tool: {request.tool}"
            }
        )
    
    # Apply delay if configured
    if config.delay_ms:
        await asyncio.sleep(config.delay_ms / 1000.0)
    
    # Apply error rate if configured
    if config.error_rate and config.error_rate > 0:
        import random
        if random.random() < config.error_rate:
            return MCPResponse(
                id=request_id,
                result={},
                error={
                    "type": "simulated_error",
                    "message": "Simulated error from mock server"
                }
            )
    
    # Return the configured response
    if "error" in config.response:
        return MCPResponse(
            id=request_id,
            result={},
            error=config.response["error"]
        )
    else:
        return MCPResponse(
            id=request_id,
            result=config.response.get("result", {})
        )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/config")
async def get_config():
    """Get the current mock configuration."""
    return {"configs": mock_configs}

@app.post("/config")
async def set_config(config: MockConfig):
    """Set a mock configuration."""
    add_mock_config(config)
    return {"status": "success", "config": config}

@app.delete("/config")
async def clear_config():
    """Clear all mock configurations."""
    clear_mock_configs()
    return {"status": "success"}

@app.get("/history")
async def get_history():
    """Get the request history."""
    return {"history": request_history}

@app.delete("/history")
async def clear_history():
    """Clear the request history."""
    request_history.clear()
    return {"status": "success"}

@app.post("/load_config")
async def load_config_from_file(file_path: str):
    """Load mock configurations from a JSON file."""
    try:
        with open(file_path, "r") as f:
            configs = json.load(f)
        
        clear_mock_configs()
        for config in configs:
            add_mock_config(MockConfig(**config))
        
        return {"status": "success", "configs_loaded": len(configs)}
    except Exception as e:
        logger.exception(f"Error loading config from file: {file_path}")
        raise HTTPException(status_code=400, detail=f"Error loading config: {str(e)}")

@app.post("/save_config")
async def save_config_to_file(file_path: str):
    """Save current mock configurations to a JSON file."""
    try:
        configs = [config.dict() for config in mock_configs]
        with open(file_path, "w") as f:
            json.dump(configs, f, indent=2)
        
        return {"status": "success", "configs_saved": len(configs)}
    except Exception as e:
        logger.exception(f"Error saving config to file: {file_path}")
        raise HTTPException(status_code=400, detail=f"Error saving config: {str(e)}")

# Example mock configurations
DEFAULT_CONFIGS = [
    MockConfig(
        tool="hello_world",
        response={"result": {"message": "Hello, world!"}},
        delay_ms=100
    ),
    MockConfig(
        tool="echo",
        response={"result": {"echo": "parameters.message"}},
        parameters_matcher={"message": "hello"}
    ),
    MockConfig(
        tool="error_example",
        response={"error": {"type": "example_error", "message": "This is an example error"}},
        error_rate=1.0
    )
]

def load_default_configs():
    """Load default mock configurations."""
    clear_mock_configs()
    for config in DEFAULT_CONFIGS:
        add_mock_config(config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCP Mock Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8030, help="Port to bind to")
    parser.add_argument("--config", help="Path to configuration file")
    
    args = parser.parse_args()
    
    # Load configuration
    if args.config:
        try:
            with open(args.config, "r") as f:
                configs = json.load(f)
            
            for config in configs:
                add_mock_config(MockConfig(**config))
            
            logger.info(f"Loaded {len(configs)} mock configurations from {args.config}")
        except Exception as e:
            logger.error(f"Error loading config from {args.config}: {e}")
            logger.info("Loading default configurations")
            load_default_configs()
    else:
        logger.info("No configuration file provided, loading default configurations")
        load_default_configs()
    
    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port)
