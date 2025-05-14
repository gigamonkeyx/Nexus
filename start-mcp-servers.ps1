# Start MCP Servers
# This script starts all the required MCP servers for the modularized bootstrapping system

Write-Host "Starting MCP servers..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to start a server
function Start-MCPServer {
    param (
        [string]$name,
        [string]$command,
        [string]$workingDir
    )

    Write-Host "Starting $name..." -ForegroundColor Cyan

    $logFile = Join-Path $logDir "$name.log"

    # Start the process
    Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"$command | Tee-Object -FilePath '$logFile'`"" -WorkingDirectory $workingDir -WindowStyle Minimized

    Write-Host "$name started. Logs will be written to $logFile" -ForegroundColor Green
}

# First, make sure the Nexus MCP Hub is running
Write-Host "Checking if Nexus MCP Hub is running..." -ForegroundColor Yellow
$nexusHubRunning = $false
$processes = Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*nexus.main*" }
if ($processes) {
    Write-Host "Nexus MCP Hub is already running." -ForegroundColor Green
    $nexusHubRunning = $true
} else {
    Write-Host "Nexus MCP Hub is not running. Starting it now..." -ForegroundColor Yellow
    # Start the Nexus MCP Hub
    & "D:\mcp\nexus\start-nexus-hub.ps1"
    $nexusHubRunning = $true
}

# Wait for the Nexus MCP Hub to initialize
if ($nexusHubRunning) {
    Write-Host "Waiting for the Nexus MCP Hub to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Start Ollama MCP Server
Start-MCPServer -name "ollama-mcp" -command "node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\ollama-mcp"

# Wait a bit before starting the next server
Start-Sleep -Seconds 2

# Start Code Enhancement MCP Server
Start-MCPServer -name "code-enhancement-mcp" -command "node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\code-enhancement-mcp"

# Wait a bit before starting the next server
Start-Sleep -Seconds 2

# Start Lucidity MCP Server
Start-MCPServer -name "lucidity-mcp" -command "node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\lucidity-mcp"

# Wait a bit before starting the next server
Start-Sleep -Seconds 2

# Start Benchmark MCP Server
Start-MCPServer -name "benchmark-mcp" -command "node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\benchmark-mcp"

Write-Host "All MCP servers started successfully!" -ForegroundColor Green
Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
