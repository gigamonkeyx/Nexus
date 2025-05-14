# Build MCP Servers
# This script builds all the MCP servers

Write-Host "Building MCP servers..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to build a server
function Build-MCPServer {
    param (
        [string]$name,
        [string]$workingDir
    )
    
    Write-Host "Building $name..." -ForegroundColor Cyan
    
    $logFile = Join-Path $logDir "$name-build.log"
    
    # Install dependencies
    Write-Host "Installing dependencies for $name..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"npm install | Tee-Object -FilePath '$logFile'`"" -WorkingDirectory $workingDir -Wait
    
    # Build the server
    Write-Host "Building $name..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"npm run build | Tee-Object -Append -FilePath '$logFile'`"" -WorkingDirectory $workingDir -Wait
    
    Write-Host "$name built successfully. Logs written to $logFile" -ForegroundColor Green
}

# Build Ollama MCP Server
Build-MCPServer -name "ollama-mcp" -workingDir "D:\mcp\nexus\mcp-servers\ollama-mcp"

# Build Code Enhancement MCP Server
Build-MCPServer -name "code-enhancement-mcp" -workingDir "D:\mcp\nexus\mcp-servers\code-enhancement-mcp"

# Build Lucidity MCP Server
Build-MCPServer -name "lucidity-mcp" -workingDir "D:\mcp\nexus\mcp-servers\lucidity-mcp"

# Build Benchmark MCP Server
Build-MCPServer -name "benchmark-mcp" -workingDir "D:\mcp\nexus\mcp-servers\benchmark-mcp"

Write-Host "All MCP servers built successfully!" -ForegroundColor Green
Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
