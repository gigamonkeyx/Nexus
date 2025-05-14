#!/usr/bin/env python3
"""
Server Manager for Nexus MCP Hub.

This module provides functionality for managing MCP server processes.
It handles server lifecycle (start, stop, restart) and monitors server health.
"""

import os
import logging
import asyncio
import signal
import subprocess
from typing import Dict, List, Optional, Any, Set
from pathlib import Path
import time
import json

from ..config import get_config_manager
from ..server import McpServerConnection

# Setup logging
logger = logging.getLogger(__name__)

class ServerManager:
    """
    Manager for MCP server processes.

    This class handles the lifecycle of MCP server processes, including
    starting, stopping, and monitoring servers.
    """

    def __init__(self):
        """Initialize the Server Manager."""
        self.config = get_config_manager()
        self.servers = {}  # Maps server_id to process information
        self.connections = {}  # Maps server_id to MCP server connection
        self.running = False
        self.monitor_task = None

        # Load configuration
        self.default_timeout = self.config.get("servers.default_timeout", 30)
        self.max_retries = self.config.get("servers.max_retries", 3)
        self.retry_delay = self.config.get("servers.retry_delay", 5)
        self.auto_restart = self.config.get("servers.auto_restart", True)

        # Load process registry if it exists
        self._load_process_registry()

        logger.info("Server Manager initialized")

    def _load_process_registry(self) -> None:
        """Load the process registry from file."""
        registry_file = self.config.get("hub.process_registry_file")
        if registry_file and os.path.exists(registry_file):
            try:
                with open(registry_file, "r") as f:
                    self.servers = json.load(f)
                logger.info(f"Loaded process registry from {registry_file}")
            except Exception as e:
                logger.error(f"Error loading process registry: {e}")
                self.servers = {}

    def _save_process_registry(self) -> None:
        """Save the process registry to file."""
        registry_file = self.config.get("hub.process_registry_file")
        if registry_file:
            try:
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(registry_file), exist_ok=True)

                # Save only serializable information
                serializable_servers = {}
                for server_id, server_info in self.servers.items():
                    serializable_info = {k: v for k, v in server_info.items()
                                        if k not in ["process", "monitor_task"]}
                    serializable_servers[server_id] = serializable_info

                with open(registry_file, "w") as f:
                    json.dump(serializable_servers, f, indent=4)
                logger.debug(f"Saved process registry to {registry_file}")
            except Exception as e:
                logger.error(f"Error saving process registry: {e}")

    async def start(self) -> None:
        """Start the server manager."""
        if self.running:
            logger.warning("Server Manager is already running")
            return

        logger.info("Starting Server Manager")
        self.running = True

        # Start server monitoring task
        self.monitor_task = asyncio.create_task(self._monitor_servers())

        logger.info("Server Manager started")

    async def stop(self) -> None:
        """Stop the server manager and all managed servers."""
        if not self.running:
            logger.warning("Server Manager is not running")
            return

        logger.info("Stopping Server Manager")

        # Stop monitoring task
        if self.monitor_task:
            self.monitor_task.cancel()
            try:
                await self.monitor_task
            except asyncio.CancelledError:
                pass

        # Stop all servers
        await self.stop_all()

        # Disconnect all MCP server connections
        for server_id in list(self.connections.keys()):
            await self.disconnect_server(server_id)

        self.running = False
        logger.info("Server Manager stopped")

    async def connect_server(self, server_id: str, server_config: Dict[str, Any]) -> bool:
        """
        Connect to an MCP server.

        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration

        Returns:
            True if the connection was successful, False otherwise
        """
        # Check if already connected
        if server_id in self.connections:
            logger.warning(f"Server {server_id} is already connected")
            return True

        logger.info(f"Connecting to MCP server: {server_id}")

        try:
            # Create MCP server connection
            connection = McpServerConnection(server_id, server_config)

            # Connect to the server
            if not await connection.connect():
                logger.error(f"Failed to connect to MCP server {server_id}")
                return False

            # Initialize the server
            if not await connection.initialize():
                logger.error(f"Failed to initialize MCP server {server_id}")
                await connection.disconnect()
                return False

            # Store the connection
            self.connections[server_id] = connection

            logger.info(f"Connected to MCP server: {server_id}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to MCP server {server_id}: {e}")
            return False

    async def disconnect_server(self, server_id: str) -> bool:
        """
        Disconnect from an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the disconnection was successful, False otherwise
        """
        # Check if connected
        if server_id not in self.connections:
            logger.warning(f"Server {server_id} is not connected")
            return True

        logger.info(f"Disconnecting from MCP server: {server_id}")

        try:
            # Get the connection
            connection = self.connections[server_id]

            # Disconnect from the server
            await connection.disconnect()

            # Remove the connection
            del self.connections[server_id]

            logger.info(f"Disconnected from MCP server: {server_id}")
            return True
        except Exception as e:
            logger.error(f"Error disconnecting from MCP server {server_id}: {e}")
            return False

    async def reconnect_server(self, server_id: str) -> bool:
        """
        Reconnect to an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the reconnection was successful, False otherwise
        """
        # Check if connected
        if server_id in self.connections:
            # Get the connection
            connection = self.connections[server_id]

            # Reconnect to the server
            return await connection.reconnect()
        else:
            # Get server configuration
            server_info = self.servers.get(server_id)
            if not server_info:
                logger.error(f"Cannot reconnect to server {server_id}: not found")
                return False

            server_config = server_info.get("config", {})

            # Connect to the server
            return await self.connect_server(server_id, server_config)

    async def _monitor_servers(self) -> None:
        """Monitor the health of running servers."""
        while self.running:
            try:
                # Check each server
                for server_id, server_info in list(self.servers.items()):
                    if not server_info.get("running", False):
                        continue

                    process = server_info.get("process")
                    if process and process.poll() is not None:
                        # Server process has terminated
                        exit_code = process.returncode
                        logger.warning(f"Server {server_id} terminated with exit code {exit_code}")

                        # Update server status
                        server_info["running"] = False
                        server_info["exit_code"] = exit_code
                        server_info["exit_time"] = time.time()

                        # Auto-restart if configured
                        if self.auto_restart and server_info.get("auto_restart", True):
                            retries = server_info.get("retries", 0)
                            if retries < self.max_retries:
                                logger.info(f"Auto-restarting server {server_id} (retry {retries + 1}/{self.max_retries})")
                                server_info["retries"] = retries + 1

                                # Schedule restart with delay
                                asyncio.create_task(self._delayed_restart(server_id, self.retry_delay))
                            else:
                                logger.error(f"Server {server_id} failed to start after {retries} retries")

                        # Save updated process registry
                        self._save_process_registry()

                # Sleep before next check
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in server monitoring: {e}")
                await asyncio.sleep(5)  # Longer delay on error

    async def _delayed_restart(self, server_id: str, delay: int) -> None:
        """
        Restart a server after a delay.

        Args:
            server_id: ID of the server to restart
            delay: Delay in seconds before restarting
        """
        await asyncio.sleep(delay)

        # Get server configuration
        server_info = self.servers.get(server_id)
        if not server_info:
            logger.error(f"Cannot restart server {server_id}: not found")
            return

        # Restart the server
        try:
            await self.start_server(server_id, server_info.get("config", {}))
        except Exception as e:
            logger.error(f"Failed to restart server {server_id}: {e}")

    async def start_server(self, server_id: str, server_config: Dict[str, Any]) -> bool:
        """
        Start an MCP server.

        Args:
            server_id: Unique identifier for the server
            server_config: Server configuration

        Returns:
            True if the server was started successfully, False otherwise
        """
        # Check if server is already running
        if server_id in self.servers and self.servers[server_id].get("running", False):
            logger.warning(f"Server {server_id} is already running")
            return True

        logger.info(f"Starting server: {server_id}")

        try:
            # Get command and arguments
            command = server_config.get("command")
            args = server_config.get("args", [])

            if not command:
                logger.error(f"Cannot start server {server_id}: command not specified")
                return False

            # Prepare environment
            env = os.environ.copy()

            # Add any server-specific environment variables
            server_env = server_config.get("env", {})
            env.update(server_env)

            # Start the process
            process = subprocess.Popen(
                [command] + args,
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            # Store server information
            self.servers[server_id] = {
                "id": server_id,
                "config": server_config,
                "process": process,
                "pid": process.pid,
                "running": True,
                "start_time": time.time(),
                "retries": 0,
                "auto_restart": server_config.get("auto_restart", self.auto_restart)
            }

            # Save process registry
            self._save_process_registry()

            logger.info(f"Server {server_id} started with PID {process.pid}")

            # Start output monitoring tasks
            asyncio.create_task(self._monitor_stdout(server_id, process))
            asyncio.create_task(self._monitor_stderr(server_id, process))

            # Connect to the MCP server
            # Wait a moment for the server to initialize
            await asyncio.sleep(2)

            # Try to connect to the server
            connect_task = asyncio.create_task(self.connect_server(server_id, server_config))

            # Don't wait for connection to complete, it will happen in the background
            # This allows the server to start even if the connection fails initially

            return True
        except Exception as e:
            logger.error(f"Failed to start server {server_id}: {e}")
            return False

    async def _monitor_stdout(self, server_id: str, process: subprocess.Popen) -> None:
        """
        Monitor and log server's standard output.

        Args:
            server_id: ID of the server
            process: Server process
        """
        while True:
            line = process.stdout.readline()
            if not line and process.poll() is not None:
                break
            if line:
                logger.debug(f"[{server_id}] {line.rstrip()}")

    async def _monitor_stderr(self, server_id: str, process: subprocess.Popen) -> None:
        """
        Monitor and log server's standard error.

        Args:
            server_id: ID of the server
            process: Server process
        """
        while True:
            line = process.stderr.readline()
            if not line and process.poll() is not None:
                break
            if line:
                logger.warning(f"[{server_id}] {line.rstrip()}")

    async def stop_server(self, server_id: str) -> bool:
        """
        Stop an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the server was stopped successfully, False otherwise
        """
        # Check if server is running
        if server_id not in self.servers or not self.servers[server_id].get("running", False):
            logger.warning(f"Server {server_id} is not running")
            return True

        logger.info(f"Stopping server: {server_id}")

        try:
            # Disconnect from the MCP server first
            if server_id in self.connections:
                await self.disconnect_server(server_id)

            # Get process
            server_info = self.servers[server_id]
            process = server_info.get("process")

            if not process:
                logger.error(f"Cannot stop server {server_id}: process not found")
                return False

            # Try graceful termination first
            process.terminate()

            # Wait for process to terminate
            try:
                process.wait(timeout=self.default_timeout)
            except subprocess.TimeoutExpired:
                # Force kill if graceful termination fails
                logger.warning(f"Server {server_id} did not terminate gracefully, forcing kill")
                process.kill()
                process.wait(timeout=5)

            # Update server status
            server_info["running"] = False
            server_info["exit_code"] = process.returncode
            server_info["exit_time"] = time.time()

            # Save process registry
            self._save_process_registry()

            logger.info(f"Server {server_id} stopped")
            return True
        except Exception as e:
            logger.error(f"Failed to stop server {server_id}: {e}")
            return False

    async def restart_server(self, server_id: str) -> bool:
        """
        Restart an MCP server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the server was restarted successfully, False otherwise
        """
        logger.info(f"Restarting server: {server_id}")

        # Get server configuration
        if server_id not in self.servers:
            logger.error(f"Cannot restart server {server_id}: not found")
            return False

        server_info = self.servers[server_id]
        server_config = server_info.get("config", {})

        # Stop the server if it's running
        if server_info.get("running", False):
            if not await self.stop_server(server_id):
                logger.error(f"Failed to stop server {server_id} during restart")
                return False

        # Start the server
        return await self.start_server(server_id, server_config)

    async def stop_all(self) -> None:
        """Stop all running MCP servers."""
        logger.info("Stopping all servers")

        for server_id in list(self.servers.keys()):
            if self.servers[server_id].get("running", False):
                await self.stop_server(server_id)

    def is_server_running(self, server_id: str) -> bool:
        """
        Check if a server is running.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the server is running, False otherwise
        """
        if server_id not in self.servers:
            return False

        server_info = self.servers[server_id]
        if not server_info.get("running", False):
            return False

        # Check if process is still running
        process = server_info.get("process")
        if process and process.poll() is not None:
            # Process has terminated, update status
            server_info["running"] = False
            server_info["exit_code"] = process.returncode
            server_info["exit_time"] = time.time()
            self._save_process_registry()
            return False

        return True

    def get_server_info(self, server_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a server.

        Args:
            server_id: Unique identifier for the server

        Returns:
            Dictionary with server information, or None if server not found
        """
        if server_id not in self.servers:
            return None

        server_info = self.servers[server_id]

        # Create a copy without the process object (not serializable)
        info = {k: v for k, v in server_info.items() if k != "process"}

        # Update running status
        info["running"] = self.is_server_running(server_id)

        # Add MCP connection status if available
        if server_id in self.connections:
            connection = self.connections[server_id]
            connection_status = connection.get_status()

            # Add connection status to server info
            info["connection"] = {
                "connected": connection.connected,
                "initialized": connection.initialized,
                "status": connection.status,
                "client_count": connection.get_client_count(),
            }

            # Add capabilities if available
            if connection.initialized:
                info["capabilities"] = connection.interface.capabilities
                info["resources"] = len(connection.interface.resources)
                info["tools"] = len(connection.interface.tools)
                info["prompts"] = len(connection.interface.prompts)
        else:
            info["connection"] = {
                "connected": False,
                "initialized": False,
                "status": "disconnected",
                "client_count": 0,
            }

        return info

    def get_connection(self, server_id: str) -> Optional[McpServerConnection]:
        """
        Get the MCP server connection.

        Args:
            server_id: Unique identifier for the server

        Returns:
            MCP server connection, or None if not connected
        """
        return self.connections.get(server_id)

    def is_server_connected(self, server_id: str) -> bool:
        """
        Check if a server is connected via MCP.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the server is connected, False otherwise
        """
        if server_id not in self.connections:
            return False

        return self.connections[server_id].connected

    def is_server_initialized(self, server_id: str) -> bool:
        """
        Check if a server is initialized via MCP.

        Args:
            server_id: Unique identifier for the server

        Returns:
            True if the server is initialized, False otherwise
        """
        if server_id not in self.connections:
            return False

        return self.connections[server_id].initialized

    def get_all_connections(self) -> Dict[str, Any]:
        """
        Get all MCP server connections.

        Returns:
            Dictionary mapping server IDs to MCP server connections
        """
        return self.connections.copy()
