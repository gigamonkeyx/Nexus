import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  SmartToy as AgentsIcon,
  Task as TasksIcon,
  Speed as BenchmarksIcon,
  Storage as MCPServersIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Create styled Grid components to fix MUI v5 warnings
const Item = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  width: '100%',
}));

// Create responsive grid layouts
const StatsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4),
  gridTemplateColumns: 'repeat(1, 1fr)',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

const ActionsGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  marginBottom: theme.spacing(4),
  gridTemplateColumns: 'repeat(1, 1fr)',
  [theme.breakpoints.up('sm')]: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  [theme.breakpoints.up('md')]: {
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
}));

/**
 * Home page component
 * Displays the dashboard with summary information and quick actions
 */
const Home = () => {
  const { currentUser } = useAuth();

  // Mock data for dashboard
  const stats = {
    agents: 5,
    tasks: 12,
    completedTasks: 8,
    benchmarks: 3,
    mcpServers: 4,
  };

  // Quick action items
  const quickActions = [
    {
      title: 'Create Agent',
      icon: <AgentsIcon fontSize="large" color="primary" />,
      path: '/agents/new',
      description: 'Create a new AI agent with custom capabilities',
    },
    {
      title: 'Run Task',
      icon: <TasksIcon fontSize="large" color="primary" />,
      path: '/tasks/new',
      description: 'Assign a new task to an existing agent',
    },
    {
      title: 'Run Benchmark',
      icon: <BenchmarksIcon fontSize="large" color="primary" />,
      path: '/benchmarks/new',
      description: 'Evaluate agent performance with benchmarks',
    },
    {
      title: 'Connect MCP Server',
      icon: <MCPServersIcon fontSize="large" color="primary" />,
      path: '/mcp-servers/new',
      description: 'Connect to a new MCP server',
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Welcome section */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
          color: 'white',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome back, {currentUser?.name || 'User'}!
        </Typography>
        <Typography variant="body1">
          Manage your AI agents, tasks, and MCP servers from this dashboard.
        </Typography>
      </Paper>

      {/* Stats section */}
      <StatsGrid>
        <Item>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Agents
              </Typography>
              <Typography variant="h3">{stats.agents}</Typography>
              <Button
                component={RouterLink}
                to="/agents"
                size="small"
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Item>
        <Item>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tasks
              </Typography>
              <Typography variant="h3">{stats.tasks}</Typography>
              <Typography variant="body2" color="textSecondary">
                {stats.completedTasks} completed
              </Typography>
              <Button
                component={RouterLink}
                to="/tasks"
                size="small"
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Item>
        <Item>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Benchmarks
              </Typography>
              <Typography variant="h3">{stats.benchmarks}</Typography>
              <Button
                component={RouterLink}
                to="/benchmarks"
                size="small"
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Item>
        <Item>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                MCP Servers
              </Typography>
              <Typography variant="h3">{stats.mcpServers}</Typography>
              <Button
                component={RouterLink}
                to="/mcp-servers"
                size="small"
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Item>
      </StatsGrid>

      {/* Quick actions section */}
      <Typography variant="h5" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={3} key={action.title}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box sx={{ mb: 2 }}>{action.icon}</Box>
                <Typography variant="h6" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {action.description}
                </Typography>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  component={RouterLink}
                  to={action.path}
                  variant="contained"
                  color="primary"
                >
                  {action.title}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent activity section */}
      <Typography variant="h5" gutterBottom>
        Recent Activity
      </Typography>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1">
                Agent "CodeAssistant" completed a task
              </Typography>
              <Typography variant="body2" color="textSecondary">
                2 hours ago
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle1">
                New benchmark "CodeXGLUE" added
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Yesterday
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle1">
                Connected to "Ollama MCP" server
              </Typography>
              <Typography variant="body2" color="textSecondary">
                2 days ago
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Home;
