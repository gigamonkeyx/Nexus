#!/usr/bin/env python3
"""
Server Registry for Nexus MCP Hub.

This module provides functionality for managing MCP server registrations.
It handles server configuration storage and retrieval.
"""

import os
import logging
import json
from typing import Dict, List, Optional, Any, Set
import asyncio

from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class ServerRegistry:
    """
    Registry for MCP servers.
    
    This class manages the registration and configuration of MCP servers.
    It provides storage and retrieval of server metadata.
    """
    
    def __init__(self):
        """Initialize the Server Registry."""
        self.config = get_config_manager()
        self.servers = {}  # Maps server_id to server configuration
        self.capabilities = {}  # Maps server_id to server capabilities
        
        logger.info("Server Registry initialized")
    
    async def initialize(self) -> None:
        """Initialize the registry."""
        # Load server registry
        self.load(self.config.get("hub.registry_file"))
    
    def load(self, registry_file: str) -> None:
        """
        Load the server registry from file.
        
        Args:
            registry_file: Path to the registry file
        """
        if not registry_file or not os.path.exists(registry_file):
            logger.info(f"Registry file not found: {registry_file}")
            return
        
        try:
            with open(registry_file, "r") as f:
                self.servers = json.load(f)
            logger.info(f"Loaded server registry from {registry_file} ({len(self.servers)} servers)")
        except Exception as e:
            logger.error(f"Error loading server registry: {e}")
            self.servers = {}
    
    def save(self, registry_file: str) -> None:
        """
        Save the server registry to file.
        
        Args:
            registry_file: Path to the registry file
        """
        if not registry_file:
            logger.warning("No registry file specified, cannot save")
            return
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(registry_file), exist_ok=True)
            
            with open(registry_file, "w") as f:
                json.dump(self.servers, f, indent=4)
            logger.debug(f"Saved server registry to {registry_file}")
        except Exception as e:
            logger.error(f"Error saving server registry: {e}")
    
    def register_server(self, server_id: str, server_config: Dict[str, Any]) -> None:
        """
        Register a server with the registry.
        
        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration
        """
        # Store server configuration
        self.servers[server_id] = server_config
        logger.info(f"Registered server: {server_id}")
    
    def unregister_server(self, server_id: str) -> bool:
        """
        Unregister a server from the registry.
        
        Args:
            server_id: Unique identifier for the server
            
        Returns:
            True if the server was unregistered, False if not found
        """
        if server_id not in self.servers:
            logger.warning(f"Cannot unregister server: {server_id} not found")
            return False
        
        # Remove server configuration
        del self.servers[server_id]
        
        # Remove server capabilities if present
        if server_id in self.capabilities:
            del self.capabilities[server_id]
        
        logger.info(f"Unregistered server: {server_id}")
        return True
    
    def get_server(self, server_id: str) -> Optional[Dict[str, Any]]:
        """
        Get server configuration.
        
        Args:
            server_id: Unique identifier for the server
            
        Returns:
            Server configuration, or None if not found
        """
        return self.servers.get(server_id)
    
    def get_all_servers(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all registered servers.
        
        Returns:
            Dictionary mapping server IDs to server configurations
        """
        return self.servers.copy()
    
    def set_server_capabilities(self, server_id: str, capabilities: Dict[str, Any]) -> None:
        """
        Set the capabilities for a server.
        
        Args:
            server_id: Unique identifier for the server
            capabilities: Server capabilities
        """
        if server_id not in self.servers:
            logger.warning(f"Cannot set capabilities: server {server_id} not registered")
            return
        
        # Store server capabilities
        self.capabilities[server_id] = capabilities
        logger.debug(f"Set capabilities for server: {server_id}")
    
    def get_server_capabilities(self, server_id: str) -> Optional[Dict[str, Any]]:
        """
        Get server capabilities.
        
        Args:
            server_id: Unique identifier for the server
            
        Returns:
            Server capabilities, or None if not found
        """
        return self.capabilities.get(server_id)
    
    def find_servers_by_capability(self, capability: str) -> List[str]:
        """
        Find servers that support a specific capability.
        
        Args:
            capability: Capability to search for
            
        Returns:
            List of server IDs that support the capability
        """
        matching_servers = []
        
        for server_id, caps in self.capabilities.items():
            # Check if the server has the capability
            # This is a simplified check; in a real implementation,
            # we would need to check the capability structure more carefully
            if capability in caps:
                matching_servers.append(server_id)
        
        return matching_servers
