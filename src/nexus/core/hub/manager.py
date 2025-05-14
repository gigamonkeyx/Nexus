#!/usr/bin/env python3
"""
Hub Manager for Nexus MCP Hub.

This module provides the central hub manager that coordinates MCP servers and clients.
It follows the official MCP specification from modelcontextprotocol.io.
"""

import logging
import asyncio
import time
from typing import Dict, List, Optional, Any, Set
from pathlib import Path

from ..config import get_config_manager
from .server_manager import ServerManager
from .client_manager import ClientManager
from .registry import ServerRegistry
from ..router import MessageRouter, Route, RouteType, RouteTarget
from ..security import AuthManager, AccessControlList, Permission, Resource
from ..ui import UiServer
from ..monitoring import (
    MetricsManager, Metric, MetricType,
    HealthManager, HealthCheck, HealthStatus,
    setup_logging, get_logger
)

# Setup logging
logger = logging.getLogger(__name__)

class HubManager:
    """
    Central manager for the Nexus MCP Hub.

    This class manages the lifecycle of MCP servers and clients, handles
    server registration and discovery, and coordinates communication.
    """

    def __init__(self):
        """Initialize the Hub Manager."""
        self.config = get_config_manager()
        self.server_manager = ServerManager()
        self.client_manager = ClientManager()
        self.registry = ServerRegistry()
        self.router = MessageRouter()
        self.auth_manager = AuthManager()
        self.acl = AccessControlList()
        self.ui_server = UiServer(self)
        self.metrics_manager = MetricsManager()
        self.health_manager = HealthManager()
        self.running = False
        self._shutdown_event = asyncio.Event()
        self._start_time = time.time()

        # Load configuration
        self._load_configuration()

        # Set up message handlers
        self._setup_message_handlers()

        # Set up health checks
        self._setup_health_checks()

        logger.info("Hub Manager initialized")

    def _setup_message_handlers(self) -> None:
        """Set up message handlers for the router."""
        # Register handlers for different route types
        self.router.register_message_handler(RouteType.SERVER, self._handle_server_message)
        self.router.register_message_handler(RouteType.CLIENT, self._handle_client_message)
        self.router.register_message_handler(RouteType.HUB, self._handle_hub_message)
        self.router.register_message_handler(RouteType.ALL_SERVERS, self._handle_all_servers_message)
        self.router.register_message_handler(RouteType.ALL_CLIENTS, self._handle_all_clients_message)
        self.router.register_message_handler(RouteType.CAPABILITY, self._handle_capability_message)

    def _setup_health_checks(self) -> None:
        """Set up health checks for the hub."""
        # Register health checks
        self.health_manager.register_health_check(
            "hub_status",
            "Check if the hub is running",
            self._check_hub_health
        )

        self.health_manager.register_health_check(
            "server_manager_status",
            "Check if the server manager is running",
            self._check_server_manager_health
        )

        self.health_manager.register_health_check(
            "client_manager_status",
            "Check if the client manager is running",
            self._check_client_manager_health
        )

        self.health_manager.register_health_check(
            "registry_status",
            "Check if the server registry is available",
            self._check_registry_health
        )

    async def _check_hub_health(self) -> HealthStatus:
        """
        Check the health of the hub.

        Returns:
            Health status
        """
        if not self.running:
            return HealthStatus.UNHEALTHY

        # Check if the hub has been running for at least 5 minutes
        uptime = time.time() - self._start_time
        if uptime < 300:  # 5 minutes
            return HealthStatus.DEGRADED

        return HealthStatus.HEALTHY

    async def _check_server_manager_health(self) -> HealthStatus:
        """
        Check the health of the server manager.

        Returns:
            Health status
        """
        if not self.server_manager.running:
            return HealthStatus.UNHEALTHY

        return HealthStatus.HEALTHY

    async def _check_client_manager_health(self) -> HealthStatus:
        """
        Check the health of the client manager.

        Returns:
            Health status
        """
        if not self.client_manager.running:
            return HealthStatus.UNHEALTHY

        return HealthStatus.HEALTHY

    async def _check_registry_health(self) -> HealthStatus:
        """
        Check the health of the server registry.

        Returns:
            Health status
        """
        try:
            # Try to get all servers
            servers = self.registry.get_all_servers()
            return HealthStatus.HEALTHY
        except Exception as e:
            logger.error(f"Registry health check failed: {e}")
            return HealthStatus.UNHEALTHY

    def _load_configuration(self) -> None:
        """Load configuration settings for the hub."""
        # Load server registry
        registry_file = self.config.get("hub.registry_file")
        if registry_file:
            self.registry.load(registry_file)

        # Load other settings
        self.host = self.config.get("hub.host", "localhost")
        self.port = self.config.get("hub.port", 8000)
        self.auto_start = self.config.get("servers.auto_start", True)
        self.auto_restart = self.config.get("servers.auto_restart", True)

        logger.debug(f"Hub configuration loaded: host={self.host}, port={self.port}")

    async def start(self) -> None:
        """Start the hub manager and all registered servers."""
        if self.running:
            logger.warning("Hub Manager is already running")
            return

        logger.info("Starting Hub Manager")
        self.running = True
        self._start_time = time.time()

        # Initialize server registry
        await self.registry.initialize()

        # Start server manager
        await self.server_manager.start()

        # Start client manager
        await self.client_manager.start()

        # Start UI server
        await self.ui_server.start()

        # Start metrics manager
        await self.metrics_manager.start()

        # Start health manager
        await self.health_manager.start()

        # Auto-start servers if configured
        if self.auto_start:
            await self._auto_start_servers()

        # Update metrics
        self.metrics_manager.set_gauge("hub_uptime", 0)
        self.metrics_manager.set_gauge("hub_server_count", len(self.registry.get_all_servers()))
        self.metrics_manager.set_gauge("hub_client_count", len(self.client_manager.get_all_clients()))
        self.metrics_manager.set_gauge("hub_mcp_server_count", len(self.server_manager.connections))
        self.metrics_manager.set_gauge("hub_mcp_client_count", len(self.client_manager.connections))

        # Start metrics update task
        self._metrics_update_task = asyncio.create_task(self._update_metrics_task())

        logger.info(f"Hub Manager started on {self.host}:{self.port}")

    async def _update_metrics_task(self) -> None:
        """Task to update metrics periodically."""
        update_interval = self.config.get("monitoring.metrics.update_interval", 10)  # 10 seconds

        while self.running:
            try:
                # Update uptime
                uptime = time.time() - self._start_time
                self.metrics_manager.set_gauge("hub_uptime", uptime)

                # Update server counts
                self.metrics_manager.set_gauge("hub_server_count", len(self.registry.get_all_servers()))
                self.metrics_manager.set_gauge("hub_mcp_server_count", len(self.server_manager.connections))

                # Update client counts
                self.metrics_manager.set_gauge("hub_client_count", len(self.client_manager.get_all_clients()))
                self.metrics_manager.set_gauge("hub_mcp_client_count", len(self.client_manager.connections))

                # Wait for the next update
                await asyncio.sleep(update_interval)
            except asyncio.CancelledError:
                logger.debug("Metrics update task cancelled")
                break
            except Exception as e:
                logger.error(f"Error updating metrics: {e}")
                await asyncio.sleep(1)  # Wait a bit before retrying

    async def _auto_start_servers(self) -> None:
        """Auto-start registered servers based on configuration."""
        servers = self.registry.get_all_servers()
        for server_id, server_config in servers.items():
            if server_config.get("auto_start", True):
                logger.info(f"Auto-starting server: {server_id}")
                try:
                    await self.server_manager.start_server(server_id, server_config)
                except Exception as e:
                    logger.error(f"Failed to auto-start server {server_id}: {e}")

    async def stop(self) -> None:
        """Stop the hub manager and all managed servers."""
        if not self.running:
            logger.warning("Hub Manager is not running")
            return

        logger.info("Stopping Hub Manager")

        # Stop all servers
        await self.server_manager.stop_all()

        # Stop client manager
        await self.client_manager.stop()

        # Stop UI server
        await self.ui_server.stop()

        # Cancel metrics update task
        if hasattr(self, '_metrics_update_task') and self._metrics_update_task:
            self._metrics_update_task.cancel()
            try:
                await self._metrics_update_task
            except asyncio.CancelledError:
                pass

        # Stop metrics manager
        await self.metrics_manager.stop()

        # Stop health manager
        await self.health_manager.stop()

        # Stop server manager
        await self.server_manager.stop()

        # Set shutdown event
        self._shutdown_event.set()

        self.running = False
        logger.info("Hub Manager stopped")

    async def register_server(self, server_id: str, server_config: Dict[str, Any]) -> bool:
        """
        Register a new MCP server with the hub.

        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration

        Returns:
            True if registration was successful, False otherwise
        """
        try:
            # Validate server configuration
            if not self._validate_server_config(server_config):
                logger.error(f"Invalid server configuration for {server_id}")
                return False

            # Register with the registry
            self.registry.register_server(server_id, server_config)

            # Save registry
            self.registry.save(self.config.get("hub.registry_file"))

            logger.info(f"Server registered: {server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to register server {server_id}: {e}")
            return False

    def _validate_server_config(self, server_config: Dict[str, Any]) -> bool:
        """
        Validate server configuration.

        Args:
            server_config: Server configuration to validate

        Returns:
            True if configuration is valid, False otherwise
        """
        # Check required fields
        required_fields = ["name", "command"]
        for field in required_fields:
            if field not in server_config:
                logger.error(f"Missing required field in server configuration: {field}")
                return False

        # Validate command
        if not isinstance(server_config.get("command"), str):
            logger.error("Server command must be a string")
            return False

        # Validate args if present
        args = server_config.get("args", [])
        if not isinstance(args, list):
            logger.error("Server args must be a list")
            return False

        return True

    async def unregister_server(self, server_id: str) -> bool:
        """
        Unregister an MCP server from the hub.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if unregistration was successful, False otherwise
        """
        try:
            # Stop the server if it's running
            if self.server_manager.is_server_running(server_id):
                await self.server_manager.stop_server(server_id)

            # Unregister from the registry
            self.registry.unregister_server(server_id)

            # Save registry
            self.registry.save(self.config.get("hub.registry_file"))

            logger.info(f"Server unregistered: {server_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to unregister server {server_id}: {e}")
            return False

    def get_server_status(self, server_id: str) -> Dict[str, Any]:
        """
        Get the status of a registered server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            Dictionary with server status information
        """
        # Get server configuration
        server_config = self.registry.get_server(server_id)
        if not server_config:
            return {"error": f"Server not found: {server_id}"}

        # Get runtime status
        running = self.server_manager.is_server_running(server_id)

        # Compile status information
        status = {
            "id": server_id,
            "name": server_config.get("name", server_id),
            "running": running,
            "auto_start": server_config.get("auto_start", True),
            "auto_restart": server_config.get("auto_restart", True),
        }

        # Add additional runtime information if available
        runtime_info = self.server_manager.get_server_info(server_id)
        if runtime_info:
            status.update(runtime_info)

        # Add MCP connection status
        status["mcp_connected"] = self.server_manager.is_server_connected(server_id)
        status["mcp_initialized"] = self.server_manager.is_server_initialized(server_id)

        return status

    def get_all_server_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the status of all registered servers.

        Returns:
            Dictionary mapping server IDs to status information
        """
        servers = self.registry.get_all_servers()
        statuses = {}

        for server_id in servers:
            statuses[server_id] = self.get_server_status(server_id)

        return statuses

    async def wait_for_shutdown(self) -> None:
        """Wait for the hub manager to shut down."""
        await self._shutdown_event.wait()

    async def connect_to_server(self, server_id: str) -> bool:
        """
        Connect to an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the connection was successful, False otherwise
        """
        # Check if server exists
        server_config = self.registry.get_server(server_id)
        if not server_config:
            logger.error(f"Cannot connect to server {server_id}: not found")
            return False

        # Connect to the server
        return await self.server_manager.connect_server(server_id, server_config)

    async def disconnect_from_server(self, server_id: str) -> bool:
        """
        Disconnect from an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the disconnection was successful, False otherwise
        """
        return await self.server_manager.disconnect_server(server_id)

    async def reconnect_to_server(self, server_id: str) -> bool:
        """
        Reconnect to an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the reconnection was successful, False otherwise
        """
        return await self.server_manager.reconnect_server(server_id)

    async def get_server_resource(self, server_id: str, uri: str) -> Optional[Dict[str, Any]]:
        """
        Get a resource from an MCP server.

        Args:
            server_id: Unique identifier for the server
            uri: Resource URI

        Returns:
            Resource contents, or None if not found
        """
        # Get the server connection
        connection = self.server_manager.get_connection(server_id)
        if not connection:
            logger.error(f"Cannot get resource from server {server_id}: not connected")
            return None

        # Get the resource
        return await connection.get_resource(uri)

    async def call_server_tool(self, server_id: str, name: str, arguments: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call a tool on an MCP server.

        Args:
            server_id: Unique identifier for the server
            name: Tool name
            arguments: Tool arguments

        Returns:
            Tool result, or None if the call failed
        """
        # Get the server connection
        connection = self.server_manager.get_connection(server_id)
        if not connection:
            logger.error(f"Cannot call tool on server {server_id}: not connected")
            return None

        # Call the tool
        return await connection.call_tool(name, arguments)

    async def get_server_prompt(self, server_id: str, id: str) -> Optional[Dict[str, Any]]:
        """
        Get a prompt from an MCP server.

        Args:
            server_id: Unique identifier for the server
            id: Prompt ID

        Returns:
            Prompt details, or None if not found
        """
        # Get the server connection
        connection = self.server_manager.get_connection(server_id)
        if not connection:
            logger.error(f"Cannot get prompt from server {server_id}: not connected")
            return None

        # Get the prompt
        return await connection.get_prompt(id)

    async def sample_from_server(self, server_id: str, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Sample from an MCP server.

        Args:
            server_id: Unique identifier for the server
            request: Sampling request

        Returns:
            Sampling result, or None if the sampling failed
        """
        # Get the server connection
        connection = self.server_manager.get_connection(server_id)
        if not connection:
            logger.error(f"Cannot sample from server {server_id}: not connected")
            return None

        # Sample from the server
        return await connection.sample(request)

    # Client management methods

    async def create_mcp_client(self, transport_type: str, **transport_args) -> str:
        """
        Create a new MCP client connection.

        Args:
            transport_type: Type of transport to use (stdio, http)
            **transport_args: Additional arguments for the transport

        Returns:
            Client ID
        """
        return await self.client_manager.create_mcp_client(transport_type, **transport_args)

    async def disconnect_mcp_client(self, client_id: str) -> bool:
        """
        Disconnect an MCP client connection.

        Args:
            client_id: Client ID

        Returns:
            True if the client was disconnected, False otherwise
        """
        return await self.client_manager.disconnect_mcp_client(client_id)

    def get_mcp_client_status(self, client_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of an MCP client connection.

        Args:
            client_id: Client ID

        Returns:
            Client status, or None if not found
        """
        return self.client_manager.get_mcp_client_status(client_id)

    def get_all_mcp_client_statuses(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the status of all MCP client connections.

        Returns:
            Dictionary mapping client IDs to client statuses
        """
        return self.client_manager.get_all_mcp_client_statuses()

    async def notify_client_resource_updated(self, client_id: str, uri: str) -> bool:
        """
        Notify a client that a resource has been updated.

        Args:
            client_id: Client ID
            uri: Resource URI

        Returns:
            True if the notification was sent, False otherwise
        """
        return await self.client_manager.notify_resource_updated(client_id, uri)

    async def notify_client_resources_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of resources has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        return await self.client_manager.notify_resources_changed(client_id)

    async def notify_client_tools_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of tools has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        return await self.client_manager.notify_tools_changed(client_id)

    async def notify_client_prompts_changed(self, client_id: str) -> bool:
        """
        Notify a client that the list of prompts has changed.

        Args:
            client_id: Client ID

        Returns:
            True if the notification was sent, False otherwise
        """
        return await self.client_manager.notify_prompts_changed(client_id)

    async def sample_from_client(self, client_id: str, request: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Request a sample from a client.

        Args:
            client_id: Client ID
            request: Sampling request

        Returns:
            Sampling result, or None if the sampling failed
        """
        return await self.client_manager.sample_from_client(client_id, request)

    # Message routing methods

    async def route_message(self, message: Dict[str, Any], source_type: RouteType, source_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Route a message through the hub.

        Args:
            message: Message to route
            source_type: Type of the source
            source_id: ID of the source (for SERVER and CLIENT routes)

        Returns:
            Response message, or None if no response is needed
        """
        # Create source route target
        if source_type in [RouteType.SERVER, RouteType.CLIENT]:
            if not source_id:
                logger.error(f"Source ID is required for {source_type} routes")
                return None

            source = RouteTarget(source_type, source_id)
        else:
            source = RouteTarget(source_type)

        # Route the message
        return await self.router.route_message(message, source)

    async def _handle_server_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message from a server to a specific destination.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        server_id = source.target_id

        # Get the server connection
        connection = self.server_manager.get_connection(server_id)
        if not connection:
            logger.error(f"Cannot handle message from server {server_id}: not connected")
            return None

        # Handle based on destination type
        if destination.route_type == RouteType.CLIENT:
            # Forward to a specific client
            client_id = destination.target_id
            client = self.client_manager.get_mcp_client(client_id)

            if not client:
                logger.error(f"Cannot forward message to client {client_id}: not found")
                return None

            # Forward the message to the client
            logger.debug(f"Forwarding message from server {server_id} to client {client_id}")
            return await client.interface.forward_message(message)

        elif destination.route_type == RouteType.ALL_CLIENTS:
            # Forward to all clients
            clients = self.client_manager.get_all_mcp_clients()

            if not clients:
                logger.warning("No clients to broadcast message to")
                return None

            # Forward to all clients
            logger.debug(f"Broadcasting message from server {server_id} to all clients")

            # For requests, return the response from the first client
            first_response = None

            for client_id, client in clients.items():
                try:
                    response = await client.interface.forward_message(message)

                    if response and first_response is None:
                        first_response = response
                except Exception as e:
                    logger.error(f"Error forwarding message to client {client_id}: {e}")

            return first_response

        elif destination.route_type == RouteType.HUB:
            # Handle message directed to the hub
            return await self._handle_hub_directed_message(message, source)

        else:
            logger.warning(f"Unsupported destination type for server message: {destination.route_type}")
            return None

    async def _handle_client_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message from a client to a specific destination.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        client_id = source.target_id

        # Get the client connection
        client = self.client_manager.get_mcp_client(client_id)
        if not client:
            logger.error(f"Cannot handle message from client {client_id}: not connected")
            return None

        # Handle based on destination type
        if destination.route_type == RouteType.SERVER:
            # Forward to a specific server
            server_id = destination.target_id
            connection = self.server_manager.get_connection(server_id)

            if not connection:
                logger.error(f"Cannot forward message to server {server_id}: not connected")
                return None

            # Forward the message to the server
            logger.debug(f"Forwarding message from client {client_id} to server {server_id}")
            return await connection.interface.forward_message(message)

        elif destination.route_type == RouteType.ALL_SERVERS:
            # Forward to all servers
            connections = self.server_manager.get_all_connections()

            if not connections:
                logger.warning("No servers to broadcast message to")
                return None

            # Forward to all servers
            logger.debug(f"Broadcasting message from client {client_id} to all servers")

            # For requests, return the response from the first server
            first_response = None

            for server_id, connection in connections.items():
                try:
                    response = await connection.interface.forward_message(message)

                    if response and first_response is None:
                        first_response = response
                except Exception as e:
                    logger.error(f"Error forwarding message to server {server_id}: {e}")

            return first_response

        elif destination.route_type == RouteType.HUB:
            # Handle message directed to the hub
            return await self._handle_hub_directed_message(message, source)

        else:
            logger.warning(f"Unsupported destination type for client message: {destination.route_type}")
            return None

    async def _handle_hub_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message from the hub to a specific destination.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        # Handle based on destination type
        if destination.route_type == RouteType.SERVER:
            # Forward to a specific server
            server_id = destination.target_id
            connection = self.server_manager.get_connection(server_id)

            if not connection:
                logger.error(f"Cannot forward message to server {server_id}: not connected")
                return None

            # Forward the message to the server
            logger.debug(f"Forwarding message from hub to server {server_id}")
            return await connection.interface.forward_message(message)

        elif destination.route_type == RouteType.CLIENT:
            # Forward to a specific client
            client_id = destination.target_id
            client = self.client_manager.get_mcp_client(client_id)

            if not client:
                logger.error(f"Cannot forward message to client {client_id}: not found")
                return None

            # Forward the message to the client
            logger.debug(f"Forwarding message from hub to client {client_id}")
            return await client.interface.forward_message(message)

        elif destination.route_type == RouteType.ALL_SERVERS:
            # Forward to all servers
            connections = self.server_manager.get_all_connections()

            if not connections:
                logger.warning("No servers to broadcast message to")
                return None

            # Forward to all servers
            logger.debug("Broadcasting message from hub to all servers")

            # For requests, return the response from the first server
            first_response = None

            for server_id, connection in connections.items():
                try:
                    response = await connection.interface.forward_message(message)

                    if response and first_response is None:
                        first_response = response
                except Exception as e:
                    logger.error(f"Error forwarding message to server {server_id}: {e}")

            return first_response

        elif destination.route_type == RouteType.ALL_CLIENTS:
            # Forward to all clients
            clients = self.client_manager.get_all_mcp_clients()

            if not clients:
                logger.warning("No clients to broadcast message to")
                return None

            # Forward to all clients
            logger.debug("Broadcasting message from hub to all clients")

            # For requests, return the response from the first client
            first_response = None

            for client_id, client in clients.items():
                try:
                    response = await client.interface.forward_message(message)

                    if response and first_response is None:
                        first_response = response
                except Exception as e:
                    logger.error(f"Error forwarding message to client {client_id}: {e}")

            return first_response

        else:
            logger.warning(f"Unsupported destination type for hub message: {destination.route_type}")
            return None

    async def _handle_all_servers_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message to all servers.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        # Get all server connections
        connections = self.server_manager.get_all_connections()

        if not connections:
            logger.warning("No servers to broadcast message to")
            return None

        # Forward to all servers
        logger.debug("Broadcasting message to all servers")

        # For requests, return the response from the first server
        first_response = None

        for server_id, connection in connections.items():
            try:
                response = await connection.interface.forward_message(message)

                if response and first_response is None:
                    first_response = response
            except Exception as e:
                logger.error(f"Error forwarding message to server {server_id}: {e}")

        return first_response

    async def _handle_all_clients_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message to all clients.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        # Get all client connections
        clients = self.client_manager.get_all_mcp_clients()

        if not clients:
            logger.warning("No clients to broadcast message to")
            return None

        # Forward to all clients
        logger.debug("Broadcasting message to all clients")

        # For requests, return the response from the first client
        first_response = None

        for client_id, client in clients.items():
            try:
                response = await client.interface.forward_message(message)

                if response and first_response is None:
                    first_response = response
            except Exception as e:
                logger.error(f"Error forwarding message to client {client_id}: {e}")

        return first_response

    async def _handle_capability_message(self, message: Dict[str, Any], source: RouteTarget, destination: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message to servers with a specific capability.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message

        Returns:
            Response message, or None if no response is needed
        """
        capability = destination.capability

        # Get all server connections
        connections = self.server_manager.get_all_connections()

        if not connections:
            logger.warning("No servers to check for capability")
            return None

        # Find servers with the capability
        capable_servers = {}
        for server_id, connection in connections.items():
            if connection.interface.has_capability(capability):
                capable_servers[server_id] = connection

        if not capable_servers:
            logger.warning(f"No servers found with capability: {capability}")
            return None

        # Forward to servers with the capability
        logger.debug(f"Broadcasting message to servers with capability: {capability}")

        # For requests, return the response from the first server
        first_response = None

        for server_id, connection in capable_servers.items():
            try:
                response = await connection.interface.forward_message(message)

                if response and first_response is None:
                    first_response = response
            except Exception as e:
                logger.error(f"Error forwarding message to server {server_id}: {e}")

        return first_response

    async def _handle_hub_directed_message(self, message: Dict[str, Any], source: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Handle a message directed to the hub.

        Args:
            message: Message to handle
            source: Source of the message

        Returns:
            Response message, or None if no response is needed
        """
        # Extract method from the message
        method = message.get("method")

        if not method:
            logger.error(f"Invalid message from {source}: missing method")
            return None

        # Handle based on method
        if method == "hub/status":
            # Return hub status
            return {
                "id": message.get("id"),
                "result": {
                    "status": "running" if self.running else "stopped",
                    "server_count": len(self.registry.get_all_servers()),
                    "client_count": len(self.client_manager.get_all_clients()),
                    "mcp_server_count": len(self.server_manager.connections),
                    "mcp_client_count": len(self.client_manager.connections)
                }
            }

        elif method == "hub/servers":
            # Return list of servers
            return {
                "id": message.get("id"),
                "result": {
                    "servers": self.get_all_server_statuses()
                }
            }

        elif method == "hub/clients":
            # Return list of clients
            return {
                "id": message.get("id"),
                "result": {
                    "clients": self.client_manager.get_all_clients()
                }
            }

        # Authentication methods
        elif method == "auth/login":
            # Authenticate user
            params = message.get("params", {})
            provider = params.get("provider")
            credentials = params.get("credentials", {})

            user_info = self.authenticate(credentials, provider)

            if user_info:
                # Generate token
                token = self.auth_manager.generate_token(user_info)

                return {
                    "id": message.get("id"),
                    "result": {
                        "token": token,
                        "user": user_info
                    }
                }
            else:
                return {
                    "id": message.get("id"),
                    "error": {
                        "code": -32000,
                        "message": "Authentication failed"
                    }
                }

        elif method == "auth/logout":
            # Revoke token
            params = message.get("params", {})
            token = params.get("token")

            if token:
                success = self.auth_manager.revoke_token(token)

                return {
                    "id": message.get("id"),
                    "result": {
                        "success": success
                    }
                }
            else:
                return {
                    "id": message.get("id"),
                    "error": {
                        "code": -32602,
                        "message": "Missing token parameter"
                    }
                }

        elif method == "auth/validate":
            # Validate token
            params = message.get("params", {})
            token = params.get("token")

            if token:
                user_info = self.auth_manager.validate_token(token)

                if user_info:
                    return {
                        "id": message.get("id"),
                        "result": {
                            "valid": True,
                            "user": user_info
                        }
                    }
                else:
                    return {
                        "id": message.get("id"),
                        "result": {
                            "valid": False
                        }
                    }
            else:
                return {
                    "id": message.get("id"),
                    "error": {
                        "code": -32602,
                        "message": "Missing token parameter"
                    }
                }

        else:
            logger.warning(f"Unsupported hub method: {method}")
            return None

    # Security methods

    def authenticate(self, credentials: Dict[str, Any], provider: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with the provided credentials.

        Args:
            credentials: Authentication credentials
            provider: Authentication provider name (uses default if None)

        Returns:
            User information if authentication is successful, None otherwise
        """
        return self.auth_manager.authenticate(credentials, provider)

    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an authentication token.

        Args:
            token: Authentication token

        Returns:
            User information if the token is valid, None otherwise
        """
        return self.auth_manager.validate_token(token)

    def check_permission(self, token: str, resource_type: str, resource_id: Optional[str], permission: Permission) -> bool:
        """
        Check if a user has a permission for a resource.

        Args:
            token: Authentication token
            resource_type: Resource type
            resource_id: Resource ID (None for all resources of the type)
            permission: Permission to check

        Returns:
            True if the user has the permission, False otherwise
        """
        # Validate token
        user_info = self.validate_token(token)

        if not user_info:
            logger.warning("Invalid token")
            return False

        # Get username
        username = user_info.get("username")

        if not username:
            logger.warning("Missing username in user info")
            return False

        # Create resource
        resource = Resource(resource_type, resource_id)

        # Check permission
        return self.acl.has_permission(username, resource, permission)

    def assign_role(self, username: str, role_name: str) -> bool:
        """
        Assign a role to a user.

        Args:
            username: Username
            role_name: Role name

        Returns:
            True if the role was assigned, False otherwise
        """
        return self.acl.assign_role(username, role_name)

    def revoke_role(self, username: str, role_name: str) -> bool:
        """
        Revoke a role from a user.

        Args:
            username: Username
            role_name: Role name

        Returns:
            True if the role was revoked, False otherwise
        """
        return self.acl.revoke_role(username, role_name)

    def get_user_roles(self, username: str) -> List[str]:
        """
        Get the roles assigned to a user.

        Args:
            username: Username

        Returns:
            List of role names
        """
        return self.acl.get_user_roles(username)
