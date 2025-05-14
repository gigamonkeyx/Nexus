import axios from 'axios';
import { API_URL } from '../config';

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
    const token = localStorage.getItem('token');
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
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Agent API
export const agentApi = {
  // Get all agents
  getAgents: async () => {
    const response = await api.get('/api/agents');
    return response.data;
  },
  
  // Get agent by ID
  getAgent: async (id) => {
    const response = await api.get(`/api/agents/${id}`);
    return response.data;
  },
  
  // Create agent
  createAgent: async (data) => {
    const response = await api.post('/api/agents', data);
    return response.data;
  },
  
  // Update agent
  updateAgent: async (id, data) => {
    const response = await api.put(`/api/agents/${id}`, data);
    return response.data;
  },
  
  // Delete agent
  deleteAgent: async (id) => {
    const response = await api.delete(`/api/agents/${id}`);
    return response.data;
  },
  
  // Start agent
  startAgent: async (id) => {
    const response = await api.post(`/api/agents/${id}/start`);
    return response.data;
  },
  
  // Stop agent
  stopAgent: async (id) => {
    const response = await api.post(`/api/agents/${id}/stop`);
    return response.data;
  },
  
  // Get agent logs
  getAgentLogs: async (id) => {
    const response = await api.get(`/api/agents/${id}/logs`);
    return response.data;
  },
};

// Task API
export const taskApi = {
  // Get all tasks
  getTasks: async () => {
    const response = await api.get('/api/tasks');
    return response.data;
  },
  
  // Get task by ID
  getTask: async (id) => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },
  
  // Create task
  createTask: async (data) => {
    const response = await api.post('/api/tasks', data);
    return response.data;
  },
  
  // Update task
  updateTask: async (id, data) => {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
  },
  
  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
  
  // Assign task to agent
  assignTask: async (taskId, agentId) => {
    const response = await api.post(`/api/tasks/${taskId}/assign`, { agentId });
    return response.data;
  },
  
  // Complete task
  completeTask: async (id) => {
    const response = await api.post(`/api/tasks/${id}/complete`);
    return response.data;
  },
};

// Benchmark API
export const benchmarkApi = {
  // Get all benchmarks
  getBenchmarks: async () => {
    const response = await api.get('/api/benchmarks');
    return response.data;
  },
  
  // Get benchmark by ID
  getBenchmark: async (id) => {
    const response = await api.get(`/api/benchmarks/${id}`);
    return response.data;
  },
  
  // Run benchmark
  runBenchmark: async (data) => {
    const response = await api.post('/api/benchmarks/run', data);
    return response.data;
  },
  
  // Get benchmark results
  getBenchmarkResults: async (id) => {
    const response = await api.get(`/api/benchmarks/${id}/results`);
    return response.data;
  },
  
  // Compare benchmark results
  compareBenchmarkResults: async (resultId1, resultId2) => {
    const response = await api.get(`/api/benchmarks/compare?result1=${resultId1}&result2=${resultId2}`);
    return response.data;
  },
};

// MCP Server API
export const mcpServerApi = {
  // Get all MCP servers
  getMCPServers: async () => {
    const response = await api.get('/api/servers');
    return response.data;
  },
  
  // Get MCP server by ID
  getMCPServer: async (id) => {
    const response = await api.get(`/api/servers/${id}`);
    return response.data;
  },
  
  // Register MCP server
  registerMCPServer: async (data) => {
    const response = await api.post('/api/servers/register', data);
    return response.data;
  },
  
  // Unregister MCP server
  unregisterMCPServer: async (id) => {
    const response = await api.delete(`/api/servers/${id}`);
    return response.data;
  },
  
  // Get MCP server status
  getMCPServerStatus: async (id) => {
    const response = await api.get(`/api/servers/${id}/status`);
    return response.data;
  },
};

export default api;
