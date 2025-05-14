# Updating Existing Cloudflare Tunnel

If you already have a Cloudflare Tunnel running, you can update its configuration to route traffic to your Nexus MCP Hub documentation.

## Checking Existing Tunnels

First, check your existing tunnels:

```bash
cloudflared tunnel list
```

This will show you all the tunnels you have configured, including their names and IDs.

## Updating Tunnel Configuration

The tunnel configuration is typically stored in the `.cloudflared` directory in your user profile. The main configuration file is usually named `config.yml`.

### Windows
```
%USERPROFILE%\.cloudflared\config.yml
```

### macOS/Linux
```
~/.cloudflared/config.yml
```

## Adding Documentation Route

Edit your tunnel configuration file to add a route for your documentation:

```yaml
# Example configuration
tunnel: your-tunnel-id
credentials-file: /path/to/your-tunnel-id.json

# Add this ingress rule for the documentation
ingress:
  - hostname: docs.yourdomain.com
    service: http://localhost:4000
  # Your existing ingress rules...
  - service: http_status:404
```

Make sure to:
1. Add the new ingress rule for `docs.yourdomain.com` before the catch-all rule (`http_status:404`)
2. Keep all your existing ingress rules

## Adding DNS Record

Add a DNS record to route traffic to your tunnel:

```bash
cloudflared tunnel route dns your-tunnel-name docs.yourdomain.com
```

Replace:
- `your-tunnel-name` with the name of your tunnel
- `yourdomain.com` with your actual domain

## Restarting the Tunnel

After updating the configuration, restart your tunnel:

1. If running as a service:
   ```bash
   # Windows
   net stop cloudflared
   net start cloudflared
   
   # macOS
   sudo launchctl stop com.cloudflare.cloudflared
   sudo launchctl start com.cloudflare.cloudflared
   
   # Linux (systemd)
   sudo systemctl restart cloudflared
   ```

2. If running manually, stop the current process and start it again:
   ```bash
   cloudflared tunnel run your-tunnel-name
   ```

## Starting the Documentation Server

Make sure the Jekyll documentation server is running:

```bash
cd D:\mcp\nexus\docs
bundle exec jekyll serve
```

You can use the provided batch file:
```bash
D:\mcp\nexus\start-docs.bat
```

## Verifying the Setup

After updating the tunnel configuration and starting the documentation server, verify that your documentation is accessible:

1. Open a web browser
2. Navigate to `https://docs.yourdomain.com`
3. You should see your Nexus MCP Hub documentation

If you encounter any issues:
1. Check that the Jekyll server is running on port 4000
2. Verify that your tunnel configuration is correct
3. Ensure that the DNS record is properly configured
4. Check the Cloudflare Tunnel logs for any errors:
   ```bash
   cloudflared tunnel info your-tunnel-name
   ```

## Making the Configuration Permanent

To ensure your documentation is always accessible, you can:

1. Set up the Jekyll server to start automatically
2. Make sure the Cloudflare Tunnel is running as a service

### Running Jekyll as a Service

You can use tools like `pm2` (Node.js) or Windows Services to run Jekyll as a service:

```bash
# Using pm2 (requires Node.js)
npm install -g pm2
pm2 start "bundle exec jekyll serve" --name "nexus-docs" --cwd "D:\mcp\nexus\docs"
pm2 save
pm2 startup
```

This will ensure that your documentation server starts automatically when your system boots up.
