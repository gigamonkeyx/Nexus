"""
Test generation prompt for the Code Enhancement MCP Server.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def test_generation_prompt(server, code: str, language: str, framework: str = "") -> str:
    """
    Create a prompt for test generation.
    
    Args:
        server: The server instance
        code: The code to generate tests for
        language: The programming language of the code
        framework: The testing framework to use (optional)
    
    Returns:
        A prompt for test generation
    """
    logger.info(f"Creating test generation prompt for {language} code with framework {framework}")
    
    # Get language support
    language_support = server.get_language_support(language)
    
    # Use language name if available
    language_name = language_support.language_name if language_support else language
    
    framework_text = f" using the {framework} framework" if framework else ""
    
    return f"""Please generate comprehensive tests for the following {language_name} code{framework_text}:

```{language}
{code}
```

Please include:
1. Unit tests for all functions/methods
2. Edge case tests
3. Mocking of external dependencies
4. Test setup and teardown
5. Clear test descriptions

The tests should verify both the expected behavior and handle error cases."""
