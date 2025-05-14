#!/usr/bin/env python3
"""
Client Protocol implementation for Nexus MCP Hub.

This module provides the client-side protocol implementation for the Model Context Protocol (MCP).
It handles client initialization, capability negotiation, and message exchange.
"""

import logging
import asyncio
import json
from typing import Dict, List, Optional, Any, Set

from .base import Protocol, Request, Response, Notification, Error, ErrorCode
from .transport import Transport

# Setup logging
logger = logging.getLogger(__name__)

class ClientProtocol(Protocol):
    """MCP client protocol implementation."""
    
    def __init__(self, transport: Transport):
        """
        Initialize the client protocol.
        
        Args:
            transport: Transport to use for communication
        """
        super().__init__()
        self.transport = transport
        self.transport.set_message_handler(self.handle_message)
        self.initialized = False
        self.server_capabilities = {}
        self.client_capabilities = {}
        self.server_info = {}
    
    async def _send_message(self, message: str) -> None:
        """
        Send a message through the transport.
        
        Args:
            message: Message to send
        """
        await self.transport.send_message(message)
    
    async def connect(self) -> None:
        """
        Connect to the server.
        
        This method establishes the transport connection and initializes the protocol.
        """
        # Connect the transport
        await self.transport.connect()
        
        # Start the message loop
        asyncio.create_task(self.transport.run())
        
        logger.info("Client protocol connected")
    
    async def disconnect(self) -> None:
        """
        Disconnect from the server.
        
        This method closes the transport connection.
        """
        # Disconnect the transport
        await self.transport.disconnect()
        
        # Reset state
        self.initialized = False
        self.server_capabilities = {}
        self.server_info = {}
        
        logger.info("Client protocol disconnected")
    
    async def initialize(self, client_name: str, client_version: str, capabilities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Initialize the protocol.
        
        Args:
            client_name: Client name
            client_version: Client version
            capabilities: Client capabilities
            
        Returns:
            Server initialization response
        """
        if self.initialized:
            logger.warning("Protocol already initialized")
            return self.server_info
        
        logger.info(f"Initializing client protocol: {client_name} {client_version}")
        
        # Store client capabilities
        self.client_capabilities = capabilities
        
        # Send initialize request
        result = await self.send_request("initialize", {
            "clientInfo": {
                "name": client_name,
                "version": client_version
            },
            "capabilities": capabilities
        })
        
        # Store server information and capabilities
        self.server_info = result
        self.server_capabilities = result.get("capabilities", {})
        
        # Send initialized notification
        await self.send_notification("initialized", {})
        
        self.initialized = True
        logger.info(f"Client protocol initialized: {client_name} {client_version}")
        
        return result
    
    def has_capability(self, capability_path: str) -> bool:
        """
        Check if the server has a specific capability.
        
        Args:
            capability_path: Dot-separated path to the capability
            
        Returns:
            True if the server has the capability, False otherwise
        """
        if not self.initialized:
            return False
        
        # Navigate the capability path
        parts = capability_path.split(".")
        current = self.server_capabilities
        
        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return False
            current = current[part]
        
        return True
    
    async def shutdown(self) -> None:
        """
        Shut down the protocol.
        
        This method sends a shutdown request to the server.
        """
        if not self.initialized:
            logger.warning("Protocol not initialized")
            return
        
        logger.info("Shutting down client protocol")
        
        try:
            # Send shutdown request
            await self.send_request("shutdown", {})
            
            # Send exit notification
            await self.send_notification("exit", {})
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
        finally:
            # Reset state
            self.initialized = False
            self.server_capabilities = {}
            self.server_info = {}
    
    # Resource methods
    
    async def list_resources(self) -> List[Dict[str, Any]]:
        """
        List available resources.
        
        Returns:
            List of resources
        """
        if not self.has_capability("resources"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resources")
        
        result = await self.send_request("resources/list", {})
        return result.get("resources", [])
    
    async def read_resource(self, uri: str) -> List[Dict[str, Any]]:
        """
        Read a resource.
        
        Args:
            uri: Resource URI
            
        Returns:
            Resource contents
        """
        if not self.has_capability("resources"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resources")
        
        result = await self.send_request("resources/read", {
            "uri": uri
        })
        return result.get("contents", [])
    
    async def subscribe_resource(self, uri: str) -> None:
        """
        Subscribe to resource updates.
        
        Args:
            uri: Resource URI
        """
        if not self.has_capability("resources.subscriptions"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resource subscriptions")
        
        await self.send_request("resources/subscribe", {
            "uri": uri
        })
    
    async def unsubscribe_resource(self, uri: str) -> None:
        """
        Unsubscribe from resource updates.
        
        Args:
            uri: Resource URI
        """
        if not self.has_capability("resources.subscriptions"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resource subscriptions")
        
        await self.send_request("resources/unsubscribe", {
            "uri": uri
        })
    
    # Tool methods
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """
        List available tools.
        
        Returns:
            List of tools
        """
        if not self.has_capability("tools"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support tools")
        
        result = await self.send_request("tools/list", {})
        return result.get("tools", [])
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a tool.
        
        Args:
            name: Tool name
            arguments: Tool arguments
            
        Returns:
            Tool result
        """
        if not self.has_capability("tools"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support tools")
        
        return await self.send_request("tools/call", {
            "name": name,
            "arguments": arguments
        })
    
    # Prompt methods
    
    async def list_prompts(self) -> List[Dict[str, Any]]:
        """
        List available prompts.
        
        Returns:
            List of prompts
        """
        if not self.has_capability("prompts"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support prompts")
        
        result = await self.send_request("prompts/list", {})
        return result.get("prompts", [])
    
    async def get_prompt(self, id: str) -> Dict[str, Any]:
        """
        Get a prompt.
        
        Args:
            id: Prompt ID
            
        Returns:
            Prompt details
        """
        if not self.has_capability("prompts"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support prompts")
        
        return await self.send_request("prompts/get", {
            "id": id
        })
    
    # Sampling methods
    
    async def sample(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sample from the model.
        
        Args:
            request: Sampling request
            
        Returns:
            Sampling result
        """
        if not self.has_capability("sampling"):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Client does not support sampling")
        
        return await self.send_request("sampling/sample", request)
