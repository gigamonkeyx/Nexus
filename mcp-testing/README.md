# MCP Testing Tools

A comprehensive suite of tools for testing Model Context Protocol (MCP) implementations.

## Overview

This repository contains a set of tools for testing MCP servers and clients:

1. **MCP Test Server**: A specialized MCP server that provides testing tools as MCP functions
2. **MCP Test Client**: A client library for writing tests against MCP servers
3. **MCP Mock Server**: A configurable mock server for simulating MCP responses
4. **MCP Validator**: A tool to validate MCP requests and responses against the specification

These tools work together to provide a complete testing solution for MCP implementations.

## Components

### MCP Test Server

The MCP Test Server is an MCP-compliant server that provides tools for testing other MCP servers. It exposes the following tools:

- `validate_mcp_request`: Validates an MCP request against the specification
- `validate_mcp_response`: Validates an MCP response against the specification
- `test_mcp_server`: Tests an MCP server by sending requests and validating responses
- `create_test_suite`: Creates a test suite for MCP testing
- `run_test_suite`: Runs a test suite against an MCP server

#### Usage

```bash
python mcp_test_server.py --host 127.0.0.1 --port 8020
```

### MCP Test Client

The MCP Test Client is a Python library for writing tests against MCP servers. It provides a simple interface for sending requests, validating responses, and running test suites.

#### Usage

```python
from mcp_test_client import MCPTestClient

async def run_tests():
    client = MCPTestClient("http://localhost:8000", "http://localhost:8020")
    
    try:
        # Send a request
        response = await client.send_request("hello_world", {})
        print(response)
        
        # Run a test case
        result = await client.run_test_case(
            "hello_world",
            {},
            {"message": "Hello, world!"}
        )
        print(result)
        
        # Run a test suite
        test_suite = [
            {
                "tool": "hello_world",
                "parameters": {},
                "expected_result": {"message": "Hello, world!"}
            }
        ]
        
        results = await client.run_test_suite(test_suite)
        print(results)
    finally:
        await client.close()
```

### MCP Mock Server

The MCP Mock Server is a configurable server that simulates MCP responses. It can be configured to return specific responses for specific requests, making it useful for testing MCP clients without requiring a real model.

#### Usage

```bash
python mcp_mock_server.py --host 127.0.0.1 --port 8030 --config examples/mock_config.json
```

#### Configuration

The mock server is configured using a JSON file that specifies the responses for different tools:

```json
[
  {
    "tool": "hello_world",
    "response": {
      "result": {
        "message": "Hello, world!"
      }
    },
    "delay_ms": 100
  }
]
```

### MCP Validator

The MCP Validator is a standalone tool for validating MCP requests and responses against the specification. It can be used to validate JSON files containing MCP messages.

#### Usage

```bash
python mcp_validator.py examples/request.json --type request
python mcp_validator.py examples/response.json --type response
python mcp_validator.py examples/tool.json --type tool
python mcp_validator.py examples/tool_list.json --type tool_list
```

## Examples

The `examples` directory contains example test scripts and configuration files:

- `test_nexus_hub.py`: Example test script for testing the Nexus Hub MCP server
- `mock_config.json`: Example mock configuration for the MCP Mock Server

## Getting Started

### Prerequisites

- Python 3.7+
- FastAPI
- Uvicorn
- httpx

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/mcp-testing.git
   cd mcp-testing
   ```

2. Install dependencies:
   ```bash
   pip install fastapi uvicorn httpx
   ```

3. Start the MCP Test Server:
   ```bash
   python mcp_test_server.py
   ```

4. Start the MCP Mock Server:
   ```bash
   python mcp_mock_server.py --config examples/mock_config.json
   ```

5. Run the example test script:
   ```bash
   python examples/test_nexus_hub.py
   ```

## Integration with Nexus Hub

These testing tools can be integrated with your Nexus Hub ecosystem:

1. **Add MCP Test Server as a Nexus Hub Server**: Register the MCP Test Server with your Nexus Hub to make testing tools available to all connected clients.

2. **Use MCP Test Client in VS Code Extension**: Integrate the MCP Test Client into your VS Code extension to enable testing of MCP servers directly from the IDE.

3. **Use MCP Mock Server for Development**: Use the MCP Mock Server during development to simulate responses from MCP servers without requiring a real model.

4. **Add Validation to Nexus Hub**: Integrate the MCP Validator into your Nexus Hub to validate all incoming and outgoing MCP messages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
