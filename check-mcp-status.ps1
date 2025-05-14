# Check MCP Status
# This script checks the status of the Nexus MCP Hub and MCP servers

Write-Host "Checking MCP status..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to check if a URL is accessible
function Test-Url {
    param (
        [string]$url,
        [string]$name
    )

    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -ErrorAction Stop
        Write-Host "$name is running at $url (Status: $($response.StatusCode))" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "$name is not accessible at $url (Error: $($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# Check Nexus MCP Hub
$nexusHubRunning = Test-Url -url "http://localhost:8000" -name "Nexus MCP Hub"

# Check MCP servers
$servers = @(
    @{Name = "Ollama MCP Server"; Url = "http://localhost:3011/mcp/status"},
    @{Name = "Code Enhancement MCP Server"; Url = "http://localhost:3020/mcp/status"},
    @{Name = "Lucidity MCP Server"; Url = "http://localhost:3021/mcp/status"},
    @{Name = "Benchmark MCP Server"; Url = "http://localhost:8020/mcp/status"}
)

$runningServers = 0
foreach ($server in $servers) {
    $isRunning = Test-Url -url $server.Url -name $server.Name
    if ($isRunning) {
        $runningServers++
    }
}

# Summary
Write-Host "`nSummary:" -ForegroundColor Cyan
if ($nexusHubRunning) {
    Write-Host "Nexus MCP Hub: Running" -ForegroundColor Green
} else {
    Write-Host "Nexus MCP Hub: Not Running" -ForegroundColor Red
}

if ($runningServers -eq $servers.Count) {
    Write-Host "MCP Servers: $runningServers out of $($servers.Count) running" -ForegroundColor Green
} else {
    Write-Host "MCP Servers: $runningServers out of $($servers.Count) running" -ForegroundColor Yellow
}

# Check if all components are running
if ($nexusHubRunning -and $runningServers -eq $servers.Count) {
    Write-Host "`nAll MCP components are running successfully!" -ForegroundColor Green
} else {
    Write-Host "`nSome MCP components are not running. Please check the logs in $logDir for details." -ForegroundColor Yellow
}
