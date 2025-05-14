# Start Nexus MCP Hub
# This script starts the Nexus MCP Hub

Write-Host "Starting Nexus MCP Hub..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Start the Nexus MCP Hub
$logFile = Join-Path $logDir "nexus-hub.log"
Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"cd D:\mcp\nexus\src; python -m nexus.main --debug | Tee-Object -FilePath '$logFile'`"" -WindowStyle Minimized

Write-Host "Nexus MCP Hub started. Logs will be written to $logFile" -ForegroundColor Green
Write-Host "Waiting for the Nexus MCP Hub to initialize..." -ForegroundColor Yellow

# Wait for the Nexus MCP Hub to initialize
Start-Sleep -Seconds 5

Write-Host "Nexus MCP Hub initialized. You can now start the MCP servers." -ForegroundColor Green
