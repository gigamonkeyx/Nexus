import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { benchmarkApi, agentApi } from '../../services/api';
import { PAGINATION } from '../../config';

// Benchmark types
const BENCHMARK_TYPES = [
  { id: 'humaneval', name: 'HumanEval', description: 'Evaluates code generation capabilities' },
  { id: 'codexglue', name: 'CodeXGLUE', description: 'Evaluates code understanding and generation' },
  { id: 'tau-bench', name: 'τ-bench', description: 'Evaluates tool usage capabilities' },
  { id: 'agentbench', name: 'AgentBench', description: 'Evaluates agent capabilities' },
  { id: 'mle-bench', name: 'MLE-bench', description: 'Evaluates machine learning engineering capabilities' }
];

/**
 * Benchmarks page component
 * Displays a list of benchmarks and allows running new benchmarks
 */
const Benchmarks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.defaultPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);
  const [newBenchmark, setNewBenchmark] = useState({
    name: '',
    type: '',
    agentId: '',
    parameters: {}
  });

  // Fetch benchmarks
  const {
    data: benchmarks,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: benchmarkApi.getBenchmarks
  });

  // Fetch agents
  const {
    data: agents
  } = useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents
  });

  // Run benchmark mutation
  const runBenchmarkMutation = useMutation({
    mutationFn: benchmarkApi.runBenchmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      setRunDialogOpen(false);
      setNewBenchmark({
        name: '',
        type: '',
        agentId: '',
        parameters: {}
      });
    }
  });

  // Delete benchmark mutation
  const deleteBenchmarkMutation = useMutation({
    mutationFn: benchmarkApi.deleteBenchmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmarks'] });
      setDeleteDialogOpen(false);
      setSelectedBenchmark(null);
    }
  });

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle type filter
  const handleTypeFilter = (event) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  // Handle agent filter
  const handleAgentFilter = (event) => {
    setAgentFilter(event.target.value);
    setPage(0);
  };

  // Handle run dialog open
  const handleRunDialogOpen = () => {
    setRunDialogOpen(true);
  };

  // Handle run dialog close
  const handleRunDialogClose = () => {
    setRunDialogOpen(false);
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = (benchmark) => {
    setSelectedBenchmark(benchmark);
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle new benchmark change
  const handleNewBenchmarkChange = (event) => {
    const { name, value } = event.target;
    setNewBenchmark(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle run benchmark
  const handleRunBenchmark = () => {
    runBenchmarkMutation.mutate(newBenchmark);
  };

  // Handle delete benchmark
  const handleDeleteBenchmark = () => {
    if (selectedBenchmark) {
      deleteBenchmarkMutation.mutate(selectedBenchmark.id);
    }
  };

  // Filter benchmarks
  const filteredBenchmarks = benchmarks?.filter(benchmark => {
    // Search filter
    const matchesSearch =
      benchmark.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      benchmark.type.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    const matchesType = typeFilter ? benchmark.type === typeFilter : true;

    // Agent filter
    const matchesAgent = agentFilter ? benchmark.agentId === agentFilter : true;

    return matchesSearch && matchesType && matchesAgent;
  }) || [];

  // Paginate benchmarks
  const paginatedBenchmarks = filteredBenchmarks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get benchmark type name
  const getBenchmarkTypeName = (typeId) => {
    const type = BENCHMARK_TYPES.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };

  // Get agent name
  const getAgentName = (agentId) => {
    const agent = agents?.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown';
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Benchmarks
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={handleRunDialogOpen}
            sx={{ mr: 1 }}
          >
            Run Benchmark
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search benchmarks..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Benchmark Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={handleTypeFilter}
                  label="Benchmark Type"
                >
                  <MenuItem value="">All</MenuItem>
                  {BENCHMARK_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={agentFilter}
                  onChange={handleAgentFilter}
                  label="Agent"
                >
                  <MenuItem value="">All</MenuItem>
                  {agents?.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load benchmarks</Alert>
      ) : filteredBenchmarks.length === 0 ? (
        <Alert severity="info">No benchmarks found</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBenchmarks.map((benchmark) => (
                  <TableRow key={benchmark.id} hover>
                    <TableCell
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/benchmarks/${benchmark.id}`)}
                    >
                      {benchmark.name}
                    </TableCell>
                    <TableCell>{getBenchmarkTypeName(benchmark.type)}</TableCell>
                    <TableCell>{getAgentName(benchmark.agentId)}</TableCell>
                    <TableCell>
                      <Chip
                        label={benchmark.status}
                        color={getStatusColor(benchmark.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      {new Date(benchmark.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/benchmarks/${benchmark.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Benchmark">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteDialogOpen(benchmark)}
                          disabled={deleteBenchmarkMutation.isLoading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={PAGINATION.pageSizeOptions}
            component="div"
            count={filteredBenchmarks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Run Benchmark Dialog */}
      <Dialog open={runDialogOpen} onClose={handleRunDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Run New Benchmark</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Configure the benchmark to run.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="name"
                label="Benchmark Name"
                fullWidth
                variant="outlined"
                value={newBenchmark.name}
                onChange={handleNewBenchmarkChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Benchmark Type</InputLabel>
                <Select
                  name="type"
                  value={newBenchmark.type}
                  onChange={handleNewBenchmarkChange}
                  label="Benchmark Type"
                >
                  {BENCHMARK_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name} - {type.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent</InputLabel>
                <Select
                  name="agentId"
                  value={newBenchmark.agentId}
                  onChange={handleNewBenchmarkChange}
                  label="Agent"
                >
                  {agents?.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {newBenchmark.type && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Benchmark Parameters
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  {newBenchmark.type === 'humaneval' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Difficulty</InputLabel>
                          <Select
                            name="parameters.difficulty"
                            value={newBenchmark.parameters.difficulty || 'medium'}
                            onChange={handleNewBenchmarkChange}
                            label="Difficulty"
                          >
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="parameters.numProblems"
                          label="Number of Problems"
                          type="number"
                          fullWidth
                          value={newBenchmark.parameters.numProblems || 10}
                          onChange={handleNewBenchmarkChange}
                          InputProps={{ inputProps: { min: 1, max: 100 } }}
                        />
                      </Grid>
                    </Grid>
                  )}
                  {newBenchmark.type === 'codexglue' && (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Task</InputLabel>
                          <Select
                            name="parameters.task"
                            value={newBenchmark.parameters.task || 'code-completion'}
                            onChange={handleNewBenchmarkChange}
                            label="Task"
                          >
                            <MenuItem value="code-completion">Code Completion</MenuItem>
                            <MenuItem value="code-translation">Code Translation</MenuItem>
                            <MenuItem value="code-refinement">Code Refinement</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  )}
                  {(newBenchmark.type !== 'humaneval' && newBenchmark.type !== 'codexglue') && (
                    <Typography variant="body2" color="text.secondary">
                      No additional parameters required for this benchmark type.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRunDialogClose}>Cancel</Button>
          <Button
            onClick={handleRunBenchmark}
            variant="contained"
            disabled={!newBenchmark.name || !newBenchmark.type || !newBenchmark.agentId || runBenchmarkMutation.isLoading}
          >
            {runBenchmarkMutation.isLoading ? <CircularProgress size={24} /> : 'Run Benchmark'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Benchmark Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Benchmark</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the benchmark "{selectedBenchmark?.name}"? This action cannot be undone.
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
    </Box>
  );
};

export default Benchmarks;
