"""
Docstring generator tool for the Code Enhancement MCP Server.
"""

import logging
from typing import Dict, Any, Optional

from mcp.server.fastmcp import Context

logger = logging.getLogger(__name__)


def generate_docstring(server, code: str, language: str, style: str = "default") -> Dict[str, Any]:
    """
    Generate a docstring for a function or class.
    
    Args:
        server: The server instance
        code: The function or class code to document
        language: The programming language of the code
        style: The docstring style to use
    
    Returns:
        Dictionary with docstring, language, and style
    """
    logger.info(f"Generating {style} docstring for {language} code")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific docstring generator
        try:
            docstring = language_support.generate_docstring(code, style)
            
            return {
                "docstring": docstring,
                "language": language,
                "style": style,
                "success": True,
                "message": f"Docstring generated successfully using {language_support.language_name} generator"
            }
        except Exception as e:
            logger.error(f"Error generating docstring: {e}")
            
            return {
                "docstring": f"/* Error generating docstring: {str(e)} */",
                "language": language,
                "style": style,
                "success": False,
                "message": f"Error generating docstring: {str(e)}"
            }
    else:
        # No language support available
        return {
            "docstring": f"/* No docstring generator available for {language} */",
            "language": language,
            "style": style,
            "success": False,
            "message": f"No docstring generator available for {language}"
        }
