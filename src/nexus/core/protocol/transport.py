#!/usr/bin/env python3
"""
Transport implementations for Nexus MCP Hub.

This module provides transport mechanisms for the Model Context Protocol (MCP).
It implements stdio and HTTP+SSE transports as specified in the MCP specification.
"""

import logging
import asyncio
import json
import sys
import os
from typing import Dict, List, Optional, Any, Callable, Awaitable, AsyncIterator
from abc import ABC, abstractmethod
import aiohttp
from aiohttp import web

# Setup logging
logger = logging.getLogger(__name__)

class Transport(ABC):
    """Base class for MCP transports."""
    
    def __init__(self):
        """Initialize the transport."""
        self.message_handler: Optional[Callable[[str], Awaitable[Optional[str]]]] = None
    
    def set_message_handler(self, handler: Callable[[str], Awaitable[Optional[str]]]) -> None:
        """
        Set the message handler.
        
        Args:
            handler: Function to handle incoming messages
        """
        self.message_handler = handler
    
    @abstractmethod
    async def connect(self) -> None:
        """
        Connect the transport.
        
        This method should establish the transport connection.
        """
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """
        Disconnect the transport.
        
        This method should close the transport connection.
        """
        pass
    
    @abstractmethod
    async def send_message(self, message: str) -> None:
        """
        Send a message through the transport.
        
        Args:
            message: Message to send
        """
        pass
    
    @abstractmethod
    async def receive_messages(self) -> AsyncIterator[str]:
        """
        Receive messages from the transport.
        
        Returns:
            AsyncIterator yielding received messages
        """
        pass
    
    async def run(self) -> None:
        """
        Run the transport message loop.
        
        This method starts receiving messages and handling them.
        """
        if not self.message_handler:
            raise ValueError("Message handler not set")
        
        async for message in self.receive_messages():
            try:
                # Handle the message
                response = await self.message_handler(message)
                
                # Send the response if there is one
                if response:
                    await self.send_message(response)
            except Exception as e:
                logger.error(f"Error handling message: {e}")

class StdioTransport(Transport):
    """Transport using standard input/output streams."""
    
    def __init__(self, input_stream=None, output_stream=None):
        """
        Initialize the stdio transport.
        
        Args:
            input_stream: Input stream (defaults to sys.stdin)
            output_stream: Output stream (defaults to sys.stdout)
        """
        super().__init__()
        self.input_stream = input_stream or sys.stdin
        self.output_stream = output_stream or sys.stdout
        self.reader = None
        self.writer = None
    
    async def connect(self) -> None:
        """Connect the stdio transport."""
        # Create StreamReader for stdin
        loop = asyncio.get_running_loop()
        reader = asyncio.StreamReader()
        protocol = asyncio.StreamReaderProtocol(reader)
        
        # Get file descriptors
        if hasattr(self.input_stream, 'fileno'):
            stdin_fd = self.input_stream.fileno()
            stdout_fd = self.output_stream.fileno()
        else:
            # Use default file descriptors if not available
            stdin_fd = 0
            stdout_fd = 1
        
        # Create transport for stdin
        await loop.connect_read_pipe(lambda: protocol, os.fdopen(stdin_fd, 'rb'))
        
        # Create StreamWriter for stdout
        transport, _ = await loop.connect_write_pipe(
            asyncio.streams.FlowControlMixin, 
            os.fdopen(stdout_fd, 'wb')
        )
        writer = asyncio.StreamWriter(transport, protocol, reader, loop)
        
        self.reader = reader
        self.writer = writer
        
        logger.debug("Stdio transport connected")
    
    async def disconnect(self) -> None:
        """Disconnect the stdio transport."""
        if self.writer:
            self.writer.close()
            await self.writer.wait_closed()
        
        self.reader = None
        self.writer = None
        
        logger.debug("Stdio transport disconnected")
    
    async def send_message(self, message: str) -> None:
        """
        Send a message through the stdio transport.
        
        Args:
            message: Message to send
        """
        if not self.writer:
            raise RuntimeError("Transport not connected")
        
        # Add content length header
        content_length = len(message.encode('utf-8'))
        header = f"Content-Length: {content_length}\r\n\r\n"
        
        # Write header and message
        self.writer.write(header.encode('utf-8'))
        self.writer.write(message.encode('utf-8'))
        await self.writer.drain()
        
        logger.debug(f"Sent message: {message}")
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """
        Receive messages from the stdio transport.
        
        Yields:
            Received messages
        """
        if not self.reader:
            raise RuntimeError("Transport not connected")
        
        while True:
            # Read the header
            header = await self.reader.readuntil(b'\r\n\r\n')
            if not header:
                break
            
            # Parse the content length
            content_length = None
            for line in header.decode('utf-8').split('\r\n'):
                if line.startswith('Content-Length: '):
                    content_length = int(line[16:])
                    break
            
            if content_length is None:
                logger.warning("Invalid header: missing Content-Length")
                continue
            
            # Read the message
            message_bytes = await self.reader.readexactly(content_length)
            message = message_bytes.decode('utf-8')
            
            logger.debug(f"Received message: {message}")
            yield message

