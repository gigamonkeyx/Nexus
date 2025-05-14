# Augment Nexus Client

A VS Code extension that connects Augment to the Nexus MCP Hub, allowing you to leverage specialized AI servers directly from your editor.

## Features

- **Connect to Nexus Hub**: Connect to a Nexus MCP Hub to access multiple AI servers
- **Server Management**: View and interact with available MCP servers
- **Tool Integration**: Use specialized AI tools from connected servers
- **Code Enhancement**: Process code with AI servers directly from the editor
- **Context Menu Integration**: Right-click to augment your code with AI

## Getting Started

### Prerequisites

- VS Code 1.60.0 or higher
- A running Nexus MCP Hub instance

### Installation

1. Install the extension from the VS Code Marketplace
2. Open the Command Palette (`Ctrl+Shift+P`) and run `Augment Nexus: Connect to Nexus Hub`
3. Enter the Nexus Hub URL, username, and password when prompted

### Configuration

You can configure the extension in the VS Code settings:

- `augmentNexusClient.hubUrl`: URL of the Nexus MCP Hub (default: `http://localhost:8000`)
- `augmentNexusClient.username`: Username for Nexus Hub authentication
- `augmentNexusClient.token`: Authentication token for Nexus Hub (automatically set after login)

## Usage

### Connecting to Nexus Hub

1. Click on the Nexus icon in the activity bar
2. If not already connected, click "Connect to Nexus Hub"
3. Enter your credentials when prompted

### Using AI Tools

#### From the Explorer View

1. Open the Nexus Explorer view from the activity bar
2. Navigate to the "Available Tools" section
3. Click on a tool to use it on the current file or selection

#### From the Editor

1. Select text in the editor
2. Right-click and select "Augment Selection with Nexus"
3. Choose a server and tool to process your code

### Viewing Server Information

1. Open the Nexus Explorer view from the activity bar
2. Navigate to the "Nexus Servers" section
3. Click on a server to expand it and see its capabilities

## How It Works

The extension acts as an MCP client that connects to the Nexus MCP Hub. The hub routes messages between the extension and various MCP servers, allowing you to access specialized AI capabilities directly from VS Code.

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  VS Code    │     │  Nexus MCP  │     │  MCP Server │
│  Extension  │<───>│     Hub     │<───>│  (RAG, etc) │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Integration with Augment

This extension enhances Augment's capabilities by providing access to specialized AI servers through the Nexus MCP Hub. When you use Augment in VS Code, it can leverage these servers to:

- Access specialized knowledge bases
- Use domain-specific tools
- Process code with specialized models
- Generate more accurate and contextual responses

## Troubleshooting

### Connection Issues

- Ensure the Nexus MCP Hub is running
- Check that the hub URL is correct in the settings
- Verify your credentials are correct

### Tool Execution Issues

- Check that the server is running and connected to the hub
- Ensure you have permission to use the tool
- Check the server logs for any errors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.

## Acknowledgements

- Nexus MCP Hub team for providing the server infrastructure
- Augment team for their AI assistant technology
