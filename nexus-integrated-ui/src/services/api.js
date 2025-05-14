import axios from 'axios';
import { API_URL, AUTH_CONFIG } from '../config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_CONFIG.tokenStorageKey);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem(AUTH_CONFIG.tokenStorageKey);
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API
export const authApi = {
  // Login
  login: async (credentials) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Check credentials
      if (credentials.email === 'admin@example.com' && credentials.password === 'password') {
        return {
          token: 'mock-token-12345',
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin'
          }
        };
      } else {
        throw new Error('Invalid email or password');
      }
    }
    
    // For production
    return api.post('/api/auth/login', credentials);
  },

  // Register
  register: async (userData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate registration
      return { success: true };
    }
    
    // For production
    return api.post('/api/auth/register', userData);
  },

  // Get user profile
  getProfile: async () => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate profile
      return {
        id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      };
    }
    
    // For production
    return api.get('/api/auth/profile');
  },

  // Update user profile
  updateProfile: async (userData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate update
      return {
        ...userData,
        id: '1',
        role: 'admin'
      };
    }
    
    // For production
    return api.put('/api/auth/profile', userData);
  },

  // Change password
  changePassword: async (passwordData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate change password
      return { success: true };
    }
    
    // For production
    return api.post('/api/auth/change-password', passwordData);
  },
};

// Agent API
export const agentApi = {
  // Get all agents
  getAgents: async () => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate agents
      return [
        {
          id: '1',
          name: 'Research Agent',
          type: 'research',
          description: 'Agent for research tasks',
          status: 'active',
          capabilities: ['web-search', 'document-analysis'],
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Coding Agent',
          type: 'coding',
          description: 'Agent for coding tasks',
          status: 'inactive',
          capabilities: ['code-generation', 'code-review'],
          createdAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'Data Analysis Agent',
          type: 'data',
          description: 'Agent for data analysis tasks',
          status: 'active',
          capabilities: ['data-processing', 'visualization'],
          createdAt: '2023-01-03T00:00:00.000Z',
        },
      ];
    }
    
    // For production
    return api.get('/api/agents');
  },

  // Get agent by ID
  getAgent: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate agent
      return {
        id,
        name: 'Research Agent',
        type: 'research',
        description: 'Agent for research tasks',
        status: 'active',
        capabilities: ['web-search', 'document-analysis'],
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/agents/${id}`);
  },

  // Create agent
  createAgent: async (agentData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate create
      return {
        ...agentData,
        id: Math.random().toString(36).substring(7),
        status: 'inactive',
        createdAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.post('/api/agents', agentData);
  },

  // Update agent
  updateAgent: async (id, agentData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate update
      return {
        ...agentData,
        id,
        updatedAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.put(`/api/agents/${id}`, agentData);
  },

  // Delete agent
  deleteAgent: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate delete
      return { success: true };
    }
    
    // For production
    return api.delete(`/api/agents/${id}`);
  },

  // Start agent
  startAgent: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate start
      return { id, status: 'active' };
    }
    
    // For production
    return api.post(`/api/agents/${id}/start`);
  },

  // Stop agent
  stopAgent: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate stop
      return { id, status: 'inactive' };
    }
    
    // For production
    return api.post(`/api/agents/${id}/stop`);
  },

  // Get agent logs
  getAgentLogs: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate logs
      return [
        { id: '1', level: 'info', message: 'Agent started', timestamp: '2023-01-01T00:00:00.000Z' },
        { id: '2', level: 'info', message: 'Processing task', timestamp: '2023-01-01T00:01:00.000Z' },
        { id: '3', level: 'error', message: 'Error occurred', timestamp: '2023-01-01T00:02:00.000Z' },
      ];
    }
    
    // For production
    return api.get(`/api/agents/${id}/logs`);
  },
};

// Task API
export const taskApi = {
  // Get all tasks
  getTasks: async (params) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate tasks
      let tasks = [
        {
          id: '1',
          name: 'Research AI trends',
          description: 'Research the latest trends in AI',
          status: 'pending',
          priority: 'high',
          agentId: '1',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Generate code for API',
          description: 'Generate code for the new API',
          status: 'in-progress',
          priority: 'medium',
          agentId: '2',
          createdAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'Analyze sales data',
          description: 'Analyze the sales data for Q1',
          status: 'completed',
          priority: 'low',
          agentId: '3',
          createdAt: '2023-01-03T00:00:00.000Z',
        },
      ];
      
      // Filter by agent ID if provided
      if (params?.agentId) {
        tasks = tasks.filter(task => task.agentId === params.agentId);
      }
      
      return tasks;
    }
    
    // For production
    return api.get('/api/tasks', { params });
  },

  // Get task by ID
  getTask: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate task
      return {
        id,
        name: 'Research AI trends',
        description: 'Research the latest trends in AI',
        status: 'pending',
        priority: 'high',
        agentId: '1',
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/tasks/${id}`);
  },

  // Create task
  createTask: async (taskData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate create
      return {
        ...taskData,
        id: Math.random().toString(36).substring(7),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.post('/api/tasks', taskData);
  },

  // Update task
  updateTask: async (id, taskData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate update
      return {
        ...taskData,
        id,
        updatedAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.put(`/api/tasks/${id}`, taskData);
  },

  // Delete task
  deleteTask: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate delete
      return { success: true };
    }
    
    // For production
    return api.delete(`/api/tasks/${id}`);
  },

  // Assign task to agent
  assignTask: async (id, agentId) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate assign
      return { id, agentId };
    }
    
    // For production
    return api.post(`/api/tasks/${id}/assign`, { agentId });
  },

  // Complete task
  completeTask: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate complete
      return { id, status: 'completed' };
    }
    
    // For production
    return api.post(`/api/tasks/${id}/complete`);
  },
};

