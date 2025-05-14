import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { BENCHMARK_STATUS } from '../../config';

/**
 * Benchmarks page component
 * Displays a list of benchmarks for evaluating agents
 */
const Benchmarks = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for benchmarks
  const benchmarks = [
    {
      id: 1,
      name: 'HumanEval',
      description: 'Evaluates code generation capabilities',
      status: BENCHMARK_STATUS.COMPLETED,
      type: 'Coding',
      createdAt: '2023-05-20',
      lastRun: '2023-05-20',
      agents: ['CodeAssistant'],
      score: '85%',
    },
    {
      id: 2,
      name: 'CodeXGLUE',
      description: 'Evaluates code understanding and generation',
      status: BENCHMARK_STATUS.COMPLETED,
      type: 'Coding',
      createdAt: '2023-05-15',
      lastRun: '2023-05-15',
      agents: ['CodeAssistant'],
      score: '78%',
    },
    {
      id: 3,
      name: 'τ-bench',
      description: 'Evaluates reasoning capabilities',
      status: BENCHMARK_STATUS.PENDING,
      type: 'Reasoning',
      createdAt: '2023-06-01',
      lastRun: null,
      agents: [],
      score: null,
    },
    {
      id: 4,
      name: 'AgentBench',
      description: 'Evaluates agent capabilities and decision making',
      status: BENCHMARK_STATUS.RUNNING,
      type: 'Agent',
      createdAt: '2023-06-02',
      lastRun: '2023-06-02',
      agents: ['CodeAssistant', 'DataAnalyzer'],
      score: null,
    },
    {
      id: 5,
      name: 'MLE-bench',
      description: 'Evaluates machine learning capabilities',
      status: BENCHMARK_STATUS.FAILED,
      type: 'ML',
      createdAt: '2023-05-25',
      lastRun: '2023-05-25',
      agents: ['DataAnalyzer'],
      score: null,
    },
  ];

  // Filter benchmarks based on search query
  const filteredBenchmarks = benchmarks.filter(
    (benchmark) =>
      benchmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benchmark.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benchmark.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benchmark.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Benchmarks</Typography>
          <Button
            component={RouterLink}
            to="/benchmarks/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Benchmark
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search benchmarks by name, description, type, or status"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Run</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBenchmarks.map((benchmark) => (
                <TableRow key={benchmark.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{benchmark.description}</TableCell>
                  <TableCell>{benchmark.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={benchmark.status}
                      color={getStatusColor(benchmark.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{benchmark.lastRun || '-'}</TableCell>
                  <TableCell>
                    {benchmark.score ? (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
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
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      {(benchmark.status === BENCHMARK_STATUS.PENDING ||
                        benchmark.status === BENCHMARK_STATUS.FAILED) && (
                        <IconButton
                          color="primary"
                          size="small"
                          title="Run benchmark"
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" title="More options">
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Benchmarks;
