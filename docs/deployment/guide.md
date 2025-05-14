# Deployment Guide

## Introduction

This guide explains how to deploy the Nexus MCP Hub in various environments, from development to production. It covers system requirements, installation methods, configuration options, and best practices for deployment.

## System Requirements

### Hardware Requirements

The hardware requirements depend on the scale of your deployment:

#### Minimum Requirements (Development)

- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB

#### Recommended Requirements (Small Production)

- CPU: 4 cores
- RAM: 8 GB
- Disk: 50 GB

#### High-Performance Requirements (Large Production)

- CPU: 8+ cores
- RAM: 16+ GB
- Disk: 100+ GB SSD

### Software Requirements

- Node.js 16 or higher
- npm 7 or higher
- Docker (optional, for containerized deployment)
- Kubernetes (optional, for production deployment)
- PostgreSQL 12 or higher (for production deployment)
- Redis 6 or higher (for production deployment)

## Deployment Environments

### Documentation Deployment

For deploying the documentation, see:
- [Cloudflare Pages Deployment Guide](cloudflare-pages.md) - For static site hosting
- [Cloudflare Tunnel Guide](cloudflare-tunnel.md) - For exposing local development environment

### Local Development

For local development, you can run the Nexus MCP Hub directly on your machine:

1. Clone the repository:
   ```bash
   git clone https://github.com/nexusmcphub/nexus.git
   cd nexus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the hub:
   ```bash
   npm start
   ```

The hub will be available at `http://localhost:3000`.

### Docker Deployment

For a more isolated environment, you can use Docker:

1. Clone the repository:
   ```bash
   git clone https://github.com/nexusmcphub/nexus.git
   cd nexus
   ```

2. Build the Docker image:
   ```bash
   docker build -t nexus-mcp-hub .
   ```

3. Create a configuration file:
   ```bash
   mkdir -p config
   cp config/nexus.example.json config/nexus.json
   # Edit config/nexus.json with your configuration
   ```

4. Run the container:
   ```bash
   docker run -p 3000:3000 -p 3001:3001 -v $(pwd)/config:/app/config nexus-mcp-hub
   ```

The hub will be available at `http://localhost:3000`.

### Docker Compose Deployment

For a multi-container setup, you can use Docker Compose:

1. Clone the repository:
   ```bash
   git clone https://github.com/nexusmcphub/nexus.git
   cd nexus
   ```

2. Create a configuration file:
   ```bash
   mkdir -p config
   cp config/nexus.example.json config/nexus.json
   # Edit config/nexus.json with your configuration
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

The hub will be available at `http://localhost:3000`.

### Kubernetes Deployment

For production deployments, Kubernetes is recommended:

1. Clone the repository:
   ```bash
   git clone https://github.com/nexusmcphub/nexus.git
   cd nexus
   ```

2. Configure the Kubernetes manifests:
   ```bash
   cd k8s
   # Edit the manifests with your configuration
   ```

3. Apply the manifests:
   ```bash
   kubectl apply -f namespace.yaml
   kubectl apply -f configmap.yaml
   kubectl apply -f secret.yaml
   kubectl apply -f postgres.yaml
   kubectl apply -f redis.yaml
   kubectl apply -f nexus.yaml
   kubectl apply -f service.yaml
   kubectl apply -f ingress.yaml
   ```

4. Verify the deployment:
   ```bash
   kubectl get pods -n nexus-mcp
   ```

The hub will be available at the configured ingress URL.

## Configuration

### Configuration File

The Nexus MCP Hub is configured using a JSON file. The default location is `config/nexus.json`.

Example configuration:

```json
{
  "server": {
    "host": "0.0.0.0",
    "port": 3000,
    "cors": {
      "enabled": true,
      "origins": ["*"]
    }
  },
  "admin": {
    "host": "0.0.0.0",
    "port": 3001
  },
  "database": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "username": "nexus",
    "password": "password",
    "database": "nexus_mcp"
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "password": ""
  },
  "auth": {
    "jwt": {
      "secret": "your-jwt-secret",
      "expiresIn": 3600
    },
    "apiKey": {
      "enabled": true
    }
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": "logs/nexus.log"
  },
  "monitoring": {
    "metrics": {
      "enabled": true,
      "interval": 60
    },
    "health": {
      "enabled": true,
      "interval": 30
    }
  },
  "mcp": {
    "servers": {
      "autoDiscovery": true,
      "autoStart": true
    }
  }
}
```

### Environment Variables

You can also configure the Nexus MCP Hub using environment variables. Environment variables take precedence over the configuration file.

Example `.env` file:

```
NEXUS_SERVER_HOST=0.0.0.0
NEXUS_SERVER_PORT=3000
NEXUS_ADMIN_HOST=0.0.0.0
NEXUS_ADMIN_PORT=3001
NEXUS_DATABASE_TYPE=postgres
NEXUS_DATABASE_HOST=localhost
NEXUS_DATABASE_PORT=5432
NEXUS_DATABASE_USERNAME=nexus
NEXUS_DATABASE_PASSWORD=password
NEXUS_DATABASE_NAME=nexus_mcp
NEXUS_REDIS_HOST=localhost
NEXUS_REDIS_PORT=6379
NEXUS_REDIS_PASSWORD=
NEXUS_AUTH_JWT_SECRET=your-jwt-secret
NEXUS_AUTH_JWT_EXPIRES_IN=3600
NEXUS_LOGGING_LEVEL=info
```

