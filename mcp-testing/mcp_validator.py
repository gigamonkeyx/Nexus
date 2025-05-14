#!/usr/bin/env python3
"""
MCP Validator - A tool to validate MCP requests and responses against the specification.
This module provides functions for validating MCP protocol messages according to the
official Model Context Protocol specification.
"""

import argparse
import json
import logging
import sys
from typing import Any, Dict, List, Optional, Tuple, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mcp-validator")

class MCPValidator:
    """Validator for MCP protocol messages."""
    
    @staticmethod
    def validate_request(request: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate an MCP request against the specification.
        
        Args:
            request: The MCP request to validate
        
        Returns:
            A tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check for required fields
        if "tool" not in request:
            errors.append("Missing required field: 'tool'")
        elif not isinstance(request["tool"], str):
            errors.append("Field 'tool' must be a string")
        
        # Check parameters
        if "parameters" in request:
            if not isinstance(request["parameters"], dict):
                errors.append("Field 'parameters' must be an object")
        
        # Check ID format if present
        if "id" in request:
            if not isinstance(request["id"], str):
                errors.append("Field 'id' must be a string")
        
        return (len(errors) == 0, errors)
    
    @staticmethod
    def validate_response(response: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate an MCP response against the specification.
        
        Args:
            response: The MCP response to validate
        
        Returns:
            A tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check for required fields
        if "id" not in response:
            errors.append("Missing required field: 'id'")
        elif not isinstance(response["id"], str):
            errors.append("Field 'id' must be a string")
        
        # Response must have either result or error
        if "result" not in response and "error" not in response:
            errors.append("Response must contain either 'result' or 'error'")
        
        # Check result
        if "result" in response:
            if not isinstance(response["result"], dict):
                errors.append("Field 'result' must be an object")
        
        # Check error
        if "error" in response:
            if not isinstance(response["error"], dict):
                errors.append("Field 'error' must be an object")
            else:
                error = response["error"]
                if "type" not in error:
                    errors.append("Error object must contain 'type' field")
                elif not isinstance(error["type"], str):
                    errors.append("Error 'type' must be a string")
                
                if "message" not in error:
                    errors.append("Error object must contain 'message' field")
                elif not isinstance(error["message"], str):
                    errors.append("Error 'message' must be a string")
        
        return (len(errors) == 0, errors)
    
    @staticmethod
    def validate_tool_definition(tool_def: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate an MCP tool definition against the specification.
        
        Args:
            tool_def: The MCP tool definition to validate
        
        Returns:
            A tuple of (is_valid, error_messages)
        """
        errors = []
        
        # Check for required fields
        if "name" not in tool_def:
            errors.append("Missing required field: 'name'")
        elif not isinstance(tool_def["name"], str):
            errors.append("Field 'name' must be a string")
        
        if "description" not in tool_def:
            errors.append("Missing required field: 'description'")
        elif not isinstance(tool_def["description"], str):
            errors.append("Field 'description' must be a string")
        
        # Check parameters schema
        if "parameters" in tool_def:
            if not isinstance(tool_def["parameters"], dict):
                errors.append("Field 'parameters' must be an object")
            else:
                # Validate parameters schema (simplified)
                params = tool_def["parameters"]
                if "properties" not in params:
                    errors.append("Parameters schema must contain 'properties' field")
                elif not isinstance(params["properties"], dict):
                    errors.append("Parameters 'properties' must be an object")
                
                if "required" in params and not isinstance(params["required"], list):
                    errors.append("Parameters 'required' must be an array")
        
        return (len(errors) == 0, errors)
    
    @staticmethod
    def validate_tool_list(tool_list: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
        """
        Validate a list of MCP tool definitions.
        
        Args:
            tool_list: The list of MCP tool definitions to validate
        
        Returns:
            A tuple of (is_valid, error_messages)
        """
        errors = []
        
        if not isinstance(tool_list, list):
            errors.append("Tool list must be an array")
            return (False, errors)
        
        # Check for duplicate tool names
        tool_names = set()
        for i, tool_def in enumerate(tool_list):
            valid, tool_errors = MCPValidator.validate_tool_definition(tool_def)
            if not valid:
                for error in tool_errors:
                    errors.append(f"Tool at index {i}: {error}")
            
            if "name" in tool_def:
                if tool_def["name"] in tool_names:
                    errors.append(f"Duplicate tool name: {tool_def['name']}")
                tool_names.add(tool_def["name"])
        
        return (len(errors) == 0, errors)
    
    @staticmethod
    def validate_file(file_path: str, message_type: str) -> Tuple[bool, List[str]]:
        """
        Validate an MCP message from a file.
        
        Args:
            file_path: Path to the file containing the MCP message
            message_type: Type of message to validate ('request', 'response', 'tool', 'tool_list')
        
        Returns:
            A tuple of (is_valid, error_messages)
        """
        try:
            with open(file_path, "r") as f:
                data = json.load(f)
            
            if message_type == "request":
                return MCPValidator.validate_request(data)
            elif message_type == "response":
                return MCPValidator.validate_response(data)
            elif message_type == "tool":
                return MCPValidator.validate_tool_definition(data)
            elif message_type == "tool_list":
                return MCPValidator.validate_tool_list(data)
            else:
                return (False, [f"Unknown message type: {message_type}"])
        except json.JSONDecodeError as e:
            return (False, [f"Invalid JSON: {str(e)}"])
        except Exception as e:
            return (False, [f"Error validating file: {str(e)}"])

def main():
    """Command-line interface for the MCP Validator."""
    parser = argparse.ArgumentParser(description="MCP Validator")
    parser.add_argument("file", help="Path to the file containing the MCP message")
    parser.add_argument("--type", choices=["request", "response", "tool", "tool_list"], required=True,
                        help="Type of message to validate")
    
    args = parser.parse_args()
    
    valid, errors = MCPValidator.validate_file(args.file, args.type)
    
    if valid:
        print(f"✅ Valid {args.type}")
        return 0
    else:
        print(f"❌ Invalid {args.type}")
        for error in errors:
            print(f"  - {error}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
