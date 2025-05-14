#!/usr/bin/env python3
"""
MCP Client Connection for Nexus MCP Hub.

This module provides the connection management for MCP clients.
It handles the lifecycle of client connections and message routing.
"""

import logging
import asyncio
import json
import time
import uuid
from typing import Dict, List, Optional, Any, Set, Union

from .interface import McpClientInterface
from ..protocol import Transport, StdioTransport, HttpSseTransport
from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class McpClientConnection:
    """Manages the connection to an MCP client."""
    
    def __init__(self, transport: Transport):
        """
        Initialize the MCP client connection.
        
        Args:
            transport: Transport to use for communication
        """
        self.config = get_config_manager()
        self.client_id = str(uuid.uuid4())
        self.transport = transport
        self.interface = McpClientInterface(self.client_id, transport)
        self.connected = False
        self.initialized = False
        self.connect_time = None
        self.disconnect_time = None
        self.servers = set()  # Set of connected server IDs
        self.status = "disconnected"
        self.error = None
        
        logger.info(f"Created MCP client connection: {self.client_id}")
    
    async def connect(self) -> bool:
        """
        Connect to the client.
        
        Returns:
            True if the connection was successful, False otherwise
        """
        if self.connected:
            logger.warning(f"MCP client {self.client_id} is already connected")
            return True
        
        logger.info(f"Connecting to MCP client: {self.client_id}")
        self.status = "connecting"
        
        try:
            # Connect the interface
            if not await self.interface.connect():
                self.status = "connection_failed"
                self.error = "Failed to connect to client"
                return False
            
            self.connected = True
            self.connect_time = time.time()
            self.status = "connected"
            
            logger.info(f"Connected to MCP client: {self.client_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP client {self.client_id}: {e}")
            self.status = "connection_failed"
            self.error = str(e)
            return False
    
    async def disconnect(self) -> None:
        """Disconnect from the client."""
        if not self.connected:
            logger.warning(f"MCP client {self.client_id} is not connected")
            return
        
        logger.info(f"Disconnecting from MCP client: {self.client_id}")
        self.status = "disconnecting"
        
        try:
            # Disconnect the interface
            await self.interface.disconnect()
            
            self.connected = False
            self.initialized = False
            self.disconnect_time = time.time()
            self.status = "disconnected"
            
            logger.info(f"Disconnected from MCP client: {self.client_id}")
        except Exception as e:
            logger.error(f"Error disconnecting from MCP client {self.client_id}: {e}")
            self.status = "error"
            self.error = str(e)
    
    def add_server(self, server_id: str) -> None:
        """
        Add a server to the client.
        
        Args:
            server_id: Server ID
        """
        self.servers.add(server_id)
        logger.debug(f"Added server {server_id} to MCP client {self.client_id}")
    
    def remove_server(self, server_id: str) -> None:
        """
        Remove a server from the client.
        
        Args:
            server_id: Server ID
        """
        self.servers.discard(server_id)
        logger.debug(f"Removed server {server_id} from MCP client {self.client_id}")
    
    def has_server(self, server_id: str) -> bool:
        """
        Check if a server is connected to the client.
        
        Args:
            server_id: Server ID
            
        Returns:
            True if the server is connected, False otherwise
        """
        return server_id in self.servers
    
    def get_server_count(self) -> int:
        """
        Get the number of connected servers.
        
        Returns:
            Number of connected servers
        """
        return len(self.servers)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get the client status.
        
        Returns:
            Client status information
        """
        status = {
            "id": self.client_id,
            "connected": self.connected,
            "initialized": self.initialized,
            "status": self.status,
            "server_count": len(self.servers),
            "servers": list(self.servers),
            "connect_time": self.connect_time,
            "disconnect_time": self.disconnect_time,
        }
        
        if self.error:
            status["error"] = self.error
        
        if self.initialized:
            status["capabilities"] = self.interface.client_capabilities
            status["client_info"] = self.interface.client_info
        
        return status
    
    async def notify_resource_updated(self, uri: str) -> None:
        """
        Notify the client that a resource has been updated.
        
        Args:
            uri: Resource URI
        """
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return
        
        await self.interface.notify_resource_updated(uri)
    
    async def notify_resources_changed(self) -> None:
        """Notify the client that the list of resources has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return
        
        await self.interface.notify_resources_changed()
    
    async def notify_tools_changed(self) -> None:
        """Notify the client that the list of tools has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return
        
        await self.interface.notify_tools_changed()
    
    async def notify_prompts_changed(self) -> None:
        """Notify the client that the list of prompts has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return
        
        await self.interface.notify_prompts_changed()
    
    async def sample(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Request a sample from the client.
        
        Args:
            request: Sampling request
            
        Returns:
            Sampling result, or None if the sampling failed
        """
        if not self.initialized:
            logger.warning(f"Cannot sample from client {self.client_id}: not initialized")
            return None
        
        return await self.interface.sample(request)
