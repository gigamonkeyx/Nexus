import React, { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AGENT_STATUS } from '../../config';

/**
 * AgentDetail page component
 * Displays detailed information about a specific agent
 */
const AgentDetail = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);

  // Mock data for agent details
  const agent = {
    id: parseInt(id),
    name: 'CodeAssistant',
    description: 'AI agent for code assistance and generation',
    status: AGENT_STATUS.ACTIVE,
    type: 'Coding',
    createdAt: '2023-05-15',
    lastActive: '2023-06-01',
    model: 'GPT-4',
    capabilities: [
      'Code generation',
      'Code review',
      'Bug fixing',
      'Documentation',
    ],
    configuration: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
    },
    stats: {
      tasksCompleted: 42,
      successRate: 0.95,
      averageResponseTime: '1.2s',
      totalRuntime: '24h 15m',
    },
  };

  // Mock data for recent tasks
  const recentTasks = [
    {
      id: 1,
      name: 'Generate React component',
      status: 'completed',
      date: '2023-06-01',
    },
    {
      id: 2,
      name: 'Fix CSS bug',
      status: 'completed',
      date: '2023-05-30',
    },
    {
      id: 3,
      name: 'Optimize database query',
      status: 'failed',
      date: '2023-05-28',
    },
  ];

  // Mock data for benchmark results
  const benchmarkResults = [
    {
      id: 1,
      name: 'HumanEval',
      score: '85%',
      date: '2023-05-20',
    },
    {
      id: 2,
      name: 'CodeXGLUE',
      score: '78%',
      date: '2023-05-15',
    },
  ];

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case AGENT_STATUS.ACTIVE:
        return 'success';
      case AGENT_STATUS.INACTIVE:
        return 'default';
      case AGENT_STATUS.RUNNING:
        return 'info';
      case AGENT_STATUS.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              component={RouterLink}
              to="/agents"
              sx={{ mr: 1 }}
              aria-label="back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">{agent.name}</Typography>
            <Chip
              label={agent.status}
              color={getStatusColor(agent.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <Box>
            {agent.status === AGENT_STATUS.ACTIVE && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                sx={{ mr: 1 }}
              >
                Run
              </Button>
            )}
            {agent.status === AGENT_STATUS.RUNNING && (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                sx={{ mr: 1 }}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={RouterLink}
              to={`/agents/${id}/edit`}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Agent info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {agent.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body1">{agent.type}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Model
                    </Typography>
                    <Typography variant="body1">{agent.model}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography variant="body1">{agent.createdAt}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Last Active
                    </Typography>
                    <Typography variant="body1">{agent.lastActive}</Typography>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Capabilities
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {agent.capabilities.map((capability) => (
                    <Chip
                      key={capability}
                      label={capability}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Stats
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Tasks Completed
                    </Typography>
                    <Typography variant="h5">
                      {agent.stats.tasksCompleted}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Success Rate
                    </Typography>
                    <Typography variant="h5">
                      {(agent.stats.successRate * 100).toFixed(0)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Avg. Response Time
                    </Typography>
                    <Typography variant="h5">
                      {agent.stats.averageResponseTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Total Runtime
                    </Typography>
                    <Typography variant="h5">
                      {agent.stats.totalRuntime}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Configuration" />
            <Tab label="Recent Tasks" />
            <Tab label="Benchmark Results" />
          </Tabs>
          <Divider />

          {/* Tab content */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Model Configuration
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Temperature
                    </Typography>
                    <Typography variant="body1">
                      {agent.configuration.temperature}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Max Tokens
                    </Typography>
                    <Typography variant="body1">
                      {agent.configuration.maxTokens}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Top P
                    </Typography>
                    <Typography variant="body1">
                      {agent.configuration.topP}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            )}

            {tabValue === 1 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Recent Tasks</Typography>
                  <IconButton size="small" title="Refresh">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                {recentTasks.map((task) => (
                  <Box
                    key={task.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component={RouterLink}
                        to={`/tasks/${task.id}`}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {task.name}
                      </Typography>
                      <Chip
                        label={task.status}
                        color={
                          task.status === 'completed' ? 'success' : 'error'
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {task.date}
                    </Typography>
                  </Box>
                ))}
                <Button
                  component={RouterLink}
                  to="/tasks"
                  variant="outlined"
                  fullWidth
                >
                  View All Tasks
                </Button>
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Benchmark Results</Typography>
                  <IconButton size="small" title="Refresh">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                {benchmarkResults.map((benchmark) => (
                  <Box
                    key={benchmark.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography
                        component={RouterLink}
                        to={`/benchmarks/${benchmark.id}`}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {benchmark.name}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {benchmark.score}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {benchmark.date}
                    </Typography>
                  </Box>
                ))}
                <Button
                  component={RouterLink}
                  to="/benchmarks"
                  variant="outlined"
                  fullWidth
                >
                  View All Benchmarks
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AgentDetail;
