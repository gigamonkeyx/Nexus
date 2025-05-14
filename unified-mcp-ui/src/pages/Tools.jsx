import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Build as BuildIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Storage as StorageIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon
} from '@mui/icons-material';
import { nexusService } from '../services/nexusService';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tools-tabpanel-${index}`}
      aria-labelledby={`tools-tab-${index}`}
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

const Tools = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [toolParams, setToolParams] = useState({});
  const [toolResult, setToolResult] = useState(null);
  const [error, setError] = useState('');
  
  // Fetch servers
  const { 
    data: servers, 
    isLoading: isLoadingServers,
    error: serversError
  } = useQuery('servers', nexusService.getAllServers);
  
  // Call tool mutation
  const callToolMutation = useMutation(
    ({ serverId, toolName, params }) => nexusService.callServerTool(serverId, toolName, params),
    {
      onSuccess: (data) => {
        setToolResult(data);
      },
      onError: (err) => {
        setError(`Failed to execute tool: ${err.message}`);
      }
    }
  );
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleServerChange = (event) => {
    setSelectedServer(event.target.value);
    setSelectedTool('');
    setToolParams({});
    setToolResult(null);
  };
  
  const handleToolChange = (event) => {
    setSelectedTool(event.target.value);
    setToolParams({});
    setToolResult(null);
  };
  
  const handleParamChange = (param, value) => {
    setToolParams({ ...toolParams, [param]: value });
  };
  
  const handleExecuteTool = () => {
    if (!selectedServer || !selectedTool) {
      setError('Please select a server and a tool');
      return;
    }
    
    callToolMutation.mutate({
      serverId: selectedServer,
      toolName: selectedTool,
      params: toolParams
    });
  };
  
  const handleSavePreset = () => {
    // Mock implementation - would save to local storage or backend
    alert('Preset saved!');
  };
  
  // Mock data for tools
  const mockTools = {
    'code-enhancement': [
      { name: 'format_code', description: 'Format code according to style guidelines', params: ['code', 'language'] },
      { name: 'analyze_code', description: 'Analyze code for issues and suggestions', params: ['code', 'language'] },
      { name: 'generate_docstring', description: 'Generate documentation for code', params: ['code', 'language', 'style'] }
    ],
    'knowledge-graph': [
      { name: 'query_graph', description: 'Query the knowledge graph', params: ['query'] },
      { name: 'add_entity', description: 'Add an entity to the knowledge graph', params: ['entity_type', 'entity_name', 'properties'] }
    ],
    'document-processing': [
      { name: 'extract_text', description: 'Extract text from a document', params: ['document_url'] },
      { name: 'summarize_text', description: 'Summarize text content', params: ['text', 'max_length'] }
    ]
  };
  
  // Mock data for execution history
  const mockHistory = [
    { 
      id: 1, 
      server: 'code-enhancement', 
      tool: 'format_code', 
      params: { code: 'function hello() { return "world"; }', language: 'javascript' },
      result: { formatted_code: 'function hello() {\n  return "world";\n}', language: 'javascript' },
      timestamp: '2023-05-15T14:30:00Z'
    },
    { 
      id: 2, 
      server: 'knowledge-graph', 
      tool: 'query_graph', 
      params: { query: 'find all entities of type Person' },
      result: { entities: ['John Doe', 'Jane Smith'] },
      timestamp: '2023-05-14T10:15:00Z'
    }
  ];
  
  // Get tools for selected server
  const getToolsForServer = () => {
    if (!selectedServer) return [];
    return mockTools[selectedServer] || [];
  };
  
  // Get params for selected tool
  const getParamsForTool = () => {
    if (!selectedServer || !selectedTool) return [];
    const tool = getToolsForServer().find(t => t.name === selectedTool);
    return tool ? tool.params : [];
  };
  
  // Filter running servers
  const runningServers = servers ? Object.values(servers).filter(server => server.running) : [];
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        MCP Tools
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Execute Tool" />
          <Tab label="Execution History" />
          <Tab label="Saved Presets" />
        </Tabs>
        
        {/* Execute Tool Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Tool Selection */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Select Tool
                </Typography>
                
                {isLoadingServers ? (
                  <CircularProgress />
                ) : serversError ? (
                  <Alert severity="error">
                    Error loading servers: {serversError.message}
                  </Alert>
                ) : runningServers.length === 0 ? (
                  <Alert severity="warning">
                    No running servers available. Please start a server first.
                  </Alert>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Server</InputLabel>
                      <Select
                        value={selectedServer}
                        onChange={handleServerChange}
                        label="Server"
                      >
                        {runningServers.map((server) => (
                          <MenuItem key={server.id} value={server.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StorageIcon sx={{ mr: 1, color: 'success.main' }} />
                              {server.id}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {selectedServer && (
                      <FormControl fullWidth>
                        <InputLabel>Tool</InputLabel>
                        <Select
                          value={selectedTool}
                          onChange={handleToolChange}
                          label="Tool"
                        >
                          {getToolsForServer().map((tool) => (
                            <MenuItem key={tool.name} value={tool.name}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                                {tool.name}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    
                    {selectedTool && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Tool Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {getToolsForServer().find(t => t.name === selectedTool)?.description}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Button 
                          variant="contained" 
                          fullWidth
                          onClick={handleExecuteTool}
                          disabled={callToolMutation.isLoading}
                        >
                          {callToolMutation.isLoading ? <CircularProgress size={24} /> : 'Execute Tool'}
                        </Button>
                        
                        <Button 
                          variant="outlined" 
                          fullWidth
                          startIcon={<SaveIcon />}
                          onClick={handleSavePreset}
                          sx={{ mt: 1 }}
                        >
                          Save as Preset
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
            
            {/* Tool Parameters */}
            <Grid item xs={12} md={8}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Tool Parameters
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {selectedTool ? (
                  <Box>
                    {getParamsForTool().map((param) => (
                      <TextField
                        key={param}
                        label={param}
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        value={toolParams[param] || ''}
                        onChange={(e) => handleParamChange(param, e.target.value)}
                        multiline={param === 'code' || param === 'text'}
                        rows={param === 'code' || param === 'text' ? 10 : 1}
                      />
                    ))}
                    
                    {toolResult && (
                      <Box sx={{ mt: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Result
                        </Typography>
                        
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            bgcolor: 'background.default',
                            maxHeight: 300,
                            overflow: 'auto'
                          }}
                        >
                          <pre>{JSON.stringify(toolResult, null, 2)}</pre>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    Select a server and tool to see parameters
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Execution History Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Recent Tool Executions
          </Typography>
          
          {mockHistory.length > 0 ? (
            <Box>
              {mockHistory.map((item) => (
                <Accordion key={item.id} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <BuildIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography sx={{ flexGrow: 1 }}>
                        {item.tool} on {item.server}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Parameters
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <pre>{JSON.stringify(item.params, null, 2)}</pre>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Result
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <pre>{JSON.stringify(item.result, null, 2)}</pre>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        startIcon={<HistoryIcon />}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Rerun
                      </Button>
                      <Button 
                        startIcon={<BookmarkBorderIcon />}
                        size="small"
                      >
                        Save as Preset
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">
              No execution history available
            </Typography>
          )}
        </TabPanel>
        
        {/* Saved Presets Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Saved Tool Presets
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BookmarkIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Format JavaScript
                    </Typography>
                  </Box>
                  
                  <Chip 
                    icon={<StorageIcon />} 
                    label="code-enhancement" 
                    size="small" 
                    sx={{ mb: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Format JavaScript code with standard style
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Load</Button>
                  <Button size="small" color="error">Delete</Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BookmarkIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">
                      Query People
                    </Typography>
                  </Box>
                  
                  <Chip 
                    icon={<StorageIcon />} 
                    label="knowledge-graph" 
                    size="small" 
                    sx={{ mb: 1 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Query all entities of type Person
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small">Load</Button>
                  <Button size="small" color="error">Delete</Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Tools;
