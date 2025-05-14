#!/usr/bin/env python3
"""
MCP Test Client - A client library for writing tests against MCP servers.
This library provides a simple interface for testing MCP servers and validating their responses.
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mcp-test-client")

class MCPTestClient:
    """Client for testing MCP servers."""
    
    def __init__(self, server_url: str, test_server_url: Optional[str] = None):
        """
        Initialize the MCP Test Client.
        
        Args:
            server_url: URL of the MCP server to test
            test_server_url: URL of the MCP Test Server (optional)
        """
        self.server_url = server_url
        self.test_server_url = test_server_url
        self.client = httpx.AsyncClient()
        self.test_results = []
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
    
    async def send_request(self, tool: str, parameters: Dict[str, Any] = None, request_id: str = None) -> Dict[str, Any]:
        """
        Send an MCP request to the server.
        
        Args:
            tool: Name of the tool to call
            parameters: Parameters for the tool
            request_id: Optional request ID
        
        Returns:
            The server's response
        """
        if parameters is None:
            parameters = {}
        
        request_id = request_id or str(uuid.uuid4())
        
        request_data = {
            "tool": tool,
            "parameters": parameters,
            "id": request_id
        }
        
        try:
            response = await self.client.post(
                self.server_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            response_data = response.json()
            
            # Record the test result
            self.test_results.append({
                "timestamp": datetime.now().isoformat(),
                "request": request_data,
                "response": response_data,
                "status_code": response.status_code
            })
            
            return response_data
        except Exception as e:
            logger.exception(f"Error sending request to {self.server_url}")
            error_result = {
                "error": {
                    "type": "client_error",
                    "message": str(e)
                }
            }
            
            # Record the test result
            self.test_results.append({
                "timestamp": datetime.now().isoformat(),
                "request": request_data,
                "error": str(e)
            })
            
            return error_result
    
    async def validate_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate an MCP request against the specification.
        
        Args:
            request_data: The MCP request to validate
        
        Returns:
            Validation result
        """
        if not self.test_server_url:
            logger.warning("No test server URL provided, skipping validation")
            return {"valid": True, "errors": []}
        
        try:
            response = await self.client.post(
                self.test_server_url,
                json={
                    "tool": "validate_mcp_request",
                    "parameters": {"request": request_data}
                },
                headers={"Content-Type": "application/json"}
            )
            
            response_data = response.json()
            return response_data.get("result", {"valid": False, "errors": ["Invalid response from test server"]})
        except Exception as e:
            logger.exception(f"Error validating request with test server")
            return {"valid": False, "errors": [str(e)]}
    
    async def validate_response(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate an MCP response against the specification.
        
        Args:
            response_data: The MCP response to validate
        
        Returns:
            Validation result
        """
        if not self.test_server_url:
            logger.warning("No test server URL provided, skipping validation")
            return {"valid": True, "errors": []}
        
        try:
            response = await self.client.post(
                self.test_server_url,
                json={
                    "tool": "validate_mcp_response",
                    "parameters": {"response": response_data}
                },
                headers={"Content-Type": "application/json"}
            )
            
            response_data = response.json()
            return response_data.get("result", {"valid": False, "errors": ["Invalid response from test server"]})
        except Exception as e:
            logger.exception(f"Error validating response with test server")
            return {"valid": False, "errors": [str(e)]}
    
    async def run_test_case(self, tool: str, parameters: Dict[str, Any], expected_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run a test case against the MCP server.
        
        Args:
            tool: Name of the tool to call
            parameters: Parameters for the tool
            expected_result: Expected result from the server (optional)
        
        Returns:
            Test result
        """
        request_id = str(uuid.uuid4())
        
        request_data = {
            "tool": tool,
            "parameters": parameters,
            "id": request_id
        }
        
        # Validate the request
        request_validation = await self.validate_request(request_data)
        
        if not request_validation.get("valid", False):
            return {
                "passed": False,
                "stage": "request_validation",
                "message": "Invalid MCP request",
                "validation": request_validation
            }
        
        # Send the request
        response_data = await self.send_request(tool, parameters, request_id)
        
        # Validate the response
        response_validation = await self.validate_response(response_data)
        
        if not response_validation.get("valid", False):
            return {
                "passed": False,
                "stage": "response_validation",
                "message": "Invalid MCP response",
                "validation": response_validation,
                "response": response_data
            }
        
        # Check expected result if provided
        if expected_result is not None:
            result = response_data.get("result", {})
            
            # Simple equality check - could be enhanced for more complex comparisons
            if result != expected_result:
                return {
                    "passed": False,
                    "stage": "result_comparison",
                    "message": "Response does not match expected result",
                    "expected": expected_result,
                    "actual": result
                }
        
        return {
            "passed": True,
            "message": "Test passed",
            "response": response_data
        }
    
    async def run_test_suite(self, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Run a test suite against the MCP server.
        
        Args:
            test_cases: List of test cases to run
        
        Returns:
            Test suite results
        """
        results = []
        
        for i, test_case in enumerate(test_cases):
            tool = test_case.get("tool")
            parameters = test_case.get("parameters", {})
            expected_result = test_case.get("expected_result")
            
            if not tool:
                results.append({
                    "test_index": i,
                    "passed": False,
                    "message": "Missing required field: tool"
                })
                continue
            
            result = await self.run_test_case(tool, parameters, expected_result)
            result["test_index"] = i
            results.append(result)
        
        return {
            "timestamp": datetime.now().isoformat(),
            "server_url": self.server_url,
            "total_tests": len(test_cases),
            "passed": sum(1 for r in results if r.get("passed", False)),
            "results": results
        }
    
    def get_test_results(self) -> List[Dict[str, Any]]:
        """Get all recorded test results."""
        return self.test_results
    
    def clear_test_results(self):
        """Clear all recorded test results."""
        self.test_results = []

async def main():
    """Example usage of the MCP Test Client."""
    import argparse
    
    parser = argparse.ArgumentParser(description="MCP Test Client")
    parser.add_argument("--server", required=True, help="URL of the MCP server to test")
    parser.add_argument("--test-server", help="URL of the MCP Test Server")
    parser.add_argument("--tool", help="Tool to test")
    parser.add_argument("--parameters", help="Parameters for the tool (JSON string)")
    
    args = parser.parse_args()
    
    client = MCPTestClient(args.server, args.test_server)
    
    try:
        if args.tool:
            parameters = json.loads(args.parameters) if args.parameters else {}
            result = await client.send_request(args.tool, parameters)
            print(json.dumps(result, indent=2))
        else:
            # Run a simple test suite
            test_cases = [
                {
                    "tool": "hello_world",
                    "parameters": {},
                    "expected_result": {"message": "Hello, world!"}
                }
            ]
            
            results = await client.run_test_suite(test_cases)
            print(json.dumps(results, indent=2))
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
