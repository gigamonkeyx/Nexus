import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';

// Layout
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import NotFound from './pages/NotFound';

// Agent pages
import Agents from './pages/agents/Agents';
import AgentDetail from './pages/agents/AgentDetail';

// Task pages
import Tasks from './pages/tasks/Tasks';
import TaskDetail from './pages/tasks/TaskDetail';

// Benchmark pages
import Benchmarks from './pages/benchmarks/Benchmarks';
import BenchmarkDetail from './pages/benchmarks/BenchmarkDetail';

// Settings pages
import Settings from './pages/settings/Settings';

// Documentation pages
import Documentation from './pages/docs/Documentation';

// MCP Server pages
import MCPServers from './pages/mcp/MCPServers';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Home />} />

                {/* Agent routes */}
                <Route path="agents">
                  <Route index element={<Agents />} />
                  <Route path=":id" element={<AgentDetail />} />
                </Route>

                {/* Task routes */}
                <Route path="tasks">
                  <Route index element={<Tasks />} />
                  <Route path=":id" element={<TaskDetail />} />
                </Route>

                {/* Benchmark routes */}
                <Route path="benchmarks">
                  <Route index element={<Benchmarks />} />
                  <Route path=":id" element={<BenchmarkDetail />} />
                </Route>

                {/* Documentation routes */}
                <Route path="documentation" element={<Documentation />} />

                {/* MCP Server routes */}
                <Route path="mcp-servers" element={<MCPServers />} />

                {/* Settings routes */}
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Not found route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
