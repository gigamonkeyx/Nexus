#!/usr/bin/env python3
"""
Tests for the authentication manager.

This module contains tests for the Nexus MCP Hub authentication manager.
"""

import pytest
from src.nexus.core.security import AuthManager, BasicAuthProvider, TokenAuthProvider

class TestAuthManager:
    """Tests for the AuthManager class."""
    
    def test_register_provider(self, auth_manager):
        """Test registering an authentication provider."""
        # Create a test provider
        provider = BasicAuthProvider()
        
        # Register the provider
        auth_manager.register_provider("test_provider", provider)
        
        # Check that the provider was registered
        assert "test_provider" in auth_manager.providers
        assert auth_manager.providers["test_provider"] is provider
    
    def test_authenticate_with_basic_provider(self, auth_manager):
        """Test authenticating with the basic provider."""
        # Create a test user
        username = "testuser"
        password = "testpassword"
        user_info = {
            "username": username,
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Create password hash
        password_hash = auth_manager.providers["basic"]._hash_password(password)
        
        # Add user to the basic auth provider
        auth_manager.providers["basic"].users[username] = {
            "password": password_hash,
            "name": user_info["name"],
            "email": user_info["email"]
        }
        
        # Authenticate with the basic provider
        credentials = {
            "username": username,
            "password": password
        }
        
        authenticated_user = auth_manager.authenticate(credentials, "basic")
        
        # Check that authentication was successful
        assert authenticated_user is not None
        assert authenticated_user["username"] == username
        assert authenticated_user["name"] == user_info["name"]
        assert authenticated_user["email"] == user_info["email"]
    
    def test_authenticate_with_invalid_credentials(self, auth_manager):
        """Test authenticating with invalid credentials."""
        # Authenticate with invalid credentials
        credentials = {
            "username": "nonexistent",
            "password": "invalid"
        }
        
        authenticated_user = auth_manager.authenticate(credentials, "basic")
        
        # Check that authentication failed
        assert authenticated_user is None
    
    def test_generate_and_validate_token(self, auth_manager):
        """Test generating and validating a token."""
        # Create a test user
        user_info = {
            "username": "testuser",
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Generate a token
        token = auth_manager.generate_token(user_info, "basic")
        
        # Check that the token was generated
        assert token is not None
        
        # Validate the token
        validated_user = auth_manager.validate_token(token)
        
        # Check that validation was successful
        assert validated_user is not None
        assert validated_user["username"] == user_info["username"]
        assert validated_user["name"] == user_info["name"]
        assert validated_user["email"] == user_info["email"]
    
    def test_revoke_token(self, auth_manager):
        """Test revoking a token."""
        # Create a test user
        user_info = {
            "username": "testuser",
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Generate a token
        token = auth_manager.generate_token(user_info, "basic")
        
        # Revoke the token
        revoked = auth_manager.revoke_token(token, "basic")
        
        # Check that the token was revoked
        assert revoked is True
        
        # Validate the revoked token
        validated_user = auth_manager.validate_token(token)
        
        # Check that validation failed
        assert validated_user is None

class TestBasicAuthProvider:
    """Tests for the BasicAuthProvider class."""
    
    def test_hash_password(self):
        """Test hashing a password."""
        # Create a provider
        provider = BasicAuthProvider()
        
        # Hash a password
        password = "testpassword"
        hashed = provider._hash_password(password)
        
        # Check that the hash was created
        assert "hash" in hashed
        assert "salt" in hashed
        assert hashed["hash"] is not None
        assert hashed["salt"] is not None
        
        # Check that the hash is different from the password
        assert hashed["hash"] != password
    
    def test_authenticate_user(self):
        """Test authenticating a user."""
        # Create a provider
        provider = BasicAuthProvider()
        
        # Create a test user
        username = "testuser"
        password = "testpassword"
        user_info = {
            "username": username,
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Create password hash
        password_hash = provider._hash_password(password)
        
        # Add user to the provider
        provider.users[username] = {
            "password": password_hash,
            "name": user_info["name"],
            "email": user_info["email"]
        }
        
        # Authenticate the user
        credentials = {
            "username": username,
            "password": password
        }
        
        authenticated_user = provider.authenticate(credentials)
        
        # Check that authentication was successful
        assert authenticated_user is not None
        assert authenticated_user["username"] == username
        assert authenticated_user["name"] == user_info["name"]
        assert authenticated_user["email"] == user_info["email"]

class TestTokenAuthProvider:
    """Tests for the TokenAuthProvider class."""
    
    def test_generate_api_key(self):
        """Test generating an API key."""
        # Create a provider
        provider = TokenAuthProvider()
        
        # Create a test user
        user_info = {
            "username": "testuser",
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Generate an API key
        api_key = provider.generate_token(user_info)
        
        # Check that the API key was generated
        assert api_key is not None
        assert api_key.startswith("nxs_")
        
        # Check that the API key was stored
        assert api_key in provider.tokens
        assert provider.tokens[api_key]["user_info"] == user_info
    
    def test_validate_api_key(self):
        """Test validating an API key."""
        # Create a provider
        provider = TokenAuthProvider()
        
        # Create a test user
        user_info = {
            "username": "testuser",
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Generate an API key
        api_key = provider.generate_token(user_info)
        
        # Validate the API key
        validated_user = provider.validate_token(api_key)
        
        # Check that validation was successful
        assert validated_user is not None
        assert validated_user == user_info
    
    def test_revoke_api_key(self):
        """Test revoking an API key."""
        # Create a provider
        provider = TokenAuthProvider()
        
        # Create a test user
        user_info = {
            "username": "testuser",
            "name": "Test User",
            "email": "testuser@example.com"
        }
        
        # Generate an API key
        api_key = provider.generate_token(user_info)
        
        # Revoke the API key
        revoked = provider.revoke_token(api_key)
        
        # Check that the API key was revoked
        assert revoked is True
        assert api_key not in provider.tokens
        
        # Validate the revoked API key
        validated_user = provider.validate_token(api_key)
        
        # Check that validation failed
        assert validated_user is None
