"""
MCP Client interface for Nexus MCP Hub.

This module provides the interface for communicating with MCP clients.
It implements the server side of the Model Context Protocol (MCP).
"""

from .interface import McpClientInterface
from .connection import McpClientConnection

__all__ = ["McpClientInterface", "McpClientConnection"]
