# Nexus MCP Hub API Reference

This document provides a comprehensive reference for the Nexus MCP Hub REST API.

## Base URL

The base URL for all API endpoints is:

```
http://localhost:8000/api
```

## Authentication

Most API endpoints require authentication. Authentication is performed using bearer tokens.

### Login

```
POST /auth/login
```

Request:

```json
{
  "credentials": {
    "username": "admin",
    "password": "password"
  }
}
```

Response:

```json
{
  "token": "abcdef1234567890",
  "user": {
    "username": "admin",
    "name": "Administrator",
    "email": "admin@example.com"
  }
}
```

### Validate Token

```
POST /auth/validate
```

Request:

```json
{
  "token": "abcdef1234567890"
}
```

Response:

```json
{
  "valid": true,
  "user": {
    "username": "admin",
    "name": "Administrator",
    "email": "admin@example.com"
  }
}
```

### Logout

```
POST /auth/logout
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true
}
```

## Server Management

### Get All Servers

```
GET /servers
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "rag-server": {
    "id": "rag-server",
    "name": "RAG Server",
    "command": "python",
    "args": ["-m", "rag_server"],
    "auto_start": true,
    "auto_restart": true,
    "running": true,
    "mcp_connected": true,
    "mcp_initialized": true
  },
  "tools-server": {
    "id": "tools-server",
    "name": "Tools Server",
    "command": "python",
    "args": ["-m", "tools_server"],
    "auto_start": true,
    "auto_restart": true,
    "running": true,
    "mcp_connected": true,
    "mcp_initialized": true
  }
}
```

### Get Server

```
GET /servers/{server_id}
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "id": "rag-server",
  "name": "RAG Server",
  "command": "python",
  "args": ["-m", "rag_server"],
  "auto_start": true,
  "auto_restart": true,
  "running": true,
  "mcp_connected": true,
  "mcp_initialized": true
}
```

### Register Server

```
POST /servers
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Request:

```json
{
  "id": "rag-server",
  "config": {
    "name": "RAG Server",
    "command": "python",
    "args": ["-m", "rag_server"],
    "auto_start": true,
    "auto_restart": true
  }
}
```

Response:

```json
{
  "success": true,
  "id": "rag-server"
}
```

### Unregister Server

```
DELETE /servers/{server_id}
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true,
  "id": "rag-server"
}
```

### Start Server

```
POST /servers/{server_id}/start
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true,
  "id": "rag-server"
}
```

### Stop Server

```
POST /servers/{server_id}/stop
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true,
  "id": "rag-server"
}
```

### Restart Server

```
POST /servers/{server_id}/restart
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true,
  "id": "rag-server"
}
```

## Client Management

### Get All Clients

```
GET /clients
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "12345678-1234-5678-1234-567812345678": {
    "id": "12345678-1234-5678-1234-567812345678",
    "name": "Test Client",
    "connected": true
  }
}
```

### Get Client

```
GET /clients/{client_id}
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "id": "12345678-1234-5678-1234-567812345678",
  "name": "Test Client",
  "connected": true
}
```

## Message Routing

### Add Route

```
POST /router/routes
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Request:

```json
{
  "source": {
    "type": "client",
    "id": "12345678-1234-5678-1234-567812345678"
  },
  "destination": {
    "type": "server",
    "id": "rag-server"
  },
  "method_pattern": "resources/*"
}
```

Response:

```json
{
  "success": true
}
```

### Get Routes

```
GET /router/routes
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "routes": [
    {
      "source": {
        "type": "client",
        "id": "12345678-1234-5678-1234-567812345678"
      },
      "destination": {
        "type": "server",
        "id": "rag-server"
      },
      "method_pattern": "resources/*"
    }
  ]
}
```

### Clear Routes

```
DELETE /router/routes
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true
}
```

### Route Message

```
POST /router/message
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Request:

```json
{
  "message": {
    "id": "msg-123",
    "method": "resources/list",
    "params": {}
  },
  "source": {
    "type": "client",
    "id": "12345678-1234-5678-1234-567812345678"
  }
}
```

Response:

```json
{
  "id": "msg-123",
  "result": {
    "resources": [
      {
        "uri": "knowledge_graph",
        "name": "Knowledge Graph",
        "description": "A graph of knowledge entities and relations"
      }
    ]
  }
}
```

## User Management

### Get Roles

```
GET /users/roles
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "roles": {
    "admin": {
      "name": "admin",
      "description": "Administrator role",
      "permissions": {
        "server": ["SERVER_VIEW", "SERVER_CREATE", "SERVER_MODIFY", "SERVER_DELETE"]
      }
    },
    "user": {
      "name": "user",
      "description": "Regular user role",
      "permissions": {
        "server": ["SERVER_VIEW"]
      }
    }
  }
}
```

### Assign Role

```
POST /users/{username}/roles
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Request:

```json
{
  "role": "user"
}
```

Response:

```json
{
  "success": true
}
```

### Revoke Role

```
DELETE /users/{username}/roles/{role_name}
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true
}
```

## Monitoring

### Get Metrics

```
GET /monitoring/metrics
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "hub_uptime": {
    "name": "hub_uptime",
    "description": "Hub uptime in seconds",
    "type": "gauge",
    "labels": {},
    "timestamp": 1625097600,
    "value": 3600
  },
  "hub_server_count": {
    "name": "hub_server_count",
    "description": "Number of registered servers",
    "type": "gauge",
    "labels": {},
    "timestamp": 1625097600,
    "value": 2
  }
}
```

### Get Health

```
GET /monitoring/health
```

Response:

```json
{
  "status": "healthy",
  "checks": {
    "hub_status": {
      "name": "hub_status",
      "description": "Check if the hub is running",
      "status": "healthy",
      "last_check_time": 1625097600,
      "last_check_duration": 0.001,
      "error_message": null
    },
    "server_manager_status": {
      "name": "server_manager_status",
      "description": "Check if the server manager is running",
      "status": "healthy",
      "last_check_time": 1625097600,
      "last_check_duration": 0.001,
      "error_message": null
    }
  }
}
```

### Get Health Check

```
GET /monitoring/health/check/{check_name}
```

Response:

```json
{
  "name": "hub_status",
  "description": "Check if the hub is running",
  "status": "healthy",
  "last_check_time": 1625097600,
  "last_check_duration": 0.001,
  "error_message": null
}
```

## Hub Management

### Get Hub Status

```
GET /hub/status
```

Response:

```json
{
  "running": true,
  "servers": 2,
  "clients": 1,
  "mcp_servers": 2,
  "mcp_clients": 1
}
```

### Shutdown Hub

```
POST /hub/shutdown
```

Headers:

```
Authorization: Bearer abcdef1234567890
```

Response:

```json
{
  "success": true,
  "message": "Hub shutdown initiated"
}
```
