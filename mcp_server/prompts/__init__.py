"""
Prompts for the Code Enhancement MCP Server.
"""

from .code_review import code_review_prompt
from .code_optimization import code_optimization_prompt
from .security_review import security_review_prompt
from .test_generation import test_generation_prompt

__all__ = [
    "code_review_prompt",
    "code_optimization_prompt",
    "security_review_prompt",
    "test_generation_prompt",
]