## Database Setup

### PostgreSQL

For production deployments, PostgreSQL is recommended:

1. Create a database:
   ```sql
   CREATE DATABASE nexus_mcp;
   CREATE USER nexus WITH ENCRYPTED PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE nexus_mcp TO nexus;
   ```

2. Configure the Nexus MCP Hub to use PostgreSQL:
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

### SQLite

For development or small deployments, SQLite is supported:

```json
{
  "database": {
    "type": "sqlite",
    "file": "data/nexus.db"
  }
}
```

## High Availability

### Active-Passive Mode

In active-passive mode, only one instance of the hub is active at a time:

```json
{
  "highAvailability": {
    "enabled": true,
    "mode": "active-passive",
    "leaderElection": {
      "enabled": true,
      "leaseDuration": 15,
      "renewDeadline": 10,
      "retryPeriod": 2
    }
  }
}
```

### Active-Active Mode

In active-active mode, all instances of the hub are active:

```json
{
  "highAvailability": {
    "enabled": true,
    "mode": "active-active",
    "redis": {
      "enabled": true
    }
  }
}
```

## Scaling

### Horizontal Scaling

To scale the Nexus MCP Hub horizontally:

1. Configure the hub for high availability
2. Deploy multiple instances
3. Use a load balancer to distribute traffic

Example Kubernetes HorizontalPodAutoscaler:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nexus-mcp-hub
  namespace: nexus-mcp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nexus-mcp-hub
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Vertical Scaling

To scale the Nexus MCP Hub vertically:

1. Increase the resources allocated to the hub
2. Restart the hub to apply the changes

Example Kubernetes resource requests and limits:

```yaml
resources:
  requests:
    cpu: 2
    memory: 4Gi
  limits:
    cpu: 4
    memory: 8Gi
```

## Security

### TLS Configuration

For production deployments, TLS is recommended:

1. Obtain a TLS certificate
2. Configure the hub to use TLS:
   ```json
   {
     "server": {
       "tls": {
         "enabled": true,
         "cert": "/path/to/cert.pem",
         "key": "/path/to/key.pem"
       }
     }
   }
   ```

### Reverse Proxy

For additional security, you can use a reverse proxy:

Example Nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name nexus.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring

### Health Checks

The Nexus MCP Hub provides health check endpoints:

- `/api/health`: Overall health status
- `/api/health/liveness`: Liveness check
- `/api/health/readiness`: Readiness check

Example Kubernetes liveness and readiness probes:

```yaml
livenessProbe:
  httpGet:
    path: /api/health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /api/health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Metrics

The Nexus MCP Hub provides metrics endpoints:

- `/api/metrics`: Prometheus metrics

Example Prometheus configuration:

```yaml
scrape_configs:
  - job_name: 'nexus-mcp-hub'
    scrape_interval: 15s
    static_configs:
      - targets: ['nexus.example.com']
```

### Logging

The Nexus MCP Hub logs to stdout/stderr by default. You can configure additional logging options:

```json
{
  "logging": {
    "level": "info",
    "format": "json",
    "file": "logs/nexus.log"
  }
}
```

For production deployments, it's recommended to use a log aggregation system like ELK or Loki.

## Backup and Restore

### Database Backup

To backup the PostgreSQL database:

```bash
pg_dump -U nexus -d nexus_mcp -f backup.sql
```

### Database Restore

To restore the PostgreSQL database:

```bash
psql -U nexus -d nexus_mcp -f backup.sql
```

### Configuration Backup

To backup the configuration:

```bash
cp config/nexus.json config/nexus.backup.json
```

## Upgrading

### Minor Upgrades

For minor upgrades:

1. Backup the database and configuration
2. Pull the latest changes or update the Docker image
3. Restart the hub

### Major Upgrades

For major upgrades:

1. Backup the database and configuration
2. Review the release notes for breaking changes
3. Update the configuration if needed
4. Pull the latest changes or update the Docker image
5. Run database migrations if needed
6. Restart the hub

## Troubleshooting

### Common Issues

#### Connection Refused

- Check if the hub is running
- Check if the port is correct
- Check if the firewall is blocking the connection

#### Authentication Failed

- Check if the JWT secret is correct
- Check if the token is expired
- Check if the user has the required permissions

#### Database Connection Failed

- Check if the database is running
- Check if the database credentials are correct
- Check if the database is accessible from the hub

### Logs

To view the logs:

```bash
# Docker
docker logs nexus-mcp-hub

# Kubernetes
kubectl logs -n nexus-mcp deployment/nexus-mcp-hub

# Local
cat logs/nexus.log
```

## Next Steps

After deploying the Nexus MCP Hub:

1. [Register MCP servers](../mcp-servers/integration-guide.md)
2. [Create agents](../agents/development-guide.md)
3. [Configure workflows](../workflows/overview.md)
4. [Secure the deployment](../security/best-practices.md)
