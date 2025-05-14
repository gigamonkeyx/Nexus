#!/usr/bin/env python3
"""
Tests for the API server.

This module contains tests for the Nexus MCP Hub API server.
"""

import json
import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

from src.nexus.api import ApiServer

@pytest.fixture
async def api_client(hub_manager):
    """Create a test client for the API server."""
    # Create the API server
    api_server = ApiServer(hub_manager)
    
    # Create a test server
    server = TestServer(api_server.app)
    
    # Create a test client
    client = TestClient(server)
    
    # Start the server
    await server.start_server()
    
    yield client
    
    # Close the client and server
    await client.close()
    await server.close()

@pytest.mark.asyncio
class TestApiServer:
    """Tests for the ApiServer class."""
    
    async def test_get_hub_status(self, api_client):
        """Test getting hub status."""
        # Make a request to the API
        response = await api_client.get('/api/hub/status')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "running" in data
        assert "servers" in data
        assert "clients" in data
    
    async def test_get_servers(self, api_client):
        """Test getting all servers."""
        # Make a request to the API
        response = await api_client.get('/api/servers')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert len(data) > 0
    
    async def test_get_server(self, api_client):
        """Test getting a specific server."""
        # Get a server ID
        server_id = "test-server"
        
        # Make a request to the API
        response = await api_client.get(f'/api/servers/{server_id}')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert data["id"] == server_id
        assert data["name"] == "Test Server"
    
    async def test_register_server(self, api_client):
        """Test registering a server."""
        # Create a test server configuration
        server_data = {
            "id": "api-test-server",
            "config": {
                "name": "API Test Server",
                "command": "python",
                "args": ["-m", "echo", "api-test"],
                "auto_start": False,
                "auto_restart": False
            }
        }
        
        # Make a request to the API
        response = await api_client.post(
            '/api/servers',
            json=server_data
        )
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert data["success"] is True
        assert data["id"] == server_data["id"]
    
    async def test_unregister_server(self, api_client):
        """Test unregistering a server."""
        # Create and register a test server
        server_data = {
            "id": "api-test-server-2",
            "config": {
                "name": "API Test Server 2",
                "command": "python",
                "args": ["-m", "echo", "api-test-2"],
                "auto_start": False,
                "auto_restart": False
            }
        }
        
        await api_client.post('/api/servers', json=server_data)
        
        # Make a request to the API
        response = await api_client.delete(f'/api/servers/{server_data["id"]}')
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert data["success"] is True
    
    async def test_login(self, api_client, test_user_credentials, hub_manager):
        """Test logging in."""
        # Create a test user
        username = test_user_credentials["username"]
        password = test_user_credentials["password"]
        user_info = {
            "username": username,
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Create password hash
        password_hash = hub_manager.auth_manager.providers["basic"]._hash_password(password)
        
        # Add user to the basic auth provider
        hub_manager.auth_manager.providers["basic"].users[username] = {
            "password": password_hash,
            "name": user_info["name"],
            "email": user_info["email"]
        }
        
        # Make a request to the API
        response = await api_client.post(
            '/api/auth/login',
            json={
                "credentials": {
                    "username": username,
                    "password": password
                }
            }
        )
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert "token" in data
        assert "user" in data
        assert data["user"]["username"] == username
    
    async def test_validate_auth(self, api_client, authenticated_user):
        """Test validating authentication."""
        # Get the token
        token = authenticated_user["token"]
        
        # Make a request to the API
        response = await api_client.post(
            '/api/auth/validate',
            json={
                "token": token
            }
        )
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert data["valid"] is True
        assert "user" in data
        assert data["user"]["username"] == authenticated_user["user_info"]["username"]
    
    async def test_logout(self, api_client, authenticated_user):
        """Test logging out."""
        # Get the token
        token = authenticated_user["token"]
        
        # Make a request to the API
        response = await api_client.post(
            '/api/auth/logout',
            headers={
                "Authorization": f"Bearer {token}"
            }
        )
        
        # Check the response
        assert response.status == 200
        
        # Parse the response body
        data = await response.json()
        
        # Check the data
        assert data["success"] is True
