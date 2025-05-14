#!/usr/bin/env python3
"""
MCP Server Interface for Nexus MCP Hub.

This module provides the interface for communicating with MCP servers.
It implements the client side of the Model Context Protocol (MCP).
"""

import logging
import asyncio
import json
from typing import Dict, List, Optional, Any, Set, Union

from ..protocol import ClientProtocol, Transport, StdioTransport, HttpSseTransport
from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class McpServerInterface:
    """Interface for communicating with an MCP server."""

    def __init__(self, server_id: str, server_config: Dict[str, Any]):
        """
        Initialize the MCP server interface.

        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration
        """
        self.config = get_config_manager()
        self.server_id = server_id
        self.server_config = server_config
        self.transport = self._create_transport()
        self.protocol = ClientProtocol(self.transport)
        self.initialized = False
        self.capabilities = {}
        self.resources = {}
        self.tools = {}
        self.prompts = {}

        logger.info(f"Created MCP server interface for {server_id}")

    def _create_transport(self) -> Transport:
        """
        Create a transport for communicating with the server.

        Returns:
            Transport instance
        """
        transport_type = self.server_config.get("transport", "stdio")

        if transport_type == "stdio":
            return StdioTransport()
        elif transport_type == "http":
            host = self.server_config.get("host", "localhost")
            port = self.server_config.get("port", 8000)
            return HttpSseTransport(host, port)
        else:
            raise ValueError(f"Unsupported transport type: {transport_type}")

    async def connect(self) -> bool:
        """
        Connect to the server.

        Returns:
            True if the connection was successful, False otherwise
        """
        try:
            # Connect the protocol
            await self.protocol.connect()

            logger.info(f"Connected to MCP server: {self.server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MCP server {self.server_id}: {e}")
            return False

    async def disconnect(self) -> None:
        """Disconnect from the server."""
        try:
            # Shutdown the protocol if initialized
            if self.initialized:
                await self.protocol.shutdown()

            # Disconnect the protocol
            await self.protocol.disconnect()

            # Reset state
            self.initialized = False
            self.capabilities = {}

            logger.info(f"Disconnected from MCP server: {self.server_id}")
        except Exception as e:
            logger.error(f"Error disconnecting from MCP server {self.server_id}: {e}")

    async def initialize(self) -> bool:
        """
        Initialize the server.

        Returns:
            True if initialization was successful, False otherwise
        """
        if self.initialized:
            logger.warning(f"MCP server {self.server_id} is already initialized")
            return True

        try:
            # Initialize the protocol
            result = await self.protocol.initialize(
                client_name="Nexus MCP Hub",
                client_version=self.config.get("hub.version", "1.0.0"),
                capabilities={
                    "resources": {
                        "subscriptions": True
                    },
                    "tools": True,
                    "prompts": True,
                    "sampling": True
                }
            )

            # Store server capabilities
            self.capabilities = result.get("capabilities", {})

            # Store server information
            server_info = result.get("serverInfo", {})
            self.server_config["name"] = server_info.get("name", self.server_config.get("name", self.server_id))
            self.server_config["version"] = server_info.get("version", "unknown")

            self.initialized = True
            logger.info(f"Initialized MCP server: {self.server_id}")

            # Load resources, tools, and prompts
            await self._load_resources()
            await self._load_tools()
            await self._load_prompts()

            return True
        except Exception as e:
            logger.error(f"Failed to initialize MCP server {self.server_id}: {e}")
            return False

    async def _load_resources(self) -> None:
        """Load resources from the server."""
        if not self.has_capability("resources"):
            logger.debug(f"MCP server {self.server_id} does not support resources")
            return

        try:
            # List resources
            resources = await self.protocol.list_resources()

            # Store resources
            self.resources = {resource["uri"]: resource for resource in resources}

            logger.debug(f"Loaded {len(resources)} resources from MCP server {self.server_id}")
        except Exception as e:
            logger.error(f"Failed to load resources from MCP server {self.server_id}: {e}")

    async def _load_tools(self) -> None:
        """Load tools from the server."""
        if not self.has_capability("tools"):
            logger.debug(f"MCP server {self.server_id} does not support tools")
            return

        try:
            # List tools
            tools = await self.protocol.list_tools()

            # Store tools
            self.tools = {tool["name"]: tool for tool in tools}

            logger.debug(f"Loaded {len(tools)} tools from MCP server {self.server_id}")
        except Exception as e:
            logger.error(f"Failed to load tools from MCP server {self.server_id}: {e}")

    async def _load_prompts(self) -> None:
        """Load prompts from the server."""
        if not self.has_capability("prompts"):
            logger.debug(f"MCP server {self.server_id} does not support prompts")
            return

        try:
            # List prompts
            prompts = await self.protocol.list_prompts()

            # Store prompts
            self.prompts = {prompt["id"]: prompt for prompt in prompts}

            logger.debug(f"Loaded {len(prompts)} prompts from MCP server {self.server_id}")
        except Exception as e:
            logger.error(f"Failed to load prompts from MCP server {self.server_id}: {e}")

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
        current = self.capabilities

        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return False
            current = current[part]

        return True

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

        if not self.has_capability("resources"):
            logger.warning(f"MCP server {self.server_id} does not support resources")
            return None

        try:
            # Read the resource
            contents = await self.protocol.read_resource(uri)

            return {
                "uri": uri,
                "contents": contents
            }
        except Exception as e:
            logger.error(f"Failed to get resource {uri} from MCP server {self.server_id}: {e}")
            return None

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

        if not self.has_capability("tools"):
            logger.warning(f"MCP server {self.server_id} does not support tools")
            return None

        try:
            # Call the tool
            result = await self.protocol.call_tool(name, arguments)

            return result
        except Exception as e:
            logger.error(f"Failed to call tool {name} on MCP server {self.server_id}: {e}")
            return None

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

        if not self.has_capability("prompts"):
            logger.warning(f"MCP server {self.server_id} does not support prompts")
            return None

        try:
            # Get the prompt
            prompt = await self.protocol.get_prompt(id)

            return prompt
        except Exception as e:
            logger.error(f"Failed to get prompt {id} from MCP server {self.server_id}: {e}")
            return None

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

        if not self.has_capability("sampling"):
            logger.warning(f"MCP server {self.server_id} does not support sampling")
            return None

        try:
            # Sample from the model
            result = await self.protocol.sample(request)

            return result
        except Exception as e:
            logger.error(f"Failed to sample from MCP server {self.server_id}: {e}")
            return None

    async def forward_message(self, message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Forward a message to the server.

        Args:
            message: Message to forward

        Returns:
            Response message, or None if no response is needed
        """
        if not self.initialized:
            logger.warning(f"Cannot forward message to server {self.server_id}: not initialized")
            return None

        try:
            # Extract method from the message
            if "method" not in message:
                logger.error(f"Invalid message to forward to server {self.server_id}: missing method")
                return None

            method = message["method"]

            # Check if this is a request or notification
            is_request = "id" in message

            # Handle based on method
            if method.startswith("resources/"):
                # Resource methods
                if method == "resources/list":
                    return await self._handle_resources_list_request(message)
                elif method == "resources/read":
                    return await self._handle_resources_read_request(message)
                else:
                    logger.warning(f"Unsupported resource method: {method}")
                    return None
            elif method.startswith("tools/"):
                # Tool methods
                tool_name = method[6:]  # Remove "tools/" prefix
                return await self._handle_tool_call_request(message, tool_name)
            elif method.startswith("prompts/"):
                # Prompt methods
                prompt_id = method[8:]  # Remove "prompts/" prefix
                return await self._handle_prompt_request(message, prompt_id)
            elif method == "sampling/sample":
                # Sampling method
                return await self._handle_sampling_request(message)
            else:
                # Forward the raw message to the server
                if is_request:
                    return await self.protocol.send_request(message)
                else:
                    await self.protocol.send_notification(message)
                    return None
        except Exception as e:
            logger.error(f"Failed to forward message to server {self.server_id}: {e}")
            return None

    async def _handle_resources_list_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a resources/list request.

        Args:
            message: Request message

        Returns:
            Response message
        """
        # Extract request ID and parameters
        request_id = message.get("id")
        params = message.get("params", {})

        try:
            # Get resources from the server
            resources = list(self.resources.values())

            # Create response
            return {
                "id": request_id,
                "result": {
                    "resources": resources
                }
            }
        except Exception as e:
            logger.error(f"Error handling resources/list request: {e}")
            return {
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }

    async def _handle_resources_read_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a resources/read request.

        Args:
            message: Request message

        Returns:
            Response message
        """
        # Extract request ID and parameters
        request_id = message.get("id")
        params = message.get("params", {})

        # Get resource URI
        uri = params.get("uri")
        if not uri:
            return {
                "id": request_id,
                "error": {
                    "code": -32602,
                    "message": "Missing required parameter: uri"
                }
            }

        try:
            # Get resource from the server
            resource = await self.get_resource(uri)

            if resource:
                return {
                    "id": request_id,
                    "result": resource
                }
            else:
                return {
                    "id": request_id,
                    "error": {
                        "code": -32001,
                        "message": f"Resource not found: {uri}"
                    }
                }
        except Exception as e:
            logger.error(f"Error handling resources/read request: {e}")
            return {
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }

    async def _handle_tool_call_request(self, message: Dict[str, Any], tool_name: str) -> Dict[str, Any]:
        """
        Handle a tool call request.

        Args:
            message: Request message
            tool_name: Tool name

        Returns:
            Response message
        """
        # Extract request ID and parameters
        request_id = message.get("id")
        params = message.get("params", {})

        try:
            # Call the tool
            result = await self.call_tool(tool_name, params)

            if result is not None:
                return {
                    "id": request_id,
                    "result": result
                }
            else:
                return {
                    "id": request_id,
                    "error": {
                        "code": -32001,
                        "message": f"Tool call failed: {tool_name}"
                    }
                }
        except Exception as e:
            logger.error(f"Error handling tool call request: {e}")
            return {
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }

    async def _handle_prompt_request(self, message: Dict[str, Any], prompt_id: str) -> Dict[str, Any]:
        """
        Handle a prompt request.

        Args:
            message: Request message
            prompt_id: Prompt ID

        Returns:
            Response message
        """
        # Extract request ID
        request_id = message.get("id")

        try:
            # Get the prompt
            prompt = await self.get_prompt(prompt_id)

            if prompt:
                return {
                    "id": request_id,
                    "result": prompt
                }
            else:
                return {
                    "id": request_id,
                    "error": {
                        "code": -32001,
                        "message": f"Prompt not found: {prompt_id}"
                    }
                }
        except Exception as e:
            logger.error(f"Error handling prompt request: {e}")
            return {
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }

    async def _handle_sampling_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle a sampling request.

        Args:
            message: Request message

        Returns:
            Response message
        """
        # Extract request ID and parameters
        request_id = message.get("id")
        params = message.get("params", {})

        try:
            # Sample from the server
            result = await self.sample(params)

            if result is not None:
                return {
                    "id": request_id,
                    "result": result
                }
            else:
                return {
                    "id": request_id,
                    "error": {
                        "code": -32001,
                        "message": "Sampling failed"
                    }
                }
        except Exception as e:
            logger.error(f"Error handling sampling request: {e}")
            return {
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }
