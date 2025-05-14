"""
Design patterns resource for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_design_patterns(server, language: str) -> str:
    """
    Get common design patterns for a specific language.
    
    Args:
        server: The server instance
        language: The programming language to get design patterns for
    
    Returns:
        String with design patterns
    """
    logger.info(f"Getting design patterns for {language}")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    if language_support:
        # Use language-specific design patterns
        return language_support.get_design_patterns()
    else:
        # No language support available
        return f"No design patterns available for {language}"
