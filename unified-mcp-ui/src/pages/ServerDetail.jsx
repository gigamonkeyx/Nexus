import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Build as BuildIcon,
  Code as CodeIcon,
  Terminal as TerminalIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { nexusService } from '../services/nexusService';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`server-tabpanel-${index}`}
      aria-labelledby={`server-tab-${index}`}
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

const ServerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolParams, setToolParams] = useState({});
  const [error, setError] = useState('');
  
  // Fetch server
  const { 
    data: server, 
    isLoading,
    error: serverError,
    refetch
  } = useQuery(['server', id], () => nexusService.getServerById(id));
  
  // Connect server mutation
  const connectMutation = useMutation(
    () => nexusService.connectServer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['server', id]);
      },
      onError: (err) => {
        setError(`Failed to start server: ${err.message}`);
      }
    }
  );
  
  // Disconnect server mutation
  const disconnectMutation = useMutation(
    () => nexusService.disconnectServer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['server', id]);
      },
      onError: (err) => {
        setError(`Failed to stop server: ${err.message}`);
      }
    }
  );
  
  // Call tool mutation
  const callToolMutation = useMutation(
    ({ toolName, params }) => nexusService.callServerTool(id, toolName, params),
    {
      onSuccess: (data) => {
        // Handle tool response
        console.log('Tool response:', data);
        setToolDialogOpen(false);
      },
      onError: (err) => {
        setError(`Failed to execute tool: ${err.message}`);
      }
    }
  );
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleStartServer = () => {
    connectMutation.mutate();
  };
  
  const handleStopServer = () => {
    disconnectMutation.mutate();
  };
  
  const handleOpenToolDialog = (tool) => {
    setSelectedTool(tool);
    setToolParams({});
    setToolDialogOpen(true);
  };
  
  const handleExecuteTool = () => {
    if (!selectedTool) return;
    
    callToolMutation.mutate({
      toolName: selectedTool.name,
      params: toolParams
    });
  };
  
  // Mock data for tools and resources
  const mockTools = [
    { name: 'format_code', description: 'Format code according to style guidelines', params: ['code', 'language'] },
    { name: 'analyze_code', description: 'Analyze code for issues and suggestions', params: ['code', 'language'] },
    { name: 'generate_docstring', description: 'Generate documentation for code', params: ['code', 'language', 'style'] }
  ];
  
  const mockResources = [
    { name: 'examples/python', description: 'Python code examples' },
    { name: 'examples/javascript', description: 'JavaScript code examples' },
    { name: 'examples/java', description: 'Java code examples' }
  ];
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (serverError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading server: {serverError.message}
      </Alert>
    );
  }
  
  if (!server) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Server not found
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/servers" underline="hover" color="inherit">
          Servers
        </Link>
        <Typography color="text.primary">{server.id}</Typography>
      </Breadcrumbs>
      
      {/* Server Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/servers')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="h4">
            {server.id}
          </Typography>
          
          <Chip 
            label={server.running ? "Running" : "Stopped"}
            color={server.running ? "success" : "default"}
            sx={{ ml: 2 }}
          />
        </Box>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          {server.running ? (
            <Button 
              variant="contained" 
              color="error"
              startIcon={<StopIcon />} 
              onClick={handleStopServer}
              disabled={disconnectMutation.isLoading}
            >
              {disconnectMutation.isLoading ? <CircularProgress size={24} /> : 'Stop Server'}
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="success"
              startIcon={<PlayArrowIcon />} 
              onClick={handleStartServer}
              disabled={connectMutation.isLoading}
            >
              {connectMutation.isLoading ? <CircularProgress size={24} /> : 'Start Server'}
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Server Details */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Overview" />
          <Tab label="Tools" />
          <Tab label="Resources" />
          <Tab label="Logs" />
        </Tabs>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Server Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1">
                  {server.id}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1">
                  {server.running ? "Running" : "Stopped"}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Connected
                </Typography>
                <Typography variant="body1">
                  {server.connected ? "Yes" : "No"}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Configuration
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Command
                </Typography>
                <Typography variant="body1">
                  {server.config?.command || "N/A"}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Arguments
                </Typography>
                <Typography variant="body1">
                  {server.config?.args ? (
                    Array.isArray(server.config.args) 
                      ? server.config.args.join(' ') 
                      : server.config.args
                  ) : "None"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Tools Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Available Tools
          </Typography>
          
          {!server.running ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Server must be running to use tools
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {mockTools.map((tool) => (
                <Grid item xs={12} md={6} lg={4} key={tool.name}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                          {tool.name}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {tool.description}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        Parameters: {tool.params.join(', ')}
                      </Typography>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleOpenToolDialog(tool)}
                        disabled={!server.connected}
                      >
                        Execute
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        {/* Resources Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Available Resources
          </Typography>
          
          <List>
            {mockResources.map((resource) => (
              <ListItem key={resource.name} divider>
                <ListItemIcon>
                  <CodeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={resource.name}
                  secondary={resource.description}
                />
                <Button size="small" variant="outlined">
                  View
                </Button>
              </ListItem>
            ))}
          </List>
        </TabPanel>
        
        {/* Logs Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Server Logs
          </Typography>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: 'background.default',
              fontFamily: 'monospace',
              height: 300,
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre">
              {server.running 
                ? "[INFO] Server started successfully\n[INFO] Listening on port 8000\n[INFO] Ready to accept connections"
                : "No logs available. Start the server to see logs."}
            </Typography>
          </Paper>
        </TabPanel>
      </Paper>
      
      {/* Tool Execution Dialog */}
      <Dialog 
        open={toolDialogOpen} 
        onClose={() => setToolDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Execute Tool: {selectedTool?.name}
        </DialogTitle>
        
        <DialogContent>
          {selectedTool?.params.map((param) => (
            <TextField
              key={param}
              label={param}
              fullWidth
              variant="outlined"
              margin="normal"
              value={toolParams[param] || ''}
              onChange={(e) => setToolParams({ ...toolParams, [param]: e.target.value })}
              multiline={param === 'code'}
              rows={param === 'code' ? 10 : 1}
            />
          ))}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setToolDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExecuteTool}
            variant="contained"
            disabled={callToolMutation.isLoading}
          >
            {callToolMutation.isLoading ? <CircularProgress size={24} /> : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServerDetail;
