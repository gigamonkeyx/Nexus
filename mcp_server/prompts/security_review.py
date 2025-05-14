"""
Security review prompt for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def security_review_prompt(server, code: str, language: str) -> str:
    """
    Create a prompt for security review.
    
    Args:
        server: The server instance
        code: The code to review for security issues
        language: The programming language of the code
    
    Returns:
        A prompt for security review
    """
    logger.info(f"Creating security review prompt for {language} code")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    # Use language name if available
    language_name = language_support.language_name if language_support else language
    
    return f"""Please perform a security review of the following {language_name} code:

```{language}
{code}
```

Please identify and explain:
1. Potential security vulnerabilities
2. Input validation issues
3. Authentication/authorization concerns
4. Data handling and privacy issues
5. Recommended security improvements

For each issue, please provide:
- Description of the vulnerability
- Potential impact
- Recommended fix with code example"""
