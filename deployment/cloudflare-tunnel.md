# Setting Up Cloudflare Tunnel

This guide explains how to set up a Cloudflare Tunnel to securely expose your local Nexus MCP Hub to the internet.

## Introduction

Cloudflare Tunnel provides a secure way to connect your local development environment to Cloudflare's network without exposing your IP address or opening ports on your firewall. This is ideal for:

- Sharing your local development environment with team members
- Testing your application from different devices
- Providing a secure way to access your local services remotely

## Prerequisites

Before you begin, make sure you have:

1. A Cloudflare account with a domain added to it
2. Cloudflare Zero Trust enabled on your account
3. Admin access to your Cloudflare account
4. The Nexus MCP Hub running locally

## Step 1: Install cloudflared

First, you need to install the `cloudflared` command-line tool:

### Windows

1. Download the latest Windows executable from [Cloudflare's download page](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
2. Run the installer
3. Verify the installation by running:
   ```powershell
   cloudflared --version
   ```

### macOS

Using Homebrew:
```bash
brew install cloudflare/cloudflare/cloudflared
```

### Linux

Using apt (Debian/Ubuntu):
```bash
curl -L https://pkg.cloudflare.com/cloudflared-stable-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

## Step 2: Authenticate cloudflared

Authenticate `cloudflared` with your Cloudflare account:

```bash
cloudflared tunnel login
```

This will open a browser window where you'll be asked to log in to your Cloudflare account and authorize `cloudflared`. Select the domain you want to use with the tunnel.

## Step 3: Create a Tunnel

Create a new tunnel:

```bash
cloudflared tunnel create nexus-mcp-hub
```

This command will create a new tunnel named "nexus-mcp-hub" and generate a credentials file in the `.cloudflared` directory.

## Step 4: Configure the Tunnel

Create a configuration file for your tunnel:

### Windows

Create a file at `%USERPROFILE%\.cloudflared\config.yml` with the following content:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<YOUR_USERNAME>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: docs.yourdomain.com
    service: http://localhost:4000
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

### macOS/Linux

Create a file at `~/.cloudflared/config.yml` with the following content:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/<YOUR_USERNAME>/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: docs.yourdomain.com
    service: http://localhost:4000
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

Replace:
- `<TUNNEL_ID>` with the ID of your tunnel (you can find it by running `cloudflared tunnel list`)
- `<YOUR_USERNAME>` with your system username
- `yourdomain.com` with your actual domain

This configuration routes traffic from:
- `docs.yourdomain.com` to your local Jekyll server (port 4000)
- `api.yourdomain.com` to your local Nexus MCP Hub API (port 3000)

## Step 5: Route DNS to Your Tunnel

Configure DNS records to route traffic to your tunnel:

```bash
cloudflared tunnel route dns nexus-mcp-hub docs.yourdomain.com
cloudflared tunnel route dns nexus-mcp-hub api.yourdomain.com
```

This creates CNAME records in your Cloudflare DNS settings that point to your tunnel.

## Step 6: Start the Tunnel

Start the tunnel:

```bash
cloudflared tunnel run nexus-mcp-hub
```

Your local services are now accessible through the configured hostnames.

## Step 7: Run as a Service (Optional)

To run the tunnel as a background service:

### Windows

Install as a service:
```powershell
cloudflared service install
```

### macOS

Install as a service:
```bash
sudo cloudflared service install
```

### Linux

Install as a service:
```bash
sudo cloudflared service install
```

## Step 8: Verify the Connection

1. Start your local Jekyll server:
   ```bash
   cd D:\mcp\nexus\docs
   bundle exec jekyll serve
   ```

2. Start your Nexus MCP Hub:
   ```bash
   cd D:\mcp
   npm start
   ```

3. Open your browser and navigate to:
   - `https://docs.yourdomain.com` - Should show your documentation
   - `https://api.yourdomain.com` - Should connect to your Nexus MCP Hub API

## Security Considerations

1. **Access Policies**: Configure Cloudflare Access policies to control who can access your tunneled services:
   - Go to Cloudflare Zero Trust dashboard
   - Navigate to Access > Applications
   - Create a new application for each hostname
   - Configure authentication methods (e.g., email, Google, GitHub)

2. **Service Tokens**: For API access, consider using service tokens:
   ```bash
   cloudflared access token api.yourdomain.com
   ```

3. **Firewall Rules**: Add additional protection with Cloudflare Firewall Rules:
   - Go to your domain's dashboard
   - Navigate to Security > WAF
   - Create rules to block malicious traffic

## Troubleshooting

### Connection Issues

If you're having trouble connecting:

1. Check that `cloudflared` is running:
   ```bash
   cloudflared tunnel info nexus-mcp-hub
   ```

2. Verify DNS records:
   ```bash
   dig docs.yourdomain.com
   ```

3. Check the logs:
   ```bash
   cloudflared tunnel logs nexus-mcp-hub
   ```

### Common Errors

1. **"Unable to connect to origin service"**: Make sure your local services are running and accessible on the configured ports.

2. **"Certificate has expired"**: Re-authenticate with `cloudflared tunnel login`.

3. **"Hostname is not within a zone in your account"**: Make sure the domain is added to your Cloudflare account.

## Managing Your Tunnel

### List Tunnels

```bash
cloudflared tunnel list
```

### Delete a Tunnel

```bash
cloudflared tunnel delete nexus-mcp-hub
```

### Clean Up DNS Records

```bash
cloudflared tunnel route dns nexus-mcp-hub docs.yourdomain.com --overwrite-dns
```

## Next Steps

After setting up your Cloudflare Tunnel:

1. Configure Cloudflare Access policies for secure authentication
2. Set up Cloudflare Workers for additional functionality
3. Configure Cloudflare Pages for static site hosting

For more information, refer to the [Cloudflare Tunnel documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).
