#!/usr/bin/env python3
"""
Message Router for Nexus MCP Hub.

This module provides the message router for the Nexus MCP Hub.
It handles routing messages between clients and servers.
"""

import logging
import asyncio
import json
from typing import Dict, List, Optional, Any, Set, Union, Callable, Awaitable

from .route import Route, RouteType, RouteTarget
from ..config import get_config_manager
from ..protocol import Request, Response, Notification, Error, ErrorCode

# Setup logging
logger = logging.getLogger(__name__)

# Type definitions
MessageHandler = Callable[[Dict[str, Any], RouteTarget, RouteTarget], Awaitable[Optional[Dict[str, Any]]]]

class MessageRouter:
    """Router for MCP messages."""

    def __init__(self):
        """Initialize the message router."""
        self.config = get_config_manager()
        self.routes = set()  # Set of routes
        self.message_handlers = {}  # Maps route type to message handler

        # Initialize with default routes
        self._initialize_default_routes()

        logger.info("Message Router initialized")

    def _initialize_default_routes(self) -> None:
        """Initialize default routes."""
        # Route client requests to the hub
        self.add_route(
            Route(
                source=RouteTarget(RouteType.ALL_CLIENTS),
                destination=RouteTarget(RouteType.HUB)
            )
        )

        # Route hub notifications to all clients
        self.add_route(
            Route(
                source=RouteTarget(RouteType.HUB),
                destination=RouteTarget(RouteType.ALL_CLIENTS),
                method_pattern="notifications/*"
            )
        )

    def add_route(self, route: Route) -> None:
        """
        Add a route.

        Args:
            route: Route to add
        """
        self.routes.add(route)
        logger.debug(f"Added route: {route}")

    def remove_route(self, route: Route) -> None:
        """
        Remove a route.

        Args:
            route: Route to remove
        """
        self.routes.discard(route)
        logger.debug(f"Removed route: {route}")

    def get_routes(self) -> Set[Route]:
        """
        Get all routes.

        Returns:
            Set of routes
        """
        return self.routes.copy()

    def clear_routes(self) -> None:
        """Clear all routes."""
        self.routes.clear()
        logger.debug("Cleared all routes")

        # Re-initialize default routes
        self._initialize_default_routes()

    def register_message_handler(self, route_type: RouteType, handler: MessageHandler) -> None:
        """
        Register a message handler for a route type.

        Args:
            route_type: Route type
            handler: Message handler
        """
        self.message_handlers[route_type] = handler
        logger.debug(f"Registered message handler for route type: {route_type}")

    def get_matching_routes(self, source: RouteTarget, method: str) -> List[Route]:
        """
        Get routes that match a source and method.

        Args:
            source: Source of the message
            method: Method name

        Returns:
            List of matching routes
        """
        # Optimize route matching for better performance
        # Use a more efficient filtering approach

        # First, filter by source type (most restrictive filter)
        source_type_matches = [route for route in self.routes if route.source.route_type == source.route_type]

        # Early return if no matches
        if not source_type_matches:
            return []

        # Then, filter by source ID or capability if applicable
        if source.route_type in [RouteType.SERVER, RouteType.CLIENT] and source.target_id is not None:
            # For specific server/client routes, filter by ID
            source_matches = [route for route in source_type_matches
                             if route.source.target_id == source.target_id]
        elif source.route_type == RouteType.CAPABILITY and source.capability is not None:
            # For capability routes, filter by capability
            source_matches = [route for route in source_type_matches
                             if route.source.capability == source.capability]
        else:
            # For other route types, keep all source type matches
            source_matches = source_type_matches

        # Early return if no matches
        if not source_matches:
            return []

        # Finally, filter by method pattern
        # This is the most expensive check, so do it last
        matching_routes = [route for route in source_matches if route.matches_method(method)]

        return matching_routes

    async def route_message(self, message: Dict[str, Any], source: RouteTarget) -> Optional[Dict[str, Any]]:
        """
        Route a message.

        Args:
            message: Message to route
            source: Source of the message

        Returns:
            Response message, or None if no response is needed
        """
        try:
            # Extract method from the message
            if "method" not in message:
                logger.error(f"Invalid message from {source}: missing method")
                return self._create_error_response(message, ErrorCode.INVALID_REQUEST, "Missing method")

            method = message["method"]

            # Get matching routes
            matching_routes = self.get_matching_routes(source, method)

            if not matching_routes:
                logger.warning(f"No matching routes for message from {source}: {method}")
                return self._create_error_response(message, ErrorCode.METHOD_NOT_FOUND, f"Method not found: {method}")

            # Check if this is a request or notification
            is_request = "id" in message

            # For requests, we only need to route to the first matching destination
            # For notifications, we route to all matching destinations
            if is_request:
                # Get the first matching route
                route = matching_routes[0]
                destination = route.destination

                # Get the handler for the destination
                handler = self.message_handlers.get(destination.route_type)

                if not handler:
                    logger.warning(f"No handler for destination: {destination}")
                    return self._create_error_response(
                        message,
                        ErrorCode.INTERNAL_ERROR,
                        f"No handler for destination: {destination}"
                    )

                # Handle the message
                try:
                    return await handler(message, source, destination)
                except Exception as e:
                    logger.error(f"Error handling message from {source} to {destination}: {e}")
                    return self._create_error_response(
                        message,
                        ErrorCode.INTERNAL_ERROR,
                        f"Internal error: {str(e)}"
                    )
            else:
                # For notifications, route to all matching destinations asynchronously
                tasks = []

                for route in matching_routes:
                    destination = route.destination

                    # Get the handler for the destination
                    handler = self.message_handlers.get(destination.route_type)

                    if not handler:
                        logger.warning(f"No handler for destination: {destination}")
                        continue

                    # Create a task for handling the message
                    task = asyncio.create_task(self._handle_notification(
                        message, source, destination, handler
                    ))

                    tasks.append(task)

                # No need to wait for the tasks to complete for notifications
                # They will run in the background

                # No response for notifications
                return None
        except Exception as e:
            logger.error(f"Error routing message from {source}: {e}")
            return self._create_error_response(message, ErrorCode.INTERNAL_ERROR, f"Internal error: {str(e)}")

    async def _handle_notification(self, message: Dict[str, Any], source: RouteTarget,
                                  destination: RouteTarget, handler: MessageHandler) -> None:
        """
        Handle a notification message.

        Args:
            message: Message to handle
            source: Source of the message
            destination: Destination of the message
            handler: Message handler
        """
        try:
            await handler(message, source, destination)
        except Exception as e:
            logger.error(f"Error handling notification from {source} to {destination}: {e}")

    def _create_error_response(self, message: Dict[str, Any], code: ErrorCode, message_text: str) -> Optional[Dict[str, Any]]:
        """
        Create an error response.

        Args:
            message: Original message
            code: Error code
            message_text: Error message

        Returns:
            Error response, or None if the original message was a notification
        """
        # Check if the message has an ID (request)
        if "id" in message:
            # Create error response
            error = Error(code, message_text)
            response = Response(message["id"], None, error)
            return response.to_dict()

        # No response for notifications
        return None
