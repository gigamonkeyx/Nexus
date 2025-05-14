# Nexus MCP Hub Documentation

Welcome to the Nexus MCP Hub documentation! This comprehensive guide provides detailed information about the architecture, components, and usage of the Nexus MCP Hub system.

## What is Nexus MCP Hub?

Nexus MCP Hub is a central management system for Model Context Protocol (MCP) servers, designed to facilitate the creation and operation of AI agents. It provides a unified interface for interacting with various MCP servers, each offering specialized capabilities.

The hub follows the official MCP specification and provides additional features such as server management, client management, message routing, security, and monitoring.

## Documentation Structure

The documentation is organized into the following sections:

### Architecture

- [System Overview](architecture/system-overview.md): High-level overview of the Nexus MCP Hub architecture
- Component Diagrams: Detailed diagrams of system components
- Communication Protocols: Information about how components communicate

### MCP Servers

- [Integration Guide](mcp-servers/integration-guide.md): How to integrate new MCP servers with the Nexus Hub
- Server Types: Details about different types of MCP servers
- Server Configuration: How to configure MCP servers

### Agents

- [Development Guide](agents/development-guide.md): How to create and configure agents
- Agent Types: Information about different types of agents
- Agent Capabilities: Details about agent capabilities

### API

- API Reference: Comprehensive reference for all API endpoints
- Authentication: Information about API authentication
- Examples: Example API usage

### Deployment

- Deployment Guide: How to deploy the Nexus MCP Hub
- Configuration: System configuration options
- Monitoring: How to monitor the system

### Security

- Security Best Practices: Security considerations for the Nexus MCP Hub
- Authentication and Authorization: How authentication and authorization work
- Data Protection: Information about data protection measures

### Workflows

- [Overview](workflows/overview.md): Common user workflows
- Use Cases: Real-world use cases
- Examples: Example workflows

## Key Features

- **Standards-Compliant**: Built from the ground up following the official MCP specification
- **Modular Architecture**: Clean separation of concerns with a modular design
- **Server Management**: Register, start, stop, and monitor MCP servers
- **Client Management**: Handle client connections and route messages to appropriate servers
- **Protocol Implementation**: Full implementation of the MCP specification
- **Transport Layer**: Support for stdio, HTTP, and WebSocket transports
- **REST API**: Management interface for the hub
- **Security**: Built-in authentication and authorization with token-based access
- **Access Control**: Role-based access control for resources and operations
- **Message Routing**: Intelligent routing of messages between clients and servers
- **Message Forwarding**: Seamless forwarding of messages between components
- **Monitoring**: Comprehensive metrics and health checks
- **High Availability**: Support for active-passive and active-active deployments
- **Admin Dashboard**: Web-based interface for managing the hub

## Getting Started

If you're new to the Nexus MCP Hub, we recommend starting with the following documents:

1. [System Overview](architecture/system-overview.md): Understand the high-level architecture
2. [MCP Server Integration Guide](mcp-servers/integration-guide.md): Learn how to integrate MCP servers
3. [Agent Development Guide](agents/development-guide.md): Learn how to create agents
4. [Workflow Overview](workflows/overview.md): Understand common workflows

## Available MCP Servers

The Nexus MCP Hub integrates with the following MCP servers:

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

The Nexus MCP Hub includes the following pre-configured agents:

| Agent | Type | Model | MCP Servers | Primary Capabilities |
|-------|------|-------|-------------|----------------------|
| CodeAssistant | Coding | Claude 3 Sonnet | Ollama MCP | Code generation, review, explanation |
| Librarian | Research | Claude 3 Opus | Supabase MCP, Terminal MCP | Web search, document retrieval |
| DataSage | Database | GPT-4 | Supabase MCP | Database query, data analysis |
| Muse | Creative | Claude 3 Opus | ComfyUI MCP, Ollama MCP | Creative writing, image generation |
| Sage | Cognitive | GPT-4 Turbo | Ollama MCP, Terminal MCP | Problem-solving, decision-making |

## Documentation Deployment

### Prerequisites

- Ruby 2.7 or higher
- Bundler
- Jekyll
- Cloudflare account

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/nexusmcphub/nexus.git
   cd nexus/docs
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Start the local server:
   ```bash
   bundle exec jekyll serve
   ```

4. Open your browser and navigate to `http://localhost:4000`

### Deployment to Cloudflare Pages

#### Automatic Deployment

The documentation is automatically deployed to Cloudflare Pages when changes are pushed to the main branch.

#### Manual Deployment

1. Build the site:
   ```bash
   JEKYLL_ENV=production bundle exec jekyll serve
   ```

2. Deploy to Cloudflare Pages using Wrangler:
   ```bash
   wrangler pages publish _site --project-name=nexus-mcp-hub
   ```

### Cloudflare Pages Configuration

The documentation is configured to be deployed on Cloudflare Pages with the following settings:

- **Build command**: `jekyll build`
- **Build output directory**: `_site`
- **Environment variables**:
  - `JEKYLL_ENV`: `production`

Custom headers and redirects are configured in the `_headers` and `_redirects` files.

### Cloudflare Tunnel

For local development, you can use Cloudflare Tunnel to securely expose your local environment to the internet:

#### Setup Cloudflare Tunnel

Run the setup script:
```bash
./setup-cloudflare-tunnel.bat
```

This will:
1. Check if cloudflared is installed and install it if needed
2. Authenticate with your Cloudflare account
3. Create a tunnel
4. Configure DNS records
5. Create the tunnel configuration

#### Start Documentation with Tunnel

Run the start script:
```bash
./start-docs-with-tunnel.bat
```

This will:
1. Start the Jekyll server
2. Start the Cloudflare Tunnel

