# Start Bootstrap System
# This script starts all the bootstrap agents and the Minimal Agent Factory

Write-Host "Starting bootstrap system..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to start an agent
function Start-Agent {
    param (
        [string]$name,
        [string]$workingDir
    )
    
    Write-Host "Starting $name..." -ForegroundColor Cyan
    
    $logFile = Join-Path $logDir "$name.log"
    
    # Start the process
    Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"node dist/index.js | Tee-Object -FilePath '$logFile'`"" -WorkingDirectory $workingDir -WindowStyle Minimized
    
    Write-Host "$name started. Logs will be written to $logFile" -ForegroundColor Green
}

# Start Factory Enhancer Agent
Start-Agent -name "factory-enhancer-agent" -workingDir "D:\mcp\nexus\bootstrap-agents\factory-enhancer-agent"

# Wait a bit before starting the next agent
Start-Sleep -Seconds 5

# Start Benchmarking Agent
Start-Agent -name "benchmarking-agent" -workingDir "D:\mcp\nexus\bootstrap-agents\benchmarking-agent"

# Wait a bit before starting the next agent
Start-Sleep -Seconds 5

# Start Continuous Learning Agent
Start-Agent -name "continuous-learning-agent" -workingDir "D:\mcp\nexus\bootstrap-agents\continuous-learning-agent"

# Wait a bit before starting the Minimal Agent Factory
Start-Sleep -Seconds 5

# Start Minimal Agent Factory
Start-Agent -name "minimal-agent-factory" -workingDir "D:\mcp\nexus\minimal-agent-factory"

Write-Host "Bootstrap system started successfully!" -ForegroundColor Green
Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
