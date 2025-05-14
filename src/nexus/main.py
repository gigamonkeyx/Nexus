#!/usr/bin/env python3
"""
Main application for Nexus MCP Hub.

This module provides the entry point for the Nexus MCP Hub application.
It initializes and runs the hub manager and API server.
"""

import os
import sys
import logging
import asyncio
import argparse
from typing import Dict, List, Optional, Any

from nexus.core import (
    initialize_config_manager, get_config_manager,
    HubManager, ServerManager, ClientManager, ServerRegistry
)
from nexus.api import ApiServer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('nexus.log')
    ]
)
logger = logging.getLogger(__name__)

async def main() -> None:
    """Main entry point for the application."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Nexus MCP Hub')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()

    # Set log level
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("Debug logging enabled")

    # Initialize configuration
    if args.config:
        config_manager = initialize_config_manager(args.config)
    else:
        config_manager = get_config_manager()

    # Set log level from configuration
    log_level = config_manager.get("hub.log_level", "info").upper()
    if not args.debug:  # Don't override debug flag from command line
        logging.getLogger().setLevel(getattr(logging, log_level))

    logger.info("Starting Nexus MCP Hub")

    try:
        # Create hub manager
        hub_manager = HubManager()

        # Start the hub manager
        await hub_manager.start()

        # Create and start API server
        api_server = ApiServer(hub_manager)
        await api_server.start()

        # Wait for shutdown
        await hub_manager.wait_for_shutdown()
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received, shutting down")
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
    finally:
        # Ensure clean shutdown
        try:
            # Stop API server if it was created
            if 'api_server' in locals():
                await api_server.stop()

            # Stop hub manager if it was created
            if 'hub_manager' in locals():
                await hub_manager.stop()
        except Exception as e:
            logger.error(f"Error during shutdown: {e}", exc_info=True)

        logger.info("Nexus MCP Hub stopped")

if __name__ == "__main__":
    # Run the main function
    asyncio.run(main())