Your documentation will be accessible at `https://docs.yourdomain.com` and the API at `https://api.yourdomain.com`.

## Configuration

Nexus MCP Hub is configured using a JSON configuration file. The default configuration file is `config/nexus.json`.

### Configuration Options

```json
{
  "hub": {
    "host": "localhost",
    "port": 8000,
    "registry_file": "data/registry.json"
  },
  "servers": {
    "auto_start": true,
    "auto_restart": true
  },
  "security": {
    "users_file": "data/users.json",
    "tokens_file": "data/tokens.json",
    "roles_file": "data/roles.json",
    "cors_origins": ["*"],
    "basic_auth": {
      "enabled": true
    },
    "token_auth": {
      "enabled": true
    }
  },
  "ui": {
    "host": "localhost",
    "port": 8080,
    "static_dir": "src/nexus/ui/static"
  },
  "monitoring": {
    "metrics": {
      "export_interval": 60,
      "update_interval": 10,
      "export_file": "data/metrics.json",
      "prometheus": {
        "enabled": true
      }
    },
    "health": {
      "check_interval": 30,
      "export_file": "data/health.json"
    }
  },
  "logging": {
    "level": "info",
    "file": "logs/nexus.log",
    "json": {
      "enabled": true,
      "file": "logs/nexus.json"
    }
  },
  "high_availability": {
    "enabled": false,
    "mode": "active-passive",
    "leader_election": {
      "enabled": true,
      "lease_duration": 15,
      "renew_deadline": 10,
      "retry_period": 2
    }
  }
}
```

### Environment Variables

You can also configure Nexus MCP Hub using environment variables. Environment variables take precedence over the configuration file.

```bash
# Example environment variables
export NEXUS_HUB_HOST=0.0.0.0
export NEXUS_HUB_PORT=8000
export NEXUS_SECURITY_BASIC_AUTH_ENABLED=true
export NEXUS_LOGGING_LEVEL=debug
```

## Usage

### Starting the Hub

```bash
# Start the hub with the default configuration
python -m src.nexus.main

# Start the hub with a custom configuration file
python -m src.nexus.main --config path/to/config.json

# Start the hub with debug logging
python -m src.nexus.main --log-level debug
```

### Accessing the Admin Dashboard

The admin dashboard is available at `http://localhost:8080` by default. You can use the dashboard to manage servers, clients, routes, and users.

### API Usage

The REST API is available at `http://localhost:8000/api` by default. You can use the API to manage servers, clients, routes, and users programmatically.

#### Authentication

```bash
# Login and get an authentication token
curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d '{
  "credentials": {
    "username": "admin",
    "password": "password"
  }
}'

# Use the token for authenticated requests
curl -X GET http://localhost:8000/api/servers -H "Authorization: Bearer <token>"
```

#### Server Management

```bash
# Register a server
curl -X POST http://localhost:8000/api/servers -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{
  "id": "rag-server",
  "config": {
    "name": "RAG Server",
    "command": "python",
    "args": ["-m", "rag_server"],
    "auto_start": true,
    "auto_restart": true
  }
}'

# Get all servers
curl -X GET http://localhost:8000/api/servers -H "Authorization: Bearer <token>"

# Start a server
curl -X POST http://localhost:8000/api/servers/rag-server/start -H "Authorization: Bearer <token>"
```

#### Message Routing

```bash
# Add a route
curl -X POST http://localhost:8000/api/router/routes -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{
  "source": {
    "type": "client",
    "id": "12345678-1234-5678-1234-567812345678"
  },
  "destination": {
    "type": "server",
    "id": "rag-server"
  },
  "method_pattern": "resources/*"
}'

# Route a message
curl -X POST http://localhost:8000/api/router/message -H "Content-Type: application/json" -H "Authorization: Bearer <token>" -d '{
  "message": {
    "id": "msg-123",
    "method": "resources/list",
    "params": {}
  },
  "source": {
    "type": "client",
    "id": "12345678-1234-5678-1234-567812345678"
  }
}'
```

For more API examples, see the [API Reference](#api-reference) section.

## Monitoring

Nexus MCP Hub includes comprehensive monitoring capabilities, including metrics collection, health checks, and logging.

### Metrics

Metrics are available at the `/api/monitoring/metrics` endpoint. The metrics include:

- Hub uptime
- Server count
- Client count
- Message count
- Error count
- Processing time

### Health Checks

Health checks are available at the `/api/monitoring/health` endpoint. The health checks include:

- Hub status
- Server manager status
- Client manager status
- Registry status

### Logging

Logs are written to the console and optionally to a file. JSON logging is also supported for integration with log aggregation systems.

## High Availability

Nexus MCP Hub supports high availability deployments using Kubernetes. The high availability configuration includes:

- Multiple replicas for fault tolerance
- Pod anti-affinity for resilience
- Pod disruption budget for availability
- Horizontal pod autoscaler for scalability
- Leader election for active-passive mode

### Active-Passive Mode

In active-passive mode, only one instance of the hub is active at a time. The active instance handles all requests, while the passive instances are on standby. If the active instance fails, one of the passive instances becomes active.

### Active-Active Mode

In active-active mode, all instances of the hub are active and handle requests. This mode provides higher throughput but requires additional coordination between instances.

## Deployment

Nexus MCP Hub can be deployed in various environments, from development to production.

### Development Deployment

For development, you can run the hub locally using Python or Docker.

### Production Deployment

For production, it is recommended to use Kubernetes for high availability and scalability. The Kubernetes manifests are provided in the `k8s` directory.

### CI/CD Pipeline

A CI/CD pipeline is provided using GitHub Actions. The pipeline includes:

- Testing
- Building
- Deployment to development
- Deployment to production

The pipeline is defined in the `.github/workflows/ci.yml` file.
