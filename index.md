# Nexus MCP Hub Documentation

Welcome to the Nexus MCP Hub documentation! Use the links below to navigate to different sections.

## Main Sections

- [Architecture](architecture/system-overview.md)
- [MCP Servers](mcp-servers/integration-guide.md)
- [Agents](agents/development-guide.md)
- [API](api/reference.md)
- [Deployment](deployment/guide.md)
- [Security](security/best-practices.md)
- [Workflows](workflows/overview.md)
- [Tutorials](tutorials/creating-your-first-agent.md)
- [Troubleshooting](troubleshooting/common-issues.md)

## Quick Links

- [System Overview](architecture/system-overview.md)
- [MCP Server Types](mcp-servers/server-types.md)
- [MCP Server Integration Guide](mcp-servers/integration-guide.md)
- [Agent Types](agents/agent-types.md)
- [Agent Development Guide](agents/development-guide.md)
- [API Reference](api/reference.md)
- [API Client Examples](api/client-examples.md)
- [Deployment Guide](deployment/guide.md)
- [Security Best Practices](security/best-practices.md)
- [Workflow Overview](workflows/overview.md)
- [Creating Your First Agent](tutorials/creating-your-first-agent.md)
- [Integrating a Custom MCP Server](tutorials/integrating-custom-mcp-server.md)
- [Common Issues](troubleshooting/common-issues.md)

## Available MCP Servers

| Server | Port | Transport | Primary Capabilities |
|--------|------|-----------|----------------------|
| Ollama MCP | 3011 | HTTP | Language model inference, code generation |
| ComfyUI MCP | 3020 | HTTP | Image generation and editing |
| Supabase MCP | 3007 | HTTP | Database operations, storage |
| Terminal MCP | 3014 | HTTP | Command execution |
| Memory Server | N/A | stdio | Context management |
| File Explorer | N/A | stdio | File system operations |
| Code Sandbox | N/A | stdio | Code execution |

## Available Agents

| Agent | Type | Model | MCP Servers | Primary Capabilities |
|-------|------|-------|-------------|----------------------|
| CodeAssistant | Coding | Claude 3 Sonnet | Ollama MCP | Code generation, review, explanation |
| Librarian | Research | Claude 3 Opus | Supabase MCP, Terminal MCP | Web search, document retrieval |
| DataSage | Database | GPT-4 | Supabase MCP | Database query, data analysis |
| Muse | Creative | Claude 3 Opus | ComfyUI MCP, Ollama MCP | Creative writing, image generation |
| Sage | Cognitive | GPT-4 Turbo | Ollama MCP, Terminal MCP | Problem-solving, decision-making |
