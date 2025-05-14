#!/usr/bin/env python3
"""
Client Manager for Nexus MCP Hub.

This module provides functionality for managing MCP client connections.
It handles client lifecycle and message routing between clients and servers.
"""

import logging
import asyncio
import uuid
from typing import Dict, List, Optional, Any, Set

from ..config import get_config_manager
from ..client import McpClientConnection
from ..protocol import Transport, StdioTransport, HttpSseTransport

# Setup logging
logger = logging.getLogger(__name__)

class ClientManager:
    """
    Manager for MCP client connections.

    This class handles the lifecycle of MCP client connections, including
    initialization, message exchange, and termination.
    """

    def __init__(self):
        """Initialize the Client Manager."""
        self.config = get_config_manager()
        self.clients = {}  # Maps client_id to client information
        self.connections = {}  # Maps client_id to MCP client connection
        self.running = False

        logger.info("Client Manager initialized")

    async def start(self) -> None:
        """Start the client manager."""
        if self.running:
            logger.warning("Client Manager is already running")
            return

        logger.info("Starting Client Manager")
        self.running = True

        # Initialize any required resources

        logger.info("Client Manager started")

    async def stop(self) -> None:
        """Stop the client manager and disconnect all clients."""
        if not self.running:
            logger.warning("Client Manager is not running")
            return

        logger.info("Stopping Client Manager")

        # Disconnect all clients
        for client_id in list(self.clients.keys()):
            await self.disconnect_client(client_id)

        # Disconnect all MCP client connections
        for client_id in list(self.connections.keys()):
            await self.disconnect_mcp_client(client_id)

        self.running = False
        logger.info("Client Manager stopped")

    async def create_mcp_client(self, transport_type: str, **transport_args) -> str:
        """
        Create a new MCP client connection.

        Args:
            transport_type: Type of transport to use (stdio, http)
            **transport_args: Additional arguments for the transport

        Returns:
            Client ID
        """
        # Create the transport
        transport = self._create_transport(transport_type, **transport_args)

        # Create the client connection
        connection = McpClientConnection(transport)

        # Connect to the client
        if not await connection.connect():
            raise RuntimeError("Failed to connect to client")

        # Store the connection
        client_id = connection.client_id
        self.connections[client_id] = connection

        logger.info(f"Created MCP client connection: {client_id}")

        return client_id

    def _create_transport(self, transport_type: str, **kwargs) -> Transport:
        """
        Create a transport for communicating with a client.

        Args:
            transport_type: Type of transport to use (stdio, http)
            **kwargs: Additional arguments for the transport

        Returns:
            Transport instance
        """
        if transport_type == "stdio":
            return StdioTransport()
        elif transport_type == "http":
            host = kwargs.get("host", "localhost")
            port = kwargs.get("port", 8000)
            return HttpSseTransport(host, port)
        else:
            raise ValueError(f"Unsupported transport type: {transport_type}")

    async def disconnect_mcp_client(self, client_id: str) -> bool:
        """
        Disconnect an MCP client connection.

        Args:
            client_id: Client ID

        Returns:
            True if the client was disconnected, False otherwise
        """
        # Check if the client exists
        if client_id not in self.connections:
            logger.warning(f"MCP client connection not found: {client_id}")
            return False

        logger.info(f"Disconnecting MCP client connection: {client_id}")

        try:
            # Get the connection
            connection = self.connections[client_id]

            # Disconnect the client
            await connection.disconnect()

            # Remove the connection
            del self.connections[client_id]

            logger.info(f"Disconnected MCP client connection: {client_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect MCP client connection {client_id}: {e}")
            return False

    async def register_client(self, client_info: Dict[str, Any]) -> str:
        """
        Register a new MCP client with the hub.

        Args:
            client_info: Client information including capabilities

        Returns:
            Unique client ID
        """
        # Generate a unique client ID
        client_id = str(uuid.uuid4())

        logger.info(f"Registering client: {client_id}")

        # Store client information
        self.clients[client_id] = {
            "id": client_id,
            "info": client_info,
            "connected": True,
            "servers": set(),  # Set of connected server IDs
            "capabilities": client_info.get("capabilities", {}),
            "connect_time": asyncio.get_event_loop().time()
        }

        logger.info(f"Client registered: {client_id}")
        return client_id

    async def disconnect_client(self, client_id: str) -> bool:
        """
        Disconnect an MCP client.

        Args:
            client_id: Unique identifier for the client

        Returns:
            True if the client was disconnected successfully, False otherwise
        """
        if client_id not in self.clients:
            logger.warning(f"Client {client_id} not found")
            return False

        logger.info(f"Disconnecting client: {client_id}")

        try:
            # Get client information
            client_info = self.clients[client_id]

            # Disconnect from all servers
            for server_id in list(client_info.get("servers", set())):
                await self.disconnect_from_server(client_id, server_id)

            # Update client status
            client_info["connected"] = False
            client_info["disconnect_time"] = asyncio.get_event_loop().time()

            # Remove client after a delay (to allow for reconnection)
            asyncio.create_task(self._delayed_client_removal(client_id, 60))

            logger.info(f"Client disconnected: {client_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect client {client_id}: {e}")
            return False

    async def _delayed_client_removal(self, client_id: str, delay: int) -> None:
        """
        Remove a client after a delay.

        Args:
            client_id: ID of the client to remove
            delay: Delay in seconds before removal
        """
        await asyncio.sleep(delay)

        # Check if client is still disconnected
        if client_id in self.clients and not self.clients[client_id].get("connected", False):
            logger.debug(f"Removing disconnected client: {client_id}")
            del self.clients[client_id]

    async def connect_to_server(self, client_id: str, server_id: str) -> bool:
        """
        Connect a client to an MCP server.

        Args:
            client_id: Unique identifier for the client
            server_id: Unique identifier for the server

        Returns:
            True if the connection was established successfully, False otherwise
        """
        # Check if client exists
        if client_id not in self.clients:
            logger.error(f"Cannot connect to server: client {client_id} not found")
            return False

        # Check if client is connected
        client_info = self.clients[client_id]
        if not client_info.get("connected", False):
            logger.error(f"Cannot connect to server: client {client_id} is disconnected")
            return False

        logger.info(f"Connecting client {client_id} to server {server_id}")

        try:
            # Add server to client's server set
            client_info["servers"].add(server_id)

            # Initialize connection (this would involve protocol negotiation in a real implementation)
            # For now, we'll just log the connection

            logger.info(f"Client {client_id} connected to server {server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect client {client_id} to server {server_id}: {e}")
            return False

    async def disconnect_from_server(self, client_id: str, server_id: str) -> bool:
        """
        Disconnect a client from an MCP server.

        Args:
            client_id: Unique identifier for the client
            server_id: Unique identifier for the server

        Returns:
            True if the disconnection was successful, False otherwise
        """
        # Check if client exists
        if client_id not in self.clients:
            logger.error(f"Cannot disconnect from server: client {client_id} not found")
            return False

        # Check if client is connected to the server
        client_info = self.clients[client_id]
        if server_id not in client_info.get("servers", set()):
            logger.warning(f"Client {client_id} is not connected to server {server_id}")
            return True

        logger.info(f"Disconnecting client {client_id} from server {server_id}")

        try:
            # Remove server from client's server set
            client_info["servers"].remove(server_id)

            # Terminate connection (this would involve protocol termination in a real implementation)
            # For now, we'll just log the disconnection

            logger.info(f"Client {client_id} disconnected from server {server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect client {client_id} from server {server_id}: {e}")
            return False

    def get_client_info(self, client_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a client.

        Args:
            client_id: Unique identifier for the client

        Returns:
            Dictionary with client information, or None if client not found
        """
        if client_id not in self.clients:
            return None

        client_info = self.clients[client_id]

        # Create a copy of the client information
        info = {
            "id": client_id,
            "connected": client_info.get("connected", False),
            "servers": list(client_info.get("servers", set())),
            "capabilities": client_info.get("capabilities", {}),
            "connect_time": client_info.get("connect_time"),
        }

        # Add disconnect time if available
        if "disconnect_time" in client_info:
            info["disconnect_time"] = client_info["disconnect_time"]

        return info

    def get_all_clients(self) -> Dict[str, Dict[str, Any]]:
        """
        Get information about all clients.

        Returns:
            Dictionary mapping client IDs to client information
        """
        return {client_id: self.get_client_info(client_id) for client_id in self.clients}

    def get_mcp_client(self, client_id: str) -> Optional[McpClientConnection]:
        """
        Get an MCP client connection.

        Args:
            client_id: Client ID

        Returns:
            MCP client connection, or None if not found
        """
        return self.connections.get(client_id)

    def get_all_mcp_clients(self) -> Dict[str, McpClientConnection]:
        """
        Get all MCP client connections.

        Returns:
            Dictionary mapping client IDs to MCP client connections
        """
        return self.connections.copy()

    def get_mcp_client_status(self, client_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of an MCP client connection.

        Args:
            client_id: Client ID

        Returns:
            Client status, or None if not found
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            return None

        return connection.get_status()

    def get_all_mcp_client_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the status of all MCP client connections.

        Returns:
            Dictionary mapping client IDs to client statuses
        """
        return {client_id: connection.get_status() for client_id, connection in self.connections.items()}

    async def notify_resource_updated(self, client_id: str, uri: str) -> bool:
        """
        Notify a client that a resource has been updated.

        Args:
            client_id: Client ID
            uri: Resource URI

        Returns:
            True if the notification was sent, False otherwise
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            logger.warning(f"Cannot notify client {client_id}: not found")
            return False

        try:
            await connection.notify_resource_updated(uri)
            return True
        except Exception as e:
            logger.error(f"Failed to notify client {client_id} of resource update: {e}")
            return False

    async def notify_resources_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of resources has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            logger.warning(f"Cannot notify client {client_id}: not found")
            return False

        try:
            await connection.notify_resources_changed()
            return True
        except Exception as e:
            logger.error(f"Failed to notify client {client_id} of resources list change: {e}")
            return False

    async def notify_tools_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of tools has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            logger.warning(f"Cannot notify client {client_id}: not found")
            return False

        try:
            await connection.notify_tools_changed()
            return True
        except Exception as e:
            logger.error(f"Failed to notify client {client_id} of tools list change: {e}")
            return False

    async def notify_prompts_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of prompts has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            logger.warning(f"Cannot notify client {client_id}: not found")
            return False

        try:
            await connection.notify_prompts_changed()
            return True
        except Exception as e:
            logger.error(f"Failed to notify client {client_id} of prompts list change: {e}")
            return False

    async def sample_from_client(self, client_id: str, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Request a sample from a client.

        Args:
            client_id: Client ID
            request: Sampling request

        Returns:
            Sampling result, or None if the sampling failed
        """
        connection = self.get_mcp_client(client_id)
        if not connection:
            logger.warning(f"Cannot sample from client {client_id}: not found")
            return None

        return await connection.sample(request)
