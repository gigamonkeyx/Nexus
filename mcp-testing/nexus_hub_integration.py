#!/usr/bin/env python3
"""
Nexus Hub Integration for MCP Testing Tools.
This script registers the MCP testing tools with your Nexus Hub.
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("nexus-hub-integration")

class NexusHubClient:
    """Client for interacting with Nexus Hub."""
    
    def __init__(self, hub_url: str):
        """
        Initialize the Nexus Hub Client.
        
        Args:
            hub_url: URL of the Nexus Hub
        """
        self.hub_url = hub_url
        self.client = httpx.AsyncClient()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def register_server(self, server_id: str, server_url: str, server_type: str) -> Dict[str, Any]:
        """
        Register a server with Nexus Hub.
        
        Args:
            server_id: ID of the server
            server_url: URL of the server
            server_type: Type of the server
        
        Returns:
            The registration response
        """
        request_data = {
            "tool": "register_server",
            "parameters": {
                "id": server_id,
                "url": server_url,
                "type": server_type
            },
            "id": "register-" + server_id
        }
        
        try:
            response = await self.client.post(
                self.hub_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            return response.json()
        except Exception as e:
            logger.exception(f"Error registering server with Nexus Hub")
            return {"error": {"type": "client_error", "message": str(e)}}
    
    async def get_servers(self) -> Dict[str, Any]:
        """
        Get the list of servers registered with Nexus Hub.
        
        Returns:
            The list of servers
        """
        request_data = {
            "tool": "list_servers",
            "parameters": {},
            "id": "list-servers"
        }
        
        try:
            response = await self.client.post(
                self.hub_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            return response.json()
        except Exception as e:
            logger.exception(f"Error getting servers from Nexus Hub")
            return {"error": {"type": "client_error", "message": str(e)}}

async def register_testing_tools(hub_url: str, test_server_url: str, mock_server_url: str) -> bool:
    """
    Register MCP testing tools with Nexus Hub.
    
    Args:
        hub_url: URL of the Nexus Hub
        test_server_url: URL of the MCP Test Server
        mock_server_url: URL of the MCP Mock Server
    
    Returns:
        True if registration was successful, False otherwise
    """
    client = NexusHubClient(hub_url)
    
    try:
        # Register MCP Test Server
        logger.info(f"Registering MCP Test Server with Nexus Hub...")
        test_server_response = await client.register_server(
            "mcp-test-server",
            test_server_url,
            "testing"
        )
        
        if "error" in test_server_response:
            logger.error(f"Error registering MCP Test Server: {test_server_response['error']}")
            return False
        
        logger.info(f"MCP Test Server registered successfully")
        
        # Register MCP Mock Server
        logger.info(f"Registering MCP Mock Server with Nexus Hub...")
        mock_server_response = await client.register_server(
            "mcp-mock-server",
            mock_server_url,
            "testing"
        )
        
        if "error" in mock_server_response:
            logger.error(f"Error registering MCP Mock Server: {mock_server_response['error']}")
            return False
        
        logger.info(f"MCP Mock Server registered successfully")
        
        # Get the list of servers
        servers_response = await client.get_servers()
        
        if "error" in servers_response:
            logger.error(f"Error getting servers: {servers_response['error']}")
            return False
        
        servers = servers_response.get("result", {}).get("servers", {})
        logger.info(f"Registered servers: {', '.join(servers.keys())}")
        
        return True
    finally:
        await client.close()

async def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Nexus Hub Integration for MCP Testing Tools")
    parser.add_argument("--hub-url", default="http://localhost:8000", help="URL of the Nexus Hub")
    parser.add_argument("--test-server-url", default="http://localhost:8020", help="URL of the MCP Test Server")
    parser.add_argument("--mock-server-url", default="http://localhost:8030", help="URL of the MCP Mock Server")
    
    args = parser.parse_args()
    
    success = await register_testing_tools(
        args.hub_url,
        args.test_server_url,
        args.mock_server_url
    )
    
    if success:
        logger.info("MCP testing tools registered successfully with Nexus Hub")
        return 0
    else:
        logger.error("Failed to register MCP testing tools with Nexus Hub")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