// Benchmark API
export const benchmarkApi = {
  // Get all benchmarks
  getBenchmarks: async (params) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate benchmarks
      let benchmarks = [
        {
          id: '1',
          name: 'HumanEval',
          description: 'Benchmark for code generation',
          type: 'coding',
          status: 'completed',
          agentId: '2',
          score: 85,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'MMLU',
          description: 'Benchmark for knowledge',
          type: 'knowledge',
          status: 'in-progress',
          agentId: '1',
          score: null,
          createdAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'AgentBench',
          description: 'Benchmark for agent capabilities',
          type: 'agent',
          status: 'pending',
          agentId: '3',
          score: null,
          createdAt: '2023-01-03T00:00:00.000Z',
        },
      ];
      
      // Filter by agent ID if provided
      if (params?.agentId) {
        benchmarks = benchmarks.filter(benchmark => benchmark.agentId === params.agentId);
      }
      
      return benchmarks;
    }
    
    // For production
    return api.get('/api/benchmarks', { params });
  },

  // Get benchmark by ID
  getBenchmark: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate benchmark
      return {
        id,
        name: 'HumanEval',
        description: 'Benchmark for code generation',
        type: 'coding',
        status: 'completed',
        agentId: '2',
        score: 85,
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/benchmarks/${id}`);
  },

  // Run benchmark
  runBenchmark: async (benchmarkData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate run
      return {
        ...benchmarkData,
        id: Math.random().toString(36).substring(7),
        status: 'in-progress',
        createdAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.post('/api/benchmarks/run', benchmarkData);
  },

  // Get benchmark results
  getBenchmarkResults: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate results
      return {
        id,
        score: 85,
        details: [
          { task: 'Task 1', score: 90 },
          { task: 'Task 2', score: 80 },
          { task: 'Task 3', score: 85 },
        ],
        completedAt: '2023-01-01T01:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/benchmarks/${id}/results`);
  },

  // Compare benchmark results
  compareBenchmarkResults: async (id1, id2) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate comparison
      return {
        benchmark1: {
          id: id1,
          name: 'HumanEval',
          score: 85,
        },
        benchmark2: {
          id: id2,
          name: 'HumanEval',
          score: 80,
        },
        difference: 5,
        tasks: [
          { task: 'Task 1', score1: 90, score2: 85 },
          { task: 'Task 2', score1: 80, score2: 75 },
          { task: 'Task 3', score1: 85, score2: 80 },
        ],
      };
    }
    
    // For production
    return api.get(`/api/benchmarks/compare`, { params: { id1, id2 } });
  },
};

