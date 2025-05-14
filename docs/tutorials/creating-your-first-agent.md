# Tutorial: Creating Your First Agent

## Introduction

This tutorial will guide you through the process of creating your first agent in the Nexus MCP Hub. By the end of this tutorial, you'll have a functional agent that can perform specific tasks using one or more MCP servers.

![Agent Creation Workflow](../assets/images/agent-creation-workflow.svg)

## Prerequisites

Before you begin, make sure you have:

1. Installed and configured the Nexus MCP Hub
2. Registered at least one MCP server
3. Basic understanding of the Nexus MCP Hub architecture

## Step 1: Define Your Agent's Purpose

The first step in creating an agent is to clearly define its purpose. This will help you determine the capabilities it needs and the MCP servers it should use.

For this tutorial, we'll create a simple coding assistant agent that can:

- Generate code based on descriptions
- Explain existing code
- Answer programming questions

## Step 2: Choose MCP Servers

Based on the agent's purpose, we need to select appropriate MCP servers. For our coding assistant, we'll use:

1. **Ollama MCP**: For language model capabilities
2. **Code Sandbox**: For executing and testing code

Make sure these servers are registered with your Nexus MCP Hub:

```bash
# Check registered servers
curl -X GET http://localhost:3000/api/mcp-servers -H "Authorization: Bearer your-token"
```

If the servers are not registered, you can register them:

```bash
# Register Ollama MCP
curl -X POST http://localhost:3000/api/mcp-servers -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "id": "ollama-mcp",
  "name": "Ollama MCP",
  "description": "Language model inference through Ollama",
  "url": "http://localhost",
  "port": 3011,
  "transport": "http",
  "capabilities": ["text-generation", "code-generation"]
}'

# Register Code Sandbox
curl -X POST http://localhost:3000/api/mcp-servers -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "id": "code-sandbox",
  "name": "Code Sandbox",
  "description": "Code execution in a sandboxed environment",
  "transport": "stdio",
  "capabilities": ["code-execution"]
}'
```

## Step 3: Configure Agent Parameters

Now, let's configure the parameters for our agent. We'll create a configuration file named `coding-assistant-config.json`:

```json
{
  "id": "coding-assistant",
  "name": "CodingAssistant",
  "description": "A simple coding assistant for generating and explaining code",
  "type": "coding",
  "model": "llama3:8b",
  "mcpServers": ["ollama-mcp", "code-sandbox"],
  "capabilities": [
    "code-generation",
    "code-explanation",
    "programming-help"
  ],
  "parameters": {
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 0.95
  }
}
```

This configuration specifies:

- A unique ID and name for the agent
- The agent type (coding)
- The model to use (Llama 3 8B)
- The MCP servers to use
- The agent's capabilities
- Model parameters for generation

## Step 4: Create the Agent

Now, let's create the agent using the API:

```bash
# Create the agent
curl -X POST http://localhost:3000/api/agents -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d @coding-assistant-config.json
```

Alternatively, you can use the Nexus MCP Hub web interface:

1. Navigate to the Agents page
2. Click "Create New Agent"
3. Fill in the form with the values from our configuration
4. Click "Create Agent"

## Step 5: Test the Agent

Let's test our agent with a simple task:

```bash
# Create a task
curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "agentId": "coding-assistant",
  "input": "Write a Python function to calculate the factorial of a number"
}'
```

This will return a task ID:

```json
{
  "id": "task-123456",
  "agentId": "coding-assistant",
  "status": "created"
}
```

You can check the task status:

```bash
# Check task status
curl -X GET http://localhost:3000/api/tasks/task-123456 -H "Authorization: Bearer your-token"
```

Once the task is completed, you'll see the result:

