import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Info as InfoIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { nexusService } from '../services/nexusService';

const Servers = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [newServer, setNewServer] = useState({ id: '', config: { command: '', args: [] } });
  const [error, setError] = useState('');
  
  // Fetch servers
  const { 
    data: servers, 
    isLoading,
    error: serversError,
    refetch
  } = useQuery('servers', nexusService.getAllServers);
  
  // Connect server mutation
  const connectMutation = useMutation(nexusService.connectServer, {
    onSuccess: () => {
      queryClient.invalidateQueries('servers');
    }
  });
  
  // Disconnect server mutation
  const disconnectMutation = useMutation(nexusService.disconnectServer, {
    onSuccess: () => {
      queryClient.invalidateQueries('servers');
    }
  });
  
  // Register server mutation
  const registerMutation = useMutation(nexusService.registerServer, {
    onSuccess: () => {
      queryClient.invalidateQueries('servers');
      setOpenDialog(false);
      setNewServer({ id: '', config: { command: '', args: [] } });
    },
    onError: (error) => {
      setError(error.message || 'Failed to register server');
    }
  });
  
  const handleOpenDialog = () => {
    setError('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleRegisterServer = () => {
    if (!newServer.id || !newServer.config.command) {
      setError('Server ID and command are required');
      return;
    }
    
    // Parse args as array if provided as string
    let args = newServer.config.args;
    if (typeof args === 'string') {
      args = args.split(' ').filter(arg => arg.trim() !== '');
    }
    
    registerMutation.mutate({
      id: newServer.id,
      config: {
        ...newServer.config,
        args
      }
    });
  };
  
  const handleConnectServer = (serverId) => {
    connectMutation.mutate(serverId);
  };
  
  const handleDisconnectServer = (serverId) => {
    disconnectMutation.mutate(serverId);
  };
  
  const handleViewServer = (serverId) => {
    navigate(`/servers/${serverId}`);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          MCP Servers
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            Register Server
          </Button>
        </Box>
      </Box>
      
      {serversError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading servers: {serversError.message}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : servers && Object.keys(servers).length > 0 ? (
        <Grid container spacing={3}>
          {Object.values(servers).map((server) => (
            <Grid item xs={12} md={6} lg={4} key={server.id}>
              <Paper 
                elevation={2} 
                sx={{ p: 2 }}
                className="hover-card"
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" noWrap sx={{ maxWidth: '70%' }}>
                    {server.id}
                  </Typography>
                  
                  <Chip 
                    label={server.running ? "Running" : "Stopped"}
                    color={server.running ? "success" : "default"}
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Command: {server.config?.command || "N/A"}
                  </Typography>
                  
                  {server.config?.args && server.config.args.length > 0 && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      Args: {Array.isArray(server.config.args) ? server.config.args.join(' ') : server.config.args}
                    </Typography>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Tooltip title="View Details">
                    <IconButton 
                      onClick={() => handleViewServer(server.id)}
                      size="small"
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {server.running ? (
                    <Tooltip title="Stop Server">
                      <IconButton 
                        onClick={() => handleDisconnectServer(server.id)}
                        size="small"
                        color="error"
                        disabled={disconnectMutation.isLoading}
                      >
                        <StopIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Start Server">
                      <IconButton 
                        onClick={() => handleConnectServer(server.id)}
                        size="small"
                        color="success"
                        disabled={connectMutation.isLoading}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  <Tooltip title="Delete Server">
                    <IconButton 
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Servers Registered
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Register a new MCP server to get started.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            Register Server
          </Button>
        </Paper>
      )}
      
      {/* Register Server Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Register New MCP Server</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            label="Server ID"
            fullWidth
            variant="outlined"
            value={newServer.id}
            onChange={(e) => setNewServer({ ...newServer, id: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Command"
            fullWidth
            variant="outlined"
            value={newServer.config.command}
            onChange={(e) => setNewServer({ 
              ...newServer, 
              config: { ...newServer.config, command: e.target.value } 
            })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Arguments (space separated)"
            fullWidth
            variant="outlined"
            value={Array.isArray(newServer.config.args) ? newServer.config.args.join(' ') : newServer.config.args}
            onChange={(e) => setNewServer({ 
              ...newServer, 
              config: { ...newServer.config, args: e.target.value } 
            })}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleRegisterServer} 
            variant="contained"
            disabled={registerMutation.isLoading}
          >
            {registerMutation.isLoading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Servers;
