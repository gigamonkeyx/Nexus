"""
Code analyzer tools for the Code Enhancement MCP Server.
"""

import logging
from typing import Dict, Any, List, Optional

from mcp.server.fastmcp import Context

logger = logging.getLogger(__name__)


def analyze_code(server, code: str, language: str, ctx: Context = None) -> Dict[str, Any]:
    """
    Analyze code for potential issues and improvements.
    
    Args:
        server: The server instance
        code: The code to analyze
        language: The programming language of the code
        ctx: Optional context object for progress reporting
    
    Returns:
        Dictionary with issues, metrics, and language
    """
    logger.info(f"Analyzing {language} code")
    
    # Report progress if context is provided
    if ctx:
        ctx.info("Starting code analysis...")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific analyzer
        if ctx:
            ctx.info(f"Using {language_support.language_name} analyzer")
        
        result = language_support.analyze_code(code)
        
        # Convert issues to a serializable format
        issues_data = []
        suggestions = []
        
        for issue in result.issues:
            issues_data.append({
                "line": issue.line,
                "column": issue.column,
                "message": issue.message,
                "severity": issue.severity,
            })
            
            if issue.suggestion:
                suggestions.append(issue.suggestion)
        
        # Report completion if context is provided
        if ctx:
            ctx.info(f"Code analysis complete: found {len(issues_data)} issues")
        
        return {
            "issues": issues_data,
            "suggestions": suggestions,
            "metrics": result.metrics,
            "language": result.language,
            "summary": f"Found {len(issues_data)} issues in {result.metrics['lines_of_code']} lines of code",
            "maintainability_score": result.metrics.get("maintainability", 0),
            "success": True,
            "message": f"Code analyzed successfully using {language_support.language_name} analyzer"
        }
    else:
        # No language support available
        if ctx:
            ctx.info(f"No analyzer available for {language}")
        
        return {
            "issues": [],
            "suggestions": [],
            "metrics": {
                "lines_of_code": len(code.split("\n")),
                "complexity": 0,
                "maintainability": 0,
            },
            "language": language,
            "summary": f"No analyzer available for {language}",
            "maintainability_score": 0,
            "success": False,
            "message": f"No analyzer available for {language}"
        }


def visualize_code_analysis(server, code: str, language: str) -> Dict[str, Any]:
    """
    Generate a visualization of code analysis results.
    
    Args:
        server: The server instance
        code: The code to analyze
        language: The programming language of the code
    
    Returns:
        Dictionary with visualization data
    """
    logger.info(f"Generating visualization for {language} code")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if not language_support:
        return {
            "visualization": f"No analyzer available for {language}",
            "metrics": {
                "lines_of_code": len(code.split("\n")),
                "complexity": 0,
                "maintainability": 0,
            },
            "issues_count": 0,
            "language": language,
            "success": False,
            "message": f"No analyzer available for {language}"
        }
    
    # Analyze the code
    result = language_support.analyze_code(code)
    
    # Generate a simple ASCII visualization
    lines = code.split("\n")
    line_count = len(lines)
    
    # Create a visualization of issues by line
    visualization = []
    
    # Header
    visualization.append("Code Analysis Visualization")
    visualization.append("=" * 50)
    visualization.append(f"Language: {language}")
    visualization.append(f"Lines of code: {result.metrics['lines_of_code']}")
    visualization.append(f"Complexity: {result.metrics['complexity']}")
    visualization.append(f"Maintainability: {result.metrics['maintainability']}/100")
    visualization.append("-" * 50)
    
    # Issues by line
    visualization.append("Issues by line:")
    
    # Group issues by line
    issues_by_line = {}
    for issue in result.issues:
        if issue.line not in issues_by_line:
            issues_by_line[issue.line] = []
        issues_by_line[issue.line].append(issue)
    
    # Generate visualization
    for i, line in enumerate(lines):
        line_num = i + 1
        line_issues = issues_by_line.get(line_num, [])
        
        if line_issues:
            # Line with issues
            severity_markers = {
                "error": "E",
                "warning": "W",
                "info": "I"
            }
            
            markers = "".join(severity_markers.get(issue.severity, "?") for issue in line_issues)
            visualization.append(f"{line_num:4d} | {markers} | {line[:50]}")
            
            # Add issue details
            for issue in line_issues:
                visualization.append(f"      | {issue.severity.upper()} | {issue.message}")
                if issue.suggestion:
                    visualization.append(f"      |   | Suggestion: {issue.suggestion}")
        else:
            # Line without issues
            visualization.append(f"{line_num:4d} |   | {line[:50]}")
    
    visualization.append("-" * 50)
    
    # Summary
    error_count = sum(1 for issue in result.issues if issue.severity == "error")
    warning_count = sum(1 for issue in result.issues if issue.severity == "warning")
    info_count = sum(1 for issue in result.issues if issue.severity == "info")
    
    visualization.append(f"Summary: {error_count} errors, {warning_count} warnings, {info_count} info")
    
    return {
        "visualization": "\n".join(visualization),
        "metrics": result.metrics,
        "issues_count": len(result.issues),
        "language": language,
        "success": True,
        "message": f"Visualization generated successfully for {language}"
    }
