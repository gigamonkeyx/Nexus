import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { agentApi } from '../services/api';
import { AGENT_TYPES, PAGINATION } from '../config';

const Agents = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    type: '',
    description: '',
    capabilities: []
  });
  
  // Fetch agents
  const { 
    data: agents, 
    isLoading, 
    error, 
    refetch 
  } = useQuery('agents', agentApi.getAgents);
  
  // Create agent mutation
  const createAgentMutation = useMutation(agentApi.createAgent, {
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
      setCreateDialogOpen(false);
      setNewAgent({
        name: '',
        type: '',
        description: '',
        capabilities: []
      });
    }
  });
  
  // Delete agent mutation
  const deleteAgentMutation = useMutation(agentApi.deleteAgent, {
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
      setDeleteDialogOpen(false);
      setSelectedAgent(null);
    }
  });
  
  // Start agent mutation
  const startAgentMutation = useMutation(agentApi.startAgent, {
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
    }
  });
  
  // Stop agent mutation
  const stopAgentMutation = useMutation(agentApi.stopAgent, {
    onSuccess: () => {
      queryClient.invalidateQueries('agents');
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
  
  // Handle create dialog open
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };
  
  // Handle create dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };
  
  // Handle delete dialog open
  const handleDeleteDialogOpen = (agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };
  
  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };
  
  // Handle new agent change
  const handleNewAgentChange = (event) => {
    const { name, value } = event.target;
    setNewAgent(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle capabilities change
  const handleCapabilitiesChange = (event) => {
    setNewAgent(prev => ({
      ...prev,
      capabilities: event.target.value
    }));
  };
  
  // Handle create agent
  const handleCreateAgent = () => {
    createAgentMutation.mutate(newAgent);
  };
  
  // Handle delete agent
  const handleDeleteAgent = () => {
    if (selectedAgent) {
      deleteAgentMutation.mutate(selectedAgent.id);
    }
  };
  
  // Handle start agent
  const handleStartAgent = (id) => {
    startAgentMutation.mutate(id);
  };
  
  // Handle stop agent
  const handleStopAgent = (id) => {
    stopAgentMutation.mutate(id);
  };
  
  // Filter agents by search term
  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Paginate agents
  const paginatedAgents = filteredAgents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Get agent type name
  const getAgentTypeName = (typeId) => {
    const type = AGENT_TYPES.find(t => t.id === typeId);
    return type ? type.name : typeId;
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'error';
      case 'starting':
      case 'stopping':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Agents
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
            sx={{ mr: 1 }}
          >
            Create Agent
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
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search agents..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Paper>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load agents</Alert>
      ) : filteredAgents.length === 0 ? (
        <Alert severity="info">No agents found</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Capabilities</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAgents.map((agent) => (
                  <TableRow key={agent.id} hover>
                    <TableCell 
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/agents/${agent.id}`)}
                    >
                      {agent.name}
                    </TableCell>
                    <TableCell>{getAgentTypeName(agent.type)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={agent.status} 
                        color={getStatusColor(agent.status)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {agent.capabilities.map((capability) => (
                        <Chip 
                          key={capability} 
                          label={capability} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      {agent.status === 'running' ? (
                        <Tooltip title="Stop Agent">
                          <IconButton 
                            color="error"
                            onClick={() => handleStopAgent(agent.id)}
                            disabled={stopAgentMutation.isLoading}
                          >
                            <StopIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Start Agent">
                          <IconButton 
                            color="success"
                            onClick={() => handleStartAgent(agent.id)}
                            disabled={startAgentMutation.isLoading}
                          >
                            <StartIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit Agent">
                        <IconButton 
                          color="primary"
                          onClick={() => navigate(`/agents/${agent.id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Agent">
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteDialogOpen(agent)}
                          disabled={deleteAgentMutation.isLoading}
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
            rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            component="div"
            count={filteredAgents.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
      
      {/* Create Agent Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Agent</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Fill in the details to create a new agent.
          </DialogContentText>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="name"
                label="Agent Name"
                fullWidth
                variant="outlined"
                value={newAgent.name}
                onChange={handleNewAgentChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent Type</InputLabel>
                <Select
                  name="type"
                  value={newAgent.type}
                  onChange={handleNewAgentChange}
                  label="Agent Type"
                >
                  {AGENT_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                variant="outlined"
                value={newAgent.description}
                onChange={handleNewAgentChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Capabilities</InputLabel>
                <Select
                  multiple
                  name="capabilities"
                  value={newAgent.capabilities}
                  onChange={handleCapabilitiesChange}
                  label="Capabilities"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="basic_agent">Basic Agent</MenuItem>
                  <MenuItem value="task_execution">Task Execution</MenuItem>
                  <MenuItem value="reasoning">Reasoning</MenuItem>
                  <MenuItem value="planning">Planning</MenuItem>
                  <MenuItem value="code_generation">Code Generation</MenuItem>
                  <MenuItem value="data_analysis">Data Analysis</MenuItem>
                  <MenuItem value="research">Research</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button 
            onClick={handleCreateAgent} 
            variant="contained"
            disabled={!newAgent.name || !newAgent.type || createAgentMutation.isLoading}
          >
            {createAgentMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Agent Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the agent "{selectedAgent?.name}"? This action cannot be undone.
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
    </Box>
  );
};

export default Agents;
