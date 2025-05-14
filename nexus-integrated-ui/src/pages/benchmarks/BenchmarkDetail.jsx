import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import { benchmarkApi, agentApi } from '../../services/api';

// Benchmark types
const BENCHMARK_TYPES = [
  { id: 'humaneval', name: 'HumanEval', description: 'Evaluates code generation capabilities' },
  { id: 'codexglue', name: 'CodeXGLUE', description: 'Evaluates code understanding and generation' },
  { id: 'tau-bench', name: 'τ-bench', description: 'Evaluates tool usage capabilities' },
  { id: 'agentbench', name: 'AgentBench', description: 'Evaluates agent capabilities' },
  { id: 'mle-bench', name: 'MLE-bench', description: 'Evaluates machine learning engineering capabilities' }
];

/**
 * BenchmarkDetail page component
 * Displays detailed information about a benchmark
 */
const BenchmarkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);

  // Fetch benchmark
  const {
    data: benchmark,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['benchmark', id],
    queryFn: () => benchmarkApi.getBenchmark(id)
  });

  // Fetch agent
  const {
    data: agent,
    isLoading: agentLoading
  } = useQuery({
    queryKey: ['agent', benchmark?.agentId],
    queryFn: () => agentApi.getAgent(benchmark?.agentId),
    enabled: !!benchmark?.agentId
  });

  // Delete benchmark mutation
  const deleteBenchmarkMutation = useMutation({
    mutationFn: () => benchmarkApi.deleteBenchmark(id),
    onSuccess: () => {
      navigate('/benchmarks');
    }
  });

  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle delete benchmark
  const handleDeleteBenchmark = () => {
    deleteBenchmarkMutation.mutate();
  };

  // Handle problem dialog open
  const handleProblemDialogOpen = (problem) => {
    setSelectedProblem(problem);
    setProblemDialogOpen(true);
  };

  // Handle problem dialog close
  const handleProblemDialogClose = () => {
    setProblemDialogOpen(false);
  };

  // Get benchmark type name
  const getBenchmarkTypeName = (typeId) => {
    const type = BENCHMARK_TYPES.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  // Get problem status icon
  const getProblemStatusIcon = (passed) => {
    return passed ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading benchmark: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {benchmark.name}
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteDialogOpen}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Benchmark Details" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>
                    {getBenchmarkTypeName(benchmark.type)}
                  </Typography>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getStatusIcon(benchmark.status)}
                    <Typography sx={{ ml: 1 }}>
                      {benchmark.status}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Score
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {benchmark.score !== null ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={benchmark.score}
                          sx={{ height: 8, borderRadius: 5 }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 35 }}>
                        <Typography variant="body2" color="text.secondary">
                          {`${Math.round(benchmark.score)}%`}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    'N/A'
                  )}
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>
                    {new Date(benchmark.createdAt).toLocaleString()}
                  </Typography>
                </Grid>

                {benchmark.completedAt && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completed
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography>
                        {new Date(benchmark.completedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Agent" />
            <CardContent>
              {agentLoading ? (
                <CircularProgress size={24} />
              ) : agent ? (
                <Box>
                  <Typography variant="h6">
                    {agent.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {agent.type}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/agents/${agent.id}`)}
                    >
                      View Agent
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  Agent not found
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Results Summary
            </Typography>
            {benchmark.status === 'completed' ? (
              <Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" align="center">
                          {benchmark.results?.totalProblems || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Total Problems
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" align="center" color="success.main">
                          {benchmark.results?.passedProblems || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Passed
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" align="center" color="error.main">
                          {benchmark.results?.failedProblems || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                          Failed
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {benchmark.results?.problems && benchmark.results.problems.length > 0 && (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Problem</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Time (ms)</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {benchmark.results.problems.map((problem, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{problem.name}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {getProblemStatusIcon(problem.passed)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {problem.passed ? 'Passed' : 'Failed'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{problem.executionTime}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="View Details">
                                <IconButton
                                  color="primary"
                                  onClick={() => handleProblemDialogOpen(problem)}
                                >
                                  <CodeIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ) : benchmark.status === 'running' ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography>
                  Benchmark is currently running...
                </Typography>
              </Box>
            ) : (
              <Alert severity="info">
                No results available. The benchmark has not been completed.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Benchmark</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the benchmark "{benchmark.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            onClick={handleDeleteBenchmark}
            color="error"
            disabled={deleteBenchmarkMutation.isLoading}
          >
            {deleteBenchmarkMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Problem Detail Dialog */}
      <Dialog
        open={problemDialogOpen}
        onClose={handleProblemDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Problem: {selectedProblem?.name}
          <Chip
            label={selectedProblem?.passed ? 'Passed' : 'Failed'}
            color={selectedProblem?.passed ? 'success' : 'error'}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedProblem && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Problem Description
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="body2">
                    {selectedProblem.description || 'No description available.'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Agent Solution
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#1a1a1a',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    color: '#f0f0f0',
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  <pre>{selectedProblem.solution || 'No solution provided.'}</pre>
                </Paper>
              </Grid>

              {selectedProblem.expectedOutput && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Expected Output
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    <pre>{selectedProblem.expectedOutput}</pre>
                  </Paper>
                </Grid>
              )}

              {selectedProblem.actualOutput && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Actual Output
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#f5f5f5',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    <pre>{selectedProblem.actualOutput}</pre>
                  </Paper>
                </Grid>
              )}

              {selectedProblem.error && (
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom color="error">
                    Error
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#ffebee',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      color: '#d32f2f',
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    <pre>{selectedProblem.error}</pre>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Execution Time: {selectedProblem.executionTime} ms
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Memory Usage: {selectedProblem.memoryUsage || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProblemDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BenchmarkDetail;