// MCP Server API
export const mcpServerApi = {
  // Get all MCP servers
  getMCPServers: async () => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate MCP servers
      return [
        {
          id: '1',
          name: 'Ollama MCP',
          type: 'ollama',
          url: 'http://localhost:3011',
          status: 'active',
          capabilities: ['text-generation', 'image-generation'],
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'ComfyUI MCP',
          type: 'comfyui',
          url: 'http://localhost:3020',
          status: 'active',
          capabilities: ['image-generation'],
          createdAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'Supabase MCP',
          type: 'supabase',
          url: 'http://localhost:3007',
          status: 'inactive',
          capabilities: ['database'],
          createdAt: '2023-01-03T00:00:00.000Z',
        },
      ];
    }
    
    // For production
    return api.get('/api/mcp-servers');
  },

  // Get MCP server by ID
  getMCPServer: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate MCP server
      return {
        id,
        name: 'Ollama MCP',
        type: 'ollama',
        url: 'http://localhost:3011',
        status: 'active',
        capabilities: ['text-generation', 'image-generation'],
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/mcp-servers/${id}`);
  },

  // Register MCP server
  registerMCPServer: async (serverData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate register
      return {
        ...serverData,
        id: Math.random().toString(36).substring(7),
        status: 'inactive',
        createdAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.post('/api/mcp-servers', serverData);
  },

  // Update MCP server
  updateMCPServer: async (id, serverData) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate update
      return {
        ...serverData,
        id,
        updatedAt: new Date().toISOString(),
      };
    }
    
    // For production
    return api.put(`/api/mcp-servers/${id}`, serverData);
  },

  // Delete MCP server
  deleteMCPServer: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate delete
      return { success: true };
    }
    
    // For production
    return api.delete(`/api/mcp-servers/${id}`);
  },

  // Test MCP server connection
  testMCPServerConnection: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate test
      return { id, status: 'active', message: 'Connection successful' };
    }
    
    // For production
    return api.post(`/api/mcp-servers/${id}/test`);
  },
};

// Documentation API
export const docsApi = {
  // Get all documentation
  getDocs: async () => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate docs
      return [
        {
          id: '1',
          title: 'Getting Started',
          category: 'general',
          content: 'This is the getting started guide...',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          title: 'API Reference',
          category: 'api',
          content: 'This is the API reference...',
          createdAt: '2023-01-02T00:00:00.000Z',
        },
        {
          id: '3',
          title: 'MCP Protocol',
          category: 'mcp',
          content: 'This is the MCP protocol documentation...',
          createdAt: '2023-01-03T00:00:00.000Z',
        },
      ];
    }
    
    // For production
    return api.get('/api/docs');
  },

  // Get documentation by ID
  getDoc: async (id) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate doc
      return {
        id,
        title: 'Getting Started',
        category: 'general',
        content: 'This is the getting started guide...',
        createdAt: '2023-01-01T00:00:00.000Z',
      };
    }
    
    // For production
    return api.get(`/api/docs/${id}`);
  },

  // Search documentation
  searchDocs: async (query) => {
    // For development/testing
    if (process.env.NODE_ENV === 'development') {
      // Simulate search
      return [
        {
          id: '1',
          title: 'Getting Started',
          category: 'general',
          excerpt: '...guide for getting started with...',
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      ];
    }
    
    // For production
    return api.get('/api/docs/search', { params: { query } });
  },
};

export default api;
