#!/usr/bin/env python3
"""
Test the Code Enhancement MCP Server using the MCP client.
"""

import os
import sys
import logging
import asyncio
import importlib
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("test_server")

# Import core modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mcp_server.core import ServerConfig
from mcp_server.languages import PythonSupport, JavaScriptSupport, TypeScriptSupport, JavaSupport

# Sample code for testing
SAMPLE_PYTHON_CODE = """
def hello_world():
print("Hello, world!")
for i in range(10):
print(i)
if i % 2 == 0:
print("Even")
else:
print("Odd")
return "Done"
"""

SAMPLE_PYTHON_CODE_WITH_ISSUES = """
def process_data(data):
    try:
        from module import *
        print("Processing data...")
        result = data * 2
        return result
    except:
        print("Error processing data")
        return None
"""

SAMPLE_PYTHON_FUNCTION = """
def calculate_average(numbers, weights=None):
    if weights is None:
        return sum(numbers) / len(numbers)
    else:
        return sum(n * w for n, w in zip(numbers, weights)) / sum(weights)
"""

async def test_server():
    """Test the MCP server using the MCP client."""
    logger.info("Testing Code Enhancement MCP Server")

    # Import the server module
    from mcp_server.core import CodeEnhancementServer
    from mcp_server.tools import format_code, analyze_code, visualize_code_analysis, generate_docstring
    from mcp_server.resources import get_code_examples, get_best_practices, get_design_patterns
    from mcp_server.prompts import (
        code_review_prompt,
        code_optimization_prompt,
        security_review_prompt,
        test_generation_prompt,
    )

    try:
        # Create server configuration
        logger.info("Creating server configuration")
        config = ServerConfig()

        # Create server
        logger.info("Creating server instance")
        server = CodeEnhancementServer(config)

        # Register language support
        logger.info("Registering language support")
        python_support = PythonSupport()
        javascript_support = JavaScriptSupport()
        typescript_support = TypeScriptSupport()
        java_support = JavaSupport()

        server.register_language_support("python", python_support)
        server.register_language_support("javascript", javascript_support)
        server.register_language_support("typescript", typescript_support)
        server.register_language_support("java", java_support)

        # Test the server directly
        logger.info("Testing server components directly")

        # Test format_code tool
        logger.info("Testing format_code tool")
        format_result = format_code(server, SAMPLE_PYTHON_CODE, "python")
        logger.info(f"Format result: {format_result}")

        # Test analyze_code tool
        logger.info("Testing analyze_code tool")
        analyze_result = analyze_code(server, SAMPLE_PYTHON_CODE_WITH_ISSUES, "python")
        logger.info(f"Analyze result: {analyze_result}")

        # Test generate_docstring tool
        logger.info("Testing generate_docstring tool")
        docstring_result = generate_docstring(server, SAMPLE_PYTHON_FUNCTION, "python", "google")
        logger.info(f"Docstring result: {docstring_result}")

        # Test visualize_code_analysis tool
        logger.info("Testing visualize_code_analysis tool")
        visualization = visualize_code_analysis(server, SAMPLE_PYTHON_CODE_WITH_ISSUES, "python")
        logger.info(f"Visualization: {visualization['visualization'][:100]}...")  # Show first 100 chars

        # Test code examples resource
        logger.info("Testing code examples resource")
        examples = get_code_examples(server, "python")
        logger.info(f"Code examples: {examples[:100]}...")  # Show first 100 chars

        # Test best practices resource
        logger.info("Testing best practices resource")
        practices = get_best_practices(server, "python")
        logger.info(f"Best practices: {practices[:100]}...")  # Show first 100 chars

        # Test design patterns resource
        logger.info("Testing design patterns resource")
        patterns = get_design_patterns(server, "python")
        logger.info(f"Design patterns: {patterns[:100]}...")  # Show first 100 chars

        # Test code review prompt
        logger.info("Testing code review prompt")
        prompt = code_review_prompt(server, SAMPLE_PYTHON_FUNCTION, "python")
        logger.info(f"Code review prompt: {prompt[:100]}...")  # Show first 100 chars

        # Test code optimization prompt
        logger.info("Testing code optimization prompt")
        prompt = code_optimization_prompt(server, SAMPLE_PYTHON_FUNCTION, "python", "performance")
        logger.info(f"Code optimization prompt: {prompt[:100]}...")  # Show first 100 chars

        # Test security review prompt
        logger.info("Testing security review prompt")
        prompt = security_review_prompt(server, SAMPLE_PYTHON_FUNCTION, "python")
        logger.info(f"Security review prompt: {prompt[:100]}...")  # Show first 100 chars

        # Test test generation prompt
        logger.info("Testing test generation prompt")
        prompt = test_generation_prompt(server, SAMPLE_PYTHON_FUNCTION, "python", "pytest")
        logger.info(f"Test generation prompt: {prompt[:100]}...")  # Show first 100 chars

        # Test language support directly
        logger.info("Testing language support directly")

        # Test Python support
        logger.info("Testing Python support")
        python_format_result = python_support.format_code(SAMPLE_PYTHON_CODE)
        logger.info(f"Python format result: {python_format_result[:100]}...")  # Show first 100 chars

        python_analyze_result = python_support.analyze_code(SAMPLE_PYTHON_CODE_WITH_ISSUES)
        logger.info(f"Python analyze result: {python_analyze_result.metrics}")

        # Test JavaScript support
        logger.info("Testing JavaScript support")
        js_code = "function test() { console.log('Hello'); }"
        js_format_result = javascript_support.format_code(js_code)
        logger.info(f"JavaScript format result: {js_format_result}")

        js_analyze_result = javascript_support.analyze_code(js_code)
        logger.info(f"JavaScript analyze result: {js_analyze_result.metrics}")

        # Test TypeScript support
        logger.info("Testing TypeScript support")
        ts_code = "function test(): void { console.log('Hello'); }"
        ts_format_result = typescript_support.format_code(ts_code)
        logger.info(f"TypeScript format result: {ts_format_result}")

        ts_analyze_result = typescript_support.analyze_code(ts_code)
        logger.info(f"TypeScript analyze result: {ts_analyze_result.metrics}")

        # Test Java support
        logger.info("Testing Java support")
        java_code = "public class Test { public static void main(String[] args) { System.out.println(\"Hello\"); } }"
        java_format_result = java_support.format_code(java_code)
        logger.info(f"Java format result: {java_format_result}")

        java_analyze_result = java_support.analyze_code(java_code)
        logger.info(f"Java analyze result: {java_analyze_result.metrics}")

        logger.info("All tests completed successfully")
        return True
    except Exception as e:
        import traceback
        logger.error(f"Error testing server: {e}")
        logger.error(f"Exception type: {type(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def main():
    """Main function."""
    success = asyncio.run(test_server())
    if not success:
        logger.error("Tests failed")
        sys.exit(1)

    logger.info("All tests passed successfully")

if __name__ == "__main__":
    main()
