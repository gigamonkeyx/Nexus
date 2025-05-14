import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { taskApi, agentApi } from '../../services/api';
import { PAGINATION } from '../../config';

// Task priorities
const TASK_PRIORITIES = [
  { id: 'high', name: 'High', color: '#f44336' },
  { id: 'medium', name: 'Medium', color: '#ff9800' },
  { id: 'low', name: 'Low', color: '#4caf50' }
];

// Task statuses
const TASK_STATUSES = [
  { id: 'pending', name: 'Pending', color: '#9e9e9e' },
  { id: 'in-progress', name: 'In Progress', color: '#2196f3' },
  { id: 'completed', name: 'Completed', color: '#4caf50' },
  { id: 'failed', name: 'Failed', color: '#f44336' }
];

/**
 * Tasks page component
 * Displays a list of tasks and allows creating, editing, and deleting tasks
 */
const Tasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Get agentId from location state if available
  const initialAgentId = location.state?.agentId || '';

  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.defaultPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState(initialAgentId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium',
    agentId: initialAgentId
  });

  // Fetch tasks
  const {
    data: tasks,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: taskApi.getTasks
  });

  // Fetch agents for assignment
  const {
    data: agents
  } = useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setCreateDialogOpen(false);
      setNewTask({
        name: '',
        description: '',
        priority: 'medium',
        agentId: initialAgentId
      });
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteDialogOpen(false);
      setSelectedTask(null);
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: taskApi.completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  // Handle status filter
  const handleStatusFilter = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // Handle priority filter
  const handlePriorityFilter = (event) => {
    setPriorityFilter(event.target.value);
    setPage(0);
  };

  // Handle agent filter
  const handleAgentFilter = (event) => {
    setAgentFilter(event.target.value);
    setPage(0);
  };

  // Handle create dialog open
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  // Handle create dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = (task) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle new task change
  const handleNewTaskChange = (event) => {
    const { name, value } = event.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle create task
  const handleCreateTask = () => {
    createTaskMutation.mutate(newTask);
  };

  // Handle delete task
  const handleDeleteTask = () => {
    if (selectedTask) {
      deleteTaskMutation.mutate(selectedTask.id);
    }
  };

  // Handle complete task
  const handleCompleteTask = (id) => {
    completeTaskMutation.mutate(id);
  };

  // Filter tasks
  const filteredTasks = tasks?.filter(task => {
    // Search filter
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter ? task.status === statusFilter : true;

    // Priority filter
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;

    // Agent filter
    const matchesAgent = agentFilter ? task.agentId === agentFilter : true;

    return matchesSearch && matchesStatus && matchesPriority && matchesAgent;
  }) || [];

  // Paginate tasks
  const paginatedTasks = filteredTasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityObj = TASK_PRIORITIES.find(p => p.id === priority);
    return priorityObj ? priorityObj.color : '#9e9e9e';
  };

  // Get status color
  const getStatusColor = (status) => {
    const statusObj = TASK_STATUSES.find(s => s.id === status);
    return statusObj ? statusObj.color : '#9e9e9e';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon sx={{ color: getStatusColor(status) }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: getStatusColor(status) }} />;
      case 'in-progress':
        return <HourglassEmptyIcon sx={{ color: getStatusColor(status) }} />;
      default:
        return <PendingIcon sx={{ color: getStatusColor(status) }} />;
    }
  };

  // Get agent name by ID
  const getAgentName = (agentId) => {
    const agent = agents?.find(a => a.id === agentId);
    return agent ? agent.name : 'Unassigned';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Tasks
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
            sx={{ mr: 1 }}
          >
            Create Task
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
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  {TASK_STATUSES.map((status) => (
                    <MenuItem key={status.id} value={status.id}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={handlePriorityFilter}
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  {TASK_PRIORITIES.map((priority) => (
                    <MenuItem key={priority.id} value={priority.id}>
                      {priority.name}
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
        <Alert severity="error">Failed to load tasks</Alert>
      ) : filteredTasks.length === 0 ? (
        <Alert severity="info">No tasks found</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      {task.name}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(task.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {task.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority}
                        sx={{ backgroundColor: getPriorityColor(task.priority), color: 'white' }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {getAgentName(task.agentId)}
                    </TableCell>
                    <TableCell>
                      {new Date(task.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      {task.status !== 'completed' && (
                        <Tooltip title="Complete Task">
                          <IconButton
                            color="success"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completeTaskMutation.isLoading}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit Task">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/tasks/${task.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Task">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteDialogOpen(task)}
                          disabled={deleteTaskMutation.isLoading}
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
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details to create a new task.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="name"
                label="Task Name"
                fullWidth
                variant="outlined"
                value={newTask.name}
                onChange={handleNewTaskChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                variant="outlined"
                value={newTask.description}
                onChange={handleNewTaskChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleNewTaskChange}
                  label="Priority"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <MenuItem key={priority.id} value={priority.id}>
                      {priority.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Assign to Agent</InputLabel>
                <Select
                  name="agentId"
                  value={newTask.agentId}
                  onChange={handleNewTaskChange}
                  label="Assign to Agent"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {agents?.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.name || createTaskMutation.isLoading}
          >
            {createTaskMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task "{selectedTask?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            onClick={handleDeleteTask}
            color="error"
            disabled={deleteTaskMutation.isLoading}
          >
            {deleteTaskMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;
