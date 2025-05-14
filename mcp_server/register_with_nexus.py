#!/usr/bin/env python3
"""
Register the Code Enhancement MCP Server with Nexus Hub.
"""

import os
import sys
import json
import logging
import requests
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("register_with_nexus")

# Nexus Hub configuration
NEXUS_URL = os.environ.get("NEXUS_URL", "http://localhost:8000")
NEXUS_API_KEY = os.environ.get("NEXUS_API_KEY", "nexus-api-key")

# MCP Server configuration
MCP_SERVER_ID = "code-enhancement"
MCP_SERVER_PATH = os.path.abspath("code_enhancement_server.py")

def register_server():
    """Register the MCP server with Nexus Hub."""
    logger.info(f"Registering {MCP_SERVER_ID} with Nexus Hub at {NEXUS_URL}")

    # Server configuration
    server_config = {
        "id": MCP_SERVER_ID,
        "config": {
            "name": "Code Enhancement Server",
            "description": "Provides tools for enhancing code",
            "command": "python",
            "args": [MCP_SERVER_PATH],
            "auto_start": True,
            "auto_restart": True,
            "transport": "stdio",
            "capabilities": [
                "tools",
                "resources",
                "prompts"
            ]
        }
    }

    try:
        # Register with Nexus Hub
        response = requests.post(
            f"{NEXUS_URL}/api/servers",
            json=server_config,
            headers={
                "Authorization": f"Bearer {NEXUS_API_KEY}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            logger.info(f"Successfully registered {MCP_SERVER_ID} with Nexus Hub")
            return True
        else:
            logger.error(f"Failed to register server: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error registering server: {e}")
        return False

def connect_server():
    """Connect to the MCP server through Nexus Hub."""
    logger.info(f"Connecting to {MCP_SERVER_ID} through Nexus Hub")

    try:
        # Connect to server
        response = requests.post(
            f"{NEXUS_URL}/api/servers/{MCP_SERVER_ID}/connect",
            headers={
                "Authorization": f"Bearer {NEXUS_API_KEY}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            logger.info(f"Successfully connected to {MCP_SERVER_ID}")
            return True
        else:
            logger.error(f"Failed to connect to server: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error connecting to server: {e}")
        return False

def get_server_status():
    """Get the status of the MCP server from Nexus Hub."""
    logger.info(f"Getting status of {MCP_SERVER_ID} from Nexus Hub")

    try:
        # Get server status
        response = requests.get(
            f"{NEXUS_URL}/api/servers/{MCP_SERVER_ID}",
            headers={
                "Authorization": f"Bearer {NEXUS_API_KEY}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            status = response.json()
            logger.info(f"Server status: {json.dumps(status, indent=2)}")
            return status
        else:
            logger.error(f"Failed to get server status: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error getting server status: {e}")
        return None

def test_server_tools():
    """Test the server tools through Nexus Hub."""
    logger.info(f"Testing tools on {MCP_SERVER_ID} through Nexus Hub")

    # Sample Python code to format
    code = """
def hello_world():
print("Hello, world!")
for i in range(10):
print(i)
if i % 2 == 0:
print("Even")
else:
print("Odd")
return "Done"
"""

    try:
        # Call the format_code tool
        response = requests.post(
            f"{NEXUS_URL}/api/servers/{MCP_SERVER_ID}/tools/format_code",
            json={
                "code": code,
                "language": "python"
            },
            headers={
                "Authorization": f"Bearer {NEXUS_API_KEY}",
                "Content-Type": "application/json"
            }
        )

        if response.status_code == 200:
            result = response.json()
            logger.info(f"Tool call successful: {json.dumps(result, indent=2)}")

            # Test resource
            logger.info("Testing resource")
            resource_response = requests.get(
                f"{NEXUS_URL}/api/servers/{MCP_SERVER_ID}/resources/examples/python",
                headers={
                    "Authorization": f"Bearer {NEXUS_API_KEY}",
                    "Content-Type": "application/json"
                }
            )

            if resource_response.status_code == 200:
                resource_result = resource_response.json()
                logger.info(f"Resource call successful: {json.dumps(resource_result, indent=2)[:100]}...")
            else:
                logger.warning(f"Failed to call resource: {resource_response.status_code} - {resource_response.text}")

            return True
        else:
            logger.error(f"Failed to call tool: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error calling tool: {e}")
        return False

def main():
    """Main function."""
    # Check if Nexus Hub is running
    try:
        response = requests.get(f"{NEXUS_URL}/api/hub/status")
        if response.status_code != 200:
            logger.error(f"Nexus Hub is not running at {NEXUS_URL}")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to connect to Nexus Hub: {e}")
        logger.error(f"Make sure Nexus Hub is running at {NEXUS_URL}")
        sys.exit(1)

    # Register server
    if not register_server():
        logger.error("Failed to register server")
        sys.exit(1)

    # Connect to server
    if not connect_server():
        logger.error("Failed to connect to server")
        sys.exit(1)

    # Get server status
    status = get_server_status()
    if not status:
        logger.error("Failed to get server status")
        sys.exit(1)

    # Test server tools
    if not test_server_tools():
        logger.warning("Failed to test server tools, but continuing")

    logger.info("Server registration and connection successful")
    logger.info(f"The Code Enhancement MCP Server is now available through Nexus Hub at {NEXUS_URL}")
    logger.info("You can use it through the VS Code extension or directly through the Nexus API")

    # Print instructions for VS Code extension
    logger.info("\nTo use with VS Code extension:")
    logger.info("1. Open VS Code")
    logger.info("2. Click on the Nexus icon in the activity bar")
    logger.info("3. Connect to Nexus Hub")
    logger.info("4. You should see the Code Enhancement server in the Servers view")
    logger.info("5. Select code in the editor and use the 'Augment with Nexus' command")

if __name__ == "__main__":
    main()