```json
{
  "id": "task-123456",
  "agentId": "coding-assistant",
  "status": "completed",
  "createdAt": "2023-06-18T14:30:00Z",
  "completedAt": "2023-06-18T14:32:00Z",
  "input": "Write a Python function to calculate the factorial of a number",
  "output": "```python\ndef factorial(n):\n    \"\"\"\n    Calculate the factorial of a number.\n    \n    Args:\n        n (int): The number to calculate factorial for\n        \n    Returns:\n        int: The factorial of n\n    \"\"\"\n    if n < 0:\n        raise ValueError(\"Factorial is not defined for negative numbers\")\n    if n == 0 or n == 1:\n        return 1\n    else:\n        return n * factorial(n - 1)\n\n# Example usage\nprint(factorial(5))  # Output: 120\n```\n\nThis function calculates the factorial of a number using recursion. The factorial of a number n is the product of all positive integers less than or equal to n. For example, factorial of 5 is 5 * 4 * 3 * 2 * 1 = 120.\n\nThe function includes:\n- Error handling for negative numbers\n- Base cases for 0 and 1 (factorial of both is 1)\n- Recursive calculation for other numbers\n\nYou can also implement this iteratively to avoid potential stack overflow for large numbers:\n\n```python\ndef factorial_iterative(n):\n    \"\"\"\n    Calculate the factorial of a number iteratively.\n    \n    Args:\n        n (int): The number to calculate factorial for\n        \n    Returns:\n        int: The factorial of n\n    \"\"\"\n    if n < 0:\n        raise ValueError(\"Factorial is not defined for negative numbers\")\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    return result\n```"
}
```

## Step 6: Execute Code with the Agent

Let's test the agent's ability to execute code:

```bash
# Create a task to execute code
curl -X POST http://localhost:3000/api/tasks -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "agentId": "coding-assistant",
  "input": "Write a Python function to calculate the factorial of 5 and execute it"
}'
```

The agent will:
1. Generate the factorial function
2. Use the Code Sandbox MCP server to execute it
3. Return the result

## Step 7: Customize the Agent

Now that you have a basic agent working, you can customize it further:

### Adjust Model Parameters

You can adjust the model parameters to change the agent's behavior:

```bash
# Update agent parameters
curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "parameters": {
    "temperature": 0.5,
    "maxTokens": 8192,
    "topP": 0.9
  }
}'
```

Lower temperature values (e.g., 0.2-0.5) will make the agent more deterministic and focused, while higher values (e.g., 0.7-1.0) will make it more creative.

### Add More Capabilities

You can add more capabilities to your agent by updating its configuration:

```bash
# Update agent capabilities
curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "capabilities": [
    "code-generation",
    "code-explanation",
    "programming-help",
    "code-review",
    "code-refactoring"
  ]
}'
```

### Change the Model

You can change the model used by the agent:

```bash
# Update agent model
curl -X PUT http://localhost:3000/api/agents/coding-assistant -H "Content-Type: application/json" -H "Authorization: Bearer your-token" -d '{
  "model": "llama3:70b"
}'
```

## Step 8: Create a Web Interface

To make it easier to interact with your agent, you can create a simple web interface. Here's a basic HTML/JavaScript example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        #input {
            width: 100%;
            height: 100px;
            margin-bottom: 10px;
        }
        #output {
            width: 100%;
            height: 300px;
            background-color: #f5f5f5;
            padding: 10px;
            border: 1px solid #ddd;
            overflow: auto;
            white-space: pre-wrap;
        }
        button {
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Coding Assistant</h1>
    <textarea id="input" placeholder="Enter your coding question or task here..."></textarea>
    <button onclick="submitTask()">Submit</button>
    <div id="status"></div>
    <pre id="output"></pre>

    <script>
        const API_URL = 'http://localhost:3000/api';
        const TOKEN = 'your-token';

        async function submitTask() {
            const input = document.getElementById('input').value;
            const status = document.getElementById('status');
            const output = document.getElementById('output');

            if (!input) {
                alert('Please enter a task');
                return;
            }

            status.textContent = 'Creating task...';
            output.textContent = '';

            try {
                // Create task
                const taskResponse = await fetch(`${API_URL}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify({
                        agentId: 'coding-assistant',
                        input: input
                    })
                });

                const taskData = await taskResponse.json();
                const taskId = taskData.id;

                status.textContent = `Task created (ID: ${taskId}). Waiting for completion...`;

                // Poll for task completion
                let completed = false;
                while (!completed) {
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const statusResponse = await fetch(`${API_URL}/tasks/${taskId}`, {
                        headers: {
                            'Authorization': `Bearer ${TOKEN}`
                        }
                    });

                    const statusData = await statusResponse.json();

                    if (statusData.status === 'completed') {
                        status.textContent = 'Task completed!';
                        output.textContent = statusData.output;
                        completed = true;
                    } else if (statusData.status === 'failed') {
                        status.textContent = 'Task failed!';
                        output.textContent = statusData.error || 'Unknown error';
                        completed = true;
                    }
                }
            } catch (error) {
                status.textContent = 'Error!';
                output.textContent = error.message;
            }
        }
    </script>
</body>
</html>
```

Save this as `coding-assistant.html` and open it in a web browser. Make sure to replace `'your-token'` with your actual API token.

## Step 9: Integrate with Development Tools

To make your agent even more useful, you can integrate it with development tools like VS Code:

1. Install the Nexus MCP Hub VS Code extension
2. Configure the extension with your API token
3. Select your coding assistant agent
4. Use the extension to send code snippets to your agent
5. View the agent's responses directly in VS Code

## Conclusion

Congratulations! You've created your first agent in the Nexus MCP Hub. This simple coding assistant can help you generate code, explain code, and answer programming questions.

As you become more familiar with the Nexus MCP Hub, you can create more sophisticated agents with additional capabilities and integrations.

## Next Steps

- [Learn about different agent types](../agents/agent-types.md)
- [Explore MCP server types](../mcp-servers/server-types.md)
- [Understand agent workflows](../workflows/overview.md)
- [Secure your agents](../security/best-practices.md)
