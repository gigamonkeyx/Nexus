# Start Jekyll server and Cloudflare Tunnel for Nexus MCP Hub documentation

# Function to check if a process is running on a specific port
function Test-PortInUse {
    param (
        [int]$port
    )

    $connections = netstat -ano | Select-String -Pattern "TCP.*:$port.*LISTENING"
    return $connections.Count -gt 0
}

# Function to start Jekyll server
function Start-JekyllServer {
    $docsPath = Join-Path $PSScriptRoot ".." "docs"

    # Check if Jekyll is already running
    if (Test-PortInUse -port 4000) {
        Write-Host "✅ Jekyll server is already running on port 4000" -ForegroundColor Green
        return $true
    }

    # Start Jekyll server
    Write-Host "🚀 Starting Jekyll server..." -ForegroundColor Yellow

    # Change to docs directory
    Push-Location $docsPath

    # Start Jekyll in a new PowerShell window
    Start-Process powershell -ArgumentList "-Command", "cd '$docsPath'; bundle exec jekyll serve"

    # Return to original directory
    Pop-Location

    # Wait for Jekyll to start
    $maxAttempts = 10
    $attempts = 0
    $started = $false

    Write-Host "   Waiting for Jekyll server to start..." -ForegroundColor Yellow

    while ($attempts -lt $maxAttempts -and -not $started) {
        if (Test-PortInUse -port 4000) {
            $started = $true
        }
        else {
            Start-Sleep -Seconds 2
            $attempts++
        }
    }

    if ($started) {
        Write-Host "✅ Jekyll server started successfully" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ Failed to start Jekyll server" -ForegroundColor Red
        return $false
    }
}

# Function to start Cloudflare Tunnel
function Start-CloudflareTunnel {
    param (
        [string]$tunnelName
    )

    # Check if cloudflared is installed
    try {
        $version = & cloudflared --version
        Write-Host "✅ cloudflared is installed: $version" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ cloudflared is not installed" -ForegroundColor Red
        Write-Host "   Please run setup-cloudflare-tunnel.ps1 first" -ForegroundColor Yellow
        return $false
    }

    # Check if tunnel exists
    $tunnels = & cloudflared tunnel list --output json | ConvertFrom-Json
    $tunnelExists = $false

    foreach ($tunnel in $tunnels) {
        if ($tunnel.name -eq $tunnelName) {
            $tunnelExists = $true
            # We don't need to store the tunnel ID since we're not using it
            break
        }
    }

    if (-not $tunnelExists) {
        Write-Host "❌ Tunnel '$tunnelName' does not exist" -ForegroundColor Red
        Write-Host "   Please run setup-cloudflare-tunnel.ps1 first" -ForegroundColor Yellow
        return $false
    }

    # Start Cloudflare Tunnel
    Write-Host "🚇 Starting Cloudflare Tunnel '$tunnelName'..." -ForegroundColor Yellow

    # Start tunnel in the current window
    & cloudflared tunnel run $tunnelName

    return $true
}

# Main script
Write-Host "🌩️ Nexus MCP Hub Documentation with Cloudflare Tunnel" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# Get tunnel name
$tunnelName = Read-Host "Enter the name of your tunnel (default: nexus-mcp-hub)"
if (-not $tunnelName) {
    $tunnelName = "nexus-mcp-hub"
}

# Start Jekyll server
if (-not (Start-JekyllServer)) {
    Write-Host "❌ Failed to start documentation server" -ForegroundColor Red
    exit 1
}

# Open documentation in browser
Start-Process "http://localhost:4000"

# Start Cloudflare Tunnel
Start-CloudflareTunnel -tunnelName $tunnelName
