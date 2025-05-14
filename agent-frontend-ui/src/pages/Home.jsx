import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  SmartToy as SmartToyIcon,
  Task as TaskIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { agentApi, taskApi, benchmarkApi, mcpServerApi } from '../services/api';
import { TASK_STATUSES } from '../config';

const Home = () => {
  const navigate = useNavigate();
  
  // Fetch agents
  const { 
    data: agents, 
    isLoading: agentsLoading, 
    error: agentsError 
  } = useQuery('agents', agentApi.getAgents);
  
  // Fetch tasks
  const { 
    data: tasks, 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useQuery('tasks', taskApi.getTasks);
  
  // Fetch benchmarks
  const { 
    data: benchmarks, 
    isLoading: benchmarksLoading, 
    error: benchmarksError 
  } = useQuery('benchmarks', benchmarkApi.getBenchmarks);
  
  // Fetch MCP servers
  const { 
    data: mcpServers, 
    isLoading: mcpServersLoading, 
    error: mcpServersError 
  } = useQuery('mcpServers', mcpServerApi.getMCPServers);
  
  // Get task status color
  const getTaskStatusColor = (status) => {
    const statusObj = TASK_STATUSES.find(s => s.id === status);
    return statusObj ? statusObj.color : '#9e9e9e';
  };
  
  // Get task status icon
  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: getTaskStatusColor(status) }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: getTaskStatusColor(status) }} />;
      case 'in_progress':
        return <CircularProgress size={20} sx={{ color: getTaskStatusColor(status) }} />;
      default:
        return <PendingIcon sx={{ color: getTaskStatusColor(status) }} />;
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* System Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {mcpServersLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    mcpServers?.length || 0
                  )}
                </Typography>
                <Typography color="text.secondary">
                  MCP Servers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {agentsLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    agents?.length || 0
                  )}
                </Typography>
                <Typography color="text.secondary">
                  Agents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {tasksLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    tasks?.length || 0
                  )}
                </Typography>
                <Typography color="text.secondary">
                  Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  {benchmarksLoading ? (
                    <CircularProgress size={24} />
                  ) : (
                    benchmarks?.length || 0
                  )}
                </Typography>
                <Typography color="text.secondary">
                  Benchmarks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Active Agents */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Active Agents
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/agents')}
              >
                New Agent
              </Button>
            </Box>
            {agentsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : agentsError ? (
              <Alert severity="error">Failed to load agents</Alert>
            ) : agents?.length === 0 ? (
              <Alert severity="info">No agents found</Alert>
            ) : (
              <List>
                {agents?.slice(0, 5).map((agent) => (
                  <ListItem
                    key={agent.id}
                    secondaryAction={
                      <Button 
                        size="small" 
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/agents/${agent.id}`)}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      <SmartToyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={agent.name}
                      secondary={`Type: ${agent.type} | Status: ${agent.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Tasks
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/tasks')}
              >
                New Task
              </Button>
            </Box>
            {tasksLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : tasksError ? (
              <Alert severity="error">Failed to load tasks</Alert>
            ) : tasks?.length === 0 ? (
              <Alert severity="info">No tasks found</Alert>
            ) : (
              <List>
                {tasks?.slice(0, 5).map((task) => (
                  <ListItem
                    key={task.id}
                    secondaryAction={
                      <Button 
                        size="small" 
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        View
                      </Button>
                    }
                  >
                    <ListItemIcon>
                      {getTaskStatusIcon(task.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={task.name}
                      secondary={`Agent: ${task.agentName || 'Unassigned'} | Priority: ${task.priority}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Benchmarks */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Benchmarks
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/benchmarks')}
              >
                Run Benchmark
              </Button>
            </Box>
            {benchmarksLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : benchmarksError ? (
              <Alert severity="error">Failed to load benchmarks</Alert>
            ) : benchmarks?.length === 0 ? (
              <Alert severity="info">No benchmarks found</Alert>
            ) : (
              <Grid container spacing={2}>
                {benchmarks?.slice(0, 3).map((benchmark) => (
                  <Grid item xs={12} md={4} key={benchmark.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {benchmark.name}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {benchmark.type}
                        </Typography>
                        <Typography variant="body2">
                          Agent: {benchmark.agentName}
                        </Typography>
                        <Typography variant="body2">
                          Score: {benchmark.score.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Date: {new Date(benchmark.date).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small"
                          onClick={() => navigate(`/benchmarks/${benchmark.id}`)}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
