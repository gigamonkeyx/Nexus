#!/usr/bin/env python3
"""
MCP Client Interface for Nexus MCP Hub.

This module provides the interface for communicating with MCP clients.
It implements the server side of the Model Context Protocol (MCP).
"""

import logging
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any, Set, Union, Callable, Awaitable

from ..protocol import ServerProtocol, Transport, StdioTransport, HttpSseTransport
from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class McpClientInterface:
    """Interface for communicating with an MCP client."""

    def __init__(self, client_id: str, transport: Transport):
        """
        Initialize the MCP client interface.

        Args:
            client_id: Unique identifier for the client
            transport: Transport to use for communication
        """
        self.config = get_config_manager()
        self.client_id = client_id
        self.transport = transport
        self.protocol = ServerProtocol(self.transport)
        self.initialized = False
        self.client_capabilities = {}
        self.client_info = {}
        self.server_capabilities = self._get_server_capabilities()

        # Set up protocol handlers
        self._setup_protocol_handlers()

        logger.info(f"Created MCP client interface for {client_id}")

    def _get_server_capabilities(self) -> Dict[str, Any]:
        """
        Get the server capabilities to advertise to clients.

        Returns:
            Server capabilities
        """
        return {
            "resources": {
                "subscriptions": True
            },
            "tools": True,
            "prompts": True,
            "sampling": True
        }

    def _setup_protocol_handlers(self) -> None:
        """Set up protocol handlers for client requests."""
        # Set server information
        self.protocol.set_server_info(
            name=self.config.get("hub.name", "Nexus MCP Hub"),
            version=self.config.get("hub.version", "1.0.0")
        )

        # Set server capabilities
        self.protocol.set_capabilities(self.server_capabilities)

        # Register resource handlers
        self.protocol.register_resource_handler("list", self._handle_resources_list)
        self.protocol.register_resource_handler("read", self._handle_resources_read)

        # Register sampling handler
        self.protocol.register_sampling_handler(self._handle_sampling)

    async def connect(self) -> bool:
        """
        Connect to the client.

        Returns:
            True if the connection was successful, False otherwise
        """
        try:
            # Connect the protocol
            await self.protocol.connect()

            logger.info(f"Connected to MCP client: {self.client_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP client {self.client_id}: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from the client."""
        try:
            # Disconnect the protocol
            await self.protocol.disconnect()

            # Reset state
            self.initialized = False
            self.client_capabilities = {}
            self.client_info = {}

            logger.info(f"Disconnected from MCP client: {self.client_id}")
        except Exception as e:
            logger.error(f"Error disconnecting from MCP client {self.client_id}: {e}")

    def has_capability(self, capability_path: str) -> bool:
        """
        Check if the client has a specific capability.

        Args:
            capability_path: Dot-separated path to the capability

        Returns:
            True if the client has the capability, False otherwise
        """
        if not self.initialized:
            return False

        # Navigate the capability path
        parts = capability_path.split(".")
        current = self.client_capabilities

        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return False
            current = current[part]

        return True

    async def notify_resource_updated(self, uri: str) -> None:
        """
        Notify the client that a resource has been updated.

        Args:
            uri: Resource URI
        """
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return

        try:
            await self.protocol.notify_resource_updated(uri)
            logger.debug(f"Notified client {self.client_id} of resource update: {uri}")
        except Exception as e:
            logger.error(f"Failed to notify client {self.client_id} of resource update: {e}")

    async def notify_resources_changed(self) -> None:
        """Notify the client that the list of resources has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return

        try:
            await self.protocol.notify_resources_changed()
            logger.debug(f"Notified client {self.client_id} of resources list change")
        except Exception as e:
            logger.error(f"Failed to notify client {self.client_id} of resources list change: {e}")

    async def notify_tools_changed(self) -> None:
        """Notify the client that the list of tools has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return

        try:
            await self.protocol.notify_tools_changed()
            logger.debug(f"Notified client {self.client_id} of tools list change")
        except Exception as e:
            logger.error(f"Failed to notify client {self.client_id} of tools list change: {e}")

    async def notify_prompts_changed(self) -> None:
        """Notify the client that the list of prompts has changed."""
        if not self.initialized:
            logger.warning(f"Cannot notify client {self.client_id}: not initialized")
            return

        try:
            await self.protocol.notify_prompts_changed()
            logger.debug(f"Notified client {self.client_id} of prompts list change")
        except Exception as e:
            logger.error(f"Failed to notify client {self.client_id} of prompts list change: {e}")

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

        if not self.has_capability("sampling"):
            logger.warning(f"Client {self.client_id} does not support sampling")
            return None

        try:
            # Sample from the client
            result = await self.protocol.sample(request)

            return result
        except Exception as e:
            logger.error(f"Failed to sample from client {self.client_id}: {e}")
            return None

    # Resource handlers

    async def _handle_resources_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/list request.

        Args:
            params: Request parameters

        Returns:
            List of resources
        """
        # This would typically query the hub for available resources
        # For now, return an empty list
        return {"resources": []}

    async def _handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/read request.

        Args:
            params: Request parameters

        Returns:
            Resource contents
        """
        # Get the resource URI
        uri = params.get("uri")
        if not uri:
            raise ValueError("Missing required parameter: uri")

        # This would typically query the hub for the resource
        # For now, return an empty resource
        return {"contents": []}

    # Sampling handler

    async def _handle_sampling(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle sampling/sample request.

        Args:
            params: Request parameters

        Returns:
            Sampling result
        """
        # This would typically forward the request to the appropriate model
        # For now, return a dummy response
        return {
            "text": "This is a sample response from the hub.",
            "finish_reason": "stop"
        }

    async def forward_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Forward a message to the client.

        Args:
            message: Message to forward

        Returns:
            Response message, or None if no response is needed
        """
        if not self.initialized:
            logger.warning(f"Cannot forward message to client {self.client_id}: not initialized")
            return None

        try:
            # Extract method from the message
            if "method" not in message:
                logger.error(f"Invalid message to forward to client {self.client_id}: missing method")
                return None

            method = message["method"]

            # Check if this is a request or notification
            is_request = "id" in message

            # Forward the message to the client
            if is_request:
                return await self.protocol.send_request(message)
            else:
                await self.protocol.send_notification(message)
                return None
        except Exception as e:
            logger.error(f"Failed to forward message to client {self.client_id}: {e}")
            return None
