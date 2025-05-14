# Troubleshooting Common Issues

This guide addresses common issues you might encounter when working with the Nexus MCP Hub and provides solutions to resolve them.

## Table of Contents

1. [Connection Issues](#connection-issues)
2. [Authentication Problems](#authentication-problems)
3. [MCP Server Issues](#mcp-server-issues)
4. [Agent Problems](#agent-problems)
5. [Task Execution Failures](#task-execution-failures)
6. [Performance Issues](#performance-issues)
7. [API Errors](#api-errors)
8. [Database Issues](#database-issues)
9. [Deployment Problems](#deployment-problems)
10. [Logging and Monitoring](#logging-and-monitoring)

## Connection Issues

### Unable to Connect to Nexus Hub

**Symptoms:**
- "Connection refused" errors
- Timeout when trying to access the hub
- Web interface not loading

**Possible Causes:**
1. Nexus Hub is not running
2. Incorrect host or port
3. Firewall blocking the connection
4. Network issues

**Solutions:**

1. **Check if the hub is running:**
   ```bash
   # Check process status
   ps aux | grep nexus
   
   # Check listening ports
   netstat -tuln | grep 3000
   ```

2. **Verify configuration:**
   ```bash
   # Check configuration file
   cat config/nexus.json
   ```

3. **Check firewall settings:**
   ```bash
   # Check firewall status (Linux)
   sudo ufw status
   
   # Allow port (Linux)
   sudo ufw allow 3000/tcp
   ```

4. **Restart the hub:**
   ```bash
   # Stop and start the hub
   npm run stop
   npm run start
   ```

### WebSocket Connection Failures

**Symptoms:**
- Real-time updates not working
- "WebSocket connection failed" errors
- Frequent disconnections

**Solutions:**

1. **Check WebSocket configuration:**
   ```bash
   # Verify WebSocket endpoint
   curl -I http://localhost:3000/api/ws
   ```

2. **Check for proxy issues:**
   If you're using a reverse proxy, ensure it's configured to handle WebSocket connections:

   ```nginx
   # Nginx configuration example
   location /api/ws {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
   }
   ```

3. **Increase ping interval:**
   ```json
   {
     "server": {
       "websocket": {
         "pingInterval": 30000,
         "pingTimeout": 5000
       }
     }
   }
   ```

## Authentication Problems

### Invalid Token Errors

**Symptoms:**
- "Invalid token" or "Unauthorized" errors
- Being logged out unexpectedly
- Unable to access protected resources

**Solutions:**

1. **Check token expiration:**
   JWT tokens have an expiration time. Make sure your token is still valid:

   ```bash
   # Decode JWT token (requires jq)
   echo "your-token" | cut -d'.' -f2 | base64 -d | jq
   ```

2. **Regenerate token:**
   ```bash
   # Login to get a new token
   curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{
     "username": "your-username",
     "password": "your-password"
   }'
   ```

3. **Check JWT secret:**
   Make sure the JWT secret in your configuration matches the one used to generate the token:

   ```json
   {
     "auth": {
       "jwt": {
         "secret": "your-jwt-secret"
       }
     }
   }
   ```

### Permission Denied Errors

**Symptoms:**
- "Permission denied" or "Forbidden" errors
- Unable to perform certain actions
- Access restricted to specific resources

**Solutions:**

1. **Check user roles:**
   ```bash
   # Get current user info
   curl -X GET http://localhost:3000/api/users/me -H "Authorization: Bearer your-token"
   ```

2. **Update user roles:**
   ```bash
   # Update user roles (admin only)
   curl -X PUT http://localhost:3000/api/users/user-id -H "Content-Type: application/json" -H "Authorization: Bearer admin-token" -d '{
     "role": "operator"
   }'
   ```

3. **Check RBAC configuration:**
   ```json
   {
     "auth": {
       "rbac": {
         "roles": [
           {
             "name": "user",
             "permissions": ["read:*", "execute:agents"]
           }
         ]
       }
     }
   }
   ```

## MCP Server Issues

### MCP Server Connection Failures

**Symptoms:**
- "Unable to connect to MCP server" errors
- MCP server status showing as "offline"
- Tool calls failing

**Solutions:**

1. **Check if the MCP server is running:**
   ```bash
   # Check process status
   ps aux | grep mcp-server
   
   # Check listening ports
   netstat -tuln | grep 3011  # For Ollama MCP
   ```

2. **Verify MCP server configuration:**
   ```bash
   # Check MCP server configuration
   cat config/mcp-servers/ollama-mcp.json
   ```

3. **Restart the MCP server:**
   ```bash
   # Restart Ollama MCP server
   cd path/to/ollama-mcp
   npm run restart
   ```

4. **Update MCP server registration:**
   ```bash
   # Update MCP server registration
   curl -X PUT http://localhost:3000/api/mcp-servers/ollama-mcp -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "url": "http://localhost",
     "port": 3011
   }'
   ```

### Tool Execution Failures

**Symptoms:**
- "Tool execution failed" errors
- Timeout during tool execution
- Unexpected tool results

**Solutions:**

1. **Check tool configuration:**
   ```bash
   # Get MCP server details
   curl -X GET http://localhost:3000/api/mcp-servers/ollama-mcp -H "Authorization: Bearer your-token"
   ```

2. **Increase tool timeout:**
   ```bash
   # Update tool timeout
   curl -X PUT http://localhost:3000/api/mcp-servers/ollama-mcp -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "toolTimeout": 30000
   }'
   ```

3. **Check MCP server logs:**
   ```bash
   # View MCP server logs
   cat logs/ollama-mcp.log
   ```

## Agent Problems

### Agent Creation Failures

**Symptoms:**
- "Failed to create agent" errors
- Agent not appearing in the list
- Validation errors during creation

**Solutions:**

1. **Check agent configuration:**
   Make sure the agent configuration is valid:

   ```json
   {
     "id": "coding-assistant",
     "name": "CodingAssistant",
     "description": "A coding assistant agent",
     "type": "coding",
     "model": "llama3:8b",
     "mcpServers": ["ollama-mcp"],
     "capabilities": ["code-generation"]
   }
   ```

2. **Verify MCP server availability:**
   ```bash
   # Check MCP server status
   curl -X GET http://localhost:3000/api/mcp-servers/ollama-mcp -H "Authorization: Bearer your-token"
   ```

3. **Check for duplicate IDs:**
   ```bash
   # List existing agents
   curl -X GET http://localhost:3000/api/agents -H "Authorization: Bearer your-token"
   ```

### Agent Performance Issues

**Symptoms:**
- Poor quality responses
- Slow response times
- Inconsistent behavior

**Solutions:**

1. **Adjust model parameters:**
   ```bash
   # Update agent parameters
   curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "parameters": {
       "temperature": 0.5,
       "maxTokens": 8192,
       "topP": 0.9
     }
   }'
   ```

2. **Change the model:**
   ```bash
   # Update agent model
   curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "model": "llama3:70b"
   }'
   ```

3. **Add more context:**
   When creating tasks, provide more context to help the agent understand the request:

   ```bash
   # Create task with context
   curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "agentId": "coding-assistant",
     "input": "Write a Python function to calculate the factorial of a number",
     "context": {
       "language": "python",
       "level": "beginner",
       "purpose": "educational"
     }
   }'
   ```

## Task Execution Failures

### Task Timeout

**Symptoms:**
- "Task timed out" errors
- Tasks stuck in "in_progress" state
- No response after a long time

**Solutions:**

1. **Increase task timeout:**
   ```bash
   # Update task timeout in configuration
   {
     "tasks": {
       "timeout": 60000
     }
   }
   ```

2. **Check resource usage:**
   ```bash
   # Check CPU and memory usage
   top
   ```

3. **Cancel stuck tasks:**
   ```bash
   # Cancel a stuck task
   curl -X POST http://localhost:3000/api/tasks/task-id/cancel -H "Authorization: Bearer your-token"
   ```

### Task Execution Errors

**Symptoms:**
- "Task execution failed" errors
- Error messages in task output
- Tasks completing with "failed" status

**Solutions:**

1. **Check task details:**
   ```bash
   # Get task details
   curl -X GET http://localhost:3000/api/tasks/task-id -H "Authorization: Bearer your-token"
   ```

2. **Check agent logs:**
   ```bash
   # View agent logs
   cat logs/agents/coding-assistant.log
   ```

3. **Retry with simplified input:**
   ```bash
   # Create a simpler task
   curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "agentId": "coding-assistant",
     "input": "Write a simple hello world program in Python"
   }'
   ```

## Performance Issues

### Slow Response Times

**Symptoms:**
- API requests taking a long time to complete
- Web interface feeling sluggish
- Task execution taking longer than expected

**Solutions:**

1. **Check system resources:**
   ```bash
   # Check CPU, memory, and disk usage
   top
   df -h
   ```

2. **Optimize database queries:**
   ```json
   {
     "database": {
       "poolSize": 10,
       "connectionTimeout": 10000
     }
   }
   ```

3. **Enable caching:**
   ```json
   {
     "cache": {
       "enabled": true,
       "ttl": 3600
     }
   }
   ```

### High Memory Usage

**Symptoms:**
- System running out of memory
- "Out of memory" errors
- Processes being killed by the OS

**Solutions:**

1. **Limit model context size:**
   ```bash
   # Update agent parameters
   curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "parameters": {
       "maxTokens": 4096
     }
   }'
   ```

2. **Implement garbage collection:**
   ```json
   {
     "memory": {
       "gcInterval": 3600,
       "maxAge": 86400
     }
   }
   ```

3. **Increase system resources:**
   If you're running in a container or virtual machine, allocate more memory:

   ```yaml
   # Docker Compose example
   services:
     nexus:
       mem_limit: 4g
   ```

## API Errors

### Rate Limiting Errors

**Symptoms:**
- "Too many requests" errors (HTTP 429)
- Requests being throttled
- Temporary inability to access the API

**Solutions:**

1. **Check rate limit configuration:**
   ```json
   {
     "server": {
       "rateLimit": {
         "enabled": true,
         "windowMs": 60000,
         "max": 100
       }
     }
   }
   ```

2. **Implement request batching:**
   Instead of making many small requests, batch them together:

   ```bash
   # Batch create tasks
   curl -X POST http://localhost:3000/api/tasks/batch -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
     "tasks": [
       {
         "agentId": "coding-assistant",
         "input": "Write a Python function to calculate the factorial of a number"
       },
       {
         "agentId": "coding-assistant",
         "input": "Write a Python function to check if a number is prime"
       }
     ]
   }'
   ```

3. **Implement exponential backoff:**
   When rate limited, wait and retry with increasing delays.

### Validation Errors

**Symptoms:**
- "Validation failed" errors
- "Invalid request" errors
- Specific field validation errors

**Solutions:**

1. **Check request format:**
   Make sure your request follows the API schema:

   ```bash
   # Get API schema
   curl -X GET http://localhost:3000/api/schema -H "Authorization: Bearer your-token"
   ```

2. **Validate input data:**
   Before sending requests, validate the data against the schema.

3. **Check for required fields:**
   Make sure all required fields are included in your requests.

## Database Issues

### Database Connection Failures

**Symptoms:**
- "Database connection failed" errors
- Unable to store or retrieve data
- System startup failures

**Solutions:**

1. **Check database configuration:**
   ```json
   {
     "database": {
       "type": "postgres",
       "host": "localhost",
       "port": 5432,
       "username": "nexus",
       "password": "password",
       "database": "nexus_mcp"
     }
   }
   ```

2. **Verify database status:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check if database exists
   psql -U postgres -c "\\l" | grep nexus_mcp
   ```

3. **Recreate database:**
   ```bash
   # Create database and user
   sudo -u postgres psql -c "CREATE DATABASE nexus_mcp;"
   sudo -u postgres psql -c "CREATE USER nexus WITH ENCRYPTED PASSWORD 'password';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE nexus_mcp TO nexus;"
   ```

### Data Corruption

**Symptoms:**
- Unexpected data in responses
- Missing data
- Inconsistent state

**Solutions:**

1. **Restore from backup:**
   ```bash
   # Restore PostgreSQL database
   pg_restore -U postgres -d nexus_mcp backup.dump
   ```

2. **Run database migrations:**
   ```bash
   # Run migrations
   npm run migrate
   ```

3. **Reset database (last resort):**
   ```bash
   # Reset database
   npm run db:reset
   ```

## Deployment Problems

### Docker Deployment Issues

**Symptoms:**
- Container fails to start
- Container exits unexpectedly
- Unable to access the service in the container

**Solutions:**

1. **Check Docker logs:**
   ```bash
   # View container logs
   docker logs nexus-mcp-hub
   ```

2. **Verify Docker configuration:**
   ```bash
   # Check Docker Compose file
   cat docker-compose.yml
   ```

3. **Rebuild the container:**
   ```bash
   # Rebuild and restart
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Kubernetes Deployment Issues

**Symptoms:**
- Pods not starting
- Pods crashing
- Service not accessible

**Solutions:**

1. **Check pod status:**
   ```bash
   # Get pod status
   kubectl get pods -n nexus-mcp
   
   # Get pod logs
   kubectl logs -n nexus-mcp pod-name
   ```

2. **Check Kubernetes resources:**
   ```bash
   # Check deployments
   kubectl get deployments -n nexus-mcp
   
   # Check services
   kubectl get services -n nexus-mcp
   ```

3. **Apply updated manifests:**
   ```bash
   # Apply Kubernetes manifests
   kubectl apply -f k8s/
   ```

## Logging and Monitoring

### Missing Logs

**Symptoms:**
- Unable to find logs
- Logs not being written
- Incomplete log information

**Solutions:**

1. **Check logging configuration:**
   ```json
   {
     "logging": {
       "level": "info",
       "format": "json",
       "file": "logs/nexus.log"
     }
   }
   ```

2. **Verify log directory permissions:**
   ```bash
   # Check log directory permissions
   ls -la logs/
   
   # Fix permissions
   chmod 755 logs/
   ```

3. **Enable verbose logging:**
   ```json
   {
     "logging": {
       "level": "debug",
       "verbose": true
     }
   }
   ```

### Monitoring Issues

**Symptoms:**
- Metrics not being collected
- Monitoring dashboards not showing data
- Alerts not triggering

**Solutions:**

1. **Check monitoring configuration:**
   ```json
   {
     "monitoring": {
       "metrics": {
         "enabled": true,
         "interval": 60
       }
     }
   }
   ```

2. **Verify Prometheus configuration:**
   ```yaml
   # prometheus.yml
   scrape_configs:
     - job_name: 'nexus-mcp-hub'
       scrape_interval: 15s
       static_configs:
         - targets: ['localhost:3000']
   ```

3. **Restart monitoring services:**
   ```bash
   # Restart Prometheus
   sudo systemctl restart prometheus
   
   # Restart Grafana
   sudo systemctl restart grafana-server
   ```

## Additional Resources

- [System Architecture](../architecture/system-overview.md)
- [API Reference](../api/reference.md)
- [Deployment Guide](../deployment/guide.md)
- [Security Best Practices](../security/best-practices.md)

If you encounter an issue not covered in this guide, please [open an issue](https://github.com/nexusmcphub/nexus/issues) on our GitHub repository.
