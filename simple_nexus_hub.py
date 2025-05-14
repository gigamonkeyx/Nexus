#!/usr/bin/env python3
"""
Simple Nexus Hub for testing MCP servers.
"""

import os
import sys
import json
import logging
import asyncio
import subprocess
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("simple_nexus_hub")

# Create FastAPI app
app = FastAPI(
    title="Simple Nexus Hub",
    description="A simple Nexus Hub for testing MCP servers",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
servers = {}
server_processes = {}
api_key = "nexus-api-key"

# Authentication dependency
def verify_api_key(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing API key")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    
    token = authorization.replace("Bearer ", "")
    
    if token != api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return token

# API routes

@app.get("/api/hub/status")
async def get_hub_status():
    """Get the status of the hub."""
    return {
        "running": True,
        "servers": len(servers),
        "clients": 0,
    }

@app.post("/api/servers")
async def register_server(server: Dict[str, Any], token: str = Depends(verify_api_key)):
    """Register a server with the hub."""
    server_id = server.get("id")
    if not server_id:
        raise HTTPException(status_code=400, detail="Missing server ID")
    
    config = server.get("config", {})
    
    servers[server_id] = {
        "id": server_id,
        "config": config,
        "running": False,
        "connected": False,
    }
    
    logger.info(f"Registered server: {server_id}")
    
    return {
        "success": True,
        "id": server_id,
    }

@app.get("/api/servers")
async def get_servers(token: str = Depends(verify_api_key)):
    """Get all registered servers."""
    return servers

@app.get("/api/servers/{server_id}")
async def get_server(server_id: str, token: str = Depends(verify_api_key)):
    """Get a specific server."""
    if server_id not in servers:
        raise HTTPException(status_code=404, detail=f"Server not found: {server_id}")
    
    return servers[server_id]

@app.post("/api/servers/{server_id}/connect")
async def connect_server(server_id: str, token: str = Depends(verify_api_key)):
    """Connect to a server."""
    if server_id not in servers:
        raise HTTPException(status_code=404, detail=f"Server not found: {server_id}")
    
    server = servers[server_id]
    config = server.get("config", {})
    
    command = config.get("command")
    args = config.get("args", [])
    
    if not command:
        raise HTTPException(status_code=400, detail="Missing server command")
    
    # Start the server process
    try:
        logger.info(f"Starting server: {server_id}")
        logger.info(f"Command: {command} {' '.join(args)}")
        
        process = subprocess.Popen(
            [command] + args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        
        server_processes[server_id] = process
        
        # Update server status
        servers[server_id]["running"] = True
        servers[server_id]["connected"] = True
        
        logger.info(f"Connected to server: {server_id}")
        
        return {
            "success": True,
            "id": server_id,
        }
    except Exception as e:
        logger.error(f"Error connecting to server: {e}")
        raise HTTPException(status_code=500, detail=f"Error connecting to server: {e}")

@app.post("/api/servers/{server_id}/tools/{tool_name}")
async def call_server_tool(
    server_id: str,
    tool_name: str,
    request: Request,
    token: str = Depends(verify_api_key),
):
    """Call a tool on a server."""
    if server_id not in servers:
        raise HTTPException(status_code=404, detail=f"Server not found: {server_id}")
    
    server = servers[server_id]
    
    if not server.get("connected"):
        raise HTTPException(status_code=400, detail=f"Server not connected: {server_id}")
    
    # Get the request body
    body = await request.json()
    
    # In a real implementation, this would call the tool on the server
    # For this simple example, we'll just return a mock response
    
    logger.info(f"Calling tool {tool_name} on server {server_id}")
    logger.info(f"Parameters: {json.dumps(body)}")
    
    if tool_name == "format_code":
        return {
            "formatted_code": body.get("code", ""),
            "language": body.get("language", ""),
        }
    elif tool_name == "analyze_code":
        return {
            "issues": ["Mock issue 1", "Mock issue 2"],
            "suggestions": ["Mock suggestion 1", "Mock suggestion 2"],
            "language": body.get("language", ""),
        }
    elif tool_name == "generate_docstring":
        return {
            "docstring": '"""Mock docstring."""',
            "language": body.get("language", ""),
            "style": body.get("style", "google"),
        }
    else:
        raise HTTPException(status_code=404, detail=f"Tool not found: {tool_name}")

@app.get("/api/servers/{server_id}/resources/{resource_path:path}")
async def get_server_resource(
    server_id: str,
    resource_path: str,
    token: str = Depends(verify_api_key),
):
    """Get a resource from a server."""
    if server_id not in servers:
        raise HTTPException(status_code=404, detail=f"Server not found: {server_id}")
    
    server = servers[server_id]
    
    if not server.get("connected"):
        raise HTTPException(status_code=400, detail=f"Server not connected: {server_id}")
    
    # In a real implementation, this would get the resource from the server
    # For this simple example, we'll just return a mock response
    
    logger.info(f"Getting resource {resource_path} from server {server_id}")
    
    if resource_path.startswith("examples/"):
        language = resource_path.split("/")[-1]
        return f"Mock code examples for {language}"
    else:
        raise HTTPException(status_code=404, detail=f"Resource not found: {resource_path}")

@app.post("/api/auth/login")
async def login(request: Request):
    """Login to the hub."""
    body = await request.json()
    credentials = body.get("credentials", {})
    
    username = credentials.get("username")
    password = credentials.get("password")
    
    if username == "admin" and password == "password":
        return {
            "token": api_key,
            "user": {
                "username": username,
                "name": "Administrator",
                "email": "admin@example.com",
            },
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting Simple Nexus Hub on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
