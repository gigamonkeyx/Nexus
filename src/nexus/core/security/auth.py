#!/usr/bin/env python3
"""
Authentication module for Nexus MCP Hub.

This module provides authentication functionality for the Nexus MCP Hub,
including user authentication and token management.
"""

import logging
import json
import os
import time
import uuid
import hashlib
import base64
import secrets
from typing import Dict, List, Optional, Any, Set, Union, Callable
from abc import ABC, abstractmethod

from ..config import get_config_manager

# Setup logging
logger = logging.getLogger(__name__)

class AuthProvider(ABC):
    """Abstract base class for authentication providers."""
    
    @abstractmethod
    def authenticate(self, credentials: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with the provided credentials.
        
        Args:
            credentials: Authentication credentials
            
        Returns:
            User information if authentication is successful, None otherwise
        """
        pass
    
    @abstractmethod
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an authentication token.
        
        Args:
            token: Authentication token
            
        Returns:
            User information if the token is valid, None otherwise
        """
        pass
    
    @abstractmethod
    def generate_token(self, user_info: Dict[str, Any]) -> str:
        """
        Generate an authentication token for a user.
        
        Args:
            user_info: User information
            
        Returns:
            Authentication token
        """
        pass
    
    @abstractmethod
    def revoke_token(self, token: str) -> bool:
        """
        Revoke an authentication token.
        
        Args:
            token: Authentication token
            
        Returns:
            True if the token was revoked, False otherwise
        """
        pass

class BasicAuthProvider(AuthProvider):
    """Basic authentication provider using username and password."""
    
    def __init__(self, users_file: Optional[str] = None):
        """
        Initialize the basic authentication provider.
        
        Args:
            users_file: Path to the users file (JSON)
        """
        self.config = get_config_manager()
        self.users_file = users_file or self.config.get("security.users_file", "users.json")
        self.users = {}
        self.tokens = {}
        self.token_expiry = {}
        self.token_lifetime = self.config.get("security.token_lifetime", 3600)  # 1 hour
        
        # Load users
        self._load_users()
    
    def _load_users(self) -> None:
        """Load users from the users file."""
        if not os.path.exists(self.users_file):
            logger.warning(f"Users file not found: {self.users_file}")
            return
        
        try:
            with open(self.users_file, "r") as f:
                self.users = json.load(f)
            
            logger.info(f"Loaded {len(self.users)} users from {self.users_file}")
        except Exception as e:
            logger.error(f"Failed to load users from {self.users_file}: {e}")
    
    def _save_users(self) -> None:
        """Save users to the users file."""
        try:
            with open(self.users_file, "w") as f:
                json.dump(self.users, f, indent=2)
            
            logger.info(f"Saved {len(self.users)} users to {self.users_file}")
        except Exception as e:
            logger.error(f"Failed to save users to {self.users_file}: {e}")
    
    def _hash_password(self, password: str, salt: Optional[str] = None) -> Dict[str, str]:
        """
        Hash a password with a salt.
        
        Args:
            password: Password to hash
            salt: Salt to use (generated if None)
            
        Returns:
            Dictionary with hashed password and salt
        """
        if salt is None:
            salt = base64.b64encode(os.urandom(16)).decode("utf-8")
        
        # Hash the password with the salt
        hash_obj = hashlib.sha256()
        hash_obj.update(password.encode("utf-8"))
        hash_obj.update(salt.encode("utf-8"))
        hashed = base64.b64encode(hash_obj.digest()).decode("utf-8")
        
        return {"hash": hashed, "salt": salt}
    
    def authenticate(self, credentials: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with username and password.
        
        Args:
            credentials: Authentication credentials (username, password)
            
        Returns:
            User information if authentication is successful, None otherwise
        """
        username = credentials.get("username")
        password = credentials.get("password")
        
        if not username or not password:
            logger.warning("Missing username or password")
            return None
        
        # Check if user exists
        if username not in self.users:
            logger.warning(f"User not found: {username}")
            return None
        
        user = self.users[username]
        
        # Check password
        stored_hash = user.get("password", {}).get("hash")
        stored_salt = user.get("password", {}).get("salt")
        
        if not stored_hash or not stored_salt:
            logger.warning(f"Invalid password data for user: {username}")
            return None
        
        # Hash the provided password with the stored salt
        hashed = self._hash_password(password, stored_salt)
        
        if hashed["hash"] != stored_hash:
            logger.warning(f"Invalid password for user: {username}")
            return None
        
        # Return user information (without password)
        user_info = {k: v for k, v in user.items() if k != "password"}
        user_info["username"] = username
        
        return user_info
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an authentication token.
        
        Args:
            token: Authentication token
            
        Returns:
            User information if the token is valid, None otherwise
        """
        if token not in self.tokens:
            logger.warning(f"Token not found: {token[:8]}...")
            return None
        
        # Check if token has expired
        if token in self.token_expiry and self.token_expiry[token] < time.time():
            logger.warning(f"Token expired: {token[:8]}...")
            self.revoke_token(token)
            return None
        
        # Return user information
        return self.tokens[token]
    
    def generate_token(self, user_info: Dict[str, Any]) -> str:
        """
        Generate an authentication token for a user.
        
        Args:
            user_info: User information
            
        Returns:
            Authentication token
        """
        # Generate a random token
        token = secrets.token_hex(32)
        
        # Store the token
        self.tokens[token] = user_info
        self.token_expiry[token] = time.time() + self.token_lifetime
        
        logger.info(f"Generated token for user: {user_info.get('username')}")
        
        return token
    
    def revoke_token(self, token: str) -> bool:
        """
        Revoke an authentication token.
        
        Args:
            token: Authentication token
            
        Returns:
            True if the token was revoked, False otherwise
        """
        if token not in self.tokens:
            logger.warning(f"Token not found: {token[:8]}...")
            return False
        
        # Remove the token
        user_info = self.tokens.pop(token)
        self.token_expiry.pop(token, None)
        
        logger.info(f"Revoked token for user: {user_info.get('username')}")
        
        return True

class TokenAuthProvider(AuthProvider):
    """Token-based authentication provider using API keys."""
    
    def __init__(self, tokens_file: Optional[str] = None):
        """
        Initialize the token authentication provider.
        
        Args:
            tokens_file: Path to the tokens file (JSON)
        """
        self.config = get_config_manager()
        self.tokens_file = tokens_file or self.config.get("security.tokens_file", "tokens.json")
        self.tokens = {}
        
        # Load tokens
        self._load_tokens()
    
    def _load_tokens(self) -> None:
        """Load tokens from the tokens file."""
        if not os.path.exists(self.tokens_file):
            logger.warning(f"Tokens file not found: {self.tokens_file}")
            return
        
        try:
            with open(self.tokens_file, "r") as f:
                self.tokens = json.load(f)
            
            logger.info(f"Loaded {len(self.tokens)} tokens from {self.tokens_file}")
        except Exception as e:
            logger.error(f"Failed to load tokens from {self.tokens_file}: {e}")
    
    def _save_tokens(self) -> None:
        """Save tokens to the tokens file."""
        try:
            with open(self.tokens_file, "w") as f:
                json.dump(self.tokens, f, indent=2)
            
            logger.info(f"Saved {len(self.tokens)} tokens to {self.tokens_file}")
        except Exception as e:
            logger.error(f"Failed to save tokens to {self.tokens_file}: {e}")
    
    def authenticate(self, credentials: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Authenticate using an API key.
        
        Args:
            credentials: Authentication credentials (api_key)
            
        Returns:
            User information if authentication is successful, None otherwise
        """
        api_key = credentials.get("api_key")
        
        if not api_key:
            logger.warning("Missing API key")
            return None
        
        # Validate the API key
        return self.validate_token(api_key)
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate an API key.
        
        Args:
            token: API key
            
        Returns:
            User information if the API key is valid, None otherwise
        """
        if token not in self.tokens:
            logger.warning(f"API key not found: {token[:8]}...")
            return None
        
        # Check if token has expired
        token_info = self.tokens[token]
        expiry = token_info.get("expiry")
        
        if expiry and expiry < time.time():
            logger.warning(f"API key expired: {token[:8]}...")
            self.revoke_token(token)
            return None
        
        # Return user information
        return token_info.get("user_info", {})
    
    def generate_token(self, user_info: Dict[str, Any]) -> str:
        """
        Generate an API key for a user.
        
        Args:
            user_info: User information
            
        Returns:
            API key
        """
        # Generate a random API key
        api_key = f"nxs_{secrets.token_hex(16)}"
        
        # Store the API key
        self.tokens[api_key] = {
            "user_info": user_info,
            "created": time.time(),
            "expiry": None  # API keys don't expire by default
        }
        
        # Save tokens
        self._save_tokens()
        
        logger.info(f"Generated API key for user: {user_info.get('username')}")
        
        return api_key
    
    def revoke_token(self, token: str) -> bool:
        """
        Revoke an API key.
        
        Args:
            token: API key
            
        Returns:
            True if the API key was revoked, False otherwise
        """
        if token not in self.tokens:
            logger.warning(f"API key not found: {token[:8]}...")
            return False
        
        # Remove the API key
        token_info = self.tokens.pop(token)
        
        # Save tokens
        self._save_tokens()
        
        logger.info(f"Revoked API key for user: {token_info.get('user_info', {}).get('username')}")
        
        return True

class AuthManager:
    """Authentication manager for the Nexus MCP Hub."""
    
    def __init__(self):
        """Initialize the authentication manager."""
        self.config = get_config_manager()
        self.providers = {}
        self.default_provider = None
        
        # Initialize default providers
        self._initialize_providers()
    
    def _initialize_providers(self) -> None:
        """Initialize authentication providers."""
        # Basic authentication provider
        if self.config.get("security.basic_auth.enabled", True):
            self.providers["basic"] = BasicAuthProvider()
            
            if not self.default_provider:
                self.default_provider = "basic"
        
        # Token authentication provider
        if self.config.get("security.token_auth.enabled", True):
            self.providers["token"] = TokenAuthProvider()
            
            if not self.default_provider:
                self.default_provider = "token"
    
    def register_provider(self, name: str, provider: AuthProvider) -> None:
        """
        Register an authentication provider.
        
        Args:
            name: Provider name
            provider: Authentication provider
        """
        self.providers[name] = provider
        logger.info(f"Registered authentication provider: {name}")
    
    def authenticate(self, credentials: Dict[str, Any], provider: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Authenticate a user with the provided credentials.
        
        Args:
            credentials: Authentication credentials
            provider: Authentication provider name (uses default if None)
            
        Returns:
            User information if authentication is successful, None otherwise
        """
        # Use default provider if none specified
        if not provider:
            provider = self.default_provider
        
        # Check if provider exists
        if provider not in self.providers:
            logger.warning(f"Authentication provider not found: {provider}")
            return None
        
        # Authenticate with the provider
        return self.providers[provider].authenticate(credentials)
    
    def validate_token(self, token: str, provider: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Validate an authentication token.
        
        Args:
            token: Authentication token
            provider: Authentication provider name (tries all if None)
            
        Returns:
            User information if the token is valid, None otherwise
        """
        # If provider specified, use only that provider
        if provider:
            if provider not in self.providers:
                logger.warning(f"Authentication provider not found: {provider}")
                return None
            
            return self.providers[provider].validate_token(token)
        
        # Try all providers
        for provider_name, provider_instance in self.providers.items():
            user_info = provider_instance.validate_token(token)
            
            if user_info:
                return user_info
        
        return None
    
    def generate_token(self, user_info: Dict[str, Any], provider: Optional[str] = None) -> Optional[str]:
        """
        Generate an authentication token for a user.
        
        Args:
            user_info: User information
            provider: Authentication provider name (uses default if None)
            
        Returns:
            Authentication token, or None if the provider is not found
        """
        # Use default provider if none specified
        if not provider:
            provider = self.default_provider
        
        # Check if provider exists
        if provider not in self.providers:
            logger.warning(f"Authentication provider not found: {provider}")
            return None
        
        # Generate token with the provider
        return self.providers[provider].generate_token(user_info)
    
    def revoke_token(self, token: str, provider: Optional[str] = None) -> bool:
        """
        Revoke an authentication token.
        
        Args:
            token: Authentication token
            provider: Authentication provider name (tries all if None)
            
        Returns:
            True if the token was revoked, False otherwise
        """
        # If provider specified, use only that provider
        if provider:
            if provider not in self.providers:
                logger.warning(f"Authentication provider not found: {provider}")
                return False
            
            return self.providers[provider].revoke_token(token)
        
        # Try all providers
        for provider_name, provider_instance in self.providers.items():
            if provider_instance.revoke_token(token):
                return True
        
        return False
