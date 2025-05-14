# API Client Examples

This document provides examples of how to interact with the Nexus MCP Hub API using various programming languages. These examples demonstrate common operations such as authentication, managing MCP servers, creating agents, and executing tasks.

## Table of Contents

1. [JavaScript/TypeScript](#javascripttypescript)
2. [Python](#python)
3. [Java](#java)
4. [Go](#go)
5. [C#](#c)
6. [Ruby](#ruby)
7. [PHP](#php)
8. [Rust](#rust)

## JavaScript/TypeScript

### Using the Official Client Library

The official JavaScript/TypeScript client library provides a convenient way to interact with the Nexus MCP Hub API.

#### Installation

```bash
npm install @nexus-mcp/client
```

#### Basic Usage

```javascript
const { NexusClient } = require('@nexus-mcp/client');

// Create a client instance
const client = new NexusClient({
  baseUrl: 'http://localhost:3000/api',
  token: 'your-jwt-token'
});

// Example: List all MCP servers
async function listMcpServers() {
  try {
    const servers = await client.mcpServers.list();
    console.log('MCP Servers:', servers);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Create an agent
async function createAgent() {
  try {
    const agent = await client.agents.create({
      id: 'coding-assistant',
      name: 'CodingAssistant',
      description: 'A coding assistant agent',
      type: 'coding',
      model: 'llama3:8b',
      mcpServers: ['ollama-mcp'],
      capabilities: ['code-generation', 'code-explanation']
    });
    console.log('Agent created:', agent);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Create and wait for a task
async function executeTask() {
  try {
    const task = await client.tasks.create({
      agentId: 'coding-assistant',
      input: 'Write a JavaScript function to calculate the factorial of a number'
    });
    console.log('Task created:', task);

    // Wait for task completion
    const result = await client.tasks.waitForCompletion(task.id);
    console.log('Task result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples
listMcpServers();
createAgent();
executeTask();
```

#### TypeScript Example

```typescript
import { NexusClient, Agent, Task, McpServer } from '@nexus-mcp/client';

// Create a client instance
const client = new NexusClient({
  baseUrl: 'http://localhost:3000/api',
  token: 'your-jwt-token'
});

// Example: List all MCP servers
async function listMcpServers(): Promise<void> {
  try {
    const servers: McpServer[] = await client.mcpServers.list();
    console.log('MCP Servers:', servers);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Create an agent
async function createAgent(): Promise<void> {
  try {
    const agent: Agent = await client.agents.create({
      id: 'coding-assistant',
      name: 'CodingAssistant',
      description: 'A coding assistant agent',
      type: 'coding',
      model: 'llama3:8b',
      mcpServers: ['ollama-mcp'],
      capabilities: ['code-generation', 'code-explanation']
    });
    console.log('Agent created:', agent);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example: Create and wait for a task
async function executeTask(): Promise<void> {
  try {
    const task: Task = await client.tasks.create({
      agentId: 'coding-assistant',
      input: 'Write a TypeScript function to calculate the factorial of a number'
    });
    console.log('Task created:', task);

    // Wait for task completion
    const result: Task = await client.tasks.waitForCompletion(task.id);
    console.log('Task result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run examples
listMcpServers();
createAgent();
executeTask();
```

### Using Fetch API

If you prefer not to use the client library, you can use the Fetch API directly:

```javascript
// Authentication
async function login(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  return data.token;
}

// List MCP servers
async function listMcpServers(token) {
  const response = await fetch('http://localhost:3000/api/mcp-servers', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Create an agent
async function createAgent(token, agent) {
  const response = await fetch('http://localhost:3000/api/agents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(agent)
  });
  
  return await response.json();
}

// Create a task
async function createTask(token, task) {
  const response = await fetch('http://localhost:3000/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  });
  
  return await response.json();
}

// Get task status
async function getTask(token, taskId) {
  const response = await fetch(`http://localhost:3000/api/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}

// Example usage
async function main() {
  try {
    // Login
    const token = await login('admin', 'password');
    console.log('Token:', token);
    
    // List MCP servers
    const servers = await listMcpServers(token);
    console.log('MCP Servers:', servers);
    
    // Create an agent
    const agent = await createAgent(token, {
      id: 'coding-assistant',
      name: 'CodingAssistant',
      description: 'A coding assistant agent',
      type: 'coding',
      model: 'llama3:8b',
      mcpServers: ['ollama-mcp'],
      capabilities: ['code-generation', 'code-explanation']
    });
    console.log('Agent created:', agent);
    
    // Create a task
    const task = await createTask(token, {
      agentId: 'coding-assistant',
      input: 'Write a JavaScript function to calculate the factorial of a number'
    });
    console.log('Task created:', task);
    
    // Poll for task completion
    let completed = false;
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const taskStatus = await getTask(token, task.id);
      if (taskStatus.status === 'completed' || taskStatus.status === 'failed') {
        console.log('Task result:', taskStatus);
        completed = true;
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Python

### Using the Official Client Library

The official Python client library provides a convenient way to interact with the Nexus MCP Hub API.

#### Installation

```bash
pip install nexus-mcp-client
```

#### Basic Usage

```python
from nexus_mcp_client import NexusClient

# Create a client instance
client = NexusClient(
    base_url='http://localhost:3000/api',
    token='your-jwt-token'
)

# Example: List all MCP servers
def list_mcp_servers():
    try:
        servers = client.mcp_servers.list()
        print('MCP Servers:', servers)
    except Exception as e:
        print('Error:', str(e))

# Example: Create an agent
def create_agent():
    try:
        agent = client.agents.create({
            'id': 'coding-assistant',
            'name': 'CodingAssistant',
            'description': 'A coding assistant agent',
            'type': 'coding',
            'model': 'llama3:8b',
            'mcpServers': ['ollama-mcp'],
            'capabilities': ['code-generation', 'code-explanation']
        })
        print('Agent created:', agent)
    except Exception as e:
        print('Error:', str(e))

# Example: Create and wait for a task
def execute_task():
    try:
        task = client.tasks.create({
            'agentId': 'coding-assistant',
            'input': 'Write a Python function to calculate the factorial of a number'
        })
        print('Task created:', task)

        # Wait for task completion
        result = client.tasks.wait_for_completion(task['id'])
        print('Task result:', result)
    except Exception as e:
        print('Error:', str(e))

# Run examples
if __name__ == '__main__':
    list_mcp_servers()
    create_agent()
    execute_task()
```

### Using Requests Library

If you prefer not to use the client library, you can use the Requests library directly:

```python
import requests
import time

# Base URL
BASE_URL = 'http://localhost:3000/api'

# Authentication
def login(username, password):
    response = requests.post(f'{BASE_URL}/auth/login', json={
        'username': username,
        'password': password
    })
    data = response.json()
    return data['token']

# List MCP servers
def list_mcp_servers(token):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/mcp-servers', headers=headers)
    return response.json()

# Create an agent
def create_agent(token, agent):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    response = requests.post(f'{BASE_URL}/agents', json=agent, headers=headers)
    return response.json()

# Create a task
def create_task(token, task):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    response = requests.post(f'{BASE_URL}/tasks', json=task, headers=headers)
    return response.json()

# Get task status
def get_task(token, task_id):
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f'{BASE_URL}/tasks/{task_id}', headers=headers)
    return response.json()

# Example usage
def main():
    try:
        # Login
        token = login('admin', 'password')
        print('Token:', token)
        
        # List MCP servers
        servers = list_mcp_servers(token)
        print('MCP Servers:', servers)
        
        # Create an agent
        agent = create_agent(token, {
            'id': 'coding-assistant',
            'name': 'CodingAssistant',
            'description': 'A coding assistant agent',
            'type': 'coding',
            'model': 'llama3:8b',
            'mcpServers': ['ollama-mcp'],
            'capabilities': ['code-generation', 'code-explanation']
        })
        print('Agent created:', agent)
        
        # Create a task
        task = create_task(token, {
            'agentId': 'coding-assistant',
            'input': 'Write a Python function to calculate the factorial of a number'
        })
        print('Task created:', task)
        
        # Poll for task completion
        completed = False
        while not completed:
            time.sleep(1)
            
            task_status = get_task(token, task['id'])
            if task_status['status'] in ['completed', 'failed']:
                print('Task result:', task_status)
                completed = True
    except Exception as e:
        print('Error:', str(e))

if __name__ == '__main__':
    main()
```

## Java

### Using the Official Client Library

The official Java client library provides a convenient way to interact with the Nexus MCP Hub API.

#### Installation

Add the dependency to your Maven `pom.xml`:

```xml
<dependency>
    <groupId>io.nexusmcp</groupId>
    <artifactId>nexus-mcp-client</artifactId>
    <version>1.0.0</version>
</dependency>
```

Or to your Gradle `build.gradle`:

```groovy
implementation 'io.nexusmcp:nexus-mcp-client:1.0.0'
```

#### Basic Usage

```java
import io.nexusmcp.client.NexusClient;
import io.nexusmcp.client.models.Agent;
import io.nexusmcp.client.models.McpServer;
import io.nexusmcp.client.models.Task;

import java.util.Arrays;
import java.util.List;

public class NexusExample {
    public static void main(String[] args) {
        // Create a client instance
        NexusClient client = new NexusClient.Builder()
                .baseUrl("http://localhost:3000/api")
                .token("your-jwt-token")
                .build();

        // List MCP servers
        listMcpServers(client);
        
        // Create an agent
        createAgent(client);
        
        // Execute a task
        executeTask(client);
    }

    // Example: List all MCP servers
    private static void listMcpServers(NexusClient client) {
        try {
            List<McpServer> servers = client.mcpServers().list();
            System.out.println("MCP Servers: " + servers);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    // Example: Create an agent
    private static void createAgent(NexusClient client) {
        try {
            Agent agent = new Agent.Builder()
                    .id("coding-assistant")
                    .name("CodingAssistant")
                    .description("A coding assistant agent")
                    .type("coding")
                    .model("llama3:8b")
                    .mcpServers(Arrays.asList("ollama-mcp"))
                    .capabilities(Arrays.asList("code-generation", "code-explanation"))
                    .build();
            
            Agent createdAgent = client.agents().create(agent);
            System.out.println("Agent created: " + createdAgent);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }

    // Example: Create and wait for a task
    private static void executeTask(NexusClient client) {
        try {
            Task task = new Task.Builder()
                    .agentId("coding-assistant")
                    .input("Write a Java function to calculate the factorial of a number")
                    .build();
            
            Task createdTask = client.tasks().create(task);
            System.out.println("Task created: " + createdTask);
            
            // Wait for task completion
            Task result = client.tasks().waitForCompletion(createdTask.getId());
            System.out.println("Task result: " + result);
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
```

## Go

### Using the Official Client Library

The official Go client library provides a convenient way to interact with the Nexus MCP Hub API.

#### Installation

```bash
go get github.com/nexusmcphub/nexus-mcp-client-go
```

#### Basic Usage

```go
package main

import (
	"fmt"
	"log"

	nexus "github.com/nexusmcphub/nexus-mcp-client-go"
)

func main() {
	// Create a client instance
	client, err := nexus.NewClient(nexus.ClientOptions{
		BaseURL: "http://localhost:3000/api",
		Token:   "your-jwt-token",
	})
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// List MCP servers
	listMcpServers(client)

	// Create an agent
	createAgent(client)

	// Execute a task
	executeTask(client)
}

// Example: List all MCP servers
func listMcpServers(client *nexus.Client) {
	servers, err := client.MCPServers.List()
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	fmt.Printf("MCP Servers: %+v\n", servers)
}

// Example: Create an agent
func createAgent(client *nexus.Client) {
	agent := nexus.Agent{
		ID:          "coding-assistant",
		Name:        "CodingAssistant",
		Description: "A coding assistant agent",
		Type:        "coding",
		Model:       "llama3:8b",
		MCPServers:  []string{"ollama-mcp"},
		Capabilities: []string{
			"code-generation",
			"code-explanation",
		},
	}

	createdAgent, err := client.Agents.Create(agent)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	fmt.Printf("Agent created: %+v\n", createdAgent)
}

// Example: Create and wait for a task
func executeTask(client *nexus.Client) {
	task := nexus.Task{
		AgentID: "coding-assistant",
		Input:   "Write a Go function to calculate the factorial of a number",
	}

	createdTask, err := client.Tasks.Create(task)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	fmt.Printf("Task created: %+v\n", createdTask)

	// Wait for task completion
	result, err := client.Tasks.WaitForCompletion(createdTask.ID)
	if err != nil {
		log.Printf("Error: %v", err)
		return
	}
	fmt.Printf("Task result: %+v\n", result)
}
```

## Additional Languages

For examples in other programming languages (C#, Ruby, PHP, Rust), please refer to the [API Client Examples Repository](https://github.com/nexusmcphub/nexus-client-examples).

## WebSocket API Examples

### JavaScript WebSocket Example

```javascript
// Create WebSocket connection
const socket = new WebSocket('ws://localhost:3000/api/ws?token=your-jwt-token');

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('Connected to Nexus MCP Hub WebSocket');
  
  // Subscribe to events
  socket.send(JSON.stringify({
    command: 'subscribe',
    events: ['server_status', 'agent_status', 'task_status']
  }));
});

// Listen for messages
socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('Message from server:', data);
  
  // Handle different event types
  switch (data.type) {
    case 'server_status':
      console.log(`Server ${data.data.id} status: ${data.data.status}`);
      break;
    case 'agent_status':
      console.log(`Agent ${data.data.id} status: ${data.data.status}`);
      break;
    case 'task_status':
      console.log(`Task ${data.data.id} status: ${data.data.status}`);
      if (data.data.status === 'completed') {
        console.log('Task output:', data.data.output);
      }
      break;
    default:
      console.log('Unknown event type:', data.type);
  }
});

// Connection closed
socket.addEventListener('close', (event) => {
  console.log('Disconnected from Nexus MCP Hub WebSocket');
});

// Connection error
socket.addEventListener('error', (event) => {
  console.error('WebSocket error:', event);
});
```

### Python WebSocket Example

```python
import websocket
import json
import threading
import time

# WebSocket URL with token
ws_url = 'ws://localhost:3000/api/ws?token=your-jwt-token'

# Define callback functions
def on_message(ws, message):
    data = json.loads(message)
    print('Message from server:', data)
    
    # Handle different event types
    if data['type'] == 'server_status':
        print(f"Server {data['data']['id']} status: {data['data']['status']}")
    elif data['type'] == 'agent_status':
        print(f"Agent {data['data']['id']} status: {data['data']['status']}")
    elif data['type'] == 'task_status':
        print(f"Task {data['data']['id']} status: {data['data']['status']}")
        if data['data']['status'] == 'completed':
            print('Task output:', data['data']['output'])
    else:
        print('Unknown event type:', data['type'])

def on_error(ws, error):
    print('Error:', error)

def on_close(ws, close_status_code, close_msg):
    print('Disconnected from Nexus MCP Hub WebSocket')

def on_open(ws):
    print('Connected to Nexus MCP Hub WebSocket')
    
    # Subscribe to events
    ws.send(json.dumps({
        'command': 'subscribe',
        'events': ['server_status', 'agent_status', 'task_status']
    }))

# Create WebSocket connection
ws = websocket.WebSocketApp(ws_url,
                            on_open=on_open,
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)

# Run WebSocket connection in a separate thread
wst = threading.Thread(target=ws.run_forever)
wst.daemon = True
wst.start()

# Keep the main thread running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    ws.close()
```

## Next Steps

- [API Reference](reference.md)
- [Tutorials](../tutorials/creating-your-first-agent.md)
- [Troubleshooting](../troubleshooting/common-issues.md)
