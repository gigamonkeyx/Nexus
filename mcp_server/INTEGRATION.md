# Integrating with VS Code Extension

This document explains how to integrate the Code Enhancement MCP Server with the Augment Nexus Client VS Code extension.

## Prerequisites

1. Nexus MCP Hub running
2. Code Enhancement MCP Server running and registered with Nexus
3. Augment Nexus Client VS Code extension installed

## Configuration

### 1. Configure Nexus Hub

Make sure Nexus Hub is running and properly configured. The hub should be accessible at the URL specified in your `.env` file (default: `http://localhost:8000`).

### 2. Start and Register the MCP Server

Run the setup script to start the server and register it with Nexus:

```bash
setup.bat
```

This will:
1. Install dependencies
2. Start the server
3. Test the server functionality
4. Register the server with Nexus Hub

### 3. Configure VS Code Extension

1. Open VS Code
2. Click on the Nexus icon in the activity bar
3. Click "Connect to Nexus Hub"
4. Enter the Nexus Hub URL and credentials
5. Once connected, you should see the "Code Enhancement" server in the "Nexus Servers" view

## Using the Integration

### Method 1: Through the VS Code Extension UI

1. Open a code file in VS Code
2. Select the code you want to enhance
3. Right-click and select "Augment with Nexus"
4. Choose the "Code Enhancement" server
5. Select the tool you want to use (format_code, analyze_code, or generate_docstring)
6. The result will be displayed according to your selection

### Method 2: Through the Command Palette

1. Open a code file in VS Code
2. Select the code you want to enhance
3. Press `Ctrl+Shift+P` to open the Command Palette
4. Type "Augment with Nexus" and select the command
5. Choose the "Code Enhancement" server
6. Select the tool you want to use
7. The result will be displayed according to your selection

### Method 3: Using Augment

1. Open a code file in VS Code
2. Ask Augment to enhance your code
3. Augment will use the Nexus MCP Hub to access the Code Enhancement server
4. The enhanced code will be provided by Augment

## Example Workflows

### Code Formatting

1. Select code in the editor
2. Right-click and select "Augment with Nexus"
3. Choose "Code Enhancement" server
4. Select "format_code" tool
5. The formatted code will replace your selection or be inserted at the cursor

### Code Analysis

1. Select code in the editor
2. Right-click and select "Augment with Nexus"
3. Choose "Code Enhancement" server
4. Select "analyze_code" tool
5. The analysis results will be displayed in the output panel

### Docstring Generation

1. Select a function or class in the editor
2. Right-click and select "Augment with Nexus"
3. Choose "Code Enhancement" server
4. Select "generate_docstring" tool
5. The generated docstring will be displayed and can be inserted at the appropriate location

## Troubleshooting

### Server Not Appearing in VS Code Extension

1. Make sure the server is running (`python code_enhancement_server.py`)
2. Make sure the server is registered with Nexus (`python register_with_nexus.py`)
3. Check the Nexus Hub logs for any errors
4. Refresh the server list in the VS Code extension

### Authentication Issues

1. Make sure the API key in the `.env` file matches the one configured in Nexus
2. Check the server logs for authentication errors
3. Try restarting the server and re-registering with Nexus

### Connection Issues

1. Make sure the server is running on the correct host and port
2. Check that the URL registered with Nexus is accessible from the Nexus Hub
3. Check for any firewall or network issues that might be blocking the connection

## Next Steps

- Add more code enhancement tools to the server
- Implement language-specific formatters and analyzers
- Add support for more programming languages
- Integrate with other development tools and workflows
