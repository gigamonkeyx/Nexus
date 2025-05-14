# Create and Test Agent
# This script creates a simple agent using the Minimal Agent Factory and tests it

Write-Host "Creating and testing a simple agent..." -ForegroundColor Green

# Create a directory for logs if it doesn't exist
$logDir = "D:\mcp\nexus\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

# Function to run a command and log the output
function Invoke-CustomCommand {
    param (
        [string]$name,
        [string]$command,
        [string]$workingDir
    )
    
    Write-Host "Running $name..." -ForegroundColor Cyan
    
    $logFile = Join-Path $logDir "$name.log"
    
    # Run the command and capture the output
    $output = Invoke-Expression -Command $command
    
    # Log the output
    $output | Out-File -FilePath $logFile
    
    Write-Host "$name completed. Logs written to $logFile" -ForegroundColor Green
    
    return $output
}

# Create a simple agent
$createAgentCommand = @"
const { NexusClient } = require('bootstrap-core');
const path = require('path');

async function main() {
    try {
        // Create NexusClient
        const nexusClient = new NexusClient();
        
        // Connect to Minimal Agent Factory
        await nexusClient.connectServer('minimal-agent-factory', {
            type: 'sse',
            url: 'http://localhost:3000/sse'
        });
        
        // Create a simple agent
        const agentId = await nexusClient.createAgent(
            'Simple Test Agent',
            'simple-agent',
            ['basic_agent', 'task_execution'],
            {
                description: 'A simple agent for testing the benchmark-driven improvement process'
            }
        );
        
        console.log("Created agent: " + agentId);
        
        // Start the agent
        await nexusClient.startAgent(agentId);
        
        console.log("Started agent: " + agentId);
        
        // Create a task for the agent
        const taskId = await nexusClient.createTask(
            agentId,
            'Test Task',
            'A simple task for testing',
            {
                priority: 'high',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
        );
        
        console.log("Created task: " + taskId);
        
        // Disconnect
        await nexusClient.disconnect();
        
        return agentId;
    } catch (error) {
        console.error("Error: " + error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Unhandled error: " + error.message);
    process.exit(1);
});
"@

# Save the script to a temporary file
$createAgentScriptPath = Join-Path $env:TEMP "create-agent.js"
$createAgentCommand | Out-File -FilePath $createAgentScriptPath -Encoding utf8

# Run the script to create the agent
$agentId = Invoke-CustomCommand -name "create-agent" -command "node $createAgentScriptPath" -workingDir "D:\mcp\nexus"

# Wait for the agent to start
Start-Sleep -Seconds 10

# Benchmark the agent
$benchmarkAgentCommand = @"
const { NexusClient } = require('bootstrap-core');
const path = require('path');

async function main() {
    try {
        // Create NexusClient
        const nexusClient = new NexusClient();
        
        // Connect to Benchmarking Agent
        await nexusClient.connectServer('benchmarking-agent', {
            type: 'sse',
            url: 'http://localhost:3000/sse'
        });
        
        // Benchmark the agent
        const benchmarkResult = await nexusClient.runBenchmark(
            '$agentId',
            'humaneval',
            {
                maxProblems: 5,
                timeout: 60000
            }
        );
        
        console.log("Benchmark completed with score: " + benchmarkResult.score);
        
        // Disconnect
        await nexusClient.disconnect();
        
        return benchmarkResult;
    } catch (error) {
        console.error("Error: " + error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Unhandled error: " + error.message);
    process.exit(1);
});
"@

# Save the script to a temporary file
$benchmarkAgentScriptPath = Join-Path $env:TEMP "benchmark-agent.js"
$benchmarkAgentCommand | Out-File -FilePath $benchmarkAgentScriptPath -Encoding utf8

# Run the script to benchmark the agent
$benchmarkResults = Invoke-CustomCommand -name "benchmark-agent" -command "node $benchmarkAgentScriptPath" -workingDir "D:\mcp\nexus"

# Wait for the benchmark to complete
Start-Sleep -Seconds 10

# Check for improvements
$checkImprovementsCommand = @"
const { NexusClient } = require('bootstrap-core');
const path = require('path');

async function main() {
    try {
        // Create NexusClient
        const nexusClient = new NexusClient();
        
        // Connect to Continuous Learning Agent
        await nexusClient.connectServer('continuous-learning-agent', {
            type: 'sse',
            url: 'http://localhost:3000/sse'
        });
        
        // Get improvement recommendations
        const recommendations = await nexusClient.getImprovementRecommendations('$agentId');
        
        console.log("Received " + recommendations.length + " improvement recommendations");
        
        // Implement recommendations
        if (recommendations.length > 0) {
            await nexusClient.implementRecommendations('$agentId', recommendations);
            console.log("Implemented " + recommendations.length + " recommendations");
        }
        
        // Disconnect
        await nexusClient.disconnect();
        
        return recommendations;
    } catch (error) {
        console.error("Error: " + error.message);
        process.exit(1);
    }
}

main().catch(error => {
    console.error("Unhandled error: " + error.message);
    process.exit(1);
});
"@

# Save the script to a temporary file
$checkImprovementsScriptPath = Join-Path $env:TEMP "check-improvements.js"
$checkImprovementsCommand | Out-File -FilePath $checkImprovementsScriptPath -Encoding utf8

# Run the script to check for improvements
$improvementResults = Invoke-CustomCommand -name "check-improvements" -command "node $checkImprovementsScriptPath" -workingDir "D:\mcp\nexus"

# Clean up temporary files
Remove-Item -Path $createAgentScriptPath -Force
Remove-Item -Path $benchmarkAgentScriptPath -Force
Remove-Item -Path $checkImprovementsScriptPath -Force

# Display results
Write-Host "Agent creation and testing completed successfully!" -ForegroundColor Green
Write-Host "Agent ID: $agentId" -ForegroundColor Yellow
Write-Host "Benchmark Results: $benchmarkResults" -ForegroundColor Yellow
Write-Host "Improvement Results: $improvementResults" -ForegroundColor Yellow
Write-Host "Check the logs in $logDir for details." -ForegroundColor Yellow
