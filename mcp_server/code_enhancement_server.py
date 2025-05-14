#!/usr/bin/env python3
"""
Code Enhancement MCP Server

This server provides tools for enhancing code through the Model Context Protocol.
It can be used by Augment through the Nexus MCP Hub.
"""

import os
import sys
import logging
from typing import Dict, Any, List, Optional

# Import core modules
from core import CodeEnhancementServer, ServerConfig

# Import language support
from languages import PythonSupport, JavaScriptSupport, TypeScriptSupport, JavaSupport

# Import tools
from tools import format_code, analyze_code, visualize_code_analysis, generate_docstring

# Import resources
from resources import get_code_examples, get_best_practices, get_design_patterns

# Import prompts
from prompts import (
    code_review_prompt,
    code_optimization_prompt,
    security_review_prompt,
    test_generation_prompt,
)

# Helper classes and functions
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

# Language-specific formatters
def format_python_code(code: str) -> str:
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

def format_javascript_code(code: str) -> str:
    """Format JavaScript code using a simple formatter."""
    # Similar to Python formatter but with JavaScript syntax
    lines = code.split("\n")
    formatted_lines = []
    indent_level = 0

    for line in lines:
        stripped = line.strip()

        # Skip empty lines
        if not stripped:
            formatted_lines.append("")
            continue

        # Handle opening braces
        if stripped.endswith("{"):
            formatted_lines.append("  " * indent_level + stripped)
            indent_level += 1
        # Handle closing braces
        elif stripped.startswith("}"):
            if indent_level > 0:
                indent_level -= 1
            formatted_lines.append("  " * indent_level + stripped)
        # Handle other lines
        else:
            formatted_lines.append("  " * indent_level + stripped)

    return "\n".join(formatted_lines)

# Language-specific analyzers
def analyze_python_code(code: str) -> AnalysisResult:
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

    return AnalysisResult(issues=issues, metrics=metrics, language="python")

