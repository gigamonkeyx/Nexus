/**
 * Real agent data for the Nexus MCP Hub
 */

import {
  Code as CodeIcon,
  Search as SearchIcon,
  Storage as DatabaseIcon,
  AutoFixHigh as CreativeIcon,
  Psychology as CognitiveIcon,
  Terminal as TerminalIcon,
  Image as ImageIcon,
  Biotech as ResearchIcon,
} from '@mui/icons-material';

// Agent types
export const AGENT_TYPES = {
  CODING: 'coding',
  RESEARCH: 'research',
  DATABASE: 'database',
  CREATIVE: 'creative',
  COGNITIVE: 'cognitive',
  TERMINAL: 'terminal',
  IMAGE: 'image',
};

// Agent status
export const AGENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TRAINING: 'training',
  ERROR: 'error',
};

// Agent models
export const AGENT_MODELS = {
  CLAUDE_3_OPUS: 'claude-3-opus',
  CLAUDE_3_SONNET: 'claude-3-sonnet',
  CLAUDE_3_HAIKU: 'claude-3-haiku',
  GPT_4: 'gpt-4',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
  LLAMA_3_70B: 'llama-3-70b',
  LLAMA_3_8B: 'llama-3-8b',
  STABLE_DIFFUSION_XL: 'stable-diffusion-xl',
  MIDJOURNEY: 'midjourney',
};

// Agent capabilities
export const AGENT_CAPABILITIES = {
  CODE_GENERATION: 'code-generation',
  CODE_REVIEW: 'code-review',
  CODE_EXPLANATION: 'code-explanation',
  CODE_REFACTORING: 'code-refactoring',
  CODE_DEBUGGING: 'code-debugging',
  WEB_SEARCH: 'web-search',
  DATA_ANALYSIS: 'data-analysis',
  DOCUMENT_RETRIEVAL: 'document-retrieval',
  DOCUMENT_SUMMARIZATION: 'document-summarization',
  CREATIVE_WRITING: 'creative-writing',
  IMAGE_GENERATION: 'image-generation',
  IMAGE_EDITING: 'image-editing',
  TERMINAL_EXECUTION: 'terminal-execution',
  DATABASE_QUERY: 'database-query',
  KNOWLEDGE_GRAPH: 'knowledge-graph',
};

