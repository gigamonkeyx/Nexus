#!/usr/bin/env python3
"""
Start All MCP Servers

This script starts all MCP servers.
"""

import os
import sys
import logging
import subprocess
import time
import signal
import atexit
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("start_all_servers")

# MCP servers configuration
MCP_SERVERS = [
    {
        "name": "Code Enhancement",
        "script": "code_enhancement_server.py",
        "port": 8001,
    },
    {
        "name": "Knowledge Graph",
        "script": "knowledge_graph_server.py",
        "port": 8002,
    },
    {
        "name": "Vector Database",
        "script": "vector_database_server.py",
        "port": 8003,
    },
    {
        "name": "Document Processing",
        "script": "document_processing_server.py",
        "port": 8004,
    },
    {
        "name": "Data Analysis",
        "script": "data_analysis_server.py",
        "port": 8005,
    },
    {
        "name": "Natural Language Processing",
        "script": "nlp_server.py",
        "port": 8006,
    },
    {
        "name": "Web Scraping",
        "script": "web_scraping_server.py",
        "port": 8007,
    },
    {
        "name": "Audio Processing",
        "script": "audio_processing_server.py",
        "port": 8008,
    },
    {
        "name": "Testing",
        "script": "testing_server.py",
        "port": 8009,
    },
]

# Store processes
processes = []

def start_server(server: Dict[str, Any]) -> subprocess.Popen:
    """Start a server."""
    logger.info(f"Starting {server['name']} server on port {server['port']}")
    
    env = os.environ.copy()
    env["PORT"] = str(server["port"])
    
    process = subprocess.Popen(
        [sys.executable, server["script"]],
        env=env,
        cwd=os.path.dirname(os.path.abspath(__file__)),
    )
    
    return process

def stop_all_servers():
    """Stop all servers."""
    logger.info("Stopping all servers")
    
    for process in processes:
        process.terminate()
    
    # Wait for processes to terminate
    for process in processes:
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            logger.warning(f"Process {process.pid} did not terminate, killing it")
            process.kill()

def main():
    """Main function."""
    logger.info("Starting all MCP servers")
    
    # Register cleanup function
    atexit.register(stop_all_servers)
    
    # Start servers
    for server in MCP_SERVERS:
        process = start_server(server)
        processes.append(process)
        
        # Wait a bit to avoid port conflicts
        time.sleep(1)
    
    logger.info(f"Started {len(processes)} servers")
    
    # Wait for all processes to complete
    try:
        for process in processes:
            process.wait()
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, stopping servers")
        stop_all_servers()

if __name__ == "__main__":
    main()
