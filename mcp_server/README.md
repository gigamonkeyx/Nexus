# Code Enhancement MCP Server

This is a Model Context Protocol (MCP) server that provides tools for enhancing code. It can be used by Augment through the Nexus MCP Hub to improve code quality.

## Features

- **Code Formatting**: Format code according to language-specific style guidelines
- **Code Analysis**: Analyze code for potential issues and improvements
- **Docstring Generation**: Generate docstrings for functions and classes

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure the server by editing the `.env` file:

```
HOST=0.0.0.0
PORT=8001
MCP_API_KEY=your-api-key
```

## Usage

### Starting the Server

```bash
python code_enhancement_server.py
```

This will start the server on the host and port specified in the `.env` file.

### Testing the Server

You can test the server directly using the provided test script:

```bash
python test_server.py
```

This will test all the available tools and verify that the server is working correctly.

### Registering with Nexus Hub

To register the server with Nexus Hub, use the provided registration script:

```bash
python register_with_nexus.py
```

Make sure to configure the Nexus Hub URL and API key in the `.env` file:

```
NEXUS_URL=http://localhost:8000
NEXUS_API_KEY=nexus-api-key
```

## API

The server provides the following MCP tools:

### format_code

Format code according to language-specific style guidelines.

**Parameters:**
- `code` (string, required): The code to format
- `language` (string, required): The programming language of the code (python, javascript, typescript, java, csharp, go)

**Returns:**
- `formatted_code` (string): The formatted code
- `language` (string): The programming language

### analyze_code

Analyze code for potential issues and improvements.

**Parameters:**
- `code` (string, required): The code to analyze
- `language` (string, required): The programming language of the code (python, javascript, typescript, java, csharp, go)

**Returns:**
- `issues` (array): List of identified issues
- `suggestions` (array): List of improvement suggestions
- `language` (string): The programming language

### generate_docstring

Generate a docstring for a function or class.

**Parameters:**
- `code` (string, required): The function or class code to document
- `language` (string, required): The programming language of the code (python, javascript, typescript, java, csharp, go)
- `style` (string, optional): The docstring style to use (google, numpy, sphinx)

**Returns:**
- `docstring` (string): The generated docstring
- `language` (string): The programming language
- `style` (string): The docstring style

## Integration with Augment

This MCP server can be used by Augment through the Nexus MCP Hub to enhance code quality. When registered with Nexus, Augment can access the tools provided by this server to:

1. Format code according to best practices
2. Identify potential issues and suggest improvements
3. Generate proper documentation for functions and classes

## Security

The server uses API key authentication to secure access. Make sure to set a strong API key in the `.env` file and configure the same key in Nexus Hub when registering the server.

## License

MIT
