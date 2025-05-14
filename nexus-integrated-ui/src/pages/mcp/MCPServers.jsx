import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { mcpServerApi } from '../../services/api';

/**
 * MCPServers page component
 * Displays and manages MCP servers
 */
const MCPServers = () => {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [newServer, setNewServer] = useState({
    name: '',
    type: '',
    url: '',
    capabilities: [],
  });

  // Fetch MCP servers
  const {
    data: mcpServers,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mcpServers'],
    queryFn: mcpServerApi.getMCPServers
  });

  // Register MCP server mutation
  const registerServerMutation = useMutation({
    mutationFn: mcpServerApi.registerMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpServers'] });
      setCreateDialogOpen(false);
      setNewServer({
        name: '',
        type: '',
        url: '',
        capabilities: [],
      });
    }
  });

  // Update MCP server mutation
  const updateServerMutation = useMutation({
    mutationFn: (updatedServer) =>
      mcpServerApi.updateMCPServer(selectedServer.id, updatedServer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpServers'] });
      setEditDialogOpen(false);
      setSelectedServer(null);
    }
  });

  // Delete MCP server mutation
  const deleteServerMutation = useMutation({
    mutationFn: () => mcpServerApi.deleteMCPServer(selectedServer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcpServers'] });
      setDeleteDialogOpen(false);
      setSelectedServer(null);
    }
  });

  // Test MCP server connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: mcpServerApi.testMCPServerConnection
  });

  // Handle create dialog open
  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  // Handle create dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  // Handle edit dialog open
  const handleEditDialogOpen = (server) => {
    setSelectedServer(server);
    setEditDialogOpen(true);
  };

  // Handle edit dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedServer(null);
  };

  // Handle delete dialog open
  const handleDeleteDialogOpen = (server) => {
    setSelectedServer(server);
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedServer(null);
  };

  // Handle new server change
  const handleNewServerChange = (e) => {
    const { name, value } = e.target;
    setNewServer({
      ...newServer,
      [name]: value,
    });
  };

  // Handle selected server change
  const handleSelectedServerChange = (e) => {
    const { name, value } = e.target;
    setSelectedServer({
      ...selectedServer,
      [name]: value,
    });
  };

  // Handle create server
  const handleCreateServer = () => {
    registerServerMutation.mutate(newServer);
  };

  // Handle update server
  const handleUpdateServer = () => {
    updateServerMutation.mutate(selectedServer);
  };

  // Handle delete server
  const handleDeleteServer = () => {
    deleteServerMutation.mutate();
  };

  // Handle test connection
  const handleTestConnection = (id) => {
    testConnectionMutation.mutate(id);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">MCP Servers</Typography>
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            Add Server
          </Button>
        </Box>
      </Box>

      {/* Server list */}
      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">Error loading MCP servers</Alert>
      ) : mcpServers?.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No MCP servers found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Add a new MCP server to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateDialogOpen}
          >
            Add Server
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {mcpServers?.map((server) => (
            <Grid item xs={12} sm={6} md={4} key={server.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      {server.name}
                    </Typography>
                    <Chip
                      label={server.status}
                      color={server.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Type: {server.type}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    URL: {server.url}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {server.capabilities.map((capability) => (
                      <Chip
                        key={capability}
                        label={capability}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
                <CardActions>
                  <Tooltip title="Test Connection">
                    <IconButton
                      color="primary"
                      onClick={() => handleTestConnection(server.id)}
                    >
                      <CheckIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      color="primary"
                      onClick={() => handleEditDialogOpen(server)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteDialogOpen(server)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  {server.status === 'active' ? (
                    <Tooltip title="Stop">
                      <IconButton color="warning">
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Start">
                      <IconButton color="success">
                        <StartIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add MCP Server</DialogTitle>
        <DialogContent>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Name"
            name="name"
            value={newServer.name}
            onChange={handleNewServerChange}
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={newServer.type}
              onChange={handleNewServerChange}
              label="Type"
            >
              <MenuItem value="ollama">Ollama</MenuItem>
              <MenuItem value="comfyui">ComfyUI</MenuItem>
              <MenuItem value="supabase">Supabase</MenuItem>
              <MenuItem value="terminal">Terminal</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            required
            fullWidth
            label="URL"
            name="url"
            value={newServer.url}
            onChange={handleNewServerChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Capabilities</InputLabel>
            <Select
              multiple
              name="capabilities"
              value={newServer.capabilities}
              onChange={handleNewServerChange}
              label="Capabilities"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="text-generation">Text Generation</MenuItem>
              <MenuItem value="image-generation">Image Generation</MenuItem>
              <MenuItem value="database">Database</MenuItem>
              <MenuItem value="file-system">File System</MenuItem>
              <MenuItem value="terminal">Terminal</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
          <Button
            onClick={handleCreateServer}
            variant="contained"
            disabled={registerServerMutation.isLoading}
          >
            {registerServerMutation.isLoading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit MCP Server</DialogTitle>
        <DialogContent>
          {selectedServer && (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Name"
                name="name"
                value={selectedServer.name}
                onChange={handleSelectedServerChange}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={selectedServer.type}
                  onChange={handleSelectedServerChange}
                  label="Type"
                >
                  <MenuItem value="ollama">Ollama</MenuItem>
                  <MenuItem value="comfyui">ComfyUI</MenuItem>
                  <MenuItem value="supabase">Supabase</MenuItem>
                  <MenuItem value="terminal">Terminal</MenuItem>
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="normal"
                required
                fullWidth
                label="URL"
                name="url"
                value={selectedServer.url}
                onChange={handleSelectedServerChange}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Capabilities</InputLabel>
                <Select
                  multiple
                  name="capabilities"
                  value={selectedServer.capabilities}
                  onChange={handleSelectedServerChange}
                  label="Capabilities"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="text-generation">Text Generation</MenuItem>
                  <MenuItem value="image-generation">Image Generation</MenuItem>
                  <MenuItem value="database">Database</MenuItem>
                  <MenuItem value="file-system">File System</MenuItem>
                  <MenuItem value="terminal">Terminal</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button
            onClick={handleUpdateServer}
            variant="contained"
            disabled={updateServerMutation.isLoading}
          >
            {updateServerMutation.isLoading ? <CircularProgress size={24} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete MCP Server</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the MCP server "{selectedServer?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button
            onClick={handleDeleteServer}
            variant="contained"
            color="error"
            disabled={deleteServerMutation.isLoading}
          >
            {deleteServerMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPServers;
