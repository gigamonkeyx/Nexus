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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardHeader,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { taskApi, agentApi } from '../../services/api';

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
 * TaskDetail page component
 * Displays detailed information about a task and allows editing
 */
const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Fetch task
  const {
    data: task,
    isLoading,
    error
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getTask(id),
    onSuccess: (data) => {
      setEditedTask(data);
      if (data.agentId) {
        setSelectedAgentId(data.agentId);
      }
    }
  });

  // Fetch agents for assignment
  const {
    data: agents,
    isLoading: agentsLoading
  } = useQuery({
    queryKey: ['agents'],
    queryFn: agentApi.getAgents
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: (updatedTask) => taskApi.updateTask(id, updatedTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setIsEditing(false);
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: () => taskApi.deleteTask(id),
    onSuccess: () => {
      navigate('/tasks');
    }
  });

  // Assign task mutation
  const assignTaskMutation = useMutation({
    mutationFn: (agentId) => taskApi.assignTask(id, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setAssignDialogOpen(false);
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: () => taskApi.completeTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    }
  });

  // Handle edit mode
  const handleEditMode = () => {
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedTask(task);
    setIsEditing(false);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    updateTaskMutation.mutate(editedTask);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle delete task
  const handleDeleteTask = () => {
    deleteTaskMutation.mutate();
  };

  // Handle assign dialog open
  const handleAssignDialogOpen = () => {
    setAssignDialogOpen(true);
  };

  // Handle assign dialog close
  const handleAssignDialogClose = () => {
    setAssignDialogOpen(false);
  };

  // Handle agent selection
  const handleAgentSelection = (e) => {
    setSelectedAgentId(e.target.value);
  };

  // Handle assign task
  const handleAssignTask = () => {
    assignTaskMutation.mutate(selectedAgentId);
  };

  // Handle complete task
  const handleCompleteTask = () => {
    completeTaskMutation.mutate();
  };

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

  // Get agent name by ID
  const getAgentName = (agentId) => {
    const agent = agents?.find(a => a.id === agentId);
    return agent ? agent.name : 'Unknown';
  };

  // Get agent type by ID
  const getAgentType = (agentId) => {
    const agent = agents?.find(a => a.id === agentId);
    return agent ? agent.type : 'Unknown';
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
        Error loading task: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isEditing ? (
            <TextField
              name="name"
              value={editedTask.name}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{ minWidth: 300 }}
            />
          ) : (
            task.name
          )}
        </Typography>
        <Box>
          {task.status !== 'completed' && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleCompleteTask}
              disabled={completeTaskMutation.isLoading}
              sx={{ mr: 1 }}
            >
              {completeTaskMutation.isLoading ? <CircularProgress size={24} /> : 'Complete'}
            </Button>
          )}

          {isEditing ? (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={updateTaskMutation.isLoading}
                sx={{ mr: 1 }}
              >
                {updateTaskMutation.isLoading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditMode}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteDialogOpen}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            {isEditing ? (
              <TextField
                name="description"
                value={editedTask.description}
                onChange={handleInputChange}
                variant="outlined"
                fullWidth
                multiline
                rows={6}
              />
            ) : (
              <Typography variant="body1">
                {task.description}
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>
            {task.status === 'completed' ? (
              <Box>
                <Typography variant="body1">
                  {task.result || 'No results available.'}
                </Typography>
                {task.output && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Output:
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
                      <pre>{task.output}</pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            ) : (
              <Alert severity="info">
                Task has not been completed yet.
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Task Details" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {isEditing ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={editedTask.status}
                        onChange={handleInputChange}
                        label="Status"
                      >
                        {TASK_STATUSES.map((status) => (
                          <MenuItem key={status.id} value={status.id}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={task.status}
                      sx={{ backgroundColor: getStatusColor(task.status), color: 'white' }}
                      size="small"
                    />
                  )}
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  {isEditing ? (
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        name="priority"
                        value={editedTask.priority}
                        onChange={handleInputChange}
                        label="Priority"
                      >
                        {TASK_PRIORITIES.map((priority) => (
                          <MenuItem key={priority.id} value={priority.id}>
                            {priority.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={task.priority}
                      sx={{ backgroundColor: getPriorityColor(task.priority), color: 'white' }}
                      size="small"
                    />
                  )}
                </Grid>

                <Grid item xs={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created
                  </Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography>
                    {new Date(task.createdAt).toLocaleString()}
                  </Typography>
                </Grid>

                {task.completedAt && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completed
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography>
                        {new Date(task.completedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Assigned Agent"
              action={
                task.status !== 'completed' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PersonIcon />}
                    onClick={handleAssignDialogOpen}
                  >
                    {task.agentId ? 'Reassign' : 'Assign'}
                  </Button>
                )
              }
            />
            <CardContent>
              {task.agentId ? (
                <Box>
                  <Typography variant="h6">
                    {getAgentName(task.agentId)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type: {getAgentType(task.agentId)}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/agents/${task.agentId}`)}
                    >
                      View Agent
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  This task is not assigned to any agent.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task "{task.name}"? This action cannot be undone.
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

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleAssignDialogClose}>
        <DialogTitle>Assign Task to Agent</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Select an agent to assign this task to.
          </DialogContentText>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Agent</InputLabel>
            <Select
              value={selectedAgentId}
              onChange={handleAgentSelection}
              label="Agent"
            >
              <MenuItem value="">Unassigned</MenuItem>
              {agents?.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignDialogClose}>Cancel</Button>
          <Button
            onClick={handleAssignTask}
            variant="contained"
            disabled={assignTaskMutation.isLoading}
          >
            {assignTaskMutation.isLoading ? <CircularProgress size={24} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDetail;
