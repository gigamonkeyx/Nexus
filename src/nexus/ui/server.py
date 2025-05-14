#!/usr/bin/env python3
"""
UI Server for Nexus MCP Hub.

This module provides the web server for the Nexus MCP Hub UI,
serving the admin dashboard and management interface.
"""

import logging
import os
import asyncio
from typing import Dict, List, Optional, Any, Set
from pathlib import Path
import aiohttp_cors
from aiohttp import web

from ..core import HubManager, get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class UiServer:
    """UI server for the Nexus MCP Hub."""
    
    def __init__(self, hub_manager: HubManager):
        """
        Initialize the UI server.
        
        Args:
            hub_manager: Hub manager instance
        """
        self.config = get_config_manager()
        self.hub_manager = hub_manager
        self.app = web.Application()
        self.runner = None
        self.site = None
        
        # Get UI configuration
        self.host = self.config.get("ui.host", "localhost")
        self.port = self.config.get("ui.port", 8080)
        self.static_dir = self.config.get("ui.static_dir", "ui/static")
        
        # Set up routes
        self._setup_routes()
        
        # Set up CORS
        self._setup_cors()
        
        logger.info(f"UI server initialized on {self.host}:{self.port}")
    
    def _setup_routes(self) -> None:
        """Set up UI routes."""
        # API routes for UI
        self.app.router.add_get('/api/dashboard/status', self.get_dashboard_status)
        self.app.router.add_get('/api/dashboard/servers', self.get_dashboard_servers)
        self.app.router.add_get('/api/dashboard/clients', self.get_dashboard_clients)
        self.app.router.add_get('/api/dashboard/routes', self.get_dashboard_routes)
        self.app.router.add_get('/api/dashboard/users', self.get_dashboard_users)
        
        # Static files
        self.app.router.add_static('/static/', path=self.static_dir, name='static')
        
        # SPA fallback
        self.app.router.add_get('/{path:.*}', self.serve_index)
    
    def _setup_cors(self) -> None:
        """Set up CORS for the UI server."""
        # Configure CORS
        cors = aiohttp_cors.setup(self.app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            )
        })
        
        # Apply CORS to all routes
        for route in list(self.app.router.routes()):
            cors.add(route)
    
    async def start(self) -> None:
        """Start the UI server."""
        logger.info(f"Starting UI server on {self.host}:{self.port}")
        
        # Create runner
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        
        # Create site
        self.site = web.TCPSite(self.runner, self.host, self.port)
        await self.site.start()
        
        logger.info(f"UI server started on http://{self.host}:{self.port}")
    
    async def stop(self) -> None:
        """Stop the UI server."""
        logger.info("Stopping UI server")
        
        if self.site:
            await self.site.stop()
        
        if self.runner:
            await self.runner.cleanup()
        
        logger.info("UI server stopped")
    
    # API handlers
    
    async def get_dashboard_status(self, request: web.Request) -> web.Response:
        """
        Get dashboard status.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with dashboard status
        """
        # Get hub status
        status = {
            "status": "running" if self.hub_manager.running else "stopped",
            "server_count": len(self.hub_manager.registry.get_all_servers()),
            "client_count": len(self.hub_manager.client_manager.get_all_clients()),
            "mcp_server_count": len(self.hub_manager.server_manager.connections),
            "mcp_client_count": len(self.hub_manager.client_manager.connections),
            "route_count": len(self.hub_manager.router.get_routes())
        }
        
        return web.json_response(status)
    
    async def get_dashboard_servers(self, request: web.Request) -> web.Response:
        """
        Get dashboard servers.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with dashboard servers
        """
        # Get all servers
        servers = self.hub_manager.get_all_server_statuses()
        
        return web.json_response({"servers": servers})
    
    async def get_dashboard_clients(self, request: web.Request) -> web.Response:
        """
        Get dashboard clients.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with dashboard clients
        """
        # Get all clients
        clients = self.hub_manager.client_manager.get_all_clients()
        
        # Get all MCP clients
        mcp_clients = self.hub_manager.client_manager.get_all_mcp_client_statuses()
        
        return web.json_response({
            "clients": clients,
            "mcp_clients": mcp_clients
        })
    
    async def get_dashboard_routes(self, request: web.Request) -> web.Response:
        """
        Get dashboard routes.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with dashboard routes
        """
        # Get all routes
        routes = self.hub_manager.router.get_routes()
        
        # Convert routes to strings
        route_strings = [str(route) for route in routes]
        
        return web.json_response({"routes": route_strings})
    
    async def get_dashboard_users(self, request: web.Request) -> web.Response:
        """
        Get dashboard users.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with dashboard users
        """
        # Get all users with roles
        users = {}
        
        for username, roles in self.hub_manager.acl.user_roles.items():
            users[username] = {
                "username": username,
                "roles": roles
            }
        
        return web.json_response({"users": users})
    
    async def serve_index(self, request: web.Request) -> web.Response:
        """
        Serve the index.html file for SPA routing.
        
        Args:
            request: HTTP request
            
        Returns:
            HTTP response with index.html
        """
        index_path = os.path.join(self.static_dir, "index.html")
        
        if os.path.exists(index_path):
            with open(index_path, "r") as f:
                content = f.read()
            
            return web.Response(text=content, content_type="text/html")
