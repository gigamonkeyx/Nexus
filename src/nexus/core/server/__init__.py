"""
MCP Server interface for Nexus MCP Hub.

This module provides the interface for communicating with MCP servers.
It implements the client side of the Model Context Protocol (MCP).
"""

from .interface import McpServerInterface
from .connection import McpServerConnection

__all__ = ["McpServerInterface", "McpServerConnection"]