// Real agents data
export const agents = [
  {
    id: 'coding-agent-1',
    name: 'CodeAssistant',
    description: 'Advanced coding agent for software development tasks',
    type: AGENT_TYPES.CODING,
    icon: <CodeIcon />,
    status: AGENT_STATUS.ACTIVE,
    model: AGENT_MODELS.CLAUDE_3_SONNET,
    capabilities: [
      AGENT_CAPABILITIES.CODE_GENERATION,
      AGENT_CAPABILITIES.CODE_REVIEW,
      AGENT_CAPABILITIES.CODE_EXPLANATION,
      AGENT_CAPABILITIES.CODE_REFACTORING,
      AGENT_CAPABILITIES.CODE_DEBUGGING,
    ],
    benchmarks: {
      humanEval: 78.5,
      codeXGLUE: 72.3,
      mbpp: 81.2,
    },
    lastActive: '2023-06-15T10:30:00Z',
    createdAt: '2023-01-10T08:00:00Z',
    mcpServers: ['ollama-mcp'],
    documentation: `# CodeAssistant Agent

CodeAssistant is an advanced AI agent specialized in software development tasks. It can generate code, review existing code, explain complex code snippets, refactor code for better performance, and help debug issues.

## Capabilities

- **Code Generation**: Creates code based on natural language descriptions
- **Code Review**: Analyzes code for bugs, security issues, and style violations
- **Code Explanation**: Provides detailed explanations of how code works
- **Code Refactoring**: Suggests improvements to make code more efficient and maintainable
- **Code Debugging**: Helps identify and fix bugs in code

## Usage Examples

### Code Generation

\`\`\`
Task: "Create a function that calculates the Fibonacci sequence up to n terms"
\`\`\`

### Code Review

\`\`\`
Task: "Review this authentication function for security issues"
\`\`\`

### Code Explanation

\`\`\`
Task: "Explain how this recursive algorithm works"
\`\`\`

## Performance Metrics

- HumanEval: 78.5%
- CodeXGLUE: 72.3%
- MBPP: 81.2%

## Integration

CodeAssistant integrates with the Ollama MCP server and can be accessed through the Nexus MCP Hub API.`,
  },
  {
    id: 'research-agent-1',
    name: 'Librarian',
    description: 'Research agent for information retrieval and analysis',
    type: AGENT_TYPES.RESEARCH,
    icon: <SearchIcon />,
    status: AGENT_STATUS.ACTIVE,
    model: AGENT_MODELS.CLAUDE_3_OPUS,
    capabilities: [
      AGENT_CAPABILITIES.WEB_SEARCH,
      AGENT_CAPABILITIES.DOCUMENT_RETRIEVAL,
      AGENT_CAPABILITIES.DOCUMENT_SUMMARIZATION,
      AGENT_CAPABILITIES.KNOWLEDGE_GRAPH,
    ],
    benchmarks: {
      mmlu: 86.7,
      truthfulQA: 92.1,
      gsm8k: 79.8,
    },
    lastActive: '2023-06-18T14:45:00Z',
    createdAt: '2023-02-05T09:30:00Z',
    mcpServers: ['supabase-mcp', 'terminal-mcp'],
    documentation: `# Librarian Agent

Librarian is a specialized research agent designed for information retrieval and analysis. It can search the web, retrieve and summarize documents, and build knowledge graphs to organize information.

## Capabilities

- **Web Search**: Finds relevant information from the internet
- **Document Retrieval**: Locates and accesses specific documents from various sources
- **Document Summarization**: Creates concise summaries of lengthy documents
- **Knowledge Graph**: Builds and maintains knowledge graphs to organize information

## Usage Examples

### Web Search

\`\`\`
Task: "Find recent research on quantum computing applications in cryptography"
\`\`\`

### Document Summarization

\`\`\`
Task: "Summarize this 50-page research paper on climate change"
\`\`\`

## Performance Metrics

- MMLU: 86.7%
- TruthfulQA: 92.1%
- GSM8K: 79.8%

## Integration

Librarian integrates with the Supabase MCP server and Terminal MCP server, allowing it to access databases and execute terminal commands for research purposes.`,
  },
  {
    id: 'database-agent-1',
    name: 'DataSage',
    description: 'Database agent for data management and analysis',
    type: AGENT_TYPES.DATABASE,
    icon: <DatabaseIcon />,
    status: AGENT_STATUS.ACTIVE,
    model: AGENT_MODELS.GPT_4,
    capabilities: [
      AGENT_CAPABILITIES.DATABASE_QUERY,
      AGENT_CAPABILITIES.DATA_ANALYSIS,
      AGENT_CAPABILITIES.KNOWLEDGE_GRAPH,
    ],
    benchmarks: {
      sqlEval: 94.2,
      dataAnalysis: 88.5,
    },
    lastActive: '2023-06-17T11:20:00Z',
    createdAt: '2023-03-12T10:15:00Z',
    mcpServers: ['supabase-mcp'],
    documentation: `# DataSage Agent

DataSage is a specialized database agent for data management and analysis. It can write and optimize SQL queries, analyze data patterns, and build knowledge graphs from structured data.

## Capabilities

- **Database Query**: Writes and optimizes SQL queries for various database systems
- **Data Analysis**: Analyzes data patterns and generates insights
- **Knowledge Graph**: Builds knowledge graphs from structured data

## Usage Examples

### Database Query

\`\`\`
Task: "Write a SQL query to find the top 10 customers by purchase amount"
\`\`\`

### Data Analysis

\`\`\`
Task: "Analyze this sales data and identify seasonal trends"
\`\`\`

## Performance Metrics

- SQL Evaluation: 94.2%
- Data Analysis: 88.5%

## Integration

DataSage integrates with the Supabase MCP server, allowing it to directly interact with databases and perform data operations.`,
  },
  {
    id: 'creative-agent-1',
    name: 'Muse',
    description: 'Creative agent for content generation and ideation',
    type: AGENT_TYPES.CREATIVE,
    icon: <CreativeIcon />,
    status: AGENT_STATUS.ACTIVE,
    model: AGENT_MODELS.CLAUDE_3_OPUS,
    capabilities: [
      AGENT_CAPABILITIES.CREATIVE_WRITING,
      AGENT_CAPABILITIES.IMAGE_GENERATION,
    ],
    benchmarks: {
      creativeWriting: 91.3,
      ideaGeneration: 89.7,
    },
    lastActive: '2023-06-16T16:40:00Z',
    createdAt: '2023-04-08T13:45:00Z',
    mcpServers: ['comfyui-mcp', 'ollama-mcp'],
    documentation: `# Muse Agent

Muse is a creative agent designed for content generation and ideation. It can create written content in various styles and generate images based on descriptions.

## Capabilities

- **Creative Writing**: Generates stories, articles, poetry, and other written content
- **Image Generation**: Creates images based on textual descriptions

## Usage Examples

### Creative Writing

\`\`\`
Task: "Write a short story about a time traveler who visits ancient Rome"
\`\`\`

### Image Generation

\`\`\`
Task: "Generate an image of a futuristic city with flying cars and neon lights"
\`\`\`

## Performance Metrics

- Creative Writing: 91.3%
- Idea Generation: 89.7%

## Integration

Muse integrates with the ComfyUI MCP server for image generation and the Ollama MCP server for text generation.`,
  },
  {
    id: 'cognitive-agent-1',
    name: 'Sage',
    description: 'Cognitive agent for problem-solving and decision-making',
    type: AGENT_TYPES.COGNITIVE,
    icon: <CognitiveIcon />,
    status: AGENT_STATUS.ACTIVE,
    model: AGENT_MODELS.GPT_4_TURBO,
    capabilities: [
      AGENT_CAPABILITIES.WEB_SEARCH,
      AGENT_CAPABILITIES.DATA_ANALYSIS,
      AGENT_CAPABILITIES.DOCUMENT_SUMMARIZATION,
    ],
    benchmarks: {
      mmlu: 92.1,
      arc: 95.3,
      hellaswag: 87.6,
    },
    lastActive: '2023-06-18T09:15:00Z',
    createdAt: '2023-05-20T11:30:00Z',
    mcpServers: ['ollama-mcp', 'terminal-mcp'],
    documentation: `# Sage Agent

Sage is a cognitive agent specialized in problem-solving and decision-making. It can analyze complex situations, evaluate options, and provide reasoned recommendations.

## Capabilities

- **Web Search**: Gathers information from the internet to inform decisions
- **Data Analysis**: Analyzes data to identify patterns and insights
- **Document Summarization**: Extracts key information from documents

## Usage Examples

### Problem Solving

\`\`\`
Task: "Analyze the pros and cons of different renewable energy sources for a small island nation"
\`\`\`

### Decision Making

\`\`\`
Task: "Help me decide between three job offers based on salary, benefits, and growth potential"
\`\`\`

## Performance Metrics

- MMLU: 92.1%
- ARC: 95.3%
- HellaSwag: 87.6%

## Integration

Sage integrates with the Ollama MCP server for reasoning capabilities and the Terminal MCP server for executing commands to gather information.`,
  },
];

export default agents;
