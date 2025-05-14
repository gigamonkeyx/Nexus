#!/usr/bin/env python3
"""
Tests for the message router.

This module contains tests for the Nexus MCP Hub message router.
"""

import pytest
from unittest.mock import MagicMock, patch

from src.nexus.core.router import MessageRouter, Route, RouteType, RouteTarget

class TestRouteTarget:
    """Tests for the RouteTarget class."""
    
    def test_route_target_creation(self):
        """Test creating a route target."""
        # Create a route target
        target = RouteTarget(RouteType.SERVER, "test-server")
        
        # Check that the target was created correctly
        assert target.route_type == RouteType.SERVER
        assert target.target_id == "test-server"
    
    def test_route_target_string_representation(self):
        """Test the string representation of a route target."""
        # Create a route target
        target = RouteTarget(RouteType.SERVER, "test-server")
        
        # Check the string representation
        assert str(target) == "SERVER:test-server"
    
    def test_route_target_equality(self):
        """Test route target equality."""
        # Create two identical targets
        target1 = RouteTarget(RouteType.SERVER, "test-server")
        target2 = RouteTarget(RouteType.SERVER, "test-server")
        
        # Check that they are equal
        assert target1 == target2
        
        # Create a different target
        target3 = RouteTarget(RouteType.CLIENT, "test-client")
        
        # Check that they are not equal
        assert target1 != target3

class TestRoute:
    """Tests for the Route class."""
    
    def test_route_creation(self):
        """Test creating a route."""
        # Create a route
        source = RouteTarget(RouteType.CLIENT, "test-client")
        destination = RouteTarget(RouteType.SERVER, "test-server")
        method_pattern = "resources/*"
        
        route = Route(source, destination, method_pattern)
        
        # Check that the route was created correctly
        assert route.source == source
        assert route.destination == destination
        assert route.method_pattern == method_pattern
    
    def test_route_string_representation(self):
        """Test the string representation of a route."""
        # Create a route
        source = RouteTarget(RouteType.CLIENT, "test-client")
        destination = RouteTarget(RouteType.SERVER, "test-server")
        method_pattern = "resources/*"
        
        route = Route(source, destination, method_pattern)
        
        # Check the string representation
        assert str(route) == "CLIENT:test-client -> SERVER:test-server (resources/*)"
    
    def test_route_matches(self):
        """Test route matching."""
        # Create a route
        source = RouteTarget(RouteType.CLIENT, "test-client")
        destination = RouteTarget(RouteType.SERVER, "test-server")
        method_pattern = "resources/*"
        
        route = Route(source, destination, method_pattern)
        
        # Check that the route matches
        assert route.matches(source, "resources/list")
        assert route.matches(source, "resources/get")
        assert not route.matches(source, "tools/call")
        
        # Check with a different source
        other_source = RouteTarget(RouteType.CLIENT, "other-client")
        assert not route.matches(other_source, "resources/list")

@pytest.mark.asyncio
class TestMessageRouter:
    """Tests for the MessageRouter class."""
    
    async def test_add_route(self):
        """Test adding a route."""
        # Create a router
        router = MessageRouter()
        
        # Create a route
        source = RouteTarget(RouteType.CLIENT, "test-client")
        destination = RouteTarget(RouteType.SERVER, "test-server")
        method_pattern = "resources/*"
        
        # Add the route
        router.add_route(source, destination, method_pattern)
        
        # Check that the route was added
        routes = router.get_routes()
        assert len(routes) == 1
        assert routes[0].source == source
        assert routes[0].destination == destination
        assert routes[0].method_pattern == method_pattern
    
    async def test_remove_route(self):
        """Test removing a route."""
        # Create a router
        router = MessageRouter()
        
        # Create a route
        source = RouteTarget(RouteType.CLIENT, "test-client")
        destination = RouteTarget(RouteType.SERVER, "test-server")
        method_pattern = "resources/*"
        
        # Add the route
        router.add_route(source, destination, method_pattern)
        
        # Remove the route
        router.remove_route(source, destination, method_pattern)
        
        # Check that the route was removed
        routes = router.get_routes()
        assert len(routes) == 0
    
    async def test_clear_routes(self):
        """Test clearing all routes."""
        # Create a router
        router = MessageRouter()
        
        # Add some routes
        router.add_route(
            RouteTarget(RouteType.CLIENT, "client1"),
            RouteTarget(RouteType.SERVER, "server1"),
            "resources/*"
        )
        
        router.add_route(
            RouteTarget(RouteType.CLIENT, "client2"),
            RouteTarget(RouteType.SERVER, "server2"),
            "tools/*"
        )
        
        # Check that routes were added
        assert len(router.get_routes()) == 2
        
        # Clear the routes
        router.clear_routes()
        
        # Check that all routes were removed
        assert len(router.get_routes()) == 0
    
    async def test_find_routes(self):
        """Test finding routes."""
        # Create a router
        router = MessageRouter()
        
        # Add some routes
        router.add_route(
            RouteTarget(RouteType.CLIENT, "client1"),
            RouteTarget(RouteType.SERVER, "server1"),
            "resources/*"
        )
        
        router.add_route(
            RouteTarget(RouteType.CLIENT, "client1"),
            RouteTarget(RouteType.SERVER, "server2"),
            "tools/*"
        )
        
        # Find routes for a specific source and method
        source = RouteTarget(RouteType.CLIENT, "client1")
        routes = router.find_routes(source, "resources/list")
        
        # Check that we found the right route
        assert len(routes) == 1
        assert routes[0].destination.route_type == RouteType.SERVER
        assert routes[0].destination.target_id == "server1"
    
    async def test_route_message(self):
        """Test routing a message."""
        # Create a router
        router = MessageRouter()
        
        # Create mock handlers
        server_handler = MagicMock()
        server_handler.return_value = {"id": "response-123", "result": "success"}
        
        client_handler = MagicMock()
        client_handler.return_value = {"id": "response-456", "result": "success"}
        
        hub_handler = MagicMock()
        hub_handler.return_value = {"id": "response-789", "result": "success"}
        
        # Register handlers
        router.register_handler(RouteType.SERVER, server_handler)
        router.register_handler(RouteType.CLIENT, client_handler)
        router.register_handler(RouteType.HUB, hub_handler)
        
        # Add a route
        router.add_route(
            RouteTarget(RouteType.CLIENT, "client1"),
            RouteTarget(RouteType.SERVER, "server1"),
            "resources/*"
        )
        
        # Create a message
        message = {
            "id": "msg-123",
            "method": "resources/list",
            "params": {}
        }
        
        # Route the message
        source = RouteTarget(RouteType.CLIENT, "client1")
        response = await router.route_message(message, source)
        
        # Check that the message was routed to the server handler
        server_handler.assert_called_once_with(message, source, RouteTarget(RouteType.SERVER, "server1"))
        
        # Check the response
        assert response["id"] == "response-123"
        assert response["result"] == "success"
