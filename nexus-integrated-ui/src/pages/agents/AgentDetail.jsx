import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Speed as SpeedIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon
} from '@mui/icons-material';
import { agentApi, taskApi, benchmarkApi } from '../../services/api';

/**
 * TabPanel component for the agent detail tabs
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`agent-tabpanel-${index}`}
      aria-labelledby={`agent-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * AgentDetail page component
 * Displays detailed information about an agent and allows editing
 */
const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedAgent, setEditedAgent] = useState(null);

  // Fetch agent
  const {
    data: agent,
    isLoading,
    error
  } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentApi.getAgent(id),
    onSuccess: (data) => {
      setEditedAgent(data);
    }
  });

  // Fetch agent tasks
  const {
    data: tasks,
    isLoading: tasksLoading
  } = useQuery({
    queryKey: ['agentTasks', id],
    queryFn: () => taskApi.getTasks({ agentId: id })
  });

  // Fetch agent benchmarks
  const {
    data: benchmarks,
    isLoading: benchmarksLoading
  } = useQuery({
    queryKey: ['agentBenchmarks', id],
    queryFn: () => benchmarkApi.getBenchmarks({ agentId: id })
  });

  // Fetch agent logs
  const {
    data: logs,
    isLoading: logsLoading
  } = useQuery({
    queryKey: ['agentLogs', id],
    queryFn: () => agentApi.getAgentLogs(id)
  });

  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: (updatedAgent) => agentApi.updateAgent(id, updatedAgent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
      setIsEditing(false);
    }
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: () => agentApi.deleteAgent(id),
    onSuccess: () => {
      navigate('/agents');
    }
  });

  // Start agent mutation
  const startAgentMutation = useMutation({
    mutationFn: () => agentApi.startAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    }
  });

  // Stop agent mutation
  const stopAgentMutation = useMutation({
    mutationFn: () => agentApi.stopAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    }
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle edit mode
  const handleEditMode = () => {
    setIsEditing(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedAgent(agent);
    setIsEditing(false);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    updateAgentMutation.mutate(editedAgent);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedAgent(prev => ({
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

  // Handle delete agent
  const handleDeleteAgent = () => {
    deleteAgentMutation.mutate();
  };

  // Handle start agent
  const handleStartAgent = () => {
    startAgentMutation.mutate();
  };

  // Handle stop agent
  const handleStopAgent = () => {
    stopAgentMutation.mutate();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      case 'starting':
      case 'stopping':
        return 'warning';
      default:
        return 'default';
    }
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
        Error loading agent: {error.message}
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
              value={editedAgent.name}
              onChange={handleInputChange}
              variant="outlined"
              size="small"
              sx={{ minWidth: 300 }}
            />
          ) : (
            agent.name
          )}
        </Typography>
        <Box>
          {agent.status === 'active' ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStopAgent}
              disabled={stopAgentMutation.isLoading}
              sx={{ mr: 1 }}
            >
              {stopAgentMutation.isLoading ? <CircularProgress size={24} /> : 'Stop Agent'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="success"
              startIcon={<StartIcon />}
              onClick={handleStartAgent}
              disabled={startAgentMutation.isLoading}
              sx={{ mr: 1 }}
            >
              {startAgentMutation.isLoading ? <CircularProgress size={24} /> : 'Start Agent'}
            </Button>
          )}

          {isEditing ? (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={updateAgentMutation.isLoading}
                sx={{ mr: 1 }}
              >
                {updateAgentMutation.isLoading ? <CircularProgress size={24} /> : 'Save'}
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

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="agent tabs">
            <Tab label="Overview" />
            <Tab label="Tasks" />
            <Tab label="Benchmarks" />
            <Tab label="Logs" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Agent Details" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Chip
                        label={agent.status}
                        color={getStatusColor(agent.status)}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Type
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      {isEditing ? (
                        <TextField
                          name="type"
                          value={editedAgent.type}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          fullWidth
                        />
                      ) : (
                        <Typography>{agent.type}</Typography>
                      )}
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      {isEditing ? (
                        <TextField
                          name="description"
                          value={editedAgent.description}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          fullWidth
                          multiline
                          rows={3}
                        />
                      ) : (
                        <Typography>{agent.description}</Typography>
                      )}
                    </Grid>

                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Created
                      </Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography>
                        {new Date(agent.createdAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Capabilities" />
                <CardContent>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {agent.capabilities.map((capability) => (
                      <Chip
                        key={capability}
                        label={capability}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tasks Tab */}
        <TabPanel value={tabValue} index={1}>
          {tasksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : tasks?.length === 0 ? (
            <Alert severity="info">No tasks found for this agent</Alert>
          ) : (
            <List>
              {tasks?.map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AssignmentIcon />}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      View
                    </Button>
                  }
                >
                  <ListItemText
                    primary={task.name}
                    secondary={`Status: ${task.status} | Priority: ${task.priority} | Created: ${new Date(task.createdAt).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              onClick={() => navigate('/tasks', { state: { agentId: id } })}
            >
              Create New Task
            </Button>
          </Box>
        </TabPanel>

        {/* Benchmarks Tab */}
        <TabPanel value={tabValue} index={2}>
          {benchmarksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : benchmarks?.length === 0 ? (
            <Alert severity="info">No benchmarks found for this agent</Alert>
          ) : (
            <List>
              {benchmarks?.map((benchmark) => (
                <ListItem
                  key={benchmark.id}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<SpeedIcon />}
                      onClick={() => navigate(`/benchmarks/${benchmark.id}`)}
                    >
                      View
                    </Button>
                  }
                >
                  <ListItemText
                    primary={benchmark.name}
                    secondary={`Type: ${benchmark.type} | Status: ${benchmark.status} | Score: ${benchmark.score || 'N/A'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SpeedIcon />}
              onClick={() => navigate('/benchmarks', { state: { agentId: id } })}
            >
              Run Benchmark
            </Button>
          </Box>
        </TabPanel>

        {/* Logs Tab */}
        <TabPanel value={tabValue} index={3}>
          {logsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : logs?.length === 0 ? (
            <Alert severity="info">No logs found for this agent</Alert>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Agent Logs
              </Typography>
              <Box
                sx={{
                  maxHeight: 400,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  bgcolor: 'grey.900',
                  color: 'grey.300',
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {logs?.map((log, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: log.level === 'error' ? 'error.main' :
                               log.level === 'warning' ? 'warning.main' : 'inherit'
                      }}
                    >
                      [{new Date(log.timestamp).toLocaleString()}] [{log.level.toUpperCase()}] {log.message}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </TabPanel>

        {/* Delete Agent Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
          <DialogTitle>Delete Agent</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the agent "{agent.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteDialogClose}>Cancel</Button>
            <Button
              onClick={handleDeleteAgent}
              color="error"
              disabled={deleteAgentMutation.isLoading}
            >
              {deleteAgentMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default AgentDetail;
