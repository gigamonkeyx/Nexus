"""
Best practices resource for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_best_practices(server, language: str) -> str:
    """
    Get best practices for a specific language.
    
    Args:
        server: The server instance
        language: The programming language to get best practices for
    
    Returns:
        String with best practices
    """
    logger.info(f"Getting best practices for {language}")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific best practices
        return language_support.get_best_practices()
    else:
        # No language support available
        return f"No best practices available for {language}"
