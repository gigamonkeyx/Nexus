#!/usr/bin/env python3
"""
Test configuration for Nexus MCP Hub.

This module contains pytest fixtures and configuration for testing the Nexus MCP Hub.
"""

import os
import sys
import json
import asyncio
import logging
import tempfile
import pytest
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.nexus.core import (
    ConfigManager, initialize_config_manager,
    HubManager, ServerManager, ClientManager, ServerRegistry,
    AuthManager, AccessControlList
)

# Configure logging for tests
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Disable logging during tests
logging.getLogger().setLevel(logging.WARNING)

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for each test."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as temp_dir:
        yield Path(temp_dir)

@pytest.fixture
def config_file(temp_dir):
    """Create a temporary configuration file for testing."""
    config = {
        "hub": {
            "host": "localhost",
            "port": 8000,
            "registry_file": str(temp_dir / "registry.json")
        },
        "servers": {
            "auto_start": True,
            "auto_restart": True
        },
        "security": {
            "users_file": str(temp_dir / "users.json"),
            "tokens_file": str(temp_dir / "tokens.json"),
            "roles_file": str(temp_dir / "roles.json"),
            "cors_origins": ["*"],
            "basic_auth": {
                "enabled": True
            },
            "token_auth": {
                "enabled": True
            }
        },
        "ui": {
            "host": "localhost",
            "port": 8080,
            "static_dir": "src/nexus/ui/static"
        }
    }
    
    config_path = temp_dir / "config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)
    
    return config_path

@pytest.fixture
def config_manager(config_file):
    """Create a ConfigManager instance for testing."""
    # Initialize the config manager with the test config file
    config_manager = ConfigManager()
    config_manager.load(config_file)
    
    # Set as the global config manager
    initialize_config_manager(config_manager)
    
    return config_manager

@pytest.fixture
def server_registry(temp_dir, config_manager):
    """Create a ServerRegistry instance for testing."""
    registry = ServerRegistry()
    
    # Create a test server
    test_server = {
        "id": "test-server",
        "config": {
            "name": "Test Server",
            "command": "python",
            "args": ["-m", "echo", "server"],
            "auto_start": True,
            "auto_restart": True
        }
    }
    
    # Register the test server
    registry.register_server(test_server["id"], test_server["config"])
    
    return registry

@pytest.fixture
def auth_manager():
    """Create an AuthManager instance for testing."""
    return AuthManager()

@pytest.fixture
def access_control_list():
    """Create an AccessControlList instance for testing."""
    return AccessControlList()

@pytest.fixture
def server_manager(config_manager):
    """Create a ServerManager instance for testing."""
    return ServerManager()

@pytest.fixture
def client_manager(config_manager):
    """Create a ClientManager instance for testing."""
    return ClientManager()

@pytest.fixture
async def hub_manager(config_manager, server_registry, auth_manager, access_control_list):
    """Create a HubManager instance for testing."""
    # Create the hub manager
    hub_manager = HubManager()
    
    # Override components with test fixtures
    hub_manager.registry = server_registry
    hub_manager.auth_manager = auth_manager
    hub_manager.acl = access_control_list
    
    # Start the hub manager
    await hub_manager.start()
    
    yield hub_manager
    
    # Stop the hub manager
    await hub_manager.stop()

@pytest.fixture
def test_user_credentials():
    """Create test user credentials for authentication tests."""
    return {
        "username": "testuser",
        "password": "testpassword"
    }

@pytest.fixture
def test_admin_credentials():
    """Create test admin credentials for authentication tests."""
    return {
        "username": "admin",
        "password": "adminpassword"
    }

@pytest.fixture
async def authenticated_user(hub_manager, test_user_credentials):
    """Create an authenticated user for testing."""
    # Create a test user
    user_info = {
        "username": test_user_credentials["username"],
        "name": "Test User",
        "email": "testuser@example.com"
    }
    
    # Create password hash
    password_hash = hub_manager.auth_manager.providers["basic"]._hash_password(
        test_user_credentials["password"]
    )
    
    # Add user to the basic auth provider
    hub_manager.auth_manager.providers["basic"].users[test_user_credentials["username"]] = {
        "password": password_hash,
        "name": user_info["name"],
        "email": user_info["email"]
    }
    
    # Assign the user role
    hub_manager.acl.assign_role(test_user_credentials["username"], "user")
    
    # Authenticate the user
    token = hub_manager.auth_manager.generate_token(user_info, "basic")
    
    return {
        "user_info": user_info,
        "token": token
    }

@pytest.fixture
async def authenticated_admin(hub_manager, test_admin_credentials):
    """Create an authenticated admin for testing."""
    # Create a test admin
    admin_info = {
        "username": test_admin_credentials["username"],
        "name": "Administrator",
        "email": "admin@example.com"
    }
    
    # Create password hash
    password_hash = hub_manager.auth_manager.providers["basic"]._hash_password(
        test_admin_credentials["password"]
    )
    
    # Add admin to the basic auth provider
    hub_manager.auth_manager.providers["basic"].users[test_admin_credentials["username"]] = {
        "password": password_hash,
        "name": admin_info["name"],
        "email": admin_info["email"]
    }
    
    # Assign the admin role
    hub_manager.acl.assign_role(test_admin_credentials["username"], "admin")
    
    # Authenticate the admin
    token = hub_manager.auth_manager.generate_token(admin_info, "basic")
    
    return {
        "user_info": admin_info,
        "token": token
    }
