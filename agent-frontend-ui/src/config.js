// API URL
export const API_URL = process.env.REACT_APP_API_URL || 'https://api.nexus-mcp.workers.dev';

// WebSocket URL for real-time updates
export const WS_URL = process.env.REACT_APP_WS_URL || 'wss://api.nexus-mcp.workers.dev';

// Environment
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Feature flags
export const FEATURES = {
  ENABLE_BENCHMARKS: true,
  ENABLE_AGENT_CREATION: true,
  ENABLE_TASK_CREATION: true,
  ENABLE_REAL_TIME_UPDATES: true,
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: 'dark',
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30, // seconds
};

// Agent types
export const AGENT_TYPES = [
  { id: 'research', name: 'Research Agent', icon: 'search' },
  { id: 'coding', name: 'Coding Agent', icon: 'code' },
  { id: 'assistant', name: 'Assistant Agent', icon: 'assistant' },
  { id: 'data', name: 'Data Analysis Agent', icon: 'analytics' },
  { id: 'custom', name: 'Custom Agent', icon: 'build' },
];

// Task priorities
export const TASK_PRIORITIES = [
  { id: 'low', name: 'Low', color: '#4caf50' },
  { id: 'medium', name: 'Medium', color: '#ff9800' },
  { id: 'high', name: 'High', color: '#f44336' },
];

// Task statuses
export const TASK_STATUSES = [
  { id: 'pending', name: 'Pending', color: '#9e9e9e' },
  { id: 'in_progress', name: 'In Progress', color: '#2196f3' },
  { id: 'completed', name: 'Completed', color: '#4caf50' },
  { id: 'failed', name: 'Failed', color: '#f44336' },
];

// Benchmark types
export const BENCHMARK_TYPES = [
  { id: 'humaneval', name: 'HumanEval', description: 'Evaluates code generation capabilities' },
  { id: 'taubench', name: 'τ-Bench', description: 'Evaluates reasoning, planning, and adaptation capabilities' },
  { id: 'custom', name: 'Custom', description: 'Custom benchmark' },
];

// MCP server types
export const MCP_SERVER_TYPES = [
  { id: 'ollama', name: 'Ollama MCP', icon: 'smart_toy' },
  { id: 'code_enhancement', name: 'Code Enhancement MCP', icon: 'code' },
  { id: 'lucidity', name: 'Lucidity MCP', icon: 'psychology' },
  { id: 'benchmark', name: 'Benchmark MCP', icon: 'speed' },
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50],
};

// Date format
export const DATE_FORMAT = 'MMMM dd, yyyy HH:mm:ss';

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  SETTINGS: 'settings',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  AGENT_CREATED: 'Agent created successfully.',
  AGENT_UPDATED: 'Agent updated successfully.',
  AGENT_DELETED: 'Agent deleted successfully.',
  TASK_CREATED: 'Task created successfully.',
  TASK_UPDATED: 'Task updated successfully.',
  TASK_DELETED: 'Task deleted successfully.',
  BENCHMARK_STARTED: 'Benchmark started successfully.',
};

// Cloudflare configuration
export const CLOUDFLARE_CONFIG = {
  PAGES_URL: 'https://nexus-agent-portal.pages.dev',
  WORKER_URL: 'https://api.nexus-mcp.workers.dev',
  ZONE_ID: process.env.REACT_APP_CF_ZONE_ID,
};

// GitHub configuration
export const GITHUB_CONFIG = {
  REPO_OWNER: process.env.REACT_APP_GITHUB_OWNER,
  REPO_NAME: process.env.REACT_APP_GITHUB_REPO,
};
