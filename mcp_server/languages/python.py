"""
Python language support for the Code Enhancement MCP Server.
"""

import re
import ast
from typing import Dict, Any, List, Optional

from .base import LanguageSupport, CodeIssue, AnalysisResult


class PythonSupport(LanguageSupport):
    """Python language support."""
    
    @property
    def language_id(self) -> str:
        """Get the language identifier."""
        return "python"
    
    @property
    def language_name(self) -> str:
        """Get the language name."""
        return "Python"
    
    @property
    def file_extensions(self) -> List[str]:
        """Get the file extensions for this language."""
        return [".py", ".pyw", ".pyi"]
    
    def format_code(self, code: str) -> str:
        """Format Python code using a simple formatter."""
        try:
            # Parse the code to ensure it's valid Python
            parsed = ast.parse(code)
            
            # Format the code with proper indentation
            lines = code.split("\n")
            formatted_lines = []
            indent_level = 0
            
            for line in lines:
                stripped = line.strip()
                
                # Skip empty lines
                if not stripped:
                    formatted_lines.append("")
                    continue
                    
                # Adjust indent level based on content
                if stripped.endswith(":"):
                    formatted_lines.append("    " * indent_level + stripped)
                    indent_level += 1
                elif stripped.startswith(("return ", "break", "continue", "pass", "raise")):
                    if indent_level > 0:
                        formatted_lines.append("    " * indent_level + stripped)
                    else:
                        formatted_lines.append(stripped)
                elif stripped.startswith(("elif ", "else:", "except", "finally:")):
                    if indent_level > 0:
                        indent_level -= 1
                    formatted_lines.append("    " * indent_level + stripped)
                    indent_level += 1
                else:
                    formatted_lines.append("    " * indent_level + stripped)
                    
            return "\n".join(formatted_lines)
        except SyntaxError:
            # If the code has syntax errors, return it unchanged
            return code
    
    def analyze_code(self, code: str) -> AnalysisResult:
        """Analyze Python code for issues and metrics."""
        issues = []
        metrics = {
            "lines_of_code": len(code.split("\n")),
            "complexity": 0,
            "maintainability": 0,
        }
        
        try:
            # Parse the code to ensure it's valid Python
            parsed = ast.parse(code)
            
            # Check for various issues
            lines = code.split("\n")
            for i, line in enumerate(lines):
                line_num = i + 1
                
                # Check for wildcard imports
                if re.search(r"from\s+\w+\s+import\s+\*", line):
                    issues.append(CodeIssue(
                        line=line_num,
                        column=line.find("import *"),
                        message="Wildcard imports should be avoided",
                        severity="warning",
                        suggestion="Import specific modules or functions instead"
                    ))
                    
                # Check for bare except clauses
                if re.search(r"except\s*:", line) and not re.search(r"except\s+\w+", line):
                    issues.append(CodeIssue(
                        line=line_num,
                        column=line.find("except"),
                        message="Bare except clause used",
                        severity="warning",
                        suggestion="Specify the exceptions you want to catch"
                    ))
                    
                # Check for print statements
                if re.search(r"print\s*\(", line):
                    issues.append(CodeIssue(
                        line=line_num,
                        column=line.find("print"),
                        message="Print statements found",
                        severity="info",
                        suggestion="Consider using logging instead of print statements in production code"
                    ))
                    
                # Check for long lines
                if len(line) > 79:
                    issues.append(CodeIssue(
                        line=line_num,
                        column=79,
                        message="Line too long",
                        severity="info",
                        suggestion="Keep lines under 80 characters for better readability"
                    ))
            
            # Calculate complexity (simplified)
            complexity = 0
            for node in ast.walk(parsed):
                if isinstance(node, (ast.If, ast.For, ast.While, ast.FunctionDef, ast.ClassDef)):
                    complexity += 1
            
            metrics["complexity"] = complexity
            metrics["maintainability"] = max(0, 100 - complexity * 5)
            
        except SyntaxError as e:
            issues.append(CodeIssue(
                line=e.lineno or 1,
                column=e.offset or 0,
                message=f"Syntax error: {e}",
                severity="error",
                suggestion="Fix the syntax error to proceed with analysis"
            ))
        
        return AnalysisResult(issues=issues, metrics=metrics, language=self.language_id)
    
    def generate_docstring(self, code: str, style: str = "google") -> str:
        """Generate a docstring for a function or class."""
        if style == "google":
            return self._generate_google_docstring(code)
        elif style == "numpy":
            return self._generate_numpy_docstring(code)
        elif style == "sphinx":
            return self._generate_sphinx_docstring(code)
        else:
            return f'"""Docstring in {style} style not supported for {self.language_name}."""'
    
    def _generate_google_docstring(self, code: str) -> str:
        """Generate a Google-style docstring for Python code."""
        try:
            # Parse the code to extract function/class information
            parsed = ast.parse(code)
            
            for node in parsed.body:
                if isinstance(node, ast.FunctionDef):
                    # Extract function name and arguments
                    func_name = node.name
                    args = []
                    returns = None
                    
                    for arg in node.args.args:
                        if arg.arg != 'self':
                            args.append(arg.arg)
                    
                    # Check for return statement
                    for child in ast.walk(node):
                        if isinstance(child, ast.Return) and child.value is not None:
                            returns = True
                            break
                    
                    # Generate docstring
                    docstring = f'"""{func_name}\n\n'
                    
                    if args:
                        docstring += "Args:\n"
                        for arg in args:
                            docstring += f"    {arg}: Description of {arg}.\n"
                        docstring += "\n"
                    
                    if returns:
                        docstring += "Returns:\n"
                        docstring += "    Description of return value.\n"
                    
                    docstring += '"""'
                    return docstring
                
                elif isinstance(node, ast.ClassDef):
                    # Extract class name
                    class_name = node.name
                    
                    # Generate docstring
                    docstring = f'"""{class_name}\n\n'
                    docstring += f"A class for representing a {class_name}.\n\n"
                    
                    # Look for __init__ method
                    init_args = []
                    for child in node.body:
                        if isinstance(child, ast.FunctionDef) and child.name == "__init__":
                            for arg in child.args.args:
                                if arg.arg != 'self':
                                    init_args.append(arg.arg)
                            break
                    
                    if init_args:
                        docstring += "Attributes:\n"
                        for arg in init_args:
                            docstring += f"    {arg}: Description of {arg}.\n"
                    
                    docstring += '"""'
                    return docstring
            
            # If no function or class found, return a generic docstring
            return '"""Description of the code.\n\n"""'
        
        except SyntaxError:
            # If the code has syntax errors, return a generic docstring
            return '"""Description of the code.\n\n"""'
    
    def _generate_numpy_docstring(self, code: str) -> str:
        """Generate a NumPy-style docstring for Python code."""
        # Implementation similar to Google docstring but with NumPy format
        # For brevity, we'll return a placeholder
        return '"""NumPy-style docstring.\n\nParameters\n----------\nparam : type\n    Description of parameter.\n\nReturns\n-------\ntype\n    Description of return value.\n"""'
    
    def _generate_sphinx_docstring(self, code: str) -> str:
        """Generate a Sphinx-style docstring for Python code."""
        # Implementation similar to Google docstring but with Sphinx format
        # For brevity, we'll return a placeholder
        return '"""Sphinx-style docstring.\n\n:param param: Description of parameter.\n:return: Description of return value.\n"""'
    
    def get_code_examples(self) -> str:
        """Get code examples for Python."""
        return """
def hello_world():
    print("Hello, world!")

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
        
    def greet(self):
        print(f"Hello, my name is {self.name} and I am {self.age} years old.")
"""
    
    def get_best_practices(self) -> str:
        """Get best practices for Python."""
        return """
# Python Best Practices

## Code Style
- Follow PEP 8 style guide
- Use 4 spaces for indentation
- Limit lines to 79 characters
- Use docstrings for functions, classes, and modules
- Use snake_case for variables and functions
- Use CamelCase for classes

## Code Organization
- Use modules and packages to organize code
- Keep functions and classes small and focused
- Use meaningful names for variables, functions, and classes
- Use type hints for better code readability and IDE support

## Error Handling
- Use specific exceptions instead of bare except clauses
- Use context managers (with statement) for resource management
- Handle exceptions at the appropriate level

## Performance
- Use list comprehensions and generator expressions
- Use built-in functions and standard library modules
- Avoid global variables
- Use appropriate data structures (lists, dictionaries, sets)

## Testing
- Write unit tests for your code
- Use pytest or unittest for testing
- Use mocking for external dependencies
- Aim for high test coverage
"""
    
    def get_design_patterns(self) -> str:
        """Get common design patterns for Python."""
        return """
# Python Design Patterns

## Creational Patterns

### Singleton
```python
class Singleton:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

### Factory Method
```python
class Creator:
    def factory_method(self):
        pass
    
    def some_operation(self):
        product = self.factory_method()
        return f"Creator: {product.operation()}"

class ConcreteCreator(Creator):
    def factory_method(self):
        return ConcreteProduct()

class Product:
    def operation(self):
        pass

class ConcreteProduct(Product):
    def operation(self):
        return "Result of the ConcreteProduct"
```

## Structural Patterns

### Adapter
```python
class Target:
    def request(self):
        return "Target: The default target's behavior."

class Adaptee:
    def specific_request(self):
        return "Adaptee: The adaptee's behavior."

class Adapter(Target):
    def __init__(self, adaptee):
        self.adaptee = adaptee
    
    def request(self):
        return f"Adapter: {self.adaptee.specific_request()}"
```

## Behavioral Patterns

### Observer
```python
class Subject:
    def __init__(self):
        self._observers = []
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def detach(self, observer):
        self._observers.remove(observer)
    
    def notify(self):
        for observer in self._observers:
            observer.update(self)

class Observer:
    def update(self, subject):
        pass

class ConcreteObserver(Observer):
    def update(self, subject):
        print(f"ConcreteObserver: Reacted to the event")
```
"""
