# Start Nexus System
# This script starts the entire Nexus system

Write-Host "Starting Nexus system..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to check if a URL is accessible
function Test-Url {
    param (
        [string]$url,
        [string]$name,
        [int]$retries = 3,
        [int]$retryDelay = 2
    )
    
    for ($i = 0; $i -lt $retries; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
            Write-Host "$name is running at $url (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } catch {
            if ($i -lt $retries - 1) {
                Write-Host "Retrying $name in $retryDelay seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds $retryDelay
            } else {
                Write-Host "$name is not accessible at $url (Error: $($_.Exception.Message))" -ForegroundColor Red
                return $false
            }
        }
    }
    
    return $false
}

# Step 1: Start Nexus MCP Hub
Write-Host "`nStep 1: Starting Nexus MCP Hub..." -ForegroundColor Cyan

$nexusHubRunning = Test-Url -url "http://localhost:8000" -name "Nexus MCP Hub"

if (-not $nexusHubRunning) {
    Write-Host "Nexus MCP Hub is not running. Starting it now..." -ForegroundColor Yellow
    
    # Start Nexus MCP Hub
    & "D:\mcp\nexus\start-nexus-hub.ps1"
    
    # Wait for the Nexus MCP Hub to initialize
    Write-Host "Waiting for the Nexus MCP Hub to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if Nexus MCP Hub is running
    $nexusHubRunning = Test-Url -url "http://localhost:8000" -name "Nexus MCP Hub"
    
    if (-not $nexusHubRunning) {
        Write-Host "Failed to start Nexus MCP Hub. Please check the logs in $logDir for details." -ForegroundColor Red
        exit 1
    }
}

# Step 2: Start MCP Servers
Write-Host "`nStep 2: Starting MCP Servers..." -ForegroundColor Cyan

# Check if MCP servers are running
$mcpServersRunning = $true
$servers = @(
    @{Name = "Ollama MCP Server"; Url = "http://localhost:3011/mcp/status"},
    @{Name = "Code Enhancement MCP Server"; Url = "http://localhost:3020/mcp/status"},
    @{Name = "Lucidity MCP Server"; Url = "http://localhost:3021/mcp/status"},
    @{Name = "Benchmark MCP Server"; Url = "http://localhost:8020/mcp/status"}
)

foreach ($server in $servers) {
    $serverRunning = Test-Url -url $server.Url -name $server.Name
    if (-not $serverRunning) {
        $mcpServersRunning = $false
    }
}

if (-not $mcpServersRunning) {
    Write-Host "Some MCP servers are not running. Starting them now..." -ForegroundColor Yellow
    
    # Start MCP servers
    & "D:\mcp\nexus\start-simplified-mcp-servers.ps1"
    
    # Wait for the MCP servers to initialize
    Write-Host "Waiting for the MCP servers to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if MCP servers are running
    $mcpServersRunning = $true
    foreach ($server in $servers) {
        $serverRunning = Test-Url -url $server.Url -name $server.Name
        if (-not $serverRunning) {
            $mcpServersRunning = $false
        }
    }
    
    if (-not $mcpServersRunning) {
        Write-Host "Failed to start some MCP servers. Please check the logs in $logDir for details." -ForegroundColor Red
        exit 1
    }
}

# Step 3: Start Bootstrap System
Write-Host "`nStep 3: Starting Bootstrap System..." -ForegroundColor Cyan

# Check if bootstrap system is running
$bootstrapRunning = $true
$processes = @(
    "factory-enhancer-agent",
    "benchmarking-agent",
    "continuous-learning-agent",
    "minimal-agent-factory"
)

foreach ($process in $processes) {
    $logFile = Join-Path $logDir "$process.log"
    if (-not (Test-Path $logFile)) {
        Write-Host "$process is not running. Bootstrap system needs to be started." -ForegroundColor Yellow
        $bootstrapRunning = $false
    }
}

if (-not $bootstrapRunning) {
    Write-Host "Bootstrap system is not running. Starting it now..." -ForegroundColor Yellow
    
    # Start bootstrap system
    & "D:\mcp\nexus\start-bootstrap-system-fixed.ps1"
    
    # Wait for the bootstrap system to initialize
    Write-Host "Waiting for the bootstrap system to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Check if bootstrap system is running
    $bootstrapRunning = $true
    foreach ($process in $processes) {
        $logFile = Join-Path $logDir "$process.log"
        if (-not (Test-Path $logFile)) {
            Write-Host "$process is not running. Bootstrap system failed to start." -ForegroundColor Red
            $bootstrapRunning = $false
        }
    }
    
    if (-not $bootstrapRunning) {
        Write-Host "Failed to start bootstrap system. Please check the logs in $logDir for details." -ForegroundColor Red
        exit 1
    }
}

# Step 4: Create a Simple Agent
Write-Host "`nStep 4: Creating a Simple Agent..." -ForegroundColor Cyan

# Create a simple agent
& "D:\mcp\nexus\create-simple-agent.ps1"

# Display success message
Write-Host "`nNexus system started successfully!" -ForegroundColor Green
Write-Host "The system is now fully operational and ready to use." -ForegroundColor Green
Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
