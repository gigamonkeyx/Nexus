"""
Java language support for the Code Enhancement MCP Server.
"""

import re
from typing import Dict, Any, List, Optional

from .base import LanguageSupport, CodeIssue, AnalysisResult


class JavaSupport(LanguageSupport):
    """Java language support."""

    @property
    def language_id(self) -> str:
        """Get the language identifier."""
        return "java"

    @property
    def language_name(self) -> str:
        """Get the language name."""
        return "Java"

    @property
    def file_extensions(self) -> List[str]:
        """Get the file extensions for this language."""
        return [".java"]

    def format_code(self, code: str) -> str:
        """Format Java code using a simple formatter."""
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
                formatted_lines.append("    " * indent_level + stripped)
                indent_level += 1
            # Handle closing braces
            elif stripped.startswith("}"):
                if indent_level > 0:
                    indent_level -= 1
                formatted_lines.append("    " * indent_level + stripped)
            # Handle other lines
            else:
                formatted_lines.append("    " * indent_level + stripped)

        return "\n".join(formatted_lines)

    def analyze_code(self, code: str) -> AnalysisResult:
        """Analyze Java code for issues and metrics."""
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

            # Check for System.out.println statements
            if re.search(r"System\.out\.println\s*\(", line):
                issues.append(CodeIssue(
                    line=line_num,
                    column=line.find("System.out.println"),
                    message="System.out.println statements found",
                    severity="info",
                    suggestion="Use a logging framework instead of System.out.println in production code"
                ))

            # Check for raw exception handling
            if re.search(r"catch\s*\(\s*Exception\s+", line):
                issues.append(CodeIssue(
                    line=line_num,
                    column=line.find("catch"),
                    message="Catching raw Exception",
                    severity="warning",
                    suggestion="Catch specific exceptions instead of the generic Exception class"
                ))

            # Check for public fields
            if re.search(r"public\s+\w+\s+\w+\s*;", line):
                issues.append(CodeIssue(
                    line=line_num,
                    column=line.find("public"),
                    message="Public field found",
                    severity="warning",
                    suggestion="Use private fields with getter and setter methods instead of public fields"
                ))

            # Check for long lines
            if len(line) > 100:
                issues.append(CodeIssue(
                    line=line_num,
                    column=100,
                    message="Line too long",
                    severity="info",
                    suggestion="Keep lines under 100 characters for better readability"
                ))

        # Calculate complexity (simplified)
        complexity = 0
        for line in lines:
            if re.search(r"\bif\b|\bfor\b|\bwhile\b|\bswitch\b|\bcatch\b|\bcase\b", line):
                complexity += 1

        metrics["complexity"] = complexity
        metrics["maintainability"] = max(0, 100 - complexity * 5)

        return AnalysisResult(issues=issues, metrics=metrics, language=self.language_id)

    def generate_docstring(self, code: str, style: str = "javadoc") -> str:
        """Generate a docstring for a function or class."""
        # Generate a Javadoc-style docstring

        # Try to extract method information using regex
        method_match = re.search(r"(public|private|protected)?\s+\w+\s+(\w+)\s*\(([^)]*)\)", code)
        if method_match:
            method_name = method_match.group(2)
            params = [p.strip() for p in method_match.group(3).split(",") if p.strip()]

            docstring = "/**\n"
            docstring += f" * {method_name}\n"
            docstring += " *\n"

            for param in params:
                # Extract parameter name
                param_parts = param.split()
                if len(param_parts) >= 2:
                    param_name = param_parts[-1]
                    docstring += f" * @param {param_name} Description of {param_name}\n"

            # Check for return type
            return_type_match = re.search(r"(public|private|protected)?\s+(\w+)\s+\w+\s*\(", code)
            if return_type_match and return_type_match.group(2) != "void":
                docstring += f" * @return Description of return value\n"

            # Check for exceptions
            if "throws" in code:
                exceptions_match = re.search(r"throws\s+([^{]+)", code)
                if exceptions_match:
                    exceptions = [e.strip() for e in exceptions_match.group(1).split(",")]
                    for exception in exceptions:
                        docstring += f" * @throws {exception} Description of when this exception is thrown\n"

            docstring += " */"
            return docstring
        else:
            # Check for class
            class_match = re.search(r"(public|private|protected)?\s+class\s+(\w+)", code)
            if class_match:
                class_name = class_match.group(2)

                docstring = "/**\n"
                docstring += f" * The {class_name} class.\n"
                docstring += " *\n"

                # Check for extends
                extends_match = re.search(r"class\s+\w+\s+extends\s+(\w+)", code)
                if extends_match:
                    parent_class = extends_match.group(1)
                    docstring += f" * Extends {parent_class}.\n"

                # Check for implements
                implements_match = re.search(r"class\s+\w+(?:\s+extends\s+\w+)?\s+implements\s+([^{]+)", code)
                if implements_match:
                    interfaces = [i.strip() for i in implements_match.group(1).split(",")]
                    docstring += f" * Implements {', '.join(interfaces)}.\n"

                docstring += " */"
                return docstring
            else:
                # If no method or class found, use a generic template
                return "/**\n * Description of the code.\n */"

    def get_code_examples(self) -> str:
        """Get code examples for Java."""
        return """
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}

class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public void greet() {
        System.out.println("Hello, my name is " + name + " and I am " + age + " years old.");
    }
}

interface Shape {
    double getArea();
    double getPerimeter();
}

class Circle implements Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double getArea() {
        return Math.PI * radius * radius;
    }

    @Override
    public double getPerimeter() {
        return 2 * Math.PI * radius;
    }
}

class Rectangle implements Shape {
    private double width;
    private double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public double getArea() {
        return width * height;
    }

    @Override
    public double getPerimeter() {
        return 2 * (width + height);
    }
}
"""

    def get_best_practices(self) -> str:
        """Get best practices for Java."""
        return """
# Java Best Practices

## Code Style

- Follow the Java Code Conventions
- Use 4 spaces for indentation
- Use camelCase for variables and methods
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants
- Keep lines under 100 characters

## Code Organization

- Use packages to organize code
- Follow the standard directory structure
- Keep classes small and focused
- Use meaningful names for variables, methods, and classes
- Use Javadoc comments for documentation

## Object-Oriented Design

- Favor composition over inheritance
- Program to interfaces, not implementations
- Use the SOLID principles
- Use design patterns appropriately
- Use encapsulation to hide implementation details

## Error Handling

- Use checked exceptions for recoverable errors
- Use unchecked exceptions for programming errors
- Don't catch Exception, catch specific exceptions
- Don't ignore exceptions
- Use try-with-resources for automatic resource management

## Performance

- Avoid premature optimization
- Use StringBuilder for string concatenation in loops
- Use appropriate collections for the task
- Use primitive types when possible
- Use streams for functional-style operations

## Testing

- Write unit tests for your code
- Use JUnit for testing
- Use mocking frameworks like Mockito
- Use test-driven development (TDD)
- Aim for high test coverage
"""

    def get_design_patterns(self) -> str:
        """Get common design patterns for Java."""
        return """
# Java Design Patterns

## Creational Patterns

### Singleton
```java
public class Singleton {
    private static Singleton instance;

    private Singleton() {}

    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

### Factory Method
```java
interface Product {
    String operation();
}

class ConcreteProduct implements Product {
    @Override
    public String operation() {
        return "Result of the ConcreteProduct";
    }
}

abstract class Creator {
    public abstract Product factoryMethod();

    public String someOperation() {
        Product product = factoryMethod();
        return "Creator: " + product.operation();
    }
}

class ConcreteCreator extends Creator {
    @Override
    public Product factoryMethod() {
        return new ConcreteProduct();
    }
}
```

## Structural Patterns

### Adapter
```java
class Target {
    public String request() {
        return "Target: The default target's behavior.";
    }
}

class Adaptee {
    public String specificRequest() {
        return "Adaptee: The adaptee's behavior.";
    }
}

class Adapter extends Target {
    private Adaptee adaptee;

    public Adapter(Adaptee adaptee) {
        this.adaptee = adaptee;
    }

    @Override
    public String request() {
        return "Adapter: " + adaptee.specificRequest();
    }
}
```

## Behavioral Patterns

### Observer
```java
import java.util.ArrayList;
import java.util.List;

interface Observer {
    void update(Subject subject);
}

class Subject {
    private List<Observer> observers = new ArrayList<>();

    public void attach(Observer observer) {
        observers.add(observer);
    }

    public void detach(Observer observer) {
        observers.remove(observer);
    }

    public void notify() {
        for (Observer observer : observers) {
            observer.update(this);
        }
    }
}

class ConcreteObserver implements Observer {
    @Override
    public void update(Subject subject) {
        System.out.println("ConcreteObserver: Reacted to the event");
    }
}
```
"""
