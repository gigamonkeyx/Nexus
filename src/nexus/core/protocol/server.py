#!/usr/bin/env python3
"""
Server Protocol implementation for Nexus MCP Hub.

This module provides the server-side protocol implementation for the Model Context Protocol (MCP).
It handles server initialization, capability negotiation, and message exchange.
"""

import logging
import asyncio
import json
from typing import Dict, List, Optional, Any, Set, Callable, Awaitable

from .base import Protocol, Request, Response, Notification, Error, ErrorCode
from .transport import Transport

# Setup logging
logger = logging.getLogger(__name__)

# Type definitions
ResourceHandler = Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]
ToolHandler = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
PromptHandler = Callable[[str, Dict[str, Any]], Awaitable[Dict[str, Any]]]
SamplingHandler = Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]

class ServerProtocol(Protocol):
    """MCP server protocol implementation."""
    
    def __init__(self, transport: Transport):
        """
        Initialize the server protocol.
        
        Args:
            transport: Transport to use for communication
        """
        super().__init__()
        self.transport = transport
        self.transport.set_message_handler(self.handle_message)
        self.initialized = False
        self.client_capabilities = {}
        self.server_capabilities = {}
        self.server_name = "Nexus MCP Server"
        self.server_version = "1.0.0"
        self.resource_handlers: Dict[str, ResourceHandler] = {}
        self.tool_handlers: Dict[str, ToolHandler] = {}
        self.prompt_handlers: Dict[str, PromptHandler] = {}
        self.sampling_handler: Optional[SamplingHandler] = None
        self.subscriptions: Dict[str, Set[str]] = {}  # Maps resource URIs to client IDs
        
        # Register protocol handlers
        self._register_protocol_handlers()
    
    def _register_protocol_handlers(self) -> None:
        """Register the standard protocol handlers."""
        # Initialize request
        self.register_request_handler("initialize", self._handle_initialize)
        
        # Initialized notification
        self.register_notification_handler("initialized", self._handle_initialized)
        
        # Shutdown request
        self.register_request_handler("shutdown", self._handle_shutdown)
        
        # Exit notification
        self.register_notification_handler("exit", self._handle_exit)
        
        # Resource handlers
        self.register_request_handler("resources/list", self._handle_resources_list)
        self.register_request_handler("resources/read", self._handle_resources_read)
        self.register_request_handler("resources/subscribe", self._handle_resources_subscribe)
        self.register_request_handler("resources/unsubscribe", self._handle_resources_unsubscribe)
        
        # Tool handlers
        self.register_request_handler("tools/list", self._handle_tools_list)
        self.register_request_handler("tools/call", self._handle_tools_call)
        
        # Prompt handlers
        self.register_request_handler("prompts/list", self._handle_prompts_list)
        self.register_request_handler("prompts/get", self._handle_prompts_get)
        
        # Sampling handlers
        self.register_request_handler("sampling/sample", self._handle_sampling_sample)
    
    async def _send_message(self, message: str) -> None:
        """
        Send a message through the transport.
        
        Args:
            message: Message to send
        """
        await self.transport.send_message(message)
    
    async def connect(self) -> None:
        """
        Connect the server.
        
        This method establishes the transport connection.
        """
        # Connect the transport
        await self.transport.connect()
        
        # Start the message loop
        asyncio.create_task(self.transport.run())
        
        logger.info("Server protocol connected")
    
    async def disconnect(self) -> None:
        """
        Disconnect the server.
        
        This method closes the transport connection.
        """
        # Disconnect the transport
        await self.transport.disconnect()
        
        # Reset state
        self.initialized = False
        self.client_capabilities = {}
        self.subscriptions = {}
        
        logger.info("Server protocol disconnected")
    
    def set_server_info(self, name: str, version: str) -> None:
        """
        Set server information.
        
        Args:
            name: Server name
            version: Server version
        """
        self.server_name = name
        self.server_version = version
    
    def set_capabilities(self, capabilities: Dict[str, Any]) -> None:
        """
        Set server capabilities.
        
        Args:
            capabilities: Server capabilities
        """
        self.server_capabilities = capabilities
    
    def register_resource_handler(self, method: str, handler: ResourceHandler) -> None:
        """
        Register a resource handler.
        
        Args:
            method: Resource method
            handler: Resource handler function
        """
        self.resource_handlers[method] = handler
    
    def register_tool_handler(self, name: str, handler: ToolHandler) -> None:
        """
        Register a tool handler.
        
        Args:
            name: Tool name
            handler: Tool handler function
        """
        self.tool_handlers[name] = handler
    
    def register_prompt_handler(self, id: str, handler: PromptHandler) -> None:
        """
        Register a prompt handler.
        
        Args:
            id: Prompt ID
            handler: Prompt handler function
        """
        self.prompt_handlers[id] = handler
    
    def register_sampling_handler(self, handler: SamplingHandler) -> None:
        """
        Register a sampling handler.
        
        Args:
            handler: Sampling handler function
        """
        self.sampling_handler = handler
    
    async def notify_resource_updated(self, uri: str) -> None:
        """
        Notify clients that a resource has been updated.
        
        Args:
            uri: Resource URI
        """
        if not self.initialized:
            return
        
        # Check if anyone is subscribed to this resource
        if uri not in self.subscriptions or not self.subscriptions[uri]:
            return
        
        # Send notification
        await self.send_notification("notifications/resources/updated", {
            "uri": uri
        })
    
    async def notify_resources_changed(self) -> None:
        """Notify clients that the list of resources has changed."""
        if not self.initialized:
            return
        
        # Send notification
        await self.send_notification("notifications/resources/list_changed", {})
    
    async def notify_tools_changed(self) -> None:
        """Notify clients that the list of tools has changed."""
        if not self.initialized:
            return
        
        # Send notification
        await self.send_notification("notifications/tools/list_changed", {})
    
    async def notify_prompts_changed(self) -> None:
        """Notify clients that the list of prompts has changed."""
        if not self.initialized:
            return
        
        # Send notification
        await self.send_notification("notifications/prompts/list_changed", {})
    
    # Protocol handlers
    
    async def _handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle initialize request.
        
        Args:
            params: Request parameters
            
        Returns:
            Initialization result
        """
        # Check if already initialized
        if self.initialized:
            raise Error(ErrorCode.PROTOCOL_ERROR, "Protocol already initialized")
        
        # Extract client information
        client_info = params.get("clientInfo", {})
        self.client_capabilities = params.get("capabilities", {})
        
        logger.info(f"Initializing server protocol for client: {client_info.get('name')} {client_info.get('version')}")
        
        # Return server information and capabilities
        return {
            "serverInfo": {
                "name": self.server_name,
                "version": self.server_version
            },
            "capabilities": self.server_capabilities
        }
    
    async def _handle_initialized(self, params: Dict[str, Any]) -> None:
        """
        Handle initialized notification.
        
        Args:
            params: Notification parameters
        """
        self.initialized = True
        logger.info("Server protocol initialized")
    
    async def _handle_shutdown(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle shutdown request.
        
        Args:
            params: Request parameters
            
        Returns:
            Empty result
        """
        logger.info("Shutting down server protocol")
        self.initialized = False
        return {}
    
    async def _handle_exit(self, params: Dict[str, Any]) -> None:
        """
        Handle exit notification.
        
        Args:
            params: Notification parameters
        """
        logger.info("Exiting server protocol")
        # Disconnect in a separate task to allow the response to be sent
        asyncio.create_task(self.disconnect())
    
    # Resource handlers
    
    async def _handle_resources_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/list request.
        
        Args:
            params: Request parameters
            
        Returns:
            List of resources
        """
        if "resources" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resources")
        
        # Call the resource list handler if registered
        if "list" in self.resource_handlers:
            return await self.resource_handlers["list"](params)
        
        # Default implementation
        return {"resources": []}
    
    async def _handle_resources_read(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/read request.
        
        Args:
            params: Request parameters
            
        Returns:
            Resource contents
        """
        if "resources" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resources")
        
        # Check for required parameters
        if "uri" not in params:
            raise Error(ErrorCode.INVALID_PARAMS, "Missing required parameter: uri")
        
        uri = params["uri"]
        
        # Call the resource read handler if registered
        if "read" in self.resource_handlers:
            return await self.resource_handlers["read"](params)
        
        # Default implementation
        raise Error(ErrorCode.RESOURCE_NOT_FOUND, f"Resource not found: {uri}")
    
    async def _handle_resources_subscribe(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/subscribe request.
        
        Args:
            params: Request parameters
            
        Returns:
            Empty result
        """
        if "resources" not in self.server_capabilities or "subscriptions" not in self.server_capabilities.get("resources", {}):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resource subscriptions")
        
        # Check for required parameters
        if "uri" not in params:
            raise Error(ErrorCode.INVALID_PARAMS, "Missing required parameter: uri")
        
        uri = params["uri"]
        
        # Add subscription
        if uri not in self.subscriptions:
            self.subscriptions[uri] = set()
        
        # Use a placeholder client ID for now
        client_id = "default"
        self.subscriptions[uri].add(client_id)
        
        logger.debug(f"Subscribed to resource: {uri}")
        
        return {}
    
    async def _handle_resources_unsubscribe(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle resources/unsubscribe request.
        
        Args:
            params: Request parameters
            
        Returns:
            Empty result
        """
        if "resources" not in self.server_capabilities or "subscriptions" not in self.server_capabilities.get("resources", {}):
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support resource subscriptions")
        
        # Check for required parameters
        if "uri" not in params:
            raise Error(ErrorCode.INVALID_PARAMS, "Missing required parameter: uri")
        
        uri = params["uri"]
        
        # Remove subscription
        if uri in self.subscriptions:
            # Use a placeholder client ID for now
            client_id = "default"
            self.subscriptions[uri].discard(client_id)
            
            logger.debug(f"Unsubscribed from resource: {uri}")
        
        return {}
    
    # Tool handlers
    
    async def _handle_tools_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle tools/list request.
        
        Args:
            params: Request parameters
            
        Returns:
            List of tools
        """
        if "tools" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support tools")
        
        # Call the tool list handler if registered
        if "list" in self.resource_handlers:
            return await self.resource_handlers["list"](params)
        
        # Default implementation: return registered tools
        tools = []
        for name, handler in self.tool_handlers.items():
            # In a real implementation, we would include the tool schema
            tools.append({
                "name": name,
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            })
        
        return {"tools": tools}
    
    async def _handle_tools_call(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle tools/call request.
        
        Args:
            params: Request parameters
            
        Returns:
            Tool result
        """
        if "tools" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support tools")
        
        # Check for required parameters
        if "name" not in params:
            raise Error(ErrorCode.INVALID_PARAMS, "Missing required parameter: name")
        
        name = params["name"]
        arguments = params.get("arguments", {})
        
        # Call the tool handler if registered
        if name in self.tool_handlers:
            return await self.tool_handlers[name](name, arguments)
        
        # Tool not found
        raise Error(ErrorCode.TOOL_NOT_FOUND, f"Tool not found: {name}")
    
    # Prompt handlers
    
    async def _handle_prompts_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle prompts/list request.
        
        Args:
            params: Request parameters
            
        Returns:
            List of prompts
        """
        if "prompts" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support prompts")
        
        # Default implementation: return registered prompts
        prompts = []
        for id in self.prompt_handlers:
            prompts.append({
                "id": id,
                "name": id,  # In a real implementation, we would include more metadata
                "description": f"Prompt: {id}"
            })
        
        return {"prompts": prompts}
    
    async def _handle_prompts_get(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle prompts/get request.
        
        Args:
            params: Request parameters
            
        Returns:
            Prompt details
        """
        if "prompts" not in self.server_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Server does not support prompts")
        
        # Check for required parameters
        if "id" not in params:
            raise Error(ErrorCode.INVALID_PARAMS, "Missing required parameter: id")
        
        id = params["id"]
        
        # Call the prompt handler if registered
        if id in self.prompt_handlers:
            return await self.prompt_handlers[id](id, params)
        
        # Prompt not found
        raise Error(ErrorCode.PROMPT_NOT_FOUND, f"Prompt not found: {id}")
    
    # Sampling handlers
    
    async def _handle_sampling_sample(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle sampling/sample request.
        
        Args:
            params: Request parameters
            
        Returns:
            Sampling result
        """
        if "sampling" not in self.client_capabilities:
            raise Error(ErrorCode.UNSUPPORTED_CAPABILITY, "Client does not support sampling")
        
        # Call the sampling handler if registered
        if self.sampling_handler:
            return await self.sampling_handler(params)
        
        # No sampling handler registered
        raise Error(ErrorCode.SAMPLING_ERROR, "No sampling handler registered")
