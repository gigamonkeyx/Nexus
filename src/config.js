/**
 * Application configuration
 */

// Application name
export const APP_NAME = 'Nexus Integrated UI';

// API base URL
export const API_BASE_URL = 'http://localhost:3000/api';

// MCP server default port
export const MCP_SERVER_DEFAULT_PORT = 3000;

// Default pagination limit
export const DEFAULT_PAGINATION_LIMIT = 10;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'nexus_token',
  USER: 'nexus_user',
  THEME: 'nexus_theme',
};

// Theme options
export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Agent status options
export const AGENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RUNNING: 'running',
  ERROR: 'error',
};

// Task status options
export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Benchmark status options
export const BENCHMARK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// MCP server status options
export const MCP_SERVER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: THEME_OPTIONS.LIGHT,
  notifications: true,
  autoUpdate: true,
  telemetry: true,
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  AGENTS: '/agents',
  AGENT_DETAIL: '/agents/:id',
  TASKS: '/tasks',
  TASK_DETAIL: '/tasks/:id',
  BENCHMARKS: '/benchmarks',
  BENCHMARK_DETAIL: '/benchmarks/:id',
  MCP_SERVERS: '/mcp-servers',
  DOCUMENTATION: '/documentation',
  SETTINGS: '/settings',
};

// Navigation items
export const NAV_ITEMS = [
  {
    name: 'Home',
    path: ROUTES.HOME,
    icon: 'home',
  },
  {
    name: 'Agents',
    path: ROUTES.AGENTS,
    icon: 'smart_toy',
  },
  {
    name: 'Tasks',
    path: ROUTES.TASKS,
    icon: 'task',
  },
  {
    name: 'Benchmarks',
    path: ROUTES.BENCHMARKS,
    icon: 'speed',
  },
  {
    name: 'MCP Servers',
    path: ROUTES.MCP_SERVERS,
    icon: 'storage',
  },
  {
    name: 'Documentation',
    path: ROUTES.DOCUMENTATION,
    icon: 'menu_book',
  },
  {
    name: 'Settings',
    path: ROUTES.SETTINGS,
    icon: 'settings',
  },
];
