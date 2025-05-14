#!/usr/bin/env python3
"""
API Server for Nexus MCP Hub.

This module provides a REST API for managing the Nexus MCP Hub.
It allows for server registration, status monitoring, and control.
"""

import logging
import asyncio
import json
from typing import Dict, List, Optional, Any
from aiohttp import web
import aiohttp_cors

from nexus.core import get_config_manager, HubManager
from nexus.core.router import Route, RouteType, RouteTarget
from nexus.core.security import Permission, Resource
from nexus.core.monitoring import HealthStatus

# Setup logging
logger = logging.getLogger(__name__)

class ApiServer:
    """API server for Nexus MCP Hub."""

    def __init__(self, hub_manager: HubManager):
        """
        Initialize the API server.

        Args:
            hub_manager: Hub manager instance
        """
        self.config = get_config_manager()
        self.hub_manager = hub_manager
        self.app = web.Application(middlewares=[self._auth_middleware])
        self.runner = None
        self.site = None

        # Define public routes (no authentication required)
        self.public_routes = [
            '/api/hub/status',
            '/api/auth/login',
            '/api/auth/validate',
            '/api/monitoring/health'
        ]

        # Set up routes
        self._setup_routes()

        # Set up CORS
        self._setup_cors()

        logger.info("API server initialized")

    @web.middleware
    async def _auth_middleware(self, request: web.Request, handler):
        """
        Authentication middleware.

        Args:
            request: HTTP request
            handler: Request handler

        Returns:
            HTTP response
        """
        # Skip authentication for public routes
        if any(request.path.startswith(route) for route in self.public_routes):
            return await handler(request)

        # Get authentication token
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return web.json_response({"error": "Authentication required"}, status=401)

        # Extract token
        parts = auth_header.split()

        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return web.json_response({"error": "Invalid authentication header"}, status=401)

        token = parts[1]

        # Validate token
        user_info = self.hub_manager.validate_token(token)

        if not user_info:
            return web.json_response({"error": "Invalid token"}, status=401)

        # Store user info in request
        request['user_info'] = user_info
        request['token'] = token

        # Continue with the request
        return await handler(request)

    def _setup_routes(self) -> None:
        """Set up API routes."""
        # Authentication
        self.app.router.add_post('/api/auth/login', self.login)
        self.app.router.add_post('/api/auth/logout', self.logout)
        self.app.router.add_post('/api/auth/validate', self.validate_auth)

        # Server management
        self.app.router.add_get('/api/servers', self.get_servers)
        self.app.router.add_get('/api/servers/{server_id}', self.get_server)
        self.app.router.add_post('/api/servers', self.register_server)
        self.app.router.add_delete('/api/servers/{server_id}', self.unregister_server)
        self.app.router.add_post('/api/servers/{server_id}/start', self.start_server)
        self.app.router.add_post('/api/servers/{server_id}/stop', self.stop_server)
        self.app.router.add_post('/api/servers/{server_id}/restart', self.restart_server)

        # MCP server management
        self.app.router.add_post('/api/servers/{server_id}/connect', self.connect_server)
        self.app.router.add_post('/api/servers/{server_id}/disconnect', self.disconnect_server)
        self.app.router.add_post('/api/servers/{server_id}/reconnect', self.reconnect_server)

        # MCP server resources
        self.app.router.add_get('/api/servers/{server_id}/resources', self.get_server_resources)
        self.app.router.add_get('/api/servers/{server_id}/resources/{uri}', self.get_server_resource)

        # MCP server tools
        self.app.router.add_get('/api/servers/{server_id}/tools', self.get_server_tools)
        self.app.router.add_post('/api/servers/{server_id}/tools/{name}', self.call_server_tool)

        # MCP server prompts
        self.app.router.add_get('/api/servers/{server_id}/prompts', self.get_server_prompts)
        self.app.router.add_get('/api/servers/{server_id}/prompts/{id}', self.get_server_prompt)

        # MCP server sampling
        self.app.router.add_post('/api/servers/{server_id}/sample', self.sample_from_server)

        # Client management
        self.app.router.add_get('/api/clients', self.get_clients)
        self.app.router.add_get('/api/clients/{client_id}', self.get_client)

        # MCP client management
        self.app.router.add_post('/api/mcp-clients', self.create_mcp_client)
        self.app.router.add_get('/api/mcp-clients', self.get_mcp_clients)
        self.app.router.add_get('/api/mcp-clients/{client_id}', self.get_mcp_client)
        self.app.router.add_delete('/api/mcp-clients/{client_id}', self.disconnect_mcp_client)

        # MCP client notifications
        self.app.router.add_post('/api/mcp-clients/{client_id}/notify/resource-updated', self.notify_client_resource_updated)
        self.app.router.add_post('/api/mcp-clients/{client_id}/notify/resources-changed', self.notify_client_resources_changed)
        self.app.router.add_post('/api/mcp-clients/{client_id}/notify/tools-changed', self.notify_client_tools_changed)
        self.app.router.add_post('/api/mcp-clients/{client_id}/notify/prompts-changed', self.notify_client_prompts_changed)

        # MCP client sampling
        self.app.router.add_post('/api/mcp-clients/{client_id}/sample', self.sample_from_client)

        # Message routing
        self.app.router.add_post('/api/router/routes', self.add_route)
        self.app.router.add_get('/api/router/routes', self.get_routes)
        self.app.router.add_delete('/api/router/routes', self.clear_routes)
        self.app.router.add_post('/api/router/message', self.route_message)

        # User management
        self.app.router.add_get('/api/users/roles', self.get_roles)
        self.app.router.add_post('/api/users/{username}/roles', self.assign_role)
        self.app.router.add_delete('/api/users/{username}/roles/{role_name}', self.revoke_role)

        # Monitoring
        self.app.router.add_get('/api/monitoring/metrics', self.get_metrics)
        self.app.router.add_get('/api/monitoring/health', self.get_health)
        self.app.router.add_get('/api/monitoring/health/check/{check_name}', self.get_health_check)

        # Hub management
        self.app.router.add_get('/api/hub/status', self.get_hub_status)
        self.app.router.add_post('/api/hub/shutdown', self.shutdown_hub)

    def _setup_cors(self) -> None:
        """Set up CORS for the API."""
        # Get CORS origins from configuration
        cors_origins = self.config.get("security.cors_origins", ["*"])

        # Set up CORS
        cors = aiohttp_cors.setup(self.app, defaults={
            origin: aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*"
            ) for origin in cors_origins
        })

        # Apply CORS to all routes
        for route in list(self.app.router.routes()):
            cors.add(route)

    async def start(self) -> None:
        """Start the API server."""
        # Get host and port from configuration
        host = self.config.get("hub.host", "localhost")
        port = self.config.get("hub.port", 8000)

        # Start the server
        self.runner = web.AppRunner(self.app)
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, host, port)
        await self.site.start()

        logger.info(f"API server started on http://{host}:{port}")

    async def stop(self) -> None:
        """Stop the API server."""
        if self.site:
            await self.site.stop()

        if self.runner:
            await self.runner.cleanup()

        self.site = None
        self.runner = None

        logger.info("API server stopped")

    # Server management handlers

    async def get_servers(self, request: web.Request) -> web.Response:
        """
        Get all servers.

        Args:
            request: HTTP request

        Returns:
            HTTP response with server information
        """
        servers = self.hub_manager.get_all_server_statuses()
        return web.json_response(servers)

    async def get_server(self, request: web.Request) -> web.Response:
        """
        Get server information.

        Args:
            request: HTTP request

        Returns:
            HTTP response with server information
        """
        server_id = request.match_info['server_id']
        server = self.hub_manager.get_server_status(server_id)

        if "error" in server:
            return web.json_response({"error": server["error"]}, status=404)

        return web.json_response(server)

    async def register_server(self, request: web.Request) -> web.Response:
        """
        Register a new server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with registration result
        """
        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "id" not in data or "config" not in data:
                return web.json_response({"error": "Missing required fields: id, config"}, status=400)

            server_id = data["id"]
            server_config = data["config"]

            # Register the server
            success = await self.hub_manager.register_server(server_id, server_config)

            if success:
                return web.json_response({"success": True, "id": server_id})
            else:
                return web.json_response({"error": "Failed to register server"}, status=500)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error registering server: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def unregister_server(self, request: web.Request) -> web.Response:
        """
        Unregister a server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with unregistration result
        """
        server_id = request.match_info['server_id']

        # Unregister the server
        success = await self.hub_manager.unregister_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to unregister server: {server_id}"}, status=404)

    async def start_server(self, request: web.Request) -> web.Response:
        """
        Start a server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with start result
        """
        server_id = request.match_info['server_id']

        # Get server configuration
        server = self.hub_manager.get_server_status(server_id)
        if "error" in server:
            return web.json_response({"error": server["error"]}, status=404)

        # Start the server
        success = await self.hub_manager.server_manager.start_server(server_id, server.get("config", {}))

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to start server: {server_id}"}, status=500)

    async def stop_server(self, request: web.Request) -> web.Response:
        """
        Stop a server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with stop result
        """
        server_id = request.match_info['server_id']

        # Stop the server
        success = await self.hub_manager.server_manager.stop_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to stop server: {server_id}"}, status=500)

    async def restart_server(self, request: web.Request) -> web.Response:
        """
        Restart a server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with restart result
        """
        server_id = request.match_info['server_id']

        # Restart the server
        success = await self.hub_manager.server_manager.restart_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to restart server: {server_id}"}, status=500)

    # Client management handlers

    async def get_clients(self, request: web.Request) -> web.Response:
        """
        Get all clients.

        Args:
            request: HTTP request

        Returns:
            HTTP response with client information
        """
        clients = self.hub_manager.client_manager.get_all_clients()
        return web.json_response(clients)

    async def get_client(self, request: web.Request) -> web.Response:
        """
        Get client information.

        Args:
            request: HTTP request

        Returns:
            HTTP response with client information
        """
        client_id = request.match_info['client_id']
        client = self.hub_manager.client_manager.get_client_info(client_id)

        if client is None:
            return web.json_response({"error": f"Client not found: {client_id}"}, status=404)

        return web.json_response(client)

    # Hub management handlers

    async def get_hub_status(self, request: web.Request) -> web.Response:
        """
        Get hub status.

        Args:
            request: HTTP request

        Returns:
            HTTP response with hub status
        """
        status = {
            "running": self.hub_manager.running,
            "servers": len(self.hub_manager.get_all_server_statuses()),
            "clients": len(self.hub_manager.client_manager.get_all_clients())
        }

        return web.json_response(status)

    async def shutdown_hub(self, request: web.Request) -> web.Response:
        """
        Shut down the hub.

        Args:
            request: HTTP request

        Returns:
            HTTP response with shutdown result
        """
        # Schedule shutdown in a separate task
        asyncio.create_task(self._shutdown())

        return web.json_response({"success": True, "message": "Hub shutdown initiated"})

    async def _shutdown(self) -> None:
        """Shut down the hub."""
        # Wait a moment to allow the response to be sent
        await asyncio.sleep(1)

        # Stop the hub manager
        await self.hub_manager.stop()

    # Monitoring handlers

    async def get_metrics(self, request: web.Request) -> web.Response:
        """
        Get metrics.

        Args:
            request: HTTP request

        Returns:
            HTTP response with metrics
        """
        # Check permission
        token = request.get('token')
        if not self.hub_manager.check_permission(token, "monitoring", None, Permission.ADMIN_VIEW):
            return web.json_response({"error": "Permission denied"}, status=403)

        # Get metrics
        metrics = self.hub_manager.metrics_manager.get_all_metrics()

        return web.json_response(metrics)

    async def get_health(self, request: web.Request) -> web.Response:
        """
        Get health status.

        Args:
            request: HTTP request

        Returns:
            HTTP response with health status
        """
        # Get health status
        overall_status = self.hub_manager.health_manager.get_overall_status()
        health_checks = self.hub_manager.health_manager.get_all_health_checks()

        # Determine HTTP status code based on health status
        status_code = 200
        if overall_status == HealthStatus.DEGRADED:
            status_code = 429  # Too Many Requests
        elif overall_status == HealthStatus.UNHEALTHY:
            status_code = 503  # Service Unavailable

        return web.json_response({
            "status": overall_status.value,
            "checks": health_checks
        }, status=status_code)

    async def get_health_check(self, request: web.Request) -> web.Response:
        """
        Get a specific health check.

        Args:
            request: HTTP request

        Returns:
            HTTP response with health check
        """
        # Get health check name
        check_name = request.match_info['check_name']

        # Get health check
        health_check = self.hub_manager.health_manager.get_health_check(check_name)

        if not health_check:
            return web.json_response({"error": f"Health check not found: {check_name}"}, status=404)

        # Determine HTTP status code based on health status
        status_code = 200
        if health_check.status == HealthStatus.DEGRADED:
            status_code = 429  # Too Many Requests
        elif health_check.status == HealthStatus.UNHEALTHY:
            status_code = 503  # Service Unavailable

        return web.json_response(health_check.to_dict(), status=status_code)

    # Authentication handlers

    async def login(self, request: web.Request) -> web.Response:
        """
        Authenticate a user and generate a token.

        Args:
            request: HTTP request

        Returns:
            HTTP response with authentication result
        """
        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "credentials" not in data:
                return web.json_response({"error": "Missing required field: credentials"}, status=400)

            credentials = data["credentials"]
            provider = data.get("provider")

            # Authenticate user
            user_info = self.hub_manager.authenticate(credentials, provider)

            if user_info:
                # Generate token
                token = self.hub_manager.auth_manager.generate_token(user_info)

                return web.json_response({
                    "token": token,
                    "user": user_info
                })
            else:
                return web.json_response({"error": "Authentication failed"}, status=401)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error during login: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def logout(self, request: web.Request) -> web.Response:
        """
        Revoke an authentication token.

        Args:
            request: HTTP request

        Returns:
            HTTP response with logout result
        """
        # Get token from request
        token = request.get('token')

        if not token:
            return web.json_response({"error": "Not authenticated"}, status=401)

        # Revoke token
        success = self.hub_manager.auth_manager.revoke_token(token)

        return web.json_response({"success": success})

    async def validate_auth(self, request: web.Request) -> web.Response:
        """
        Validate an authentication token.

        Args:
            request: HTTP request

        Returns:
            HTTP response with validation result
        """
        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "token" not in data:
                return web.json_response({"error": "Missing required field: token"}, status=400)

            token = data["token"]

            # Validate token
            user_info = self.hub_manager.validate_token(token)

            if user_info:
                return web.json_response({
                    "valid": True,
                    "user": user_info
                })
            else:
                return web.json_response({
                    "valid": False
                })
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error validating token: {e}")
            return web.json_response({"error": str(e)}, status=500)

    # User management handlers

    async def get_roles(self, request: web.Request) -> web.Response:
        """
        Get all roles.

        Args:
            request: HTTP request

        Returns:
            HTTP response with roles
        """
        # Check permission
        token = request.get('token')
        if not self.hub_manager.check_permission(token, "admin", None, Permission.ADMIN_VIEW):
            return web.json_response({"error": "Permission denied"}, status=403)

        # Get roles
        roles = {role_name: role.to_dict() for role_name, role in self.hub_manager.acl.roles.items()}

        return web.json_response({"roles": roles})

    async def assign_role(self, request: web.Request) -> web.Response:
        """
        Assign a role to a user.

        Args:
            request: HTTP request

        Returns:
            HTTP response with assignment result
        """
        # Check permission
        token = request.get('token')
        if not self.hub_manager.check_permission(token, "admin", None, Permission.ADMIN_MODIFY):
            return web.json_response({"error": "Permission denied"}, status=403)

        username = request.match_info['username']

        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "role" not in data:
                return web.json_response({"error": "Missing required field: role"}, status=400)

            role_name = data["role"]

            # Assign role
            success = self.hub_manager.assign_role(username, role_name)

            if success:
                return web.json_response({"success": True})
            else:
                return web.json_response({"error": f"Failed to assign role {role_name} to user {username}"}, status=400)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error assigning role: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def revoke_role(self, request: web.Request) -> web.Response:
        """
        Revoke a role from a user.

        Args:
            request: HTTP request

        Returns:
            HTTP response with revocation result
        """
        # Check permission
        token = request.get('token')
        if not self.hub_manager.check_permission(token, "admin", None, Permission.ADMIN_MODIFY):
            return web.json_response({"error": "Permission denied"}, status=403)

        username = request.match_info['username']
        role_name = request.match_info['role_name']

        # Revoke role
        success = self.hub_manager.revoke_role(username, role_name)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to revoke role {role_name} from user {username}"}, status=400)

    # MCP server management handlers

    async def connect_server(self, request: web.Request) -> web.Response:
        """
        Connect to an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with connection result
        """
        server_id = request.match_info['server_id']

        # Connect to the server
        success = await self.hub_manager.connect_to_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to connect to server: {server_id}"}, status=500)

    async def disconnect_server(self, request: web.Request) -> web.Response:
        """
        Disconnect from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with disconnection result
        """
        server_id = request.match_info['server_id']

        # Disconnect from the server
        success = await self.hub_manager.disconnect_from_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to disconnect from server: {server_id}"}, status=500)

    async def reconnect_server(self, request: web.Request) -> web.Response:
        """
        Reconnect to an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with reconnection result
        """
        server_id = request.match_info['server_id']

        # Reconnect to the server
        success = await self.hub_manager.reconnect_to_server(server_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to reconnect to server: {server_id}"}, status=500)

    # MCP server resource handlers

    async def get_server_resources(self, request: web.Request) -> web.Response:
        """
        Get resources from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with resources
        """
        server_id = request.match_info['server_id']

        # Get server connection
        connection = self.hub_manager.server_manager.get_connection(server_id)
        if not connection:
            return web.json_response({"error": f"Server not connected: {server_id}"}, status=404)

        # Get resources
        resources = list(connection.interface.resources.values())

        return web.json_response({"resources": resources})

    async def get_server_resource(self, request: web.Request) -> web.Response:
        """
        Get a resource from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with resource
        """
        server_id = request.match_info['server_id']
        uri = request.match_info['uri']

        # Get the resource
        resource = await self.hub_manager.get_server_resource(server_id, uri)

        if resource:
            return web.json_response(resource)
        else:
            return web.json_response({"error": f"Resource not found: {uri}"}, status=404)

    # MCP server tool handlers

    async def get_server_tools(self, request: web.Request) -> web.Response:
        """
        Get tools from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with tools
        """
        server_id = request.match_info['server_id']

        # Get server connection
        connection = self.hub_manager.server_manager.get_connection(server_id)
        if not connection:
            return web.json_response({"error": f"Server not connected: {server_id}"}, status=404)

        # Get tools
        tools = list(connection.interface.tools.values())

        return web.json_response({"tools": tools})

    async def call_server_tool(self, request: web.Request) -> web.Response:
        """
        Call a tool on an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with tool result
        """
        server_id = request.match_info['server_id']
        name = request.match_info['name']

        try:
            # Parse request body
            data = await request.json()
            arguments = data.get("arguments", {})

            # Call the tool
            result = await self.hub_manager.call_server_tool(server_id, name, arguments)

            if result is not None:
                return web.json_response(result)
            else:
                return web.json_response({"error": f"Failed to call tool: {name}"}, status=500)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error calling tool {name} on server {server_id}: {e}")
            return web.json_response({"error": str(e)}, status=500)

    # MCP server prompt handlers

    async def get_server_prompts(self, request: web.Request) -> web.Response:
        """
        Get prompts from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with prompts
        """
        server_id = request.match_info['server_id']

        # Get server connection
        connection = self.hub_manager.server_manager.get_connection(server_id)
        if not connection:
            return web.json_response({"error": f"Server not connected: {server_id}"}, status=404)

        # Get prompts
        prompts = list(connection.interface.prompts.values())

        return web.json_response({"prompts": prompts})

    async def get_server_prompt(self, request: web.Request) -> web.Response:
        """
        Get a prompt from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with prompt
        """
        server_id = request.match_info['server_id']
        id = request.match_info['id']

        # Get the prompt
        prompt = await self.hub_manager.get_server_prompt(server_id, id)

        if prompt:
            return web.json_response(prompt)
        else:
            return web.json_response({"error": f"Prompt not found: {id}"}, status=404)

    # MCP server sampling handlers

    async def sample_from_server(self, request: web.Request) -> web.Response:
        """
        Sample from an MCP server.

        Args:
            request: HTTP request

        Returns:
            HTTP response with sampling result
        """
        server_id = request.match_info['server_id']

        try:
            # Parse request body
            data = await request.json()

            # Sample from the server
            result = await self.hub_manager.sample_from_server(server_id, data)

            if result is not None:
                return web.json_response(result)
            else:
                return web.json_response({"error": "Failed to sample from server"}, status=500)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error sampling from server {server_id}: {e}")
            return web.json_response({"error": str(e)}, status=500)

    # MCP client management handlers

    async def create_mcp_client(self, request: web.Request) -> web.Response:
        """
        Create a new MCP client connection.

        Args:
            request: HTTP request

        Returns:
            HTTP response with client ID
        """
        try:
            # Parse request body
            data = await request.json()

            # Get transport type and arguments
            transport_type = data.get("transport_type", "http")
            transport_args = data.get("transport_args", {})

            # Create the client
            client_id = await self.hub_manager.create_mcp_client(transport_type, **transport_args)

            return web.json_response({"client_id": client_id})
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error creating MCP client: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def get_mcp_clients(self, request: web.Request) -> web.Response:
        """
        Get all MCP client connections.

        Args:
            request: HTTP request

        Returns:
            HTTP response with client statuses
        """
        clients = self.hub_manager.get_all_mcp_client_statuses()
        return web.json_response(clients)

    async def get_mcp_client(self, request: web.Request) -> web.Response:
        """
        Get an MCP client connection.

        Args:
            request: HTTP request

        Returns:
            HTTP response with client status
        """
        client_id = request.match_info['client_id']

        # Get client status
        status = self.hub_manager.get_mcp_client_status(client_id)

        if status:
            return web.json_response(status)
        else:
            return web.json_response({"error": f"Client not found: {client_id}"}, status=404)

    async def disconnect_mcp_client(self, request: web.Request) -> web.Response:
        """
        Disconnect an MCP client connection.

        Args:
            request: HTTP request

        Returns:
            HTTP response with disconnection result
        """
        client_id = request.match_info['client_id']

        # Disconnect the client
        success = await self.hub_manager.disconnect_mcp_client(client_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to disconnect client: {client_id}"}, status=500)

    # MCP client notification handlers

    async def notify_client_resource_updated(self, request: web.Request) -> web.Response:
        """
        Notify a client that a resource has been updated.

        Args:
            request: HTTP request

        Returns:
            HTTP response with notification result
        """
        client_id = request.match_info['client_id']

        try:
            # Parse request body
            data = await request.json()

            # Get resource URI
            uri = data.get("uri")
            if not uri:
                return web.json_response({"error": "Missing required parameter: uri"}, status=400)

            # Notify the client
            success = await self.hub_manager.notify_client_resource_updated(client_id, uri)

            if success:
                return web.json_response({"success": True})
            else:
                return web.json_response({"error": f"Failed to notify client: {client_id}"}, status=500)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error notifying client {client_id}: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def notify_client_resources_changed(self, request: web.Request) -> web.Response:
        """
        Notify a client that the list of resources has changed.

        Args:
            request: HTTP request

        Returns:
            HTTP response with notification result
        """
        client_id = request.match_info['client_id']

        # Notify the client
        success = await self.hub_manager.notify_client_resources_changed(client_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to notify client: {client_id}"}, status=500)

    async def notify_client_tools_changed(self, request: web.Request) -> web.Response:
        """
        Notify a client that the list of tools has changed.

        Args:
            request: HTTP request

        Returns:
            HTTP response with notification result
        """
        client_id = request.match_info['client_id']

        # Notify the client
        success = await self.hub_manager.notify_client_tools_changed(client_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to notify client: {client_id}"}, status=500)

    async def notify_client_prompts_changed(self, request: web.Request) -> web.Response:
        """
        Notify a client that the list of prompts has changed.

        Args:
            request: HTTP request

        Returns:
            HTTP response with notification result
        """
        client_id = request.match_info['client_id']

        # Notify the client
        success = await self.hub_manager.notify_client_prompts_changed(client_id)

        if success:
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": f"Failed to notify client: {client_id}"}, status=500)

    async def sample_from_client(self, request: web.Request) -> web.Response:
        """
        Request a sample from a client.

        Args:
            request: HTTP request

        Returns:
            HTTP response with sampling result
        """
        client_id = request.match_info['client_id']

        try:
            # Parse request body
            data = await request.json()

            # Sample from the client
            result = await self.hub_manager.sample_from_client(client_id, data)

            if result is not None:
                return web.json_response(result)
            else:
                return web.json_response({"error": "Failed to sample from client"}, status=500)
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error sampling from client {client_id}: {e}")
            return web.json_response({"error": str(e)}, status=500)

    # Message routing handlers

    async def add_route(self, request: web.Request) -> web.Response:
        """
        Add a route to the message router.

        Args:
            request: HTTP request

        Returns:
            HTTP response with route addition result
        """
        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "source" not in data or "destination" not in data:
                return web.json_response({"error": "Missing required fields: source, destination"}, status=400)

            # Parse source
            source_data = data["source"]
            if "type" not in source_data:
                return web.json_response({"error": "Missing required field: source.type"}, status=400)

            try:
                source_type = RouteType(source_data["type"])
            except ValueError:
                return web.json_response({"error": f"Invalid source type: {source_data['type']}"}, status=400)

            source_id = source_data.get("id")
            source_capability = source_data.get("capability")

            # Create source target
            try:
                source = RouteTarget(source_type, source_id, source_capability)
            except ValueError as e:
                return web.json_response({"error": f"Invalid source: {str(e)}"}, status=400)

            # Parse destination
            dest_data = data["destination"]
            if "type" not in dest_data:
                return web.json_response({"error": "Missing required field: destination.type"}, status=400)

            try:
                dest_type = RouteType(dest_data["type"])
            except ValueError:
                return web.json_response({"error": f"Invalid destination type: {dest_data['type']}"}, status=400)

            dest_id = dest_data.get("id")
            dest_capability = dest_data.get("capability")

            # Create destination target
            try:
                destination = RouteTarget(dest_type, dest_id, dest_capability)
            except ValueError as e:
                return web.json_response({"error": f"Invalid destination: {str(e)}"}, status=400)

            # Get method pattern
            method_pattern = data.get("method_pattern")

            # Create route
            route = Route(source, destination, method_pattern)

            # Add route
            self.hub_manager.router.add_route(route)

            return web.json_response({"success": True, "route": str(route)})
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error adding route: {e}")
            return web.json_response({"error": str(e)}, status=500)

    async def get_routes(self, request: web.Request) -> web.Response:
        """
        Get all routes from the message router.

        Args:
            request: HTTP request

        Returns:
            HTTP response with routes
        """
        routes = self.hub_manager.router.get_routes()

        # Convert routes to strings
        route_strings = [str(route) for route in routes]

        return web.json_response({"routes": route_strings})

    async def clear_routes(self, request: web.Request) -> web.Response:
        """
        Clear all routes from the message router.

        Args:
            request: HTTP request

        Returns:
            HTTP response with route clearing result
        """
        self.hub_manager.router.clear_routes()

        return web.json_response({"success": True})

    async def route_message(self, request: web.Request) -> web.Response:
        """
        Route a message through the hub.

        Args:
            request: HTTP request

        Returns:
            HTTP response with routing result
        """
        try:
            # Parse request body
            data = await request.json()

            # Check required fields
            if "message" not in data or "source" not in data:
                return web.json_response({"error": "Missing required fields: message, source"}, status=400)

            message = data["message"]
            source_data = data["source"]

            # Parse source
            if "type" not in source_data:
                return web.json_response({"error": "Missing required field: source.type"}, status=400)

            try:
                source_type = RouteType(source_data["type"])
            except ValueError:
                return web.json_response({"error": f"Invalid source type: {source_data['type']}"}, status=400)

            source_id = source_data.get("id")

            # Route the message
            result = await self.hub_manager.route_message(message, source_type, source_id)

            if result is not None:
                return web.json_response(result)
            else:
                return web.json_response({"success": True})
        except json.JSONDecodeError:
            return web.json_response({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            logger.error(f"Error routing message: {e}")
            return web.json_response({"error": str(e)}, status=500)
