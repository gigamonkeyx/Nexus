# Start MCP Servers
# This script starts all the MCP servers

Write-Host "Starting MCP servers..." -ForegroundColor Green

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

# Function to start a server
function Start-MCPServer {
    param (
        [string]$name,
        [string]$command,
        [string]$workingDir,
        [string]$checkUrl,
        [int]$maxWaitSeconds = 30
    )
    
    Write-Host "Starting $name..." -ForegroundColor Cyan
    
    $logFile = Join-Path $logDir "$name.log"
    
    # Start the server
    Start-Process -FilePath "powershell.exe" -ArgumentList "-Command `"$command | Tee-Object -FilePath '$logFile'`"" -WorkingDirectory $workingDir -WindowStyle Hidden
    
    # Wait for the server to start
    Write-Host "Waiting for $name to start..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    $serverStarted = $false
    
    while ((Get-Date) -lt $startTime.AddSeconds($maxWaitSeconds)) {
        if (Test-Url -url $checkUrl -name $name -retries 1 -retryDelay 1) {
            $serverStarted = $true
            break
        }
        
        Start-Sleep -Seconds 2
    }
    
    if ($serverStarted) {
        Write-Host "$name started successfully. Logs will be written to $logFile" -ForegroundColor Green
    } else {
        Write-Host "$name failed to start within $maxWaitSeconds seconds. Check the logs at $logFile" -ForegroundColor Red
    }
    
    return $serverStarted
}

# Check if Nexus MCP Hub is running
Write-Host "Checking if Nexus MCP Hub is running..." -ForegroundColor Yellow

$nexusHubRunning = Test-Url -url "http://localhost:8000" -name "Nexus MCP Hub"

if (-not $nexusHubRunning) {
    Write-Host "Nexus MCP Hub is not running. Starting it now..." -ForegroundColor Yellow
    
    # Start Nexus MCP Hub
    & "D:\mcp\nexus\start-nexus-hub.ps1"
    
    # Wait for the Nexus MCP Hub to initialize
    Write-Host "Waiting for the Nexus MCP Hub to initialize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Start Ollama MCP Server
$ollamaStarted = Start-MCPServer -name "ollama-mcp" -command "cd D:\mcp\nexus\mcp-servers\ollama-mcp && node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\ollama-mcp" -checkUrl "http://localhost:3011/mcp/status"

# Start Code Enhancement MCP Server
$codeEnhancementStarted = Start-MCPServer -name "code-enhancement-mcp" -command "cd D:\mcp\nexus\mcp-servers\code-enhancement-mcp && node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\code-enhancement-mcp" -checkUrl "http://localhost:3020/mcp/status"

# Start Lucidity MCP Server
$lucidityStarted = Start-MCPServer -name "lucidity-mcp" -command "cd D:\mcp\nexus\mcp-servers\lucidity-mcp && node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\lucidity-mcp" -checkUrl "http://localhost:3021/mcp/status"

# Start Benchmark MCP Server
$benchmarkStarted = Start-MCPServer -name "benchmark-mcp" -command "cd D:\mcp\nexus\mcp-servers\benchmark-mcp && node dist/index.js" -workingDir "D:\mcp\nexus\mcp-servers\benchmark-mcp" -checkUrl "http://localhost:8020/mcp/status"

# Check if all servers started successfully
$allServersStarted = $ollamaStarted -and $codeEnhancementStarted -and $lucidityStarted -and $benchmarkStarted

if ($allServersStarted) {
    Write-Host "All MCP servers started successfully!" -ForegroundColor Green
} else {
    Write-Host "Some MCP servers failed to start. Check the logs in $logDir for details." -ForegroundColor Red
}

Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
