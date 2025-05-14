# Augment Nexus Integration Documentation

This document provides comprehensive documentation for the Augment Nexus integration, including the Nexus MCP Hub, MCP servers, and VS Code extension.

## Overview

The Augment Nexus integration consists of three main components:

1. **Nexus MCP Hub**: A central coordinator for Model Context Protocol (MCP) servers
2. **MCP Servers**: Specialized servers that provide various capabilities through the MCP protocol
3. **VS Code Extension**: A client that connects to the Nexus Hub and provides access to MCP servers

This integration allows Augment to leverage specialized AI capabilities through the Nexus infrastructure.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  VS Code    │     │  Nexus MCP  │     │  MCP Server │
│  Extension  │<───>│     Hub     │<───>│  (Code Enh) │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       ▲
       │                                       │
       │                                       │
       ▼                                       ▼
┌─────────────┐                        ┌─────────────┐
│   Augment   │                        │  Other MCP  │
│  Assistant  │                        │   Servers   │
└─────────────┘                        └─────────────┘
```

## Installation and Setup

### 1. Nexus MCP Hub

#### Installation

1. Clone the Nexus repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure the hub by editing the configuration file

#### Starting the Hub

```bash
python -m src.nexus.main
```

### 2. Code Enhancement MCP Server

#### Installation

1. Navigate to the `mcp_server` directory
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure the server by editing the `.env` file

#### Starting the Server

```bash
python code_enhancement_server.py
```

#### Registering with Nexus Hub

```bash
python register_with_nexus.py
```

### 3. VS Code Extension

#### Installation

1. Open VS Code
2. Go to Extensions view
3. Click on "..." and select "Install from VSIX..."
4. Select the `augment-nexus-client.vsix` file

#### Configuration

1. Open VS Code settings
2. Search for "Augment Nexus"
3. Set the Nexus Hub URL and other settings

## Using the Integration

### Connecting to Nexus Hub

1. Open VS Code
2. Click on the Nexus icon in the activity bar
3. Click "Connect to Nexus Hub"
4. Enter your credentials when prompted

### Using MCP Servers

#### Through the VS Code Extension

1. Open the Nexus Explorer view
2. Navigate to the "Available Tools" section
3. Click on a tool to use it on the current file or selection

#### Through Augment

1. Ask Augment to perform a task that requires specialized capabilities
2. Augment will use the Nexus infrastructure to access the appropriate MCP server
3. The result will be provided by Augment

## Code Enhancement MCP Server

The Code Enhancement MCP Server provides tools for enhancing code quality.

### Available Tools

#### format_code

Format code according to language-specific style guidelines.

**Parameters:**
- `code` (string, required): The code to format
- `language` (string, required): The programming language of the code

**Example:**
```
format_code("def hello():\nprint('Hello')", "python")
```

#### analyze_code

Analyze code for potential issues and improvements.

**Parameters:**
- `code` (string, required): The code to analyze
- `language` (string, required): The programming language of the code

**Example:**
```
analyze_code("import *", "python")
```

#### generate_docstring

Generate a docstring for a function or class.

**Parameters:**
- `code` (string, required): The function or class code to document
- `language` (string, required): The programming language of the code
- `style` (string, optional): The docstring style to use

**Example:**
```
generate_docstring("def add(a, b):\n    return a + b", "python", "google")
```

## VS Code Extension

The VS Code extension provides a user interface for interacting with the Nexus MCP Hub and MCP servers.

### Features

- **Connect to Nexus Hub**: Connect to a Nexus MCP Hub to access multiple AI servers
- **Server Management**: View and interact with available MCP servers
- **Tool Integration**: Use specialized AI tools from connected servers
- **Code Enhancement**: Process code with AI servers directly from the editor
- **Context Menu Integration**: Right-click to augment your code with AI

### Commands

- `Augment Nexus: Connect to Nexus Hub`: Connect to the Nexus Hub
- `Augment Nexus: Disconnect from Nexus Hub`: Disconnect from the Nexus Hub
- `Augment Nexus: Augment with Nexus`: Augment the current file or selection with Nexus
- `Augment Nexus: Call Nexus Server`: Call a specific Nexus server
- `Augment Nexus: Call Nexus Tool`: Call a specific tool on a Nexus server

## Integration with Augment

This integration enhances Augment's capabilities by providing access to specialized AI servers through the Nexus MCP Hub. When you use Augment in VS Code, it can leverage these servers to:

- Access specialized knowledge bases
- Use domain-specific tools
- Process code with specialized models
- Generate more accurate and contextual responses

### Example Workflows

#### Code Enhancement

1. Ask Augment to enhance your code
2. Augment uses the Nexus infrastructure to access the Code Enhancement server
3. The enhanced code is provided by Augment

#### Knowledge Retrieval

1. Ask Augment a question that requires specialized knowledge
2. Augment uses the Nexus infrastructure to access a knowledge retrieval server
3. The answer is provided by Augment

## Troubleshooting

### Nexus Hub Issues

- Check that the hub is running
- Verify the configuration
- Check the logs for errors

### MCP Server Issues

- Make sure the server is running
- Check that it's registered with Nexus
- Verify the API key is correct

### VS Code Extension Issues

- Check the connection to Nexus Hub
- Verify the credentials
- Check the extension logs

## Next Steps

- Add more MCP servers for different capabilities
- Enhance the VS Code extension with more features
- Improve the integration with Augment
- Add support for more programming languages and tools

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [FastAPI MCP](https://github.com/tadata-org/fastapi_mcp)
- [Nexus MCP Hub Documentation](docs/README.md)
- [Code Enhancement MCP Server Documentation](mcp_server/README.md)
- [VS Code Extension Documentation](vscode-extension/README.md)