class HttpSseTransport(Transport):
    """Transport using HTTP and Server-Sent Events (SSE)."""
    
    def __init__(self, host: str = "localhost", port: int = 8000):
        """
        Initialize the HTTP+SSE transport.
        
        Args:
            host: Host to bind to
            port: Port to bind to
        """
        super().__init__()
        self.host = host
        self.port = port
        self.app = web.Application()
        self.runner = None
        self.site = None
        self.message_queue = asyncio.Queue()
    
    async def connect(self) -> None:
        """Connect the HTTP+SSE transport."""
        # Set up routes
        self.app.router.add_post('/jsonrpc', self._handle_jsonrpc)
        self.app.router.add_get('/events', self._handle_sse)
        
        # Start the server
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, self.host, self.port)
        await self.site.start()
        
        logger.info(f"HTTP+SSE transport listening on http://{self.host}:{self.port}")
    
    async def disconnect(self) -> None:
        """Disconnect the HTTP+SSE transport."""
        if self.site:
            await self.site.stop()
        
        if self.runner:
            await self.runner.cleanup()
        
        self.site = None
        self.runner = None
        
        logger.info("HTTP+SSE transport disconnected")
    
    async def send_message(self, message: str) -> None:
        """
        Send a message through the HTTP+SSE transport.
        
        Args:
            message: Message to send
        """
        # Put the message in the queue for SSE clients
        await self.message_queue.put(message)
        
        logger.debug(f"Queued message for SSE: {message}")
    
    async def receive_messages(self) -> AsyncIterator[str]:
        """
        Receive messages from the HTTP+SSE transport.
        
        This is a dummy implementation since messages are received via HTTP endpoints.
        
        Yields:
            No messages (empty iterator)
        """
        # This is a no-op for HTTP+SSE transport
        # Messages are received via HTTP endpoints
        return
        yield  # This is just to make it an async generator
    
    async def _handle_jsonrpc(self, request: web.Request) -> web.Response:
        """
        Handle JSON-RPC requests.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response
        """
        if not self.message_handler:
            return web.Response(status=500, text="Message handler not set")
        
        try:
            # Read the request body
            body = await request.text()
            
            # Handle the message
            response = await self.message_handler(body)
            
            # Return the response
            if response:
                return web.Response(
                    text=response,
                    content_type='application/json'
                )
            else:
                return web.Response(status=204)  # No content
        except Exception as e:
            logger.error(f"Error handling JSON-RPC request: {e}")
            return web.Response(
                status=500,
                text=json.dumps({
                    "jsonrpc": "2.0",
                    "error": {
                        "code": -32603,
                        "message": f"Internal error: {str(e)}"
                    },
                    "id": None
                }),
                content_type='application/json'
            )
    
    async def _handle_sse(self, request: web.Request) -> web.StreamResponse:
        """
        Handle SSE connections.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP stream response
        """
        # Set up SSE response
        response = web.StreamResponse(
            status=200,
            reason='OK',
            headers={
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            }
        )
        
        # Start the response
        await response.prepare(request)
        
        try:
            # Send messages as they arrive
            while True:
                message = await self.message_queue.get()
                
                # Format as SSE event
                event_data = f"data: {message}\n\n"
                await response.write(event_data.encode('utf-8'))
                await response.drain()
                
                # Mark the message as processed
                self.message_queue.task_done()
        except asyncio.CancelledError:
            # Client disconnected
            pass
        except Exception as e:
            logger.error(f"Error in SSE handler: {e}")
        finally:
            return response
