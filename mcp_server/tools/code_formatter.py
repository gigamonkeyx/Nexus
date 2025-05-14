"""
Code formatter tool for the Code Enhancement MCP Server.
"""

import logging
from typing import Dict, Any, Optional

from mcp.server.fastmcp import Context

logger = logging.getLogger(__name__)


def format_code(server, code: str, language: str) -> Dict[str, Any]:
    """
    Format code according to language-specific style guidelines.
    
    Args:
        server: The server instance
        code: The code to format
        language: The programming language of the code
    
    Returns:
        Dictionary with formatted code and language
    """
    logger.info(f"Formatting {language} code")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific formatter
        formatted_code = language_support.format_code(code)
        
        return {
            "formatted_code": formatted_code,
            "language": language,
            "success": True,
            "message": f"Code formatted successfully using {language_support.language_name} formatter"
        }
    else:
        # No language support available
        return {
            "formatted_code": code,
            "language": language,
            "success": False,
            "message": f"No formatter available for {language}"
        }
