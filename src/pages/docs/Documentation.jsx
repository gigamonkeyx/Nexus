import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
  InputAdornment,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Search as SearchIcon,
  Book as BookIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  SmartToy as SmartToyIcon,
  Task as TaskIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

/**
 * Documentation page component
 * Displays documentation for the Nexus MCP Hub
 */
const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedDoc, setSelectedDoc] = useState('introduction');

  // Mock data for documentation categories
  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: <BookIcon />,
      docs: [
        {
          id: 'introduction',
          name: 'Introduction',
          content: `
# Introduction to Nexus MCP Hub

Nexus MCP Hub is a central management system for Model Context Protocol (MCP) servers. It provides a unified interface for managing and interacting with various AI services through the MCP standard.

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol for AI model interactions. It defines how AI models and services communicate with each other and with client applications.

## Key Features

- **Centralized Management**: Manage all your MCP servers from a single interface
- **Agent Creation**: Build and deploy AI agents with specific capabilities
- **Task Management**: Assign and monitor tasks for your agents
- **Benchmarking**: Evaluate agent performance with standardized benchmarks
- **Integration**: Connect with various AI services and tools

## Getting Started

To get started with Nexus MCP Hub, follow these steps:

1. Install the Nexus MCP Hub
2. Connect your MCP servers
3. Create your first agent
4. Run a task

For more detailed instructions, check out the [Installation Guide](installation) and [Quick Start Guide](quick-start).
          `,
        },
        {
          id: 'installation',
          name: 'Installation',
          content: `
# Installation Guide

This guide will walk you through the process of installing and setting up Nexus MCP Hub.

## System Requirements

- Node.js 16.x or higher
- npm 8.x or higher
- 4GB RAM minimum (8GB recommended)
- 1GB free disk space

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/nexus-mcp-hub.git
cd nexus-mcp-hub
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment

Create a \`.env\` file in the root directory with the following content:

\`\`\`
PORT=3000
NODE_ENV=development
\`\`\`

### 4. Start the Application

\`\`\`bash
npm start
\`\`\`

The application should now be running at \`http://localhost:3000\`.

## Next Steps

After installation, you should:

1. [Connect your MCP servers](../mcp-servers/connecting)
2. [Create your first agent](../agents/creating)
3. [Run a task](../tasks/creating)

For troubleshooting, see the [Troubleshooting Guide](troubleshooting).
          `,
        },
        {
          id: 'quick-start',
          name: 'Quick Start Guide',
          content: `
# Quick Start Guide

This guide will help you get up and running with Nexus MCP Hub quickly.

## Prerequisites

Make sure you have:

- Installed Nexus MCP Hub (see [Installation Guide](installation))
- At least one MCP server running

## Step 1: Connect to MCP Servers

1. Go to the MCP Servers page
2. Click "Add Server"
3. Enter the server details:
   - Name: A descriptive name for the server
   - URL: The server URL (e.g., http://localhost)
   - Port: The server port (e.g., 3020)
   - Type: The server type (e.g., LLM, Image Generation)
4. Click "Add"

## Step 2: Create an Agent

1. Go to the Agents page
2. Click "Create Agent"
3. Enter the agent details:
   - Name: A name for your agent
   - Description: What the agent does
   - Type: The agent type
   - Model: The AI model to use
4. Configure the agent capabilities
5. Click "Create"

## Step 3: Run a Task

1. Go to the Tasks page
2. Click "Create Task"
3. Enter the task details:
   - Name: A name for the task
   - Description: What the task should accomplish
   - Agent: Select the agent to run the task
   - Input: The task input
4. Click "Create"
5. Click "Run" to start the task

## Next Steps

Congratulations! You've completed the basic workflow of Nexus MCP Hub. Next, you can:

- Explore more advanced agent configurations
- Set up benchmarks to evaluate agent performance
- Integrate with other tools and services

For more detailed information, check out the specific documentation sections.
          `,
        },
      ],
    },
    {
      id: 'mcp-servers',
      name: 'MCP Servers',
      icon: <StorageIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# MCP Servers Overview

MCP (Model Context Protocol) servers are the foundation of the Nexus MCP Hub ecosystem. They provide standardized interfaces for AI models and services.

## What is an MCP Server?

An MCP server is a service that implements the Model Context Protocol, allowing it to communicate with the Nexus MCP Hub and other MCP-compatible clients. Each server typically provides a specific capability, such as:

- Language model inference
- Image generation
- Database access
- File system operations
- Terminal access
- Memory management

## Supported MCP Servers

Nexus MCP Hub supports various MCP servers, including:

- **Ollama MCP**: For local LLM inference
- **ComfyUI MCP**: For image generation
- **Supabase MCP**: For database operations
- **Terminal MCP**: For terminal access
- **Memory Server**: For memory management
- **File Explorer**: For file system operations
- **Code Sandbox**: For code execution

## Server Management

The MCP Servers page in Nexus MCP Hub provides a central interface for:

- Adding new servers
- Monitoring server status
- Starting and stopping servers
- Configuring server settings

## Next Steps

To learn more about working with MCP servers, check out:

- [Connecting MCP Servers](connecting)
- [Server Configuration](configuration)
- [Troubleshooting](troubleshooting)
          `,
        },
      ],
    },
    {
      id: 'agents',
      name: 'Agents',
      icon: <SmartToyIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# Agents Overview

Agents are the core components of the Nexus MCP Hub that perform tasks and interact with users and other systems.

## What is an Agent?

An agent is an AI entity that can perform specific tasks based on its capabilities and configuration. Agents in Nexus MCP Hub are built on top of MCP servers and can combine multiple capabilities to achieve complex goals.

## Agent Capabilities

Agents can have various capabilities, including:

- **Code Generation**: Writing and modifying code
- **Data Analysis**: Analyzing and visualizing data
- **Content Creation**: Generating text, images, and other content
- **Research**: Finding and synthesizing information
- **Task Automation**: Automating repetitive tasks

## Agent Types

Nexus MCP Hub supports different types of agents:

- **Coding Agents**: Specialized in code-related tasks
- **Data Agents**: Focused on data processing and analysis
- **Content Agents**: Designed for content creation
- **Research Agents**: Optimized for information gathering
- **Support Agents**: Built for user assistance

## Agent Lifecycle

Agents go through several stages:

1. **Creation**: Defining the agent's capabilities and configuration
2. **Training**: Fine-tuning the agent for specific tasks (if applicable)
3. **Deployment**: Making the agent available for use
4. **Execution**: Running tasks with the agent
5. **Evaluation**: Assessing the agent's performance
6. **Improvement**: Updating the agent based on feedback

## Next Steps

To learn more about working with agents, check out:

- [Creating Agents](creating)
- [Agent Configuration](configuration)
- [Running Agents](running)
- [Evaluating Agents](evaluating)
          `,
        },
      ],
    },
    {
      id: 'tasks',
      name: 'Tasks',
      icon: <TaskIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# Tasks Overview

Tasks are the work units that agents perform in the Nexus MCP Hub.

## What is a Task?

A task is a specific piece of work assigned to an agent. It includes:

- A clear objective
- Input data or instructions
- The agent assigned to perform it
- Output expectations

## Task Types

Tasks can vary widely depending on the agent's capabilities:

- **Code Tasks**: Writing, reviewing, or debugging code
- **Data Tasks**: Analyzing data, generating reports
- **Content Tasks**: Creating text, images, or other content
- **Research Tasks**: Finding and summarizing information
- **Automation Tasks**: Performing automated workflows

## Task Lifecycle

Tasks go through several stages:

1. **Creation**: Defining the task parameters
2. **Assignment**: Assigning the task to an agent
3. **Execution**: Running the task
4. **Completion**: Finishing the task and producing output
5. **Review**: Evaluating the task results

## Task Status

Tasks can have different statuses:

- **Pending**: Created but not yet started
- **Running**: Currently being executed
- **Completed**: Successfully finished
- **Failed**: Encountered an error
- **Cancelled**: Stopped before completion

## Next Steps

To learn more about working with tasks, check out:

- [Creating Tasks](creating)
- [Task Configuration](configuration)
- [Monitoring Tasks](monitoring)
- [Troubleshooting](troubleshooting)
          `,
        },
      ],
    },
    {
      id: 'benchmarks',
      name: 'Benchmarks',
      icon: <SpeedIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# Benchmarks Overview

Benchmarks are standardized tests used to evaluate agent performance in the Nexus MCP Hub.

## What is a Benchmark?

A benchmark is a set of standardized tasks designed to measure an agent's capabilities in specific areas. Benchmarks provide objective metrics for comparing different agents and tracking improvements over time.

## Benchmark Types

Nexus MCP Hub supports various benchmark types:

- **HumanEval**: Evaluates code generation capabilities
- **CodeXGLUE**: Assesses code understanding and generation
- **τ-bench**: Tests reasoning capabilities
- **AgentBench**: Measures agent decision-making
- **MLE-bench**: Evaluates machine learning capabilities

## Benchmark Metrics

Benchmarks typically measure:

- **Accuracy**: Correctness of outputs
- **Precision**: Exactness of outputs
- **Recall**: Completeness of outputs
- **F1 Score**: Balance between precision and recall
- **Execution Time**: Performance speed
- **Resource Usage**: Efficiency

## Benchmark Lifecycle

Benchmarks go through several stages:

1. **Setup**: Configuring the benchmark parameters
2. **Agent Selection**: Choosing which agents to evaluate
3. **Execution**: Running the benchmark tests
4. **Analysis**: Calculating performance metrics
5. **Reporting**: Generating benchmark reports

## Next Steps

To learn more about working with benchmarks, check out:

- [Running Benchmarks](running)
- [Benchmark Configuration](configuration)
- [Interpreting Results](interpreting)
- [Custom Benchmarks](custom)
          `,
        },
      ],
    },
    {
      id: 'api',
      name: 'API Reference',
      icon: <CodeIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# API Reference Overview

The Nexus MCP Hub provides a comprehensive API for programmatic interaction with the system.

## API Basics

The API follows RESTful principles and uses JSON for data exchange. All endpoints are prefixed with \`/api/v1\`.

### Authentication

API requests require authentication using JWT tokens. To obtain a token:

\`\`\`
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
\`\`\`

Include the token in subsequent requests:

\`\`\`
Authorization: Bearer <token>
\`\`\`

### Error Handling

API errors follow a standard format:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

## API Endpoints

The API is organized into the following categories:

### Agents API

- \`GET /api/v1/agents\`: List all agents
- \`GET /api/v1/agents/:id\`: Get agent details
- \`POST /api/v1/agents\`: Create a new agent
- \`PUT /api/v1/agents/:id\`: Update an agent
- \`DELETE /api/v1/agents/:id\`: Delete an agent

### Tasks API

- \`GET /api/v1/tasks\`: List all tasks
- \`GET /api/v1/tasks/:id\`: Get task details
- \`POST /api/v1/tasks\`: Create a new task
- \`PUT /api/v1/tasks/:id\`: Update a task
- \`DELETE /api/v1/tasks/:id\`: Delete a task
- \`POST /api/v1/tasks/:id/run\`: Run a task

### MCP Servers API

- \`GET /api/v1/mcp-servers\`: List all MCP servers
- \`GET /api/v1/mcp-servers/:id\`: Get server details
- \`POST /api/v1/mcp-servers\`: Add a new server
- \`PUT /api/v1/mcp-servers/:id\`: Update a server
- \`DELETE /api/v1/mcp-servers/:id\`: Delete a server

### Benchmarks API

- \`GET /api/v1/benchmarks\`: List all benchmarks
- \`GET /api/v1/benchmarks/:id\`: Get benchmark details
- \`POST /api/v1/benchmarks\`: Create a new benchmark
- \`PUT /api/v1/benchmarks/:id\`: Update a benchmark
- \`DELETE /api/v1/benchmarks/:id\`: Delete a benchmark
- \`POST /api/v1/benchmarks/:id/run\`: Run a benchmark

## Next Steps

For detailed information about specific endpoints, check out:

- [Agents API](agents)
- [Tasks API](tasks)
- [MCP Servers API](mcp-servers)
- [Benchmarks API](benchmarks)
          `,
        },
      ],
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: <SettingsIcon />,
      docs: [
        {
          id: 'overview',
          name: 'Overview',
          content: `
# Settings Overview

The Settings section allows you to configure various aspects of the Nexus MCP Hub.

## General Settings

- **Theme**: Choose between light, dark, or system theme
- **Language**: Set the interface language
- **Notifications**: Configure notification preferences
- **Auto-update**: Enable or disable automatic updates

## User Settings

- **Profile**: Update your user profile
- **Password**: Change your password
- **API Keys**: Manage your API keys
- **Preferences**: Set personal preferences

## System Settings

- **Server Configuration**: Configure the Nexus MCP Hub server
- **Database Settings**: Manage database connections
- **Logging**: Configure logging options
- **Backup & Restore**: Manage system backups

## Security Settings

- **Authentication**: Configure authentication methods
- **Authorization**: Manage user roles and permissions
- **API Security**: Set API security options
- **Encryption**: Configure encryption settings

## Integration Settings

- **External Services**: Connect to external services
- **Webhooks**: Configure webhooks
- **SSO**: Set up Single Sign-On
- **OAuth**: Configure OAuth providers

## Next Steps

For detailed information about specific settings, check out:

- [General Settings](general)
- [User Settings](user)
- [System Settings](system)
- [Security Settings](security)
- [Integration Settings](integration)
          `,
        },
      ],
    },
  ];

  // Filter categories and docs based on search query
  const filteredCategories = categories.map((category) => ({
    ...category,
    docs: category.docs.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.docs.length > 0);

  // Get current category and doc
  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const currentDoc = currentCategory?.docs.find((d) => d.id === selectedDoc);

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    const category = categories.find((c) => c.id === categoryId);
    if (category && category.docs.length > 0) {
      setSelectedDoc(category.docs[0].id);
    }
  };

  // Handle doc selection
  const handleDocSelect = (docId) => {
    setSelectedDoc(docId);
  };

  // Render markdown content (enhanced version)
  const renderMarkdown = (content) => {
    // This is an enhanced markdown renderer
    // In a real app, you would use a library like react-markdown
    const lines = content.split('\n');
    const result = [];

    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';
    let inList = false;
    let listItems = [];
    let listType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          result.push(
            <Paper
              key={`code-${i}`}
              sx={{
                p: 2,
                my: 3,
                backgroundColor: 'grey.900',
                color: 'grey.100',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                borderRadius: 1,
                overflowX: 'auto',
                whiteSpace: 'pre',
                position: 'relative',
              }}
            >
              {codeBlockLanguage && (
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 8,
                    color: 'grey.500',
                    textTransform: 'uppercase',
                  }}
                >
                  {codeBlockLanguage}
                </Typography>
              )}
              {codeBlockContent.join('\n')}
            </Paper>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeBlockLanguage = '';
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle lists
      if (line.match(/^(\d+\.|-)/) && !inList) {
        // Start of a list
        inList = true;
        listType = line.startsWith('-') ? 'ul' : 'ol';
        listItems.push(line);
      } else if (line.match(/^(\d+\.|-)/) && inList) {
        // Continue list
        listItems.push(line);
      } else if (line.trim() === '' && inList) {
        // End of list
        const listItemElements = listItems.map((item, idx) => {
          const content = item.startsWith('-')
            ? item.substring(2)
            : item.substring(item.indexOf('.') + 2);

          // Process bold and links in list items
          const processedContent = processInlineMarkdown(content);

          return (
            <Box component="li" key={`list-item-${idx}`} sx={{ mb: 1 }}>
              <Typography variant="body1">{processedContent}</Typography>
            </Box>
          );
        });

        result.push(
          <Box
            component={listType === 'ul' ? 'ul' : 'ol'}
            key={`list-${i}`}
            sx={{
              pl: 4,
              my: 2,
              '& li::marker': {
                color: 'primary.main',
              }
            }}
          >
            {listItemElements}
          </Box>
        );

        inList = false;
        listItems = [];
        listType = '';
      } else if (inList) {
        // Add to previous list item if it's indented
        if (line.startsWith('   ')) {
          const lastItem = listItems.pop();
          listItems.push(lastItem + ' ' + line.trim());
        } else {
          // End of list
          const listItemElements = listItems.map((item, idx) => {
            const content = item.startsWith('-')
              ? item.substring(2)
              : item.substring(item.indexOf('.') + 2);

            // Process bold and links in list items
            const processedContent = processInlineMarkdown(content);

            return (
              <Box component="li" key={`list-item-${idx}`} sx={{ mb: 1 }}>
                <Typography variant="body1">{processedContent}</Typography>
              </Box>
            );
          });

          result.push(
            <Box
              component={listType === 'ul' ? 'ul' : 'ol'}
              key={`list-${i}`}
              sx={{
                pl: 4,
                my: 2,
                '& li::marker': {
                  color: 'primary.main',
                }
              }}
            >
              {listItemElements}
            </Box>
          );

          inList = false;
          listItems = [];
          listType = '';

          // Process the current line
          i--; // Reprocess this line
        }
        continue;
      }

      // Handle headings
      if (line.startsWith('# ')) {
        result.push(
          <Typography
            key={`h1-${i}`}
            variant="h3"
            sx={{
              mt: 3,
              mb: 2,
              fontWeight: 600,
              color: 'primary.main',
              borderBottom: 1,
              borderColor: 'divider',
              pb: 1,
            }}
          >
            {line.substring(2)}
          </Typography>
        );
      } else if (line.startsWith('## ')) {
        result.push(
          <Typography
            key={`h2-${i}`}
            variant="h4"
            sx={{
              mt: 4,
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {line.substring(3)}
          </Typography>
        );
      } else if (line.startsWith('### ')) {
        result.push(
          <Typography
            key={`h3-${i}`}
            variant="h5"
            sx={{
              mt: 3,
              mb: 2,
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {line.substring(4)}
          </Typography>
        );
      } else if (line === '') {
        // Empty line
        result.push(<Box key={`empty-${i}`} sx={{ my: 1 }} />);
      } else {
        // Regular paragraph
        const processedContent = processInlineMarkdown(line);
        result.push(
          <Typography
            key={`p-${i}`}
            variant="body1"
            sx={{
              mb: 2,
              lineHeight: 1.7,
            }}
          >
            {processedContent}
          </Typography>
        );
      }
    }

    // Handle any remaining list
    if (inList) {
      const listItemElements = listItems.map((item, idx) => {
        const content = item.startsWith('-')
          ? item.substring(2)
          : item.substring(item.indexOf('.') + 2);

        // Process bold and links in list items
        const processedContent = processInlineMarkdown(content);

        return (
          <Box component="li" key={`list-item-${idx}`} sx={{ mb: 1 }}>
            <Typography variant="body1">{processedContent}</Typography>
          </Box>
        );
      });

      result.push(
        <Box
          component={listType === 'ul' ? 'ul' : 'ol'}
          key="list-final"
          sx={{
            pl: 4,
            my: 2,
            '& li::marker': {
              color: 'primary.main',
            }
          }}
        >
          {listItemElements}
        </Box>
      );
    }

    return <Box>{result}</Box>;
  };

  // Process inline markdown like bold, italic, links
  const processInlineMarkdown = (text) => {
    // Process links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(processBoldItalic(text.substring(lastIndex, match.index)));
      }

      parts.push(
        <Link
          key={`link-${match.index}`}
          href={match[2]}
          color="primary"
          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
        >
          {match[1]}
        </Link>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(processBoldItalic(text.substring(lastIndex)));
    }

    return parts.length > 0 ? parts : text;
  };

  // Process bold and italic
  const processBoldItalic = (text) => {
    // Process bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      parts.push(
        <Box
          key={`bold-${match.index}`}
          component="span"
          sx={{ fontWeight: 'bold' }}
        >
          {match[1]}
        </Box>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          zIndex: 1,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Documentation
        </Typography>
        <TextField
          fullWidth
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />
      </Box>

      {/* Main content area with fixed sidebar */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Sidebar - fixed width, scrollable */}
        <Box
          sx={{
            width: 280,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            overflowY: 'auto',
            height: '100%',
          }}
        >
          <List component="nav" aria-label="documentation categories" dense>
            {filteredCategories.map((category) => (
              <React.Fragment key={category.id}>
                <ListItemButton
                  selected={selectedCategory === category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  sx={{
                    py: 1.5,
                    borderLeft: 3,
                    borderColor: selectedCategory === category.id ? 'primary.main' : 'transparent',
                  }}
                >
                  <Box sx={{ mr: 1, color: 'primary.main' }}>{category.icon}</Box>
                  <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{
                      fontWeight: selectedCategory === category.id ? 600 : 400
                    }}
                  />
                </ListItemButton>
                {category.docs.map((doc) => (
                  <ListItemButton
                    key={doc.id}
                    selected={selectedDoc === doc.id && selectedCategory === category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      handleDocSelect(doc.id);
                    }}
                    sx={{
                      pl: 4,
                      py: 1,
                      display: selectedCategory === category.id || searchQuery ? 'flex' : 'none',
                      borderLeft: 3,
                      borderColor: selectedDoc === doc.id && selectedCategory === category.id
                        ? 'secondary.main'
                        : 'transparent',
                    }}
                  >
                    <ListItemText
                      primary={doc.name}
                      primaryTypographyProps={{
                        fontSize: '0.9rem',
                        fontWeight: selectedDoc === doc.id && selectedCategory === category.id ? 600 : 400
                      }}
                    />
                  </ListItemButton>
                ))}
                {selectedCategory === category.id && <Divider sx={{ my: 1 }} />}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Content area - flexible width, scrollable */}
        <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', height: '100%' }}>
          {currentDoc ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                maxWidth: 900,
                mx: 'auto',
                backgroundColor: 'background.default',
              }}
            >
              <Breadcrumbs sx={{ mb: 2 }}>
                <Link
                  color="inherit"
                  onClick={() => handleCategorySelect(selectedCategory)}
                  sx={{ cursor: 'pointer' }}
                >
                  {currentCategory?.name}
                </Link>
                <Typography color="text.primary">{currentDoc.name}</Typography>
              </Breadcrumbs>
              <Divider sx={{ mb: 3 }} />
              {renderMarkdown(currentDoc.content)}
            </Paper>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography variant="body1" color="text.secondary">
                Select a document from the sidebar to view its content.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Documentation;
