# Build script for the modularized bootstrapping approach

# Set error action preference
$ErrorActionPreference = "Stop"

# Define colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green $message
}

function Write-Info($message) {
    Write-ColorOutput Cyan $message
}

function Write-Warning($message) {
    Write-ColorOutput Yellow $message
}

function Write-Error($message) {
    Write-ColorOutput Red $message
}

# Function to build a module
function Build-Module {
    param (
        [string]$modulePath,
        [string]$moduleName
    )
    
    Write-Info "Building $moduleName..."
    
    # Check if the module directory exists
    if (-not (Test-Path $modulePath)) {
        Write-Error "Module directory not found: $modulePath"
        return $false
    }
    
    # Check if package.json exists
    if (-not (Test-Path "$modulePath\package.json")) {
        Write-Error "package.json not found in $modulePath"
        return $false
    }
    
    # Navigate to the module directory
    Push-Location $modulePath
    
    try {
        # Install dependencies
        Write-Info "Installing dependencies for $moduleName..."
        npm install
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install dependencies for $moduleName"
            return $false
        }
        
        # Build the module
        Write-Info "Building $moduleName..."
        npm run build
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to build $moduleName"
            return $false
        }
        
        Write-Success "$moduleName built successfully"
        return $true
    }
    catch {
        Write-Error "Error building $moduleName: $_"
        return $false
    }
    finally {
        # Return to the original directory
        Pop-Location
    }
}

# Main build function
function Build-All {
    $rootDir = $PSScriptRoot
    $success = $true
    
    # Build bootstrap-core
    $coreSuccess = Build-Module "$rootDir\bootstrap-core" "bootstrap-core"
    
    if (-not $coreSuccess) {
        Write-Error "Failed to build bootstrap-core. Aborting."
        return $false
    }
    
    # Build factory-enhancer-agent
    $factoryEnhancerSuccess = Build-Module "$rootDir\bootstrap-agents\factory-enhancer-agent" "factory-enhancer-agent"
    
    if (-not $factoryEnhancerSuccess) {
        Write-Warning "Failed to build factory-enhancer-agent."
        $success = $false
    }
    
    # Build benchmarking-agent
    $benchmarkingSuccess = Build-Module "$rootDir\bootstrap-agents\benchmarking-agent" "benchmarking-agent"
    
    if (-not $benchmarkingSuccess) {
        Write-Warning "Failed to build benchmarking-agent."
        $success = $false
    }
    
    # Build continuous-learning-agent if it exists
    if (Test-Path "$rootDir\bootstrap-agents\continuous-learning-agent") {
        $learningSuccess = Build-Module "$rootDir\bootstrap-agents\continuous-learning-agent" "continuous-learning-agent"
        
        if (-not $learningSuccess) {
            Write-Warning "Failed to build continuous-learning-agent."
            $success = $false
        }
    }
    
    # Build minimal-agent-factory if it exists
    if (Test-Path "$rootDir\minimal-agent-factory") {
        $factorySuccess = Build-Module "$rootDir\minimal-agent-factory" "minimal-agent-factory"
        
        if (-not $factorySuccess) {
            Write-Warning "Failed to build minimal-agent-factory."
            $success = $false
        }
    }
    
    if ($success) {
        Write-Success "All modules built successfully"
    }
    else {
        Write-Warning "Some modules failed to build"
    }
    
    return $success
}

# Run the build
$buildResult = Build-All

if ($buildResult) {
    exit 0
}
else {
    exit 1
}
