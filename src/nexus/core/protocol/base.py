#!/usr/bin/env python3
"""
Base Protocol implementation for Nexus MCP Hub.

This module provides the core protocol classes for the Model Context Protocol (MCP).
It implements the JSON-RPC 2.0 message format and protocol flow.
"""

import logging
import asyncio
import json
import uuid
from typing import Dict, List, Optional, Any, Callable, Awaitable, TypeVar, Generic, Union
from enum import Enum

# Setup logging
logger = logging.getLogger(__name__)

# Type definitions
T = TypeVar('T')
RequestHandler = Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]
NotificationHandler = Callable[[Dict[str, Any]], Awaitable[None]]

class ErrorCode(Enum):
    """Standard JSON-RPC 2.0 error codes."""
    
    # Standard JSON-RPC error codes
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603
    
    # MCP-specific error codes
    PROTOCOL_ERROR = -32000
    UNSUPPORTED_CAPABILITY = -32001
    INVALID_CAPABILITY = -32002
    RESOURCE_NOT_FOUND = -32003
    TOOL_NOT_FOUND = -32004
    PROMPT_NOT_FOUND = -32005
    SUBSCRIPTION_ERROR = -32006
    SAMPLING_ERROR = -32007

class Error(Exception):
    """MCP protocol error."""
    
    def __init__(self, code: Union[int, ErrorCode], message: str, data: Any = None):
        """
        Initialize an MCP protocol error.
        
        Args:
            code: Error code
            message: Error message
            data: Additional error data
        """
        self.code = code.value if isinstance(code, ErrorCode) else code
        self.message = message
        self.data = data
        super().__init__(f"{message} (code: {self.code})")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the error to a dictionary.
        
        Returns:
            Dictionary representation of the error
        """
        error_dict = {
            "code": self.code,
            "message": self.message
        }
        
        if self.data is not None:
            error_dict["data"] = self.data
        
        return error_dict

class Request:
    """MCP protocol request."""
    
    def __init__(self, method: str, params: Optional[Dict[str, Any]] = None, id: Optional[str] = None):
        """
        Initialize an MCP protocol request.
        
        Args:
            method: Request method
            params: Request parameters
            id: Request ID (generated if not provided)
        """
        self.method = method
        self.params = params or {}
        self.id = id or str(uuid.uuid4())
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the request to a dictionary.
        
        Returns:
            Dictionary representation of the request
        """
        return {
            "jsonrpc": "2.0",
            "method": self.method,
            "params": self.params,
            "id": self.id
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Request':
        """
        Create a request from a dictionary.
        
        Args:
            data: Dictionary representation of the request
            
        Returns:
            Request object
            
        Raises:
            Error: If the request is invalid
        """
        if "jsonrpc" not in data or data["jsonrpc"] != "2.0":
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid JSON-RPC version")
        
        if "method" not in data or not isinstance(data["method"], str):
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid or missing method")
        
        if "id" not in data:
            raise Error(ErrorCode.INVALID_REQUEST, "Missing request ID")
        
        params = data.get("params", {})
        if params is not None and not isinstance(params, dict):
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid params (must be an object or null)")
        
        return cls(data["method"], params, data["id"])

class Response:
    """MCP protocol response."""
    
    def __init__(self, id: str, result: Optional[Dict[str, Any]] = None, error: Optional[Error] = None):
        """
        Initialize an MCP protocol response.
        
        Args:
            id: Request ID
            result: Response result
            error: Response error
        """
        self.id = id
        self.result = result
        self.error = error
        
        if result is not None and error is not None:
            raise ValueError("Response cannot have both result and error")
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the response to a dictionary.
        
        Returns:
            Dictionary representation of the response
        """
        response = {
            "jsonrpc": "2.0",
            "id": self.id
        }
        
        if self.error is not None:
            response["error"] = self.error.to_dict()
        else:
            response["result"] = self.result or {}
        
        return response
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Response':
        """
        Create a response from a dictionary.
        
        Args:
            data: Dictionary representation of the response
            
        Returns:
            Response object
            
        Raises:
            Error: If the response is invalid
        """
        if "jsonrpc" not in data or data["jsonrpc"] != "2.0":
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid JSON-RPC version")
        
        if "id" not in data:
            raise Error(ErrorCode.INVALID_REQUEST, "Missing response ID")
        
        if "error" in data:
            error_data = data["error"]
            error = Error(
                error_data["code"],
                error_data["message"],
                error_data.get("data")
            )
            return cls(data["id"], None, error)
        elif "result" in data:
            return cls(data["id"], data["result"])
        else:
            raise Error(ErrorCode.INVALID_REQUEST, "Response must have either result or error")

class Notification:
    """MCP protocol notification."""
    
    def __init__(self, method: str, params: Optional[Dict[str, Any]] = None):
        """
        Initialize an MCP protocol notification.
        
        Args:
            method: Notification method
            params: Notification parameters
        """
        self.method = method
        self.params = params or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the notification to a dictionary.
        
        Returns:
            Dictionary representation of the notification
        """
        return {
            "jsonrpc": "2.0",
            "method": self.method,
            "params": self.params
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Notification':
        """
        Create a notification from a dictionary.
        
        Args:
            data: Dictionary representation of the notification
            
        Returns:
            Notification object
            
        Raises:
            Error: If the notification is invalid
        """
        if "jsonrpc" not in data or data["jsonrpc"] != "2.0":
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid JSON-RPC version")
        
        if "method" not in data or not isinstance(data["method"], str):
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid or missing method")
        
        if "id" in data:
            raise Error(ErrorCode.INVALID_REQUEST, "Notification must not have an ID")
        
        params = data.get("params", {})
        if params is not None and not isinstance(params, dict):
            raise Error(ErrorCode.INVALID_REQUEST, "Invalid params (must be an object or null)")
        
        return cls(data["method"], params)

class Protocol:
    """Base MCP protocol implementation."""
    
    def __init__(self):
        """Initialize the protocol."""
        self.request_handlers: Dict[str, RequestHandler] = {}
        self.notification_handlers: Dict[str, NotificationHandler] = {}
        self.pending_requests: Dict[str, asyncio.Future] = {}
    
    def register_request_handler(self, method: str, handler: RequestHandler) -> None:
        """
        Register a request handler.
        
        Args:
            method: Request method
            handler: Request handler function
        """
        self.request_handlers[method] = handler
        logger.debug(f"Registered request handler for method: {method}")
    
    def register_notification_handler(self, method: str, handler: NotificationHandler) -> None:
        """
        Register a notification handler.
        
        Args:
            method: Notification method
            handler: Notification handler function
        """
        self.notification_handlers[method] = handler
        logger.debug(f"Registered notification handler for method: {method}")
    
    async def handle_message(self, message: str) -> Optional[str]:
        """
        Handle an incoming message.
        
        Args:
            message: JSON-RPC message
            
        Returns:
            Response message, or None if no response is needed
        """
        try:
            # Parse the message
            data = json.loads(message)
            
            # Check if it's a request, response, or notification
            if "method" in data and "id" in data:
                # It's a request
                return await self._handle_request(data)
            elif "method" in data and "id" not in data:
                # It's a notification
                await self._handle_notification(data)
                return None
            elif "id" in data and ("result" in data or "error" in data):
                # It's a response
                await self._handle_response(data)
                return None
            else:
                # Invalid message
                logger.error(f"Invalid message format: {message}")
                error = Error(ErrorCode.INVALID_REQUEST, "Invalid message format")
                return json.dumps({"jsonrpc": "2.0", "error": error.to_dict(), "id": None})
        except json.JSONDecodeError:
            # Invalid JSON
            logger.error(f"Invalid JSON: {message}")
            error = Error(ErrorCode.PARSE_ERROR, "Invalid JSON")
            return json.dumps({"jsonrpc": "2.0", "error": error.to_dict(), "id": None})
        except Exception as e:
            # Unexpected error
            logger.error(f"Error handling message: {e}")
            error = Error(ErrorCode.INTERNAL_ERROR, f"Internal error: {str(e)}")
            return json.dumps({"jsonrpc": "2.0", "error": error.to_dict(), "id": None})
    
    async def _handle_request(self, data: Dict[str, Any]) -> str:
        """
        Handle an incoming request.
        
        Args:
            data: Request data
            
        Returns:
            Response message
        """
        try:
            request = Request.from_dict(data)
            
            # Check if we have a handler for this method
            handler = self.request_handlers.get(request.method)
            if not handler:
                logger.warning(f"No handler for method: {request.method}")
                error = Error(ErrorCode.METHOD_NOT_FOUND, f"Method not found: {request.method}")
                response = Response(request.id, None, error)
                return json.dumps(response.to_dict())
            
            # Call the handler
            try:
                result = await handler(request.params)
                response = Response(request.id, result)
            except Error as e:
                response = Response(request.id, None, e)
            except Exception as e:
                logger.error(f"Error in request handler for {request.method}: {e}")
                error = Error(ErrorCode.INTERNAL_ERROR, f"Internal error: {str(e)}")
                response = Response(request.id, None, error)
            
            return json.dumps(response.to_dict())
        except Error as e:
            # Protocol error
            return json.dumps({"jsonrpc": "2.0", "error": e.to_dict(), "id": data.get("id")})
    
    async def _handle_notification(self, data: Dict[str, Any]) -> None:
        """
        Handle an incoming notification.
        
        Args:
            data: Notification data
        """
        try:
            notification = Notification.from_dict(data)
            
            # Check if we have a handler for this method
            handler = self.notification_handlers.get(notification.method)
            if not handler:
                logger.warning(f"No handler for notification method: {notification.method}")
                return
            
            # Call the handler
            try:
                await handler(notification.params)
            except Exception as e:
                logger.error(f"Error in notification handler for {notification.method}: {e}")
        except Error as e:
            # Protocol error
            logger.error(f"Protocol error handling notification: {e}")
    
    async def _handle_response(self, data: Dict[str, Any]) -> None:
        """
        Handle an incoming response.
        
        Args:
            data: Response data
        """
        try:
            response = Response.from_dict(data)
            
            # Check if we have a pending request with this ID
            future = self.pending_requests.pop(response.id, None)
            if not future:
                logger.warning(f"Received response for unknown request ID: {response.id}")
                return
            
            # Resolve the future
            if response.error:
                future.set_exception(Error(response.error.code, response.error.message, response.error.data))
            else:
                future.set_result(response.result)
        except Error as e:
            # Protocol error
            logger.error(f"Protocol error handling response: {e}")
    
    async def send_request(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a request and wait for the response.
        
        Args:
            method: Request method
            params: Request parameters
            
        Returns:
            Response result
            
        Raises:
            Error: If the request fails
        """
        # Create the request
        request = Request(method, params)
        
        # Create a future for the response
        future = asyncio.get_running_loop().create_future()
        self.pending_requests[request.id] = future
        
        # Send the request
        await self._send_message(json.dumps(request.to_dict()))
        
        try:
            # Wait for the response
            return await future
        finally:
            # Clean up the pending request
            self.pending_requests.pop(request.id, None)
    
    async def send_notification(self, method: str, params: Optional[Dict[str, Any]] = None) -> None:
        """
        Send a notification.
        
        Args:
            method: Notification method
            params: Notification parameters
        """
        # Create the notification
        notification = Notification(method, params)
        
        # Send the notification
        await self._send_message(json.dumps(notification.to_dict()))
    
    async def _send_message(self, message: str) -> None:
        """
        Send a message.
        
        This method should be implemented by subclasses.
        
        Args:
            message: Message to send
        """
        raise NotImplementedError("Subclasses must implement _send_message")
