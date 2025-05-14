"""
Code optimization prompt for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def code_optimization_prompt(server, code: str, language: str, focus: str = "performance") -> str:
    """
    Create a prompt for code optimization.
    
    Args:
        server: The server instance
        code: The code to optimize
        language: The programming language of the code
        focus: The focus of optimization (performance, memory, readability)
    
    Returns:
        A prompt for code optimization
    """
    logger.info(f"Creating code optimization prompt for {language} code with focus on {focus}")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    # Use language name if available
    language_name = language_support.language_name if language_support else language
    
    return f"""Please optimize the following {language_name} code with a focus on {focus}:

```{language}
{code}
```

Please provide:
1. An optimized version of the code
2. Explanation of the optimizations made
3. Expected improvements in {focus}
4. Any trade-offs made during optimization"""
