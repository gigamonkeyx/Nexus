# Setup Cloudflare Tunnel for Nexus MCP Hub
# This script helps set up and run a Cloudflare Tunnel for the Nexus MCP Hub

# Check if cloudflared is installed
function Test-CloudflaredInstalled {
    try {
        $version = & cloudflared --version
        Write-Host "✅ cloudflared is installed: $version" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ cloudflared is not installed" -ForegroundColor Red
        return $false
    }
}

# Install cloudflared
function Install-Cloudflared {
    Write-Host "📥 Installing cloudflared..." -ForegroundColor Yellow

    # Create a temporary directory
    $tempDir = Join-Path $env:TEMP "cloudflared"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    # Download the installer
    $installerUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi"
    $installerPath = Join-Path $tempDir "cloudflared-windows-amd64.msi"

    Write-Host "   Downloading cloudflared installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

    # Install cloudflared
    Write-Host "   Running installer..." -ForegroundColor Yellow
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $installerPath, "/quiet" -Wait

    # Clean up
    Remove-Item -Path $tempDir -Recurse -Force

    # Verify installation
    if (Check-CloudflaredInstalled) {
        Write-Host "✅ cloudflared installed successfully" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ Failed to install cloudflared" -ForegroundColor Red
        return $false
    }
}

# Check if user is authenticated with Cloudflare
function Test-CloudflaredAuthenticated {
    $configPath = Join-Path $env:USERPROFILE ".cloudflared" "cert.pem"
    if (Test-Path $configPath) {
        Write-Host "✅ cloudflared is authenticated" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ cloudflared is not authenticated" -ForegroundColor Red
        return $false
    }
}

# Authenticate with Cloudflare
function Connect-Cloudflared {
    Write-Host "🔑 Authenticating with Cloudflare..." -ForegroundColor Yellow
    Write-Host "   This will open a browser window. Please log in to your Cloudflare account and authorize cloudflared." -ForegroundColor Yellow

    & cloudflared tunnel login

    if (Test-CloudflaredAuthenticated) {
        Write-Host "✅ Authentication successful" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        return $false
    }
}

# Check if tunnel exists
function Test-TunnelExists {
    param (
        [string]$tunnelName
    )

    $tunnels = & cloudflared tunnel list --output json | ConvertFrom-Json
    foreach ($tunnel in $tunnels) {
        if ($tunnel.name -eq $tunnelName) {
            Write-Host "✅ Tunnel '$tunnelName' exists (ID: $($tunnel.id))" -ForegroundColor Green
            return $tunnel.id
        }
    }

    Write-Host "❌ Tunnel '$tunnelName' does not exist" -ForegroundColor Red
    return $null
}

# Create a new tunnel
function New-CloudflareTunnel {
    param (
        [string]$tunnelName
    )

    Write-Host "🚇 Creating tunnel '$tunnelName'..." -ForegroundColor Yellow

    $output = & cloudflared tunnel create $tunnelName

    # Extract tunnel ID from output
    $tunnelId = $output | Select-String -Pattern "Created tunnel $tunnelName with id ([a-f0-9-]+)" | ForEach-Object { $_.Matches.Groups[1].Value }

    if ($tunnelId) {
        Write-Host "✅ Tunnel created successfully (ID: $tunnelId)" -ForegroundColor Green
        return $tunnelId
    }
    else {
        Write-Host "❌ Failed to create tunnel" -ForegroundColor Red
        return $null
    }
}

# Create tunnel configuration
function New-TunnelConfig {
    param (
        [string]$tunnelId,
        [string]$domain
    )

    $configDir = Join-Path $env:USERPROFILE ".cloudflared"
    $configPath = Join-Path $configDir "config.yml"
    $credentialsPath = Join-Path $configDir "$tunnelId.json"

    # Create config directory if it doesn't exist
    if (-not (Test-Path $configDir)) {
        New-Item -ItemType Directory -Path $configDir -Force | Out-Null
    }

    # Create config file
    $config = @"
tunnel: $tunnelId
credentials-file: $credentialsPath

ingress:
  - hostname: docs.$domain
    service: http://localhost:4000
  - hostname: api.$domain
    service: http://localhost:3000
  - service: http_status:404
"@

    Set-Content -Path $configPath -Value $config

    Write-Host "✅ Tunnel configuration created at $configPath" -ForegroundColor Green
}

