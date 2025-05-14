# Deploying to Cloudflare Pages

This guide explains how to deploy the Nexus MCP Hub documentation to Cloudflare Pages.

## Prerequisites

Before you begin, make sure you have:

1. A Cloudflare account
2. Access to the Nexus MCP Hub repository
3. Git installed on your local machine

## Setting Up Cloudflare Pages

### Step 1: Create a New Cloudflare Pages Project

1. Log in to your Cloudflare dashboard
2. Navigate to **Pages**
3. Click **Create a project**
4. Select **Connect to Git**

### Step 2: Connect Your Repository

1. Select the Git provider where your repository is hosted (GitHub, GitLab, etc.)
2. Authenticate with your Git provider
3. Select the Nexus MCP Hub repository
4. Click **Begin setup**

### Step 3: Configure Build Settings

Configure the build settings as follows:

- **Project name**: `nexus-mcp-hub`
- **Production branch**: `main`
- **Build command**: `jekyll build`
- **Build output directory**: `_site`
- **Root directory**: `docs`

### Step 4: Add Environment Variables

Add the following environment variables:

- `JEKYLL_ENV`: `production`

### Step 5: Deploy

Click **Save and Deploy** to start the deployment process.

## Automatic Deployments

Once you've set up Cloudflare Pages, it will automatically deploy your documentation whenever you push changes to the main branch of your repository.

The deployment process includes:

1. Cloning the repository
2. Installing dependencies
3. Building the site using Jekyll
4. Deploying the built site to Cloudflare's global network

## Manual Deployments

If you need to deploy manually, you can do so using the Cloudflare Wrangler CLI:

### Step 1: Install Wrangler

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

### Step 3: Build the Site

```bash
cd nexus/docs
JEKYLL_ENV=production bundle exec jekyll build
```

### Step 4: Deploy to Cloudflare Pages

```bash
wrangler pages publish _site --project-name=nexus-mcp-hub
```

## Custom Domain Setup

To use a custom domain for your documentation:

### Step 1: Add a Custom Domain

1. In the Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name (e.g., `docs.nexusmcphub.com`)
4. Click **Continue**

### Step 2: Configure DNS

If your domain is already on Cloudflare:

1. Cloudflare will automatically configure the DNS records
2. Click **Activate domain**

If your domain is not on Cloudflare:

1. Add the CNAME record provided by Cloudflare to your DNS provider
2. Wait for DNS propagation (may take up to 24 hours)
3. Click **Activate domain**

## Advanced Configuration

### Headers

Custom HTTP headers are configured in the `_headers` file in the root of the documentation directory:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Redirects

Custom redirects are configured in the `_redirects` file in the root of the documentation directory:

```
# Redirect default Netlify subdomain to primary domain
https://nexus-mcp-hub.pages.dev/* https://docs.nexusmcphub.com/:splat 301!

# Redirect old paths to new paths
/docs/overview /architecture/system-overview 301
/docs/servers /mcp-servers/server-types 301
/docs/agents /agents/agent-types 301
```

## Troubleshooting

### Build Failures

If your build fails, check the build logs for errors:

1. In the Cloudflare Pages project, go to **Deployments**
2. Click on the failed deployment
3. Click **View build logs**

Common issues include:

- Missing dependencies
- Syntax errors in Jekyll templates
- Invalid configuration in `_config.yml`

### Custom Domain Issues

If you're having issues with your custom domain:

1. Verify that the DNS records are correct
2. Check that your domain is active in Cloudflare Pages
3. Ensure that SSL/TLS is enabled for your domain

## Performance Optimization

To optimize the performance of your documentation site:

### Minify Assets

Configure Jekyll to minify HTML, CSS, and JavaScript:

```yaml
# _config.yml
compress_html:
  clippings: all
  comments: all
  endings: all
  startings: [html, head, body]
```

### Enable Caching

Configure caching headers in the `_headers` file:

```
/*
  Cache-Control: public, max-age=3600
```

### Optimize Images

Compress and optimize images before adding them to the documentation:

1. Use SVG for diagrams and icons
2. Compress PNG and JPEG images
3. Use appropriate image dimensions

## Next Steps

After deploying your documentation to Cloudflare Pages:

1. Set up a custom domain
2. Configure analytics to track usage
3. Set up monitoring to ensure the site is available
4. Establish a process for keeping the documentation up to date

For more information, refer to the [Cloudflare Pages documentation](https://developers.cloudflare.com/pages/).
