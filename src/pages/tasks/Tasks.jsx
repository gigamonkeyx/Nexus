import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Container,
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
  Stop as StopIcon,
} from '@mui/icons-material';
import { TASK_STATUS } from '../../config';

/**
 * Tasks page component
 * Displays a list of agent tasks
 */
const Tasks = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for tasks
  const tasks = [
    {
      id: 1,
      name: 'Generate React component',
      description: 'Create a reusable React component for the dashboard',
      status: TASK_STATUS.COMPLETED,
      agent: 'CodeAssistant',
      agentId: 1,
      createdAt: '2023-06-01',
      completedAt: '2023-06-01',
    },
    {
      id: 2,
      name: 'Fix CSS bug',
      description: 'Fix the layout issue in the navigation menu',
      status: TASK_STATUS.COMPLETED,
      agent: 'CodeAssistant',
      agentId: 1,
      createdAt: '2023-05-30',
      completedAt: '2023-05-30',
    },
    {
      id: 3,
      name: 'Optimize database query',
      description: 'Improve the performance of the user search query',
      status: TASK_STATUS.FAILED,
      agent: 'CodeAssistant',
      agentId: 1,
      createdAt: '2023-05-28',
      completedAt: '2023-05-28',
    },
    {
      id: 4,
      name: 'Analyze user data',
      description: 'Analyze user engagement data and generate insights',
      status: TASK_STATUS.RUNNING,
      agent: 'DataAnalyzer',
      agentId: 2,
      createdAt: '2023-06-02',
      completedAt: null,
    },
    {
      id: 5,
      name: 'Generate weekly report',
      description: 'Create a weekly report of system performance',
      status: TASK_STATUS.PENDING,
      agent: 'DataAnalyzer',
      agentId: 2,
      createdAt: '2023-06-02',
      completedAt: null,
    },
  ];

  // Filter tasks based on search query
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case TASK_STATUS.COMPLETED:
        return 'success';
      case TASK_STATUS.RUNNING:
        return 'info';
      case TASK_STATUS.PENDING:
        return 'warning';
      case TASK_STATUS.FAILED:
        return 'error';
      case TASK_STATUS.CANCELLED:
        return 'default';
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
          <Typography variant="h4">Tasks</Typography>
          <Button
            component={RouterLink}
            to="/tasks/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Task
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search tasks by name, description, agent, or status"
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
                <TableCell>Agent</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Completed</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    <Typography
                      component={RouterLink}
                      to={`/agents/${task.agentId}`}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {task.agent}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{task.createdAt}</TableCell>
                  <TableCell>{task.completedAt || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      {task.status === TASK_STATUS.PENDING && (
                        <IconButton
                          color="primary"
                          size="small"
                          title="Run task"
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                      {task.status === TASK_STATUS.RUNNING && (
                        <IconButton
                          color="error"
                          size="small"
                          title="Stop task"
                        >
                          <StopIcon />
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

export default Tasks;
