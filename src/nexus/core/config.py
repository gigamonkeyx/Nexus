#!/usr/bin/env python3
"""
Configuration management for Nexus MCP Hub.

This module handles loading, saving, and validating configuration settings.
It supports environment variable overrides and multiple configuration sources.
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

# Setup logging
logger = logging.getLogger(__name__)

class ConfigManager:
    """Manages configuration for Nexus MCP Hub."""
    
    def __init__(self, config_file: Optional[str] = None):
        """Initialize the configuration manager.
        
        Args:
            config_file: Path to the configuration file. If None, uses the default.
        """
        self.config_file = config_file or os.path.join(os.path.dirname(__file__), "../../../config/default.json")
        self.config = {}
        self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load the configuration from file and apply environment variable overrides.
        
        Returns:
            The loaded configuration.
        """
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    self.config = json.load(f)
                logger.info(f"Loaded configuration from {self.config_file}")
            except Exception as e:
                logger.error(f"Error loading configuration: {e}")
                self.config = self._get_default_config()
        else:
            logger.info(f"Configuration file {self.config_file} not found, creating default configuration")
            self.config = self._get_default_config()
            self.save_config()
        
        # Apply environment variable overrides
        self._apply_env_overrides()
        
        return self.config
    
    def _apply_env_overrides(self) -> None:
        """Apply environment variable overrides to the configuration.
        
        Environment variables should be prefixed with NEXUS_ and use double underscores
        to represent nested keys. For example, NEXUS_HUB__PORT would override hub.port.
        """
        prefix = "NEXUS_"
        for key, value in os.environ.items():
            if key.startswith(prefix):
                # Remove prefix and convert to lowercase
                config_key = key[len(prefix):].lower()
                
                # Handle nested keys (double underscore separator)
                if "__" in config_key:
                    parts = config_key.split("__")
                    self._set_nested_value(self.config, parts, self._convert_value(value))
                else:
                    self.config[config_key] = self._convert_value(value)
    
    def _set_nested_value(self, config: Dict[str, Any], parts: List[str], value: Any) -> None:
        """Set a nested value in the configuration dictionary.
        
        Args:
            config: The configuration dictionary.
            parts: The parts of the nested key.
            value: The value to set.
        """
        current = config
        for part in parts[:-1]:
            if part not in current:
                current[part] = {}
            current = current[part]
        current[parts[-1]] = value
    
    def _convert_value(self, value: str) -> Any:
        """Convert a string value to the appropriate type.
        
        Args:
            value: The string value to convert.
            
        Returns:
            The converted value.
        """
        # Try to convert to boolean
        if value.lower() in ("true", "yes", "1"):
            return True
        if value.lower() in ("false", "no", "0"):
            return False
        
        # Try to convert to integer
        try:
            return int(value)
        except ValueError:
            pass
        
        # Try to convert to float
        try:
            return float(value)
        except ValueError:
            pass
        
        # Try to convert to JSON
        try:
            return json.loads(value)
        except ValueError:
            pass
        
        # Return as string
        return value
    
    def save_config(self) -> None:
        """Save the configuration to file."""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            
            with open(self.config_file, "w") as f:
                json.dump(self.config, f, indent=4)
            logger.info(f"Saved configuration to {self.config_file}")
        except Exception as e:
            logger.error(f"Error saving configuration: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value.
        
        Args:
            key: The configuration key. Can use dot notation for nested keys.
            default: The default value to return if the key is not found.
        
        Returns:
            The configuration value, or the default if the key is not found.
        """
        # Support nested keys with dot notation
        if "." in key:
            parts = key.split(".")
            value = self.config
            for part in parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    return default
            return value
        
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value.
        
        Args:
            key: The configuration key. Can use dot notation for nested keys.
            value: The configuration value.
        """
        # Support nested keys with dot notation
        if "." in key:
            parts = key.split(".")
            config = self.config
            for part in parts[:-1]:
                if part not in config:
                    config[part] = {}
                config = config[part]
            config[parts[-1]] = value
        else:
            self.config[key] = value
        
        # Save the updated configuration
        self.save_config()
    
    def delete(self, key: str) -> None:
        """Delete a configuration value.
        
        Args:
            key: The configuration key. Can use dot notation for nested keys.
        """
        # Support nested keys with dot notation
        if "." in key:
            parts = key.split(".")
            config = self.config
            for part in parts[:-1]:
                if part not in config:
                    return
                config = config[part]
            if parts[-1] in config:
                del config[parts[-1]]
        elif key in self.config:
            del self.config[key]
        
        # Save the updated configuration
        self.save_config()
    
    def get_all(self) -> Dict[str, Any]:
        """Get the entire configuration.
        
        Returns:
            The entire configuration.
        """
        return self.config.copy()
    
    def reset(self) -> None:
        """Reset the configuration to default values."""
        self.config = self._get_default_config()
        self.save_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get the default configuration.
        
        Returns:
            The default configuration.
        """
        return {
            "hub": {
                "name": "Nexus MCP Hub",
                "host": "localhost",
                "port": 8000,
                "debug": False,
                "log_level": "info",
                "data_dir": os.path.join(os.path.dirname(__file__), "../../../data"),
                "registry_file": os.path.join(os.path.dirname(__file__), "../../../config/registry.json"),
                "process_registry_file": os.path.join(os.path.dirname(__file__), "../../../config/process_registry.json"),
                "admin_username": "admin",
                "admin_password": "admin",  # This should be changed in production
            },
            "servers": {
                "default_timeout": 30,
                "auto_start": True,
                "auto_restart": True,
                "max_retries": 3,
                "retry_delay": 5,
            },
            "integrations": {
                "github": {
                    "enabled": True,
                    "default_repo": "https://github.com/modelcontextprotocol/servers",
                },
                "supabase": {
                    "enabled": False,
                    "url": "",
                    "key": "",
                },
                "rag": {
                    "enabled": True,
                    "storage_dir": os.path.join(os.path.dirname(__file__), "../../../data/rag"),
                },
                "comfyui": {
                    "enabled": True,
                    "host": "localhost",
                    "port": 8188,
                },
                "playwright": {
                    "enabled": True,
                    "browser": "chromium",
                },
            },
            "security": {
                "enable_auth": True,
                "jwt_secret": "",  # This should be generated on first run
                "token_expiry": 86400,  # 24 hours
                "cors_origins": ["http://localhost:3000"],
            },
        }
    
    def validate(self) -> List[str]:
        """Validate the configuration.
        
        Returns:
            A list of validation errors, or an empty list if the configuration is valid.
        """
        errors = []
        
        # Validate hub configuration
        if not self.get("hub.host"):
            errors.append("Hub host is required")
        
        if not isinstance(self.get("hub.port"), int):
            errors.append("Hub port must be an integer")
        
        if not isinstance(self.get("hub.debug"), bool):
            errors.append("Hub debug must be a boolean")
        
        # Validate server configuration
        if not isinstance(self.get("servers.default_timeout"), int):
            errors.append("Server default timeout must be an integer")
        
        if not isinstance(self.get("servers.auto_start"), bool):
            errors.append("Server auto start must be a boolean")
        
        if not isinstance(self.get("servers.auto_restart"), bool):
            errors.append("Server auto restart must be a boolean")
        
        if not isinstance(self.get("servers.max_retries"), int):
            errors.append("Server max retries must be an integer")
        
        if not isinstance(self.get("servers.retry_delay"), int):
            errors.append("Server retry delay must be an integer")
        
        # Validate security configuration
        if self.get("security.enable_auth") and not self.get("security.jwt_secret"):
            errors.append("JWT secret is required when authentication is enabled")
        
        return errors

# Global configuration manager instance
config_manager = ConfigManager()

def get_config_manager() -> ConfigManager:
    """Get the global configuration manager instance.
    
    Returns:
        The global ConfigManager instance.
    """
    return config_manager

def initialize_config_manager(config_file: Optional[str] = None) -> ConfigManager:
    """Initialize the configuration manager with a specific configuration file.
    
    Args:
        config_file: Path to the configuration file.
    
    Returns:
        The initialized ConfigManager instance.
    """
    global config_manager
    config_manager = ConfigManager(config_file)
    return config_manager
