#!/usr/bin/env python3
"""
Startup script for MCP testing tools.
This script starts the MCP Test Server and MCP Mock Server in separate processes.
"""

import argparse
import os
import subprocess
import sys
import time
from typing import List, Optional

def start_process(command: List[str], name: str) -> Optional[subprocess.Popen]:
    """Start a process and return the process object."""
    try:
        print(f"Starting {name}...")
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Wait a bit to make sure the process starts
        time.sleep(1)
        
        # Check if the process is still running
        if process.poll() is not None:
            print(f"Error starting {name}. Process exited with code {process.returncode}")
            stdout, stderr = process.communicate()
            print(f"stdout: {stdout}")
            print(f"stderr: {stderr}")
            return None
        
        print(f"{name} started with PID {process.pid}")
        return process
    except Exception as e:
        print(f"Error starting {name}: {e}")
        return None

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Start MCP testing tools")
    parser.add_argument("--test-server-host", default="127.0.0.1", help="Host for the MCP Test Server")
    parser.add_argument("--test-server-port", type=int, default=8020, help="Port for the MCP Test Server")
    parser.add_argument("--mock-server-host", default="127.0.0.1", help="Host for the MCP Mock Server")
    parser.add_argument("--mock-server-port", type=int, default=8030, help="Port for the MCP Mock Server")
    parser.add_argument("--mock-config", help="Path to mock configuration file")
    
    args = parser.parse_args()
    
    # Start MCP Test Server
    test_server_command = [
        sys.executable,
        "mcp_test_server.py",
        "--host", args.test_server_host,
        "--port", str(args.test_server_port)
    ]
    
    test_server_process = start_process(test_server_command, "MCP Test Server")
    
    # Start MCP Mock Server
    mock_server_command = [
        sys.executable,
        "mcp_mock_server.py",
        "--host", args.mock_server_host,
        "--port", str(args.mock_server_port)
    ]
    
    if args.mock_config:
        mock_server_command.extend(["--config", args.mock_config])
    
    mock_server_process = start_process(mock_server_command, "MCP Mock Server")
    
    # Wait for user to press Ctrl+C
    try:
        print("\nMCP testing tools are running. Press Ctrl+C to stop.")
        
        # Print URLs
        print(f"\nMCP Test Server: http://{args.test_server_host}:{args.test_server_port}")
        print(f"MCP Mock Server: http://{args.mock_server_host}:{args.mock_server_port}")
        
        # Keep the script running
        while True:
            time.sleep(1)
            
            # Check if processes are still running
            if test_server_process and test_server_process.poll() is not None:
                print(f"MCP Test Server exited with code {test_server_process.returncode}")
                stdout, stderr = test_server_process.communicate()
                print(f"stdout: {stdout}")
                print(f"stderr: {stderr}")
                test_server_process = None
            
            if mock_server_process and mock_server_process.poll() is not None:
                print(f"MCP Mock Server exited with code {mock_server_process.returncode}")
                stdout, stderr = mock_server_process.communicate()
                print(f"stdout: {stdout}")
                print(f"stderr: {stderr}")
                mock_server_process = None
            
            # Exit if both processes have exited
            if not test_server_process and not mock_server_process:
                print("All processes have exited. Exiting.")
                return 1
    except KeyboardInterrupt:
        print("\nStopping MCP testing tools...")
    finally:
        # Stop processes
        if test_server_process:
            print("Stopping MCP Test Server...")
            test_server_process.terminate()
            test_server_process.wait(timeout=5)
        
        if mock_server_process:
            print("Stopping MCP Mock Server...")
            mock_server_process.terminate()
            mock_server_process.wait(timeout=5)
        
        print("MCP testing tools stopped.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
