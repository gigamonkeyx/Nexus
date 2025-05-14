"""
Base language support interface for the Code Enhancement MCP Server.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, List, Optional, Tuple


@dataclass
class CodeIssue:
    """Represents an issue found in code."""
    line: int
    column: int
    message: str
    severity: str  # "error", "warning", "info"
    suggestion: Optional[str] = None


@dataclass
class AnalysisResult:
    """Represents the result of code analysis."""
    issues: List[CodeIssue]
    metrics: Dict[str, Any]
    language: str


class LanguageSupport(ABC):
    """Base class for language support."""
    
    @property
    @abstractmethod
    def language_id(self) -> str:
        """Get the language identifier."""
        pass
    
    @property
    @abstractmethod
    def language_name(self) -> str:
        """Get the language name."""
        pass
    
    @property
    @abstractmethod
    def file_extensions(self) -> List[str]:
        """Get the file extensions for this language."""
        pass
    
    @abstractmethod
    def format_code(self, code: str) -> str:
        """Format code according to language-specific style guidelines."""
        pass
    
    @abstractmethod
    def analyze_code(self, code: str) -> AnalysisResult:
        """Analyze code for potential issues and improvements."""
        pass
    
    @abstractmethod
    def generate_docstring(self, code: str, style: str = "default") -> str:
        """Generate a docstring for a function or class."""
        pass
    
    @abstractmethod
    def get_code_examples(self) -> str:
        """Get code examples for this language."""
        pass
    
    @abstractmethod
    def get_best_practices(self) -> str:
        """Get best practices for this language."""
        pass
    
    @abstractmethod
    def get_design_patterns(self) -> str:
        """Get common design patterns for this language."""
        pass
