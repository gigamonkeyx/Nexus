#!/usr/bin/env python3
"""
Tests for the hub manager.

This module contains tests for the Nexus MCP Hub manager.
"""

import pytest
import asyncio
from unittest.mock import MagicMock, patch

from src.nexus.core import HubManager
from src.nexus.core.security import Permission, Resource

@pytest.mark.asyncio
class TestHubManager:
    """Tests for the HubManager class."""
    
    async def test_start_and_stop(self, hub_manager):
        """Test starting and stopping the hub manager."""
        # Check that the hub manager is running
        assert hub_manager.running is True
        
        # Stop the hub manager
        await hub_manager.stop()
        
        # Check that the hub manager is stopped
        assert hub_manager.running is False
        
        # Start the hub manager again
        await hub_manager.start()
        
        # Check that the hub manager is running again
        assert hub_manager.running is True
    
    async def test_register_server(self, hub_manager):
        """Test registering a server."""
        # Create a test server configuration
        server_id = "test-server-2"
        server_config = {
            "name": "Test Server 2",
            "command": "python",
            "args": ["-m", "echo", "server2"],
            "auto_start": False,
            "auto_restart": False
        }
        
        # Register the server
        success = await hub_manager.register_server(server_id, server_config)
        
        # Check that registration was successful
        assert success is True
        
        # Check that the server was registered
        server = hub_manager.registry.get_server(server_id)
        assert server is not None
        assert server["name"] == server_config["name"]
    
    async def test_unregister_server(self, hub_manager):
        """Test unregistering a server."""
        # Get a server ID from the registry
        server_id = "test-server"
        
        # Unregister the server
        success = await hub_manager.unregister_server(server_id)
        
        # Check that unregistration was successful
        assert success is True
        
        # Check that the server was unregistered
        server = hub_manager.registry.get_server(server_id)
        assert server is None
    
    async def test_get_server_status(self, hub_manager):
        """Test getting server status."""
        # Get a server ID from the registry
        server_id = "test-server"
        
        # Get the server status
        status = hub_manager.get_server_status(server_id)
        
        # Check the status
        assert status["id"] == server_id
        assert status["name"] == "Test Server"
        assert "running" in status
        assert "auto_start" in status
        assert "auto_restart" in status
    
    async def test_get_all_server_statuses(self, hub_manager):
        """Test getting all server statuses."""
        # Get all server statuses
        statuses = hub_manager.get_all_server_statuses()
        
        # Check that we got at least one server
        assert len(statuses) > 0
        
        # Check the first server
        server_id = list(statuses.keys())[0]
        assert statuses[server_id]["id"] == server_id
    
    async def test_authenticate(self, hub_manager, test_user_credentials):
        """Test authenticating a user."""
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
        
        # Authenticate the user
        credentials = {
            "username": username,
            "password": password
        }
        
        authenticated_user = hub_manager.authenticate(credentials)
        
        # Check that authentication was successful
        assert authenticated_user is not None
        assert authenticated_user["username"] == username
        assert authenticated_user["name"] == user_info["name"]
        assert authenticated_user["email"] == user_info["email"]
    
    async def test_validate_token(self, hub_manager, authenticated_user):
        """Test validating a token."""
        # Get the token
        token = authenticated_user["token"]
        
        # Validate the token
        validated_user = hub_manager.validate_token(token)
        
        # Check that validation was successful
        assert validated_user is not None
        assert validated_user["username"] == authenticated_user["user_info"]["username"]
    
    async def test_check_permission(self, hub_manager, authenticated_user):
        """Test checking permissions."""
        # Get the token
        token = authenticated_user["token"]
        
        # Assign a role with permissions
        username = authenticated_user["user_info"]["username"]
        role_name = "test_role"
        
        # Create a role
        role = hub_manager.acl.roles.get("user")
        
        # Check that the user has the permission
        has_permission = hub_manager.check_permission(token, "resource", None, Permission.RESOURCE_VIEW)
        
        # The user should have this permission from the "user" role
        assert has_permission is True
        
        # Check a permission the user doesn't have
        has_permission = hub_manager.check_permission(token, "admin", None, Permission.ADMIN_MODIFY)
        
        # The user should not have this permission
        assert has_permission is False
    
    async def test_assign_and_revoke_role(self, hub_manager):
        """Test assigning and revoking roles."""
        # Create a test user
        username = "roletest"
        
        # Assign a role
        success = hub_manager.assign_role(username, "user")
        
        # Check that assignment was successful
        assert success is True
        
        # Check that the role was assigned
        roles = hub_manager.get_user_roles(username)
        assert "user" in roles
        
        # Revoke the role
        success = hub_manager.revoke_role(username, "user")
        
        # Check that revocation was successful
        assert success is True
        
        # Check that the role was revoked
        roles = hub_manager.get_user_roles(username)
        assert "user" not in roles
