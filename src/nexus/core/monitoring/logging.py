#!/usr/bin/env python3
"""
Logging module for Nexus MCP Hub.

This module provides logging functionality for the Nexus MCP Hub.
"""

import os
import sys
import logging
import logging.handlers
import json
from typing import Dict, List, Optional, Any, Set, Union

try:
    import colorlog
    HAS_COLORLOG = True
except ImportError:
    HAS_COLORLOG = False

from ..config import get_config_manager

# Default log format
DEFAULT_LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DEFAULT_COLOR_LOG_FORMAT = "%(log_color)s%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Log level mapping
LOG_LEVEL_MAP = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warning": logging.WARNING,
    "error": logging.ERROR,
    "critical": logging.CRITICAL
}

def setup_logging(log_level: str = "info", log_file: Optional[str] = None, log_format: Optional[str] = None) -> None:
    """
    Set up logging for the Nexus MCP Hub.
    
    Args:
        log_level: Log level (debug, info, warning, error, critical)
        log_file: Log file path
        log_format: Log format
    """
    # Get configuration
    config = get_config_manager()
    
    # Get log level from config if not provided
    if not log_level:
        log_level = config.get("logging.level", "info")
    
    # Get log file from config if not provided
    if not log_file:
        log_file = config.get("logging.file")
    
    # Get log format from config if not provided
    if not log_format:
        log_format = config.get("logging.format", DEFAULT_LOG_FORMAT)
    
    # Convert log level string to logging level
    level = LOG_LEVEL_MAP.get(log_level.lower(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Use colorlog if available
    if HAS_COLORLOG and sys.stdout.isatty():
        formatter = colorlog.ColoredFormatter(
            DEFAULT_COLOR_LOG_FORMAT,
            log_colors={
                "DEBUG": "cyan",
                "INFO": "green",
                "WARNING": "yellow",
                "ERROR": "red",
                "CRITICAL": "red,bg_white"
            }
        )
    else:
        formatter = logging.Formatter(log_format)
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Create file handler if log file is specified
    if log_file:
        # Create log directory if it doesn't exist
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Create rotating file handler
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(logging.Formatter(log_format))
        root_logger.addHandler(file_handler)
    
    # Configure JSON logging if enabled
    json_logging_enabled = config.get("logging.json.enabled", False)
    json_log_file = config.get("logging.json.file")
    
    if json_logging_enabled and json_log_file:
        # Create log directory if it doesn't exist
        json_log_dir = os.path.dirname(json_log_file)
        if json_log_dir and not os.path.exists(json_log_dir):
            os.makedirs(json_log_dir)
        
        # Create JSON file handler
        json_file_handler = logging.handlers.RotatingFileHandler(
            json_log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        json_file_handler.setLevel(level)
        
        # Create JSON formatter
        class JsonFormatter(logging.Formatter):
            def format(self, record):
                log_record = {
                    "timestamp": self.formatTime(record),
                    "level": record.levelname,
                    "name": record.name,
                    "message": record.getMessage(),
                    "module": record.module,
                    "function": record.funcName,
                    "line": record.lineno
                }
                
                # Add exception info if available
                if record.exc_info:
                    log_record["exception"] = self.formatException(record.exc_info)
                
                return json.dumps(log_record)
        
        json_file_handler.setFormatter(JsonFormatter())
        root_logger.addHandler(json_file_handler)
    
    # Log configuration
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured with level: {log_level}")
    if log_file:
        logger.info(f"Log file: {log_file}")
    if json_logging_enabled and json_log_file:
        logger.info(f"JSON log file: {json_log_file}")

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)
