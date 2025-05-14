#!/usr/bin/env python3
"""
Tests for the configuration manager.

This module contains tests for the Nexus MCP Hub configuration manager.
"""

import os
import json
import pytest
from pathlib import Path

from src.nexus.core import ConfigManager, get_config_manager, initialize_config_manager

class TestConfigManager:
    """Tests for the ConfigManager class."""
    
    def test_load_config(self, temp_dir):
        """Test loading a configuration file."""
        # Create a test configuration
        config = {
            "hub": {
                "host": "localhost",
                "port": 8000
            },
            "servers": {
                "auto_start": True
            }
        }
        
        # Write the configuration to a file
        config_path = temp_dir / "test_config.json"
        with open(config_path, "w") as f:
            json.dump(config, f)
        
        # Create a config manager and load the configuration
        config_manager = ConfigManager()
        config_manager.load(config_path)
        
        # Check that the configuration was loaded correctly
        assert config_manager.get("hub.host") == "localhost"
        assert config_manager.get("hub.port") == 8000
        assert config_manager.get("servers.auto_start") is True
    
    def test_get_config_value(self, config_manager):
        """Test getting a configuration value."""
        # Get a configuration value
        host = config_manager.get("hub.host")
        
        # Check that the value is correct
        assert host == "localhost"
    
    def test_get_config_value_with_default(self, config_manager):
        """Test getting a configuration value with a default."""
        # Get a configuration value that doesn't exist
        value = config_manager.get("nonexistent.key", "default")
        
        # Check that the default value was returned
        assert value == "default"
    
    def test_set_config_value(self, config_manager):
        """Test setting a configuration value."""
        # Set a configuration value
        config_manager.set("test.key", "test_value")
        
        # Check that the value was set correctly
        assert config_manager.get("test.key") == "test_value"
    
    def test_get_config_manager(self, config_manager):
        """Test getting the global config manager."""
        # Initialize the global config manager
        initialize_config_manager(config_manager)
        
        # Get the global config manager
        global_config = get_config_manager()
        
        # Check that the global config manager is the same as the one we initialized
        assert global_config is config_manager
    
    def test_save_config(self, temp_dir, config_manager):
        """Test saving a configuration file."""
        # Set a configuration value
        config_manager.set("test.key", "test_value")
        
        # Save the configuration to a file
        save_path = temp_dir / "saved_config.json"
        config_manager.save(save_path)
        
        # Check that the file was created
        assert save_path.exists()
        
        # Load the saved configuration
        with open(save_path, "r") as f:
            saved_config = json.load(f)
        
        # Check that the configuration was saved correctly
        assert "test" in saved_config
        assert saved_config["test"]["key"] == "test_value"
