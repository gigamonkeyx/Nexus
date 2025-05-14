"""
Main server module for the Code Enhancement MCP Server.
"""

import logging
from typing import Dict, Any, List, Optional, Type

from mcp.server.fastmcp import FastMCP, Context

from .config import ServerConfig


class CodeEnhancementServer:
    """Main server class for the Code Enhancement MCP Server."""
    
    def __init__(self, config: Optional[ServerConfig] = None):
        """Initialize the server."""
        self.config = config or ServerConfig()
        
        # Configure logging
        logging.basicConfig(
            level=getattr(logging, self.config.log_level),
            format=self.config.log_format,
        )
        self.logger = logging.getLogger("code_enhancement_server")
        
        # Create MCP server
        self.mcp = FastMCP(
            name=self.config.name,
            description=self.config.description,
            version=self.config.version,
        )
        
        # Tool registry
        self.tools = {}
        
        # Resource registry
        self.resources = {}
        
        # Prompt registry
        self.prompts = {}
        
        # Language support registry
        self.language_support = {}
    
    def register_tool(self, name: str, tool_func: callable, description: str = None):
        """Register a tool with the server."""
        self.logger.info(f"Registering tool: {name}")
        
        # Register with MCP
        decorated_func = self.mcp.tool()(tool_func)
        
        # Store in registry
        self.tools[name] = {
            "func": decorated_func,
            "description": description or tool_func.__doc__,
        }
        
        return decorated_func
    
    def register_resource(self, path: str, resource_func: callable, description: str = None):
        """Register a resource with the server."""
        self.logger.info(f"Registering resource: {path}")
        
        # Register with MCP
        decorated_func = self.mcp.resource(path)(resource_func)
        
        # Store in registry
        self.resources[path] = {
            "func": decorated_func,
            "description": description or resource_func.__doc__,
        }
        
        return decorated_func
    
    def register_prompt(self, name: str, prompt_func: callable, description: str = None):
        """Register a prompt with the server."""
        self.logger.info(f"Registering prompt: {name}")
        
        # Register with MCP
        decorated_func = self.mcp.prompt()(prompt_func)
        
        # Store in registry
        self.prompts[name] = {
            "func": decorated_func,
            "description": description or prompt_func.__doc__,
        }
        
        return decorated_func
    
    def register_language_support(self, language: str, support_module):
        """Register language support with the server."""
        self.logger.info(f"Registering language support: {language}")
        
        # Store in registry
        self.language_support[language.lower()] = support_module
    
    def get_language_support(self, language: str):
        """Get language support for a specific language."""
        return self.language_support.get(language.lower())
    
    def run(self):
        """Run the server."""
        self.logger.info(f"Starting {self.config.name} on {self.config.host}:{self.config.port}")
        
        # Run the MCP server
        self.mcp.run(host=self.config.host, port=self.config.port)
