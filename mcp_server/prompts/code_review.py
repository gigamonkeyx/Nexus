"""
Code review prompt for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def code_review_prompt(server, code: str, language: str) -> str:
    """
    Create a prompt for code review.
    
    Args:
        server: The server instance
        code: The code to review
        language: The programming language of the code
    
    Returns:
        A prompt for code review
    """
    logger.info(f"Creating code review prompt for {language} code")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    # Use language name if available
    language_name = language_support.language_name if language_support else language
    
    return f"""Please review the following {language_name} code:

```{language}
{code}
```

Please provide feedback on:
1. Code quality and style
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Suggestions for improvement"""
