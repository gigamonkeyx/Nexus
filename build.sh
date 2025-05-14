#!/bin/bash

# Build script for the modularized bootstrapping approach

# Set error handling
set -e

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions for colored output
function echo_success() {
  echo -e "${GREEN}$1${NC}"
}

function echo_info() {
  echo -e "${CYAN}$1${NC}"
}

function echo_warning() {
  echo -e "${YELLOW}$1${NC}"
}

function echo_error() {
  echo -e "${RED}$1${NC}"
}

# Function to build a module
function build_module() {
  local module_path=$1
  local module_name=$2
  
  echo_info "Building $module_name..."
  
  # Check if the module directory exists
  if [ ! -d "$module_path" ]; then
    echo_error "Module directory not found: $module_path"
    return 1
  fi
  
  # Check if package.json exists
  if [ ! -f "$module_path/package.json" ]; then
    echo_error "package.json not found in $module_path"
    return 1
  fi
  
  # Navigate to the module directory
  pushd "$module_path" > /dev/null
  
  # Install dependencies
  echo_info "Installing dependencies for $module_name..."
  npm install
  
  if [ $? -ne 0 ]; then
    echo_error "Failed to install dependencies for $module_name"
    popd > /dev/null
    return 1
  fi
  
  # Build the module
  echo_info "Building $module_name..."
  npm run build
  
  if [ $? -ne 0 ]; then
    echo_error "Failed to build $module_name"
    popd > /dev/null
    return 1
  fi
  
  echo_success "$module_name built successfully"
  
  # Return to the original directory
  popd > /dev/null
  
  return 0
}

# Main build function
function build_all() {
  local root_dir=$(dirname "$0")
  local success=true
  
  # Build bootstrap-core
  build_module "$root_dir/bootstrap-core" "bootstrap-core"
  
  if [ $? -ne 0 ]; then
    echo_error "Failed to build bootstrap-core. Aborting."
    return 1
  fi
  
  # Build factory-enhancer-agent
  build_module "$root_dir/bootstrap-agents/factory-enhancer-agent" "factory-enhancer-agent"
  
  if [ $? -ne 0 ]; then
    echo_warning "Failed to build factory-enhancer-agent."
    success=false
  fi
  
  # Build benchmarking-agent
  build_module "$root_dir/bootstrap-agents/benchmarking-agent" "benchmarking-agent"
  
  if [ $? -ne 0 ]; then
    echo_warning "Failed to build benchmarking-agent."
    success=false
  fi
  
  # Build continuous-learning-agent if it exists
  if [ -d "$root_dir/bootstrap-agents/continuous-learning-agent" ]; then
    build_module "$root_dir/bootstrap-agents/continuous-learning-agent" "continuous-learning-agent"
    
    if [ $? -ne 0 ]; then
      echo_warning "Failed to build continuous-learning-agent."
      success=false
    fi
  fi
  
  # Build minimal-agent-factory if it exists
  if [ -d "$root_dir/minimal-agent-factory" ]; then
    build_module "$root_dir/minimal-agent-factory" "minimal-agent-factory"
    
    if [ $? -ne 0 ]; then
      echo_warning "Failed to build minimal-agent-factory."
      success=false
    fi
  fi
  
  if $success; then
    echo_success "All modules built successfully"
    return 0
  else
    echo_warning "Some modules failed to build"
    return 1
  fi
}

# Run the build
build_all
exit $?
