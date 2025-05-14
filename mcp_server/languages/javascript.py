"""
JavaScript language support for the Code Enhancement MCP Server.
"""

import re
from typing import Dict, Any, List, Optional

from .base import LanguageSupport, CodeIssue, AnalysisResult


class JavaScriptSupport(LanguageSupport):
    """JavaScript language support."""
    
    @property
    def language_id(self) -> str:
        """Get the language identifier."""
        return "javascript"
    
    @property
    def language_name(self) -> str:
        """Get the language name."""
        return "JavaScript"
    
    @property
    def file_extensions(self) -> List[str]:
        """Get the file extensions for this language."""
        return [".js", ".jsx", ".mjs"]
    
    def format_code(self, code: str) -> str:
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
    
    def analyze_code(self, code: str) -> AnalysisResult:
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
        
        return AnalysisResult(issues=issues, metrics=metrics, language=self.language_id)
    
    def generate_docstring(self, code: str, style: str = "jsdoc") -> str:
        """Generate a docstring for a function or class."""
        # Generate a JSDoc-style docstring
        docstring = "/**\n * Function description\n *\n"
        
        # Try to extract function parameters using regex
        func_match = re.search(r"function\s+(\w+)\s*\(([^)]*)\)", code)
        if func_match:
            func_name = func_match.group(1)
            params = [p.strip() for p in func_match.group(2).split(",") if p.strip()]
            
            for param in params:
                docstring += f" * @param {{{self.language_id}}} {param} - Description of {param}\n"
            
            # Check for return statement
            if "return" in code:
                docstring += " * @returns {any} Description of return value\n"
            
            docstring += " */"
        else:
            # If no function found, use a generic template
            docstring = "/**\n * Function description\n * \n * @param {any} param1 - Description of param1\n * @param {any} param2 - Description of param2\n * @returns {any} Description of return value\n */"
        
        return docstring
    
    def get_code_examples(self) -> str:
        """Get code examples for JavaScript."""
        return """
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
"""
    
    def get_best_practices(self) -> str:
        """Get best practices for JavaScript."""
        return """
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
    
    def get_design_patterns(self) -> str:
        """Get common design patterns for JavaScript."""
        return """
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