# Configure DNS for the tunnel
function Set-TunnelDNS {
    param (
        [string]$tunnelName,
        [string]$domain
    )

    Write-Host "🌐 Configuring DNS for tunnel '$tunnelName'..." -ForegroundColor Yellow

    # Configure DNS for docs subdomain
    Write-Host "   Configuring DNS for docs.$domain..." -ForegroundColor Yellow
    & cloudflared tunnel route dns $tunnelName "docs.$domain"

    # Configure DNS for api subdomain
    Write-Host "   Configuring DNS for api.$domain..." -ForegroundColor Yellow
    & cloudflared tunnel route dns $tunnelName "api.$domain"

    Write-Host "✅ DNS configured successfully" -ForegroundColor Green
}

# Run the tunnel
function Start-CloudflareTunnel {
    param (
        [string]$tunnelName
    )

    Write-Host "🚀 Starting tunnel '$tunnelName'..." -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop the tunnel" -ForegroundColor Yellow

    & cloudflared tunnel run $tunnelName
}

# Main script
Write-Host "🌩️ Cloudflare Tunnel Setup for Nexus MCP Hub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if cloudflared is installed
if (-not (Test-CloudflaredInstalled)) {
    $installChoice = Read-Host "Do you want to install cloudflared? (y/n)"
    if ($installChoice -eq "y") {
        if (-not (Install-Cloudflared)) {
            Write-Host "❌ Setup failed. Please install cloudflared manually." -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Setup failed. cloudflared is required." -ForegroundColor Red
        exit 1
    }
}

# Check if user is authenticated
if (-not (Test-CloudflaredAuthenticated)) {
    $authChoice = Read-Host "Do you want to authenticate with Cloudflare? (y/n)"
    if ($authChoice -eq "y") {
        if (-not (Connect-Cloudflared)) {
            Write-Host "❌ Setup failed. Authentication is required." -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Setup failed. Authentication is required." -ForegroundColor Red
        exit 1
    }
}

# Get tunnel name
$tunnelName = Read-Host "Enter a name for your tunnel (default: nexus-mcp-hub)"
if (-not $tunnelName) {
    $tunnelName = "nexus-mcp-hub"
}

# Check if tunnel exists
$tunnelId = Test-TunnelExists -tunnelName $tunnelName

# Create tunnel if it doesn't exist
if (-not $tunnelId) {
    $createChoice = Read-Host "Do you want to create a new tunnel? (y/n)"
    if ($createChoice -eq "y") {
        $tunnelId = New-CloudflareTunnel -tunnelName $tunnelName
        if (-not $tunnelId) {
            Write-Host "❌ Setup failed. Could not create tunnel." -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Setup failed. A tunnel is required." -ForegroundColor Red
        exit 1
    }
}

# Get domain
$domain = Read-Host "Enter your Cloudflare domain (e.g., example.com)"
if (-not $domain) {
    Write-Host "❌ Setup failed. A domain is required." -ForegroundColor Red
    exit 1
}

# Create tunnel configuration
New-TunnelConfig -tunnelId $tunnelId -domain $domain

# Configure DNS
$dnsChoice = Read-Host "Do you want to configure DNS for your tunnel? (y/n)"
if ($dnsChoice -eq "y") {
    Set-TunnelDNS -tunnelName $tunnelName -domain $domain
}

# Run the tunnel
$runChoice = Read-Host "Do you want to run the tunnel now? (y/n)"
if ($runChoice -eq "y") {
    Start-CloudflareTunnel -tunnelName $tunnelName
}
else {
    Write-Host "✅ Setup completed. To run the tunnel, use the following command:" -ForegroundColor Green
    Write-Host "   cloudflared tunnel run $tunnelName" -ForegroundColor Cyan
}
