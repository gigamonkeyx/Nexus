#!/usr/bin/env python3
"""
MCP Server Connection for Nexus MCP Hub.

This module provides the connection management for MCP servers.
It handles the lifecycle of server connections and message routing.
"""

import logging
import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Set, Union

from .interface import McpServerInterface
from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class McpServerConnection:
    """Manages the connection to an MCP server."""
    
    def __init__(self, server_id: str, server_config: Dict[str, Any]):
        """
        Initialize the MCP server connection.
        
        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration
        """
        self.config = get_config_manager()
        self.server_id = server_id
        self.server_config = server_config
        self.interface = McpServerInterface(server_id, server_config)
        self.connected = False
        self.initialized = False
        self.connect_time = None
        self.disconnect_time = None
        self.clients = set()  # Set of connected client IDs
        self.status = "disconnected"
        self.error = None
        
        logger.info(f"Created MCP server connection for {server_id}")
    
    async def connect(self) -> bool:
        """
        Connect to the server.
        
        Returns:
            True if the connection was successful, False otherwise
        """
        if self.connected:
            logger.warning(f"MCP server {self.server_id} is already connected")
            return True
        
        logger.info(f"Connecting to MCP server: {self.server_id}")
        self.status = "connecting"
        
        try:
            # Connect the interface
            if not await self.interface.connect():
                self.status = "connection_failed"
                self.error = "Failed to connect to server"
                return False
            
            self.connected = True
            self.connect_time = time.time()
            self.status = "connected"
            
            logger.info(f"Connected to MCP server: {self.server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP server {self.server_id}: {e}")
            self.status = "connection_failed"
            self.error = str(e)
            return False
    
    async def initialize(self) -> bool:
        """
        Initialize the server.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        if not self.connected:
            logger.warning(f"MCP server {self.server_id} is not connected")
            return False
        
        if self.initialized:
            logger.warning(f"MCP server {self.server_id} is already initialized")
            return True
        
        logger.info(f"Initializing MCP server: {self.server_id}")
        self.status = "initializing"
        
        try:
            # Initialize the interface
            if not await self.interface.initialize():
                self.status = "initialization_failed"
                self.error = "Failed to initialize server"
                return False
            
            self.initialized = True
            self.status = "ready"
            
            logger.info(f"Initialized MCP server: {self.server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize MCP server {self.server_id}: {e}")
            self.status = "initialization_failed"
            self.error = str(e)
            return False
    
    async def disconnect(self) -> None:
        """Disconnect from the server."""
        if not self.connected:
            logger.warning(f"MCP server {self.server_id} is not connected")
            return
        
        logger.info(f"Disconnecting from MCP server: {self.server_id}")
        self.status = "disconnecting"
        
        try:
            # Disconnect the interface
            await self.interface.disconnect()
            
            self.connected = False
            self.initialized = False
            self.disconnect_time = time.time()
            self.status = "disconnected"
            
            logger.info(f"Disconnected from MCP server: {self.server_id}")
        except Exception as e:
            logger.error(f"Error disconnecting from MCP server {self.server_id}: {e}")
            self.status = "error"
            self.error = str(e)
    
    async def reconnect(self) -> bool:
        """
        Reconnect to the server.
        
        Returns:
            True if the reconnection was successful, False otherwise
        """
        logger.info(f"Reconnecting to MCP server: {self.server_id}")
        
        # Disconnect if connected
        if self.connected:
            await self.disconnect()
        
        # Connect and initialize
        if await self.connect():
            return await self.initialize()
        
        return False
    
    def add_client(self, client_id: str) -> None:
        """
        Add a client to the server.
        
        Args:
            client_id: Client ID
        """
        self.clients.add(client_id)
        logger.debug(f"Added client {client_id} to MCP server {self.server_id}")
    
    def remove_client(self, client_id: str) -> None:
        """
        Remove a client from the server.
        
        Args:
            client_id: Client ID
        """
        self.clients.discard(client_id)
        logger.debug(f"Removed client {client_id} from MCP server {self.server_id}")
    
    def has_client(self, client_id: str) -> bool:
        """
        Check if a client is connected to the server.
        
        Args:
            client_id: Client ID
            
        Returns:
            True if the client is connected, False otherwise
        """
        return client_id in self.clients
    
    def get_client_count(self) -> int:
        """
        Get the number of connected clients.
        
        Returns:
            Number of connected clients
        """
        return len(self.clients)
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get the server status.
        
        Returns:
            Server status information
        """
        status = {
            "id": self.server_id,
            "name": self.server_config.get("name", self.server_id),
            "connected": self.connected,
            "initialized": self.initialized,
            "status": self.status,
            "client_count": len(self.clients),
            "connect_time": self.connect_time,
            "disconnect_time": self.disconnect_time,
        }
        
        if self.error:
            status["error"] = self.error
        
        if self.initialized:
            status["capabilities"] = self.interface.capabilities
            status["resources"] = len(self.interface.resources)
            status["tools"] = len(self.interface.tools)
            status["prompts"] = len(self.interface.prompts)
        
        return status
    
    async def get_resource(self, uri: str) -> Optional[Dict[str, Any]]:
        """
        Get a resource from the server.
        
        Args:
            uri: Resource URI
            
        Returns:
            Resource contents, or None if not found
        """
        if not self.initialized:
            logger.warning(f"MCP server {self.server_id} is not initialized")
            return None
        
        return await self.interface.get_resource(uri)
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call a tool on the server.
        
        Args:
            name: Tool name
            arguments: Tool arguments
            
        Returns:
            Tool result, or None if the call failed
        """
        if not self.initialized:
            logger.warning(f"MCP server {self.server_id} is not initialized")
            return None
        
        return await self.interface.call_tool(name, arguments)
    
    async def get_prompt(self, id: str) -> Optional[Dict[str, Any]]:
        """
        Get a prompt from the server.
        
        Args:
            id: Prompt ID
            
        Returns:
            Prompt details, or None if not found
        """
        if not self.initialized:
            logger.warning(f"MCP server {self.server_id} is not initialized")
            return None
        
        return await self.interface.get_prompt(id)
    
    async def sample(self, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Sample from the model.
        
        Args:
            request: Sampling request
            
        Returns:
            Sampling result, or None if the sampling failed
        """
        if not self.initialized:
            logger.warning(f"MCP server {self.server_id} is not initialized")
            return None
        
        return await self.interface.sample(request)
