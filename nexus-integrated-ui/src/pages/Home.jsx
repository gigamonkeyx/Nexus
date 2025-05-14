import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  SmartToy as AgentIcon,
  Assignment as TaskIcon,
  Speed as BenchmarkIcon,
  Storage as ServerIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { agentApi, taskApi, benchmarkApi, mcpServerApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Home page component
 * Displays a dashboard with summary information
 */
const Home = () => {
  const { currentUser } = useAuth();

  // Fetch agents
  const {
    data: agents,
    isLoading: agentsLoading,
    error: agentsError
  } = useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents
  });

  // Fetch tasks
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskApi.getTasks
  });

  // Fetch benchmarks
  const {
    data: benchmarks,
    isLoading: benchmarksLoading,
    error: benchmarksError
  } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: benchmarkApi.getBenchmarks
  });

  // Fetch MCP servers
  const {
    data: mcpServers,
    isLoading: mcpServersLoading,
    error: mcpServersError
  } = useQuery({
    queryKey: ['mcpServers'],
    queryFn: mcpServerApi.getMCPServers
  });

  // Count active agents
  const activeAgents = agents?.filter(agent => agent.status === 'active').length || 0;
  
  // Count tasks by status
  const pendingTasks = tasks?.filter(task => task.status === 'pending').length || 0;
  const inProgressTasks = tasks?.filter(task => task.status === 'in-progress').length || 0;
  const completedTasks = tasks?.filter(task => task.status === 'completed').length || 0;

  // Get recent tasks
  const recentTasks = tasks?.slice(0, 5) || [];

  // Get recent benchmarks
  const recentBenchmarks = benchmarks?.slice(0, 5) || [];

  return (
    <Box>
      {/* Welcome message */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          backgroundColor: (theme) => theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.name || 'User'}!
        </Typography>
        <Typography variant="body1">
          This is your Nexus Agent Portal dashboard. Here you can manage your agents, tasks, and benchmarks.
        </Typography>
      </Paper>

      {/* Summary cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Agents card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AgentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Agents</Typography>
              </Box>
              {agentsLoading ? (
                <CircularProgress size={24} />
              ) : agentsError ? (
                <Typography color="error">Error loading agents</Typography>
              ) : (
                <>
                  <Typography variant="h4">{agents?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeAgents} active
                  </Typography>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/agents">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Tasks card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TaskIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Tasks</Typography>
              </Box>
              {tasksLoading ? (
                <CircularProgress size={24} />
              ) : tasksError ? (
                <Typography color="error">Error loading tasks</Typography>
              ) : (
                <>
                  <Typography variant="h4">{tasks?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pendingTasks} pending, {inProgressTasks} in progress
                  </Typography>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/tasks">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Benchmarks card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BenchmarkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Benchmarks</Typography>
              </Box>
              {benchmarksLoading ? (
                <CircularProgress size={24} />
              ) : benchmarksError ? (
                <Typography color="error">Error loading benchmarks</Typography>
              ) : (
                <>
                  <Typography variant="h4">{benchmarks?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {benchmarks?.filter(b => b.status === 'completed').length || 0} completed
                  </Typography>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/benchmarks">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* MCP Servers card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ServerIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">MCP Servers</Typography>
              </Box>
              {mcpServersLoading ? (
                <CircularProgress size={24} />
              ) : mcpServersError ? (
                <Typography color="error">Error loading servers</Typography>
              ) : (
                <>
                  <Typography variant="h4">{mcpServers?.length || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mcpServers?.filter(s => s.status === 'active').length || 0} active
                  </Typography>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/mcp-servers">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Recent items */}
      <Grid container spacing={3}>
        {/* Recent tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tasks
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {tasksLoading ? (
                <CircularProgress />
              ) : tasksError ? (
                <Alert severity="error">Error loading tasks</Alert>
              ) : recentTasks.length === 0 ? (
                <Typography color="text.secondary">No tasks found</Typography>
              ) : (
                <List>
                  {recentTasks.map((task) => (
                    <ListItem
                      key={task.id}
                      button
                      component={RouterLink}
                      to={`/tasks/${task.id}`}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        {task.status === 'completed' ? (
                          <SuccessIcon color="success" />
                        ) : task.status === 'in-progress' ? (
                          <PendingIcon color="warning" />
                        ) : (
                          <TaskIcon color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.name}
                        secondary={`Priority: ${task.priority}`}
                      />
                      <Chip
                        label={task.status}
                        color={
                          task.status === 'completed'
                            ? 'success'
                            : task.status === 'in-progress'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/tasks">
                View All Tasks
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Recent benchmarks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Benchmarks
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {benchmarksLoading ? (
                <CircularProgress />
              ) : benchmarksError ? (
                <Alert severity="error">Error loading benchmarks</Alert>
              ) : recentBenchmarks.length === 0 ? (
                <Typography color="text.secondary">No benchmarks found</Typography>
              ) : (
                <List>
                  {recentBenchmarks.map((benchmark) => (
                    <ListItem
                      key={benchmark.id}
                      button
                      component={RouterLink}
                      to={`/benchmarks/${benchmark.id}`}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        {benchmark.status === 'completed' ? (
                          <SuccessIcon color="success" />
                        ) : benchmark.status === 'in-progress' ? (
                          <PendingIcon color="warning" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={benchmark.name}
                        secondary={`Type: ${benchmark.type}`}
                      />
                      {benchmark.score !== null && (
                        <Chip
                          label={`Score: ${benchmark.score}`}
                          color="primary"
                          size="small"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" component={RouterLink} to="/benchmarks">
                View All Benchmarks
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
