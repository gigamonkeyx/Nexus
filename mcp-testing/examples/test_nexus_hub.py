#!/usr/bin/env python3
"""
Example test script for testing the Nexus Hub MCP server.
This script demonstrates how to use the MCP Test Client to test an MCP server.
"""

import asyncio
import json
import logging
import os
import sys

# Add parent directory to path to import MCP Test Client
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mcp_test_client import MCPTestClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("test-nexus-hub")

# Test cases for Nexus Hub
NEXUS_HUB_TEST_CASES = [
    {
        "name": "Get Hub Status",
        "tool": "get_hub_status",
        "parameters": {},
        "validation": lambda result: (
            isinstance(result, dict) and
            "running" in result and
            "servers" in result
        )
    },
    {
        "name": "List Servers",
        "tool": "list_servers",
        "parameters": {},
        "validation": lambda result: isinstance(result, dict)
    },
    {
        "name": "Register Server",
        "tool": "register_server",
        "parameters": {
            "id": "test-server",
            "config": {
                "command": "python",
                "args": ["-m", "http.server", "8000"]
            }
        },
        "validation": lambda result: (
            isinstance(result, dict) and
            "id" in result and
            result["id"] == "test-server"
        )
    }
]

async def run_tests(server_url, test_server_url=None):
    """Run tests against the Nexus Hub MCP server."""
    client = MCPTestClient(server_url, test_server_url)
    
    try:
        # Run each test case
        for test_case in NEXUS_HUB_TEST_CASES:
            logger.info(f"Running test: {test_case['name']}")
            
            # Send the request
            response = await client.send_request(
                test_case["tool"],
                test_case["parameters"]
            )
            
            # Check for errors
            if "error" in response:
                logger.error(f"Test failed: {response['error']}")
                continue
            
            # Validate the result
            result = response.get("result", {})
            validation_func = test_case.get("validation")
            
            if validation_func and not validation_func(result):
                logger.error(f"Validation failed for {test_case['name']}")
                logger.error(f"Result: {json.dumps(result, indent=2)}")
            else:
                logger.info(f"Test passed: {test_case['name']}")
        
        # Run a test suite
        logger.info("Running test suite")
        test_suite = [
            {
                "tool": test_case["tool"],
                "parameters": test_case["parameters"],
                "expected_result": None  # We're not checking exact results
            }
            for test_case in NEXUS_HUB_TEST_CASES
        ]
        
        suite_results = await client.run_test_suite(test_suite)
        logger.info(f"Test suite results: {suite_results['passed']}/{suite_results['total_tests']} tests passed")
        
        # Print detailed results
        for result in suite_results["results"]:
            test_index = result["test_index"]
            test_name = NEXUS_HUB_TEST_CASES[test_index]["name"]
            passed = result["passed"]
            
            if passed:
                logger.info(f"✅ {test_name}")
            else:
                logger.error(f"❌ {test_name}: {result['message']}")
        
        return suite_results
    finally:
        await client.close()

async def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test Nexus Hub MCP Server")
    parser.add_argument("--server", default="http://localhost:8000", help="URL of the Nexus Hub MCP server")
    parser.add_argument("--test-server", default="http://localhost:8020", help="URL of the MCP Test Server")
    
    args = parser.parse_args()
    
    logger.info(f"Testing Nexus Hub at {args.server}")
    results = await run_tests(args.server, args.test_server)
    
    # Determine exit code based on test results
    if results["passed"] == results["total_tests"]:
        logger.info("All tests passed!")
        return 0
    else:
        logger.error(f"{results['total_tests'] - results['passed']} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
