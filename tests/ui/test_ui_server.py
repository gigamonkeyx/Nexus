#!/usr/bin/env python3
"""
Tests for the UI server.

This module contains tests for the Nexus MCP Hub UI server.
"""

import json
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from src.nexus.ui import UiServer

@pytest.fixture
async def ui_client(hub_manager):
    """Create a test client for the UI server."""
    # Create the UI server
    ui_server = UiServer(hub_manager)
    
    # Create a test server
    server = TestServer(ui_server.app)
    
    # Create a test client
    client = TestClient(server)
    
    # Start the server
    await server.start_server()
    
    yield client
    
    # Close the client and server
    await client.close()
    await server.close()

@pytest.mark.asyncio
class TestUiServer:
    """Tests for the UiServer class."""
    
    async def test_get_dashboard_status(self, ui_client):
        """Test getting dashboard status."""
        # Make a request to the API
        response = await ui_client.get('/api/dashboard/status')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "status" in data
        assert "server_count" in data
        assert "client_count" in data
        assert "mcp_server_count" in data
        assert "mcp_client_count" in data
        assert "route_count" in data
    
    async def test_get_dashboard_servers(self, ui_client):
        """Test getting dashboard servers."""
        # Make a request to the API
        response = await ui_client.get('/api/dashboard/servers')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "servers" in data
        assert len(data["servers"]) > 0
    
    async def test_get_dashboard_clients(self, ui_client):
        """Test getting dashboard clients."""
        # Make a request to the API
        response = await ui_client.get('/api/dashboard/clients')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "clients" in data
        assert "mcp_clients" in data
    
    async def test_get_dashboard_routes(self, ui_client):
        """Test getting dashboard routes."""
        # Make a request to the API
        response = await ui_client.get('/api/dashboard/routes')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "routes" in data
    
    async def test_get_dashboard_users(self, ui_client):
        """Test getting dashboard users."""
        # Make a request to the API
        response = await ui_client.get('/api/dashboard/users')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "users" in data
