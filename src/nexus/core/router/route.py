#!/usr/bin/env python3
"""
Route definitions for Nexus MCP Hub.

This module provides the route definitions for the message router.
It defines how messages are routed between clients and servers.
"""

import logging
import enum
from typing import Dict, List, Optional, Any, Set, Union

# Setup logging
logger = logging.getLogger(__name__)

class RouteType(enum.Enum):
    """Type of route."""

    # Route to a specific server
    SERVER = "server"

    # Route to a specific client
    CLIENT = "client"

    # Route to all servers
    ALL_SERVERS = "all_servers"

    # Route to all clients
    ALL_CLIENTS = "all_clients"

    # Route to servers with specific capabilities
    CAPABILITY = "capability"

    # Route to the hub itself
    HUB = "hub"

class RouteTarget:
    """Target for a route."""

    def __init__(self, route_type: RouteType, target_id: Optional[str] = None, capability: Optional[str] = None):
        """
        Initialize a route target.

        Args:
            route_type: Type of route
            target_id: Target ID (for SERVER and CLIENT routes)
            capability: Capability path (for CAPABILITY routes)
        """
        self.route_type = route_type
        self.target_id = target_id
        self.capability = capability

        # Validate the target
        self._validate()

    def _validate(self) -> None:
        """Validate the route target."""
        if self.route_type in [RouteType.SERVER, RouteType.CLIENT] and not self.target_id:
            raise ValueError(f"Target ID is required for {self.route_type} routes")

        if self.route_type == RouteType.CAPABILITY and not self.capability:
            raise ValueError("Capability is required for CAPABILITY routes")

    def __str__(self) -> str:
        """Get string representation of the route target."""
        if self.route_type == RouteType.SERVER:
            return f"SERVER:{self.target_id}"
        elif self.route_type == RouteType.CLIENT:
            return f"CLIENT:{self.target_id}"
        elif self.route_type == RouteType.ALL_SERVERS:
            return "ALL_SERVERS"
        elif self.route_type == RouteType.ALL_CLIENTS:
            return "ALL_CLIENTS"
        elif self.route_type == RouteType.CAPABILITY:
            return f"CAPABILITY:{self.capability}"
        elif self.route_type == RouteType.HUB:
            return "HUB"
        else:
            return f"UNKNOWN:{self.route_type}"

    def __eq__(self, other: object) -> bool:
        """Check if two route targets are equal."""
        if not isinstance(other, RouteTarget):
            return False

        return (
            self.route_type == other.route_type and
            self.target_id == other.target_id and
            self.capability == other.capability
        )

    def __hash__(self) -> int:
        """Get hash of the route target."""
        return hash((self.route_type, self.target_id, self.capability))

class Route:
    """Route for messages."""

    def __init__(self, source: RouteTarget, destination: RouteTarget, method_pattern: Optional[str] = None):
        """
        Initialize a route.

        Args:
            source: Source of the route
            destination: Destination of the route
            method_pattern: Pattern to match method names (None matches all)
        """
        self.source = source
        self.destination = destination
        self.method_pattern = method_pattern

    def __str__(self) -> str:
        """Get string representation of the route."""
        if self.method_pattern:
            return f"{self.source} -> {self.destination} ({self.method_pattern})"
        else:
            return f"{self.source} -> {self.destination}"

    def __eq__(self, other: object) -> bool:
        """Check if two routes are equal."""
        if not isinstance(other, Route):
            return False

        return (
            self.source == other.source and
            self.destination == other.destination and
            self.method_pattern == other.method_pattern
        )

    def __hash__(self) -> int:
        """Get hash of the route."""
        return hash((self.source, self.destination, self.method_pattern))

    def matches_method(self, method: str) -> bool:
        """
        Check if the route matches a method.

        Args:
            method: Method name

        Returns:
            True if the route matches the method, False otherwise
        """
        # If no pattern is specified, match all methods
        if not self.method_pattern:
            return True

        # Exact match
        if self.method_pattern == method:
            return True

        # Wildcard at the end (e.g., "resources/*")
        if self.method_pattern.endswith('/*'):
            prefix = self.method_pattern[:-2]
            return method.startswith(prefix)

        # Simple wildcard matching (e.g., "resources*")
        if self.method_pattern.endswith('*'):
            prefix = self.method_pattern[:-1]
            return method.startswith(prefix)

        # Wildcard in the middle (e.g., "resources/*/get")
        if '*' in self.method_pattern:
            parts = self.method_pattern.split('*')
            if len(parts) == 2:
                return method.startswith(parts[0]) and method.endswith(parts[1])

        # No match
        return False
