import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { MCP_SERVER_STATUS } from '../../config';

/**
 * MCPServers page component
 * Displays a list of MCP servers
 */
const MCPServers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    url: '',
    port: '',
    type: '',
  });

  // Mock data for MCP servers
  const servers = [
    {
      id: 1,
      name: 'ComfyUI MCP',
      url: 'http://localhost',
      port: 3020,
      type: 'Image Generation',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 2,
      name: 'Supabase MCP',
      url: 'http://localhost',
      port: 3007,
      type: 'Database',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 3,
      name: 'Ollama MCP',
      url: 'http://localhost',
      port: 3011,
      type: 'LLM',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 4,
      name: 'Terminal MCP',
      url: 'http://localhost',
      port: 3014,
      type: 'Terminal',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 5,
      name: 'Memory Server',
      url: 'stdio',
      port: null,
      type: 'Memory',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 6,
      name: 'File Explorer',
      url: 'stdio',
      port: null,
      type: 'File System',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 7,
      name: 'Code Sandbox',
      url: 'stdio',
      port: null,
      type: 'Code Execution',
      status: MCP_SERVER_STATUS.ONLINE,
      lastConnected: '2023-06-02 10:15:30',
      version: '1.0.0',
    },
    {
      id: 8,
      name: 'Image Research MCP',
      url: 'http://localhost',
      port: 3025,
      type: 'Image Research',
      status: MCP_SERVER_STATUS.ERROR,
      lastConnected: '2023-06-01 15:45:20',
      version: '1.0.0',
      error: 'Sharp module not found',
    },
  ];

  // Filter servers based on search query
  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.url && server.url.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case MCP_SERVER_STATUS.ONLINE:
        return 'success';
      case MCP_SERVER_STATUS.OFFLINE:
        return 'default';
      case MCP_SERVER_STATUS.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle add dialog open
  const handleAddDialogOpen = () => {
    setOpenAddDialog(true);
  };

  // Handle add dialog close
  const handleAddDialogClose = () => {
    setOpenAddDialog(false);
    setNewServer({
      name: '',
      url: '',
      port: '',
      type: '',
    });
  };

  // Handle new server input change
  const handleNewServerChange = (e) => {
    const { name, value } = e.target;
    setNewServer((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle add server
  const handleAddServer = () => {
    // In a real app, this would make an API call to add the server
    console.log('Adding server:', newServer);
    handleAddDialogClose();
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
          <Typography variant="h4">MCP Servers</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddDialogOpen}
            >
              Add Server
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Search servers by name, type, status, or URL"
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

        <Grid container spacing={3}>
          {filteredServers.map((server) => (
            <Grid item xs={12} sm={6} md={4} key={server.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    display: 'flex',
                  }}
                >
                  <Chip
                    label={server.status}
                    color={getStatusColor(server.status)}
                    size="small"
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {server.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {server.type}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>URL:</strong> {server.url}
                      {server.port ? `:${server.port}` : ''}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Version:</strong> {server.version}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Connected:</strong> {server.lastConnected}
                    </Typography>
                    {server.error && (
                      <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 1 }}
                      >
                        <strong>Error:</strong> {server.error}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <Divider />
                <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  {server.status === MCP_SERVER_STATUS.OFFLINE && (
                    <IconButton
                      color="primary"
                      size="small"
                      title="Start server"
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  )}
                  {server.status === MCP_SERVER_STATUS.ONLINE && (
                    <IconButton
                      color="error"
                      size="small"
                      title="Stop server"
                    >
                      <StopIcon />
                    </IconButton>
                  )}
                  <IconButton size="small" title="Edit server">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    title="Delete server"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Add Server Dialog */}
      <Dialog open={openAddDialog} onClose={handleAddDialogClose}>
        <DialogTitle>Add MCP Server</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Server Name"
            type="text"
            fullWidth
            value={newServer.name}
            onChange={handleNewServerChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="url"
            label="Server URL"
            type="text"
            fullWidth
            value={newServer.url}
            onChange={handleNewServerChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="port"
            label="Port"
            type="number"
            fullWidth
            value={newServer.port}
            onChange={handleNewServerChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="type"
            label="Server Type"
            type="text"
            fullWidth
            value={newServer.type}
            onChange={handleNewServerChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddDialogClose}>Cancel</Button>
          <Button
            onClick={handleAddServer}
            variant="contained"
            disabled={!newServer.name || !newServer.url || !newServer.type}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MCPServers;
