"""
Code examples resource for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_code_examples(server, language: str) -> str:
    """
    Get code examples for a specific language.
    
    Args:
        server: The server instance
        language: The programming language to get examples for
    
    Returns:
        String with code examples
    """
    logger.info(f"Getting code examples for {language}")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific examples
        return language_support.get_code_examples()
    else:
        # No language support available
        return f"No code examples available for {language}"
