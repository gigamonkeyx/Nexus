import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from 'react-query';

// Layout components
import Layout from './components/common/Layout';

// Pages
import Home from './pages/Home';
import Agents from './pages/Agents';
import AgentDetail from './pages/AgentDetail';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Benchmarks from './pages/Benchmarks';
import BenchmarkDetail from './pages/BenchmarkDetail';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// Auth
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create a theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Home />} />
                
                <Route path="agents">
                  <Route index element={<Agents />} />
                  <Route path=":id" element={<AgentDetail />} />
                </Route>
                
                <Route path="tasks">
                  <Route index element={<Tasks />} />
                  <Route path=":id" element={<TaskDetail />} />
                </Route>
                
                <Route path="benchmarks">
                  <Route index element={<Benchmarks />} />
                  <Route path=":id" element={<BenchmarkDetail />} />
                </Route>
                
                <Route path="settings" element={<Settings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
