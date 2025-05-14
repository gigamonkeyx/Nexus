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
  LinearProgress,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { BENCHMARK_STATUS } from '../../config';

/**
 * BenchmarkDetail page component
 * Displays detailed information about a specific benchmark
 */
const BenchmarkDetail = () => {
  const { id } = useParams();
  const [tabValue, setTabValue] = useState(0);

  // Mock data for benchmark details
  const benchmark = {
    id: parseInt(id),
    name: 'HumanEval',
    description: 'Evaluates code generation capabilities',
    status: BENCHMARK_STATUS.COMPLETED,
    type: 'Coding',
    createdAt: '2023-05-20 09:30:15',
    startedAt: '2023-05-20 10:00:00',
    completedAt: '2023-05-20 10:45:30',
    duration: '45m 30s',
    progress: 100,
    score: '85%',
    metrics: {
      accuracy: 0.85,
      precision: 0.88,
      recall: 0.82,
      f1Score: 0.85,
    },
    agents: [
      {
        id: 1,
        name: 'CodeAssistant',
        score: '85%',
        status: 'completed',
      },
    ],
    tasks: [
      {
        id: 1,
        name: 'Function implementation',
        description: 'Implement a function to reverse a string',
        status: 'passed',
        score: '100%',
      },
      {
        id: 2,
        name: 'Algorithm implementation',
        description: 'Implement a sorting algorithm',
        status: 'passed',
        score: '90%',
      },
      {
        id: 3,
        name: 'Data structure implementation',
        description: 'Implement a binary search tree',
        status: 'failed',
        score: '65%',
      },
    ],
    results: [
      {
        category: 'Basic Functions',
        score: 95,
        total: 20,
        passed: 19,
      },
      {
        category: 'Algorithms',
        score: 85,
        total: 15,
        passed: 13,
      },
      {
        category: 'Data Structures',
        score: 75,
        total: 10,
        passed: 7,
      },
      {
        category: 'Problem Solving',
        score: 80,
        total: 15,
        passed: 12,
      },
    ],
    logs: [
      {
        timestamp: '2023-05-20 10:00:00',
        level: 'INFO',
        message: 'Benchmark started',
      },
      {
        timestamp: '2023-05-20 10:00:05',
        level: 'INFO',
        message: 'Loading test cases',
      },
      {
        timestamp: '2023-05-20 10:00:15',
        level: 'INFO',
        message: 'Running tests for agent: CodeAssistant',
      },
      {
        timestamp: '2023-05-20 10:15:30',
        level: 'INFO',
        message: 'Completed basic function tests: 19/20 passed',
      },
      {
        timestamp: '2023-05-20 10:30:45',
        level: 'INFO',
        message: 'Completed algorithm tests: 13/15 passed',
      },
      {
        timestamp: '2023-05-20 10:40:15',
        level: 'WARNING',
        message: 'Data structure tests: 7/10 passed',
      },
      {
        timestamp: '2023-05-20 10:45:00',
        level: 'INFO',
        message: 'Completed problem solving tests: 12/15 passed',
      },
      {
        timestamp: '2023-05-20 10:45:30',
        level: 'INFO',
        message: 'Benchmark completed successfully',
      },
    ],
  };

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case BENCHMARK_STATUS.COMPLETED:
        return 'success';
      case BENCHMARK_STATUS.RUNNING:
        return 'info';
      case BENCHMARK_STATUS.PENDING:
        return 'warning';
      case BENCHMARK_STATUS.FAILED:
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
              to="/benchmarks"
              sx={{ mr: 1 }}
              aria-label="back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">{benchmark.name}</Typography>
            <Chip
              label={benchmark.status}
              color={getStatusColor(benchmark.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <Box>
            {(benchmark.status === BENCHMARK_STATUS.PENDING ||
              benchmark.status === BENCHMARK_STATUS.FAILED) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                sx={{ mr: 1 }}
              >
                Run
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Benchmark info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {benchmark.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body1">{benchmark.type}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography variant="body1">{benchmark.createdAt}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Started
                    </Typography>
                    <Typography variant="body1">
                      {benchmark.startedAt || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Completed
                    </Typography>
                    <Typography variant="body1">
                      {benchmark.completedAt || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">
                      {benchmark.duration || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Score
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(benchmark.score)}
                    color={
                      parseFloat(benchmark.score) >= 80
                        ? 'success'
                        : parseFloat(benchmark.score) >= 60
                        ? 'warning'
                        : 'error'
                    }
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography
                  variant="h3"
                  align="center"
                  sx={{
                    color:
                      parseFloat(benchmark.score) >= 80
                        ? 'success.main'
                        : parseFloat(benchmark.score) >= 60
                        ? 'warning.main'
                        : 'error.main',
                  }}
                >
                  {benchmark.score}
                </Typography>
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
            <Tab label="Results" />
            <Tab label="Agents" />
            <Tab label="Tasks" />
            <Tab label="Logs" />
          </Tabs>
          <Divider />

          {/* Tab content */}
          <Box sx={{ p: 3 }}>
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Benchmark Results
                </Typography>
                <Grid container spacing={3}>
                  {benchmark.results.map((result) => (
                    <Grid item xs={12} sm={6} md={3} key={result.category}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            color="textSecondary"
                            gutterBottom
                          >
                            {result.category}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{
                              color:
                                result.score >= 80
                                  ? 'success.main'
                                  : result.score >= 60
                                  ? 'warning.main'
                                  : 'error.main',
                            }}
                          >
                            {result.score}%
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {result.passed}/{result.total} passed
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Metrics
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            color="textSecondary"
                            gutterBottom
                          >
                            Accuracy
                          </Typography>
                          <Typography variant="h4">
                            {(benchmark.metrics.accuracy * 100).toFixed(0)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            color="textSecondary"
                            gutterBottom
                          >
                            Precision
                          </Typography>
                          <Typography variant="h4">
                            {(benchmark.metrics.precision * 100).toFixed(0)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            color="textSecondary"
                            gutterBottom
                          >
                            Recall
                          </Typography>
                          <Typography variant="h4">
                            {(benchmark.metrics.recall * 100).toFixed(0)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card>
                        <CardContent>
                          <Typography
                            variant="subtitle1"
                            color="textSecondary"
                            gutterBottom
                          >
                            F1 Score
                          </Typography>
                          <Typography variant="h4">
                            {(benchmark.metrics.f1Score * 100).toFixed(0)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
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
                  <Typography variant="h6">Agents</Typography>
                  <Button variant="outlined" startIcon={<AddIcon />}>
                    Add Agent
                  </Button>
                </Box>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {benchmark.agents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>
                            <Typography
                              component={RouterLink}
                              to={`/agents/${agent.id}`}
                              sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                '&:hover': {
                                  textDecoration: 'underline',
                                },
                              }}
                            >
                              {agent.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={agent.status}
                              color={
                                agent.status === 'completed'
                                  ? 'success'
                                  : agent.status === 'running'
                                  ? 'info'
                                  : agent.status === 'failed'
                                  ? 'error'
                                  : 'default'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 'bold',
                                color:
                                  parseFloat(agent.score) >= 80
                                    ? 'success.main'
                                    : parseFloat(agent.score) >= 60
                                    ? 'warning.main'
                                    : 'error.main',
                              }}
                            >
                              {agent.score || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {tabValue === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Tasks
                </Typography>
                {benchmark.tasks.map((task) => (
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
                      <Typography variant="subtitle1">{task.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip
                          label={task.status}
                          color={
                            task.status === 'passed'
                              ? 'success'
                              : task.status === 'failed'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            color:
                              parseFloat(task.score) >= 80
                                ? 'success.main'
                                : parseFloat(task.score) >= 60
                                ? 'warning.main'
                                : 'error.main',
                          }}
                        >
                          {task.score}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {task.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {tabValue === 3 && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Logs</Typography>
                  <IconButton size="small" title="Refresh">
                    <RefreshIcon />
                  </IconButton>
                </Box>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    maxHeight: 400,
                    overflow: 'auto',
                    fontFamily: 'monospace',
                  }}
                >
                  {benchmark.logs.map((log, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            log.level === 'ERROR'
                              ? 'error.main'
                              : log.level === 'WARNING'
                              ? 'warning.main'
                              : 'text.primary',
                        }}
                      >
                        [{log.timestamp}] [{log.level}] {log.message}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default BenchmarkDetail;