def analyze_javascript_code(code: str) -> AnalysisResult:
    """Analyze JavaScript code for issues and metrics."""
    issues = []
    metrics = {
        "lines_of_code": len(code.split("\n")),
        "complexity": 0,
        "maintainability": 0,
    }

    # Check for various issues
    lines = code.split("\n")
    for i, line in enumerate(lines):
        line_num = i + 1

        # Check for console.log statements
        if re.search(r"console\.log\s*\(", line):
            issues.append(CodeIssue(
                line=line_num,
                column=line.find("console.log"),
                message="Console.log statements found",
                severity="info",
                suggestion="Remove console.log statements in production code"
            ))

        # Check for var usage
        if re.search(r"\bvar\s+", line):
            issues.append(CodeIssue(
                line=line_num,
                column=line.find("var"),
                message="Var keyword used",
                severity="warning",
                suggestion="Use let or const instead of var for better scoping"
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
    for line in lines:
        if re.search(r"\bif\b|\bfor\b|\bwhile\b|\bfunction\b|\bclass\b", line):
            complexity += 1

    metrics["complexity"] = complexity
    metrics["maintainability"] = max(0, 100 - complexity * 5)

    return AnalysisResult(issues=issues, metrics=metrics, language="javascript")

# Docstring generators
def generate_python_google_docstring(code: str) -> str:
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
                docstring += "A class for representing a {class_name}.\n\n"

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

def generate_python_numpy_docstring(code: str) -> str:
    """Generate a NumPy-style docstring for Python code."""
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
                    docstring += "Parameters\n"
                    docstring += "----------\n"
                    for arg in args:
                        docstring += f"{arg} : type\n"
                        docstring += f"    Description of {arg}.\n"
                    docstring += "\n"

                if returns:
                    docstring += "Returns\n"
                    docstring += "-------\n"
                    docstring += "type\n"
                    docstring += "    Description of return value.\n"

                docstring += '"""'
                return docstring

            elif isinstance(node, ast.ClassDef):
                # Extract class name
                class_name = node.name

                # Generate docstring
                docstring = f'"""{class_name}\n\n'
                docstring += "A class for representing a {class_name}.\n\n"

                # Look for __init__ method
                init_args = []
                for child in node.body:
                    if isinstance(child, ast.FunctionDef) and child.name == "__init__":
                        for arg in child.args.args:
                            if arg.arg != 'self':
                                init_args.append(arg.arg)
                        break

                if init_args:
                    docstring += "Attributes\n"
                    docstring += "----------\n"
                    for arg in init_args:
                        docstring += f"{arg} : type\n"
                        docstring += f"    Description of {arg}.\n"

                docstring += '"""'
                return docstring

        # If no function or class found, return a generic docstring
        return '"""Description of the code.\n\n"""'

    except SyntaxError:
        # If the code has syntax errors, return a generic docstring
        return '"""Description of the code.\n\n"""'

# Create MCP server
mcp = FastMCP(
    name="Code Enhancement",
    description="Provides tools for enhancing code",
    version="0.1.0",
)

# Resources

@mcp.resource("examples/{language}")
def get_code_examples(language: str) -> str:
    """
    Get code examples for a specific language.

    Args:
        language: The programming language to get examples for

    Returns:
        String with code examples
    """
    logger.info(f"Getting code examples for {language}")

    examples = {
        "python": """
def hello_world():
    print("Hello, world!")

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        print(f"Hello, my name is {self.name} and I am {self.age} years old.")
""",
        "javascript": """
function helloWorld() {
    console.log("Hello, world!");
}

class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    greet() {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
    }
}
""",
        "typescript": """
function helloWorld(): void {
    console.log("Hello, world!");
}

class Person {
    name: string;
    age: number;

    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }

    greet(): void {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
    }
}
"""
    }

    return examples.get(language.lower(), f"No examples available for {language}")

@mcp.resource("best-practices/{language}")
def get_best_practices(language: str) -> str:
    """
    Get best practices for a specific language.

    Args:
        language: The programming language to get best practices for

    Returns:
        String with best practices
    """
    logger.info(f"Getting best practices for {language}")

    practices = {
        "python": """
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
""",
        "javascript": """
# JavaScript Best Practices

## Code Style
- Use ESLint or Prettier for consistent code style
- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use camelCase for variables and functions
- Use PascalCase for classes

## Code Organization
- Use modules to organize code
- Keep functions and classes small and focused
- Use meaningful names for variables, functions, and classes
- Use JSDoc comments for documentation

## Error Handling
- Use try-catch blocks for error handling
- Use async/await for asynchronous code
- Handle promises properly with .catch() or try-catch

## Performance
- Avoid excessive DOM manipulation
- Use event delegation
- Minimize global variables
- Use appropriate data structures (arrays, objects, maps, sets)

## Testing
- Write unit tests for your code
- Use Jest, Mocha, or Jasmine for testing
- Use mocking for external dependencies
- Aim for high test coverage
"""
    }

    return practices.get(language.lower(), f"No best practices available for {language}")

@mcp.resource("patterns/{language}")
def get_design_patterns(language: str) -> str:
    """
    Get common design patterns for a specific language.

    Args:
        language: The programming language to get design patterns for

    Returns:
        String with design patterns
    """
    logger.info(f"Getting design patterns for {language}")

    patterns = {
        "python": """
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
""",
        "javascript": """
# JavaScript Design Patterns

## Creational Patterns

### Singleton
```javascript
class Singleton {
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance;
    }
    Singleton.instance = this;
  }
}
```

### Factory Method
```javascript
class Creator {
  factoryMethod() {
    throw new Error('factoryMethod must be implemented');
  }

  someOperation() {
    const product = this.factoryMethod();
    return `Creator: ${product.operation()}`;
  }
}

class ConcreteCreator extends Creator {
  factoryMethod() {
    return new ConcreteProduct();
  }
}

class Product {
  operation() {
    throw new Error('operation must be implemented');
  }
}

class ConcreteProduct extends Product {
  operation() {
    return 'Result of the ConcreteProduct';
  }
}
```

## Structural Patterns

### Adapter
```javascript
class Target {
  request() {
    return 'Target: The default target\'s behavior.';
  }
}

class Adaptee {
  specificRequest() {
    return 'Adaptee: The adaptee\'s behavior.';
  }
}

class Adapter extends Target {
  constructor(adaptee) {
    super();
    this.adaptee = adaptee;
  }

  request() {
    return `Adapter: ${this.adaptee.specificRequest()}`;
  }
}
```

## Behavioral Patterns

### Observer
```javascript
class Subject {
  constructor() {
    this.observers = [];
  }

  attach(observer) {
    this.observers.push(observer);
  }

  detach(observer) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  notify() {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }
}

class Observer {
  update(subject) {
    throw new Error('update must be implemented');
  }
}

class ConcreteObserver extends Observer {
  update(subject) {
    console.log('ConcreteObserver: Reacted to the event');
  }
}
```
"""
    }

    return patterns.get(language.lower(), f"No design patterns available for {language}")

# Code enhancement tools

@mcp.tool()
def visualize_code_analysis(code: str, language: str) -> Dict[str, Any]:
    """
    Generate a visualization of code analysis results.

    Args:
        code: The code to analyze
        language: The programming language of the code

    Returns:
        Dictionary with visualization data
    """
    logger.info(f"Generating visualization for {language} code")

    # Analyze the code
    if language.lower() == "python":
        result = analyze_python_code(code)
    elif language.lower() in ["javascript", "typescript"]:
        result = analyze_javascript_code(code)
    else:
        # For unsupported languages, return a basic analysis
        result = AnalysisResult(
            issues=[],
            metrics={
                "lines_of_code": len(code.split("\n")),
                "complexity": 0,
                "maintainability": 0,
            },
            language=language
        )

    # Generate a simple ASCII visualization
    lines = code.split("\n")
    line_count = len(lines)

    # Create a visualization of issues by line
    visualization = []

    # Header
    visualization.append("Code Analysis Visualization")
    visualization.append("=" * 50)
    visualization.append(f"Language: {language}")
    visualization.append(f"Lines of code: {result.metrics['lines_of_code']}")
    visualization.append(f"Complexity: {result.metrics['complexity']}")
    visualization.append(f"Maintainability: {result.metrics['maintainability']}/100")
    visualization.append("-" * 50)

    # Issues by line
    visualization.append("Issues by line:")

    # Group issues by line
    issues_by_line = {}
    for issue in result.issues:
        if issue.line not in issues_by_line:
            issues_by_line[issue.line] = []
        issues_by_line[issue.line].append(issue)

    # Generate visualization
    for i, line in enumerate(lines):
        line_num = i + 1
        line_issues = issues_by_line.get(line_num, [])

        if line_issues:
            # Line with issues
            severity_markers = {
                "error": "E",
                "warning": "W",
                "info": "I"
            }

            markers = "".join(severity_markers.get(issue.severity, "?") for issue in line_issues)
            visualization.append(f"{line_num:4d} | {markers} | {line[:50]}")

            # Add issue details
            for issue in line_issues:
                visualization.append(f"      | {issue.severity.upper()} | {issue.message}")
                if issue.suggestion:
                    visualization.append(f"      |   | Suggestion: {issue.suggestion}")
        else:
            # Line without issues
            visualization.append(f"{line_num:4d} |   | {line[:50]}")

    visualization.append("-" * 50)

    # Summary
    error_count = sum(1 for issue in result.issues if issue.severity == "error")
    warning_count = sum(1 for issue in result.issues if issue.severity == "warning")
    info_count = sum(1 for issue in result.issues if issue.severity == "info")

    visualization.append(f"Summary: {error_count} errors, {warning_count} warnings, {info_count} info")

    return {
        "visualization": "\n".join(visualization),
        "metrics": result.metrics,
        "issues_count": len(result.issues),
        "language": language
    }

@mcp.tool()
def format_code(code: str, language: str) -> Dict[str, Any]:
    """
    Format code according to language-specific style guidelines.

    Args:
        code: The code to format
        language: The programming language of the code (python, javascript, typescript, java, csharp, go, ruby, rust)

    Returns:
        Dictionary with formatted code and language
    """
    logger.info(f"Formatting {language} code")

    formatted_code = code

    # Use language-specific formatters
    if language.lower() == "python":
        formatted_code = format_python_code(code)
    elif language.lower() in ["javascript", "typescript"]:
        formatted_code = format_javascript_code(code)
    # Add more language formatters as needed

    return {
        "formatted_code": formatted_code,
        "language": language,
        "success": True,
        "message": f"Code formatted successfully using {language} formatter"
    }

@mcp.tool()
def analyze_code(code: str, language: str, ctx: Context = None) -> Dict[str, Any]:
    """
    Analyze code for potential issues and improvements.

    Args:
        code: The code to analyze
        language: The programming language of the code (python, javascript, typescript, java, csharp, go, ruby, rust)
        ctx: Optional context object for progress reporting

    Returns:
        Dictionary with issues, metrics, and language
    """
    logger.info(f"Analyzing {language} code")

    # Report progress if context is provided
    if ctx:
        ctx.info("Starting code analysis...")

    # Use language-specific analyzers
    if language.lower() == "python":
        if ctx:
            ctx.info("Using Python analyzer")
        result = analyze_python_code(code)
    elif language.lower() in ["javascript", "typescript"]:
        if ctx:
            ctx.info("Using JavaScript analyzer")
        result = analyze_javascript_code(code)
    else:
        # For unsupported languages, return a basic analysis
        if ctx:
            ctx.info(f"No specific analyzer available for {language}")
        result = AnalysisResult(
            issues=[],
            metrics={
                "lines_of_code": len(code.split("\n")),
                "complexity": 0,
                "maintainability": 0,
            },
            language=language
        )

    # Convert issues to a serializable format
    issues_data = []
    suggestions = []

    for issue in result.issues:
        issues_data.append({
            "line": issue.line,
            "column": issue.column,
            "message": issue.message,
            "severity": issue.severity,
        })

        if issue.suggestion:
            suggestions.append(issue.suggestion)

    # Report completion if context is provided
    if ctx:
        ctx.info(f"Code analysis complete: found {len(issues_data)} issues")

    return {
        "issues": issues_data,
        "suggestions": suggestions,
        "metrics": result.metrics,
        "language": result.language,
        "summary": f"Found {len(issues_data)} issues in {result.metrics['lines_of_code']} lines of code",
        "maintainability_score": result.metrics.get("maintainability", 0)
    }

@mcp.tool()
def generate_docstring(code: str, language: str, style: str = "google") -> Dict[str, Any]:
    """
    Generate a docstring for a function or class.

    Args:
        code: The function or class code to document
        language: The programming language of the code (python, javascript, typescript, java, csharp, go, ruby, rust)
        style: The docstring style to use (google, numpy, sphinx)

    Returns:
        Dictionary with docstring, language, and style
    """
    logger.info(f"Generating {style} docstring for {language} code")

    docstring = ""
    success = True
    message = f"Generated {style} docstring for {language} code"

    try:
        if language.lower() == "python":
            if style.lower() == "google":
                docstring = generate_python_google_docstring(code)
            elif style.lower() == "numpy":
                docstring = generate_python_numpy_docstring(code)
            elif style.lower() == "sphinx":
                # Generate a Sphinx-style docstring
                docstring = '"""Function description.\n\n'

                # Try to parse the code to extract function/class information
                try:
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
                                for arg in args:
                                    docstring += f":param {arg}: Description of {arg}.\n"
                                docstring += "\n"

                            if returns:
                                docstring += ":return: Description of return value.\n"

                            docstring += '"""'
                            break
                except SyntaxError:
                    # If parsing fails, use a generic template
                    docstring = '"""Function description.\n\n:param param1: Description of param1.\n:param param2: Description of param2.\n:return: Description of return value.\n"""'
            else:
                success = False
                message = f"Unsupported docstring style: {style}"
                docstring = f'"""Docstring in {style} style not supported for {language}."""'
        elif language.lower() in ["javascript", "typescript"]:
            # Generate a JSDoc-style docstring
            docstring = "/**\n * Function description\n *\n"

            # Try to extract function parameters using regex
            func_match = re.search(r"function\s+(\w+)\s*\(([^)]*)\)", code)
            if func_match:
                func_name = func_match.group(1)
                params = [p.strip() for p in func_match.group(2).split(",") if p.strip()]

                for param in params:
                    docstring += f" * @param {{{language}}} {param} - Description of {param}\n"

                # Check for return statement
                if "return" in code:
                    docstring += " * @returns {any} Description of return value\n"

                docstring += " */"
            else:
                # If no function found, use a generic template
                docstring = "/**\n * Function description\n * \n * @param {any} param1 - Description of param1\n * @param {any} param2 - Description of param2\n * @returns {any} Description of return value\n */"
        else:
            success = False
            message = f"Docstring generation not supported for {language}"
            docstring = f'/* Docstring generation not supported for {language} */'
    except Exception as e:
        success = False
        message = f"Error generating docstring: {str(e)}"
        docstring = f'/* Error generating docstring: {str(e)} */'

    return {
        "docstring": docstring,
        "language": language,
        "style": style,
        "success": success,
        "message": message
    }

# Prompts

@mcp.prompt()
def code_review_prompt(code: str, language: str) -> str:
    """
    Create a prompt for code review.

    Args:
        code: The code to review
        language: The programming language of the code

    Returns:
        A prompt for code review
    """
    return f"""Please review the following {language} code:

```{language}
{code}
```

Please provide feedback on:
1. Code quality and style
2. Potential bugs or issues
3. Performance considerations
4. Security concerns
5. Suggestions for improvement"""

@mcp.prompt()
def code_optimization_prompt(code: str, language: str, focus: str = "performance") -> str:
    """
    Create a prompt for code optimization.

    Args:
        code: The code to optimize
        language: The programming language of the code
        focus: The focus of optimization (performance, memory, readability)

    Returns:
        A prompt for code optimization
    """
    return f"""Please optimize the following {language} code with a focus on {focus}:

```{language}
{code}
```

Please provide:
1. An optimized version of the code
2. Explanation of the optimizations made
3. Expected improvements in {focus}
4. Any trade-offs made during optimization"""

@mcp.prompt()
def security_review_prompt(code: str, language: str) -> str:
    """
    Create a prompt for security review.

    Args:
        code: The code to review for security issues
        language: The programming language of the code

    Returns:
        A prompt for security review
    """
    return f"""Please perform a security review of the following {language} code:

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

@mcp.prompt()
def test_generation_prompt(code: str, language: str, framework: str = "") -> str:
    """
    Create a prompt for test generation.

    Args:
        code: The code to generate tests for
        language: The programming language of the code
        framework: The testing framework to use (optional)

    Returns:
        A prompt for test generation
    """
    framework_text = f" using the {framework} framework" if framework else ""

    return f"""Please generate comprehensive tests for the following {language} code{framework_text}:

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

def main():
    """Main function."""
    # Create server configuration
    config = ServerConfig()

    # Create server
    server = CodeEnhancementServer(config)

    # Register language support
    server.register_language_support("python", PythonSupport())
    server.register_language_support("javascript", JavaScriptSupport())
    server.register_language_support("typescript", TypeScriptSupport())
    server.register_language_support("java", JavaSupport())

    # Register tools
    server.register_tool(
        "format_code",
        lambda code, language: format_code(server, code, language),
        "Format code according to language-specific style guidelines"
    )

    server.register_tool(
        "analyze_code",
        lambda code, language, ctx=None: analyze_code(server, code, language, ctx),
        "Analyze code for potential issues and improvements"
    )

    server.register_tool(
        "visualize_code_analysis",
        lambda code, language: visualize_code_analysis(server, code, language),
        "Generate a visualization of code analysis results"
    )

    server.register_tool(
        "generate_docstring",
        lambda code, language, style="default": generate_docstring(server, code, language, style),
        "Generate a docstring for a function or class"
    )

    # Register resources
    server.register_resource(
        "examples/{language}",
        lambda language: get_code_examples(server, language),
        "Get code examples for a specific language"
    )

    server.register_resource(
        "best-practices/{language}",
        lambda language: get_best_practices(server, language),
        "Get best practices for a specific language"
    )

    server.register_resource(
        "patterns/{language}",
        lambda language: get_design_patterns(server, language),
        "Get common design patterns for a specific language"
    )

    # Register prompts
    server.register_prompt(
        "code_review",
        lambda code, language: code_review_prompt(server, code, language),
        "Create a prompt for code review"
    )

    server.register_prompt(
        "code_optimization",
        lambda code, language, focus="performance": code_optimization_prompt(server, code, language, focus),
        "Create a prompt for code optimization"
    )

    server.register_prompt(
        "security_review",
        lambda code, language: security_review_prompt(server, code, language),
        "Create a prompt for security review"
    )

    server.register_prompt(
        "test_generation",
        lambda code, language, framework="": test_generation_prompt(server, code, language, framework),
        "Create a prompt for test generation"
    )

    # Run the server
    server.run()


if __name__ == "__main__":
    main()
