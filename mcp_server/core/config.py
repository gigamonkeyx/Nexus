"""
Configuration module for the Code Enhancement MCP Server.
"""

import os
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional


@dataclass
class ServerConfig:
    """Configuration for the Code Enhancement MCP Server."""
    
    # Server information
    name: str = "Code Enhancement"
    description: str = "Provides tools for enhancing code"
    version: str = "0.1.0"
    
    # Server settings
    host: str = os.environ.get("HOST", "0.0.0.0")
    port: int = int(os.environ.get("PORT", 8001))
    
    # Logging settings
    log_level: str = os.environ.get("LOG_LEVEL", "INFO")
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Supported languages
    supported_languages: List[str] = field(default_factory=lambda: [
        "python",
        "javascript",
        "typescript",
        "java",
        "csharp",
        "go",
        "ruby",
        "rust"
    ])
    
    # Tool settings
    tool_settings: Dict[str, Any] = field(default_factory=dict)
    
    # Resource settings
    resource_settings: Dict[str, Any] = field(default_factory=dict)
    
    # Prompt settings
    prompt_settings: Dict[str, Any] = field(default_factory=dict)
    
    def is_language_supported(self, language: str) -> bool:
        """Check if a language is supported."""
        return language.lower() in [lang.lower() for lang in self.supported_languages]
    
    def get_tool_setting(self, tool_name: str, setting_name: str, default: Any = None) -> Any:
        """Get a tool setting."""
        tool_settings = self.tool_settings.get(tool_name, {})
        return tool_settings.get(setting_name, default)
    
    def get_resource_setting(self, resource_name: str, setting_name: str, default: Any = None) -> Any:
        """Get a resource setting."""
        resource_settings = self.resource_settings.get(resource_name, {})
        return resource_settings.get(setting_name, default)
    
    def get_prompt_setting(self, prompt_name: str, setting_name: str, default: Any = None) -> Any:
        """Get a prompt setting."""
        prompt_settings = self.prompt_settings.get(prompt_name, {})
        return prompt_settings.get(setting_name, default)
