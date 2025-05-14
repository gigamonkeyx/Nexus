"""
TypeScript language support for the Code Enhancement MCP Server.
"""

import re
from typing import Dict, Any, List, Optional

from .base import LanguageSupport, CodeIssue, AnalysisResult


class TypeScriptSupport(LanguageSupport):
    """TypeScript language support."""
    
    @property
    def language_id(self) -> str:
        """Get the language identifier."""
        return "typescript"
    
    @property
    def language_name(self) -> str:
        """Get the language name."""
        return "TypeScript"
    
    @property
    def file_extensions(self) -> List[str]:
        """Get the file extensions for this language."""
        return [".ts", ".tsx"]
    
    def format_code(self, code: str) -> str:
        """Format TypeScript code using a simple formatter."""
        # Similar to JavaScript formatter but with TypeScript syntax
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
        """Analyze TypeScript code for issues and metrics."""
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
                
            # Check for any type
            if re.search(r":\s*any", line):
                issues.append(CodeIssue(
                    line=line_num,
                    column=line.find(": any"),
                    message="Any type used",
                    severity="warning",
                    suggestion="Use a more specific type instead of 'any'"
                ))
                
            # Check for non-null assertion
            if re.search(r"!\s*;", line):
                issues.append(CodeIssue(
                    line=line_num,
                    column=line.find("!"),
                    message="Non-null assertion used",
                    severity="warning",
                    suggestion="Use optional chaining (?.) or nullish coalescing (??) instead"
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
                # Extract type if available
                param_type_match = re.search(r"(\w+)\s*:\s*(\w+)", param)
                if param_type_match:
                    param_name = param_type_match.group(1)
                    param_type = param_type_match.group(2)
                    docstring += f" * @param {{{param_type}}} {param_name} - Description of {param_name}\n"
                else:
                    docstring += f" * @param {{any}} {param} - Description of {param}\n"
            
            # Check for return type
            return_type_match = re.search(r"function\s+\w+\s*\([^)]*\)\s*:\s*(\w+)", code)
            if return_type_match:
                return_type = return_type_match.group(1)
                docstring += f" * @returns {{{return_type}}} Description of return value\n"
            elif "return" in code:
                docstring += " * @returns {any} Description of return value\n"
            
            docstring += " */"
        else:
            # Check for arrow function
            arrow_func_match = re.search(r"const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*", code)
            if arrow_func_match:
                func_name = arrow_func_match.group(1)
                params = [p.strip() for p in arrow_func_match.group(2).split(",") if p.strip()]
                
                for param in params:
                    # Extract type if available
                    param_type_match = re.search(r"(\w+)\s*:\s*(\w+)", param)
                    if param_type_match:
                        param_name = param_type_match.group(1)
                        param_type = param_type_match.group(2)
                        docstring += f" * @param {{{param_type}}} {param_name} - Description of {param_name}\n"
                    else:
                        docstring += f" * @param {{any}} {param} - Description of {param}\n"
                
                # Check for return type
                return_type_match = re.search(r"const\s+\w+\s*=\s*\([^)]*\)\s*:\s*(\w+)\s*=>", code)
                if return_type_match:
                    return_type = return_type_match.group(1)
                    docstring += f" * @returns {{{return_type}}} Description of return value\n"
                elif "return" in code:
                    docstring += " * @returns {any} Description of return value\n"
                
                docstring += " */"
            else:
                # If no function found, use a generic template
                docstring = "/**\n * Function description\n * \n * @param {any} param1 - Description of param1\n * @param {any} param2 - Description of param2\n * @returns {any} Description of return value\n */"
        
        return docstring
    
    def get_code_examples(self) -> str:
        """Get code examples for TypeScript."""
        return """
function helloWorld(): void {
  console.log("Hello, world!");
}

interface Person {
  name: string;
  age: number;
  greet(): void;
}

class Employee implements Person {
  name: string;
  age: number;
  position: string;
  
  constructor(name: string, age: number, position: string) {
    this.name = name;
    this.age = age;
    this.position = position;
  }
  
  greet(): void {
    console.log(`Hello, my name is ${this.name}, I am ${this.age} years old, and I work as a ${this.position}.`);
  }
}

// Generic function example
function identity<T>(arg: T): T {
  return arg;
}

// Union types
type StringOrNumber = string | number;
function processValue(value: StringOrNumber): void {
  if (typeof value === "string") {
    console.log(value.toUpperCase());
  } else {
    console.log(value.toFixed(2));
  }
}
"""
    
    def get_best_practices(self) -> str:
        """Get best practices for TypeScript."""
        return """
# TypeScript Best Practices

## Type Safety

- Use specific types instead of `any`
- Use interfaces for object shapes
- Use type aliases for complex types
- Use generics for reusable components
- Use union types for variables that can have multiple types
- Use intersection types for combining types
- Use type guards for runtime type checking

## Code Style

- Use ESLint and Prettier for consistent code style
- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

## Code Organization

- Use modules to organize code
- Use namespaces sparingly
- Keep functions and classes small and focused
- Use meaningful names for variables, functions, and classes
- Use JSDoc comments for documentation

## Error Handling

- Use try-catch blocks for error handling
- Use async/await for asynchronous code
- Handle promises properly with .catch() or try-catch
- Use custom error classes for specific error types

## Performance

- Use readonly for immutable properties
- Use const assertions for immutable objects
- Use mapped types for transforming types
- Use conditional types for complex type logic
- Use template literal types for string manipulation

## Testing

- Write unit tests for your code
- Use Jest or Mocha for testing
- Use TypeScript-specific testing tools like ts-jest
- Use mocking for external dependencies
- Aim for high test coverage
"""
    
    def get_design_patterns(self) -> str:
        """Get common design patterns for TypeScript."""
        return """
# TypeScript Design Patterns

## Creational Patterns

### Singleton
```typescript
class Singleton {
  private static instance: Singleton;
  
  private constructor() {}
  
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}
```

### Factory Method
```typescript
interface Product {
  operation(): string;
}

class ConcreteProduct implements Product {
  operation(): string {
    return 'Result of the ConcreteProduct';
  }
}

abstract class Creator {
  abstract factoryMethod(): Product;
  
  someOperation(): string {
    const product = this.factoryMethod();
    return `Creator: ${product.operation()}`;
  }
}

class ConcreteCreator extends Creator {
  factoryMethod(): Product {
    return new ConcreteProduct();
  }
}
```

## Structural Patterns

### Adapter
```typescript
class Target {
  request(): string {
    return 'Target: The default target\'s behavior.';
  }
}

class Adaptee {
  specificRequest(): string {
    return 'Adaptee: The adaptee\'s behavior.';
  }
}

class Adapter extends Target {
  private adaptee: Adaptee;
  
  constructor(adaptee: Adaptee) {
    super();
    this.adaptee = adaptee;
  }
  
  request(): string {
    return `Adapter: ${this.adaptee.specificRequest()}`;
  }
}
```

## Behavioral Patterns

### Observer
```typescript
interface Observer {
  update(subject: Subject): void;
}

class Subject {
  private observers: Observer[] = [];
  
  attach(observer: Observer): void {
    this.observers.push(observer);
  }
  
  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }
  
  notify(): void {
    for (const observer of this.observers) {
      observer.update(this);
    }
  }
}

class ConcreteObserver implements Observer {
  update(subject: Subject): void {
    console.log('ConcreteObserver: Reacted to the event');
  }
}
```
"""
