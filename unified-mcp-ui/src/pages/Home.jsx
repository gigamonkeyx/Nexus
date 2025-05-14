import React from 'react';
import { useQuery } from 'react-query';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Link
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { nexusService } from '../services/nexusService';
import { docsService } from '../services/docsService';

const Home = () => {
  // Fetch hub status
  const { 
    data: hubStatus, 
    isLoading: isLoadingHub,
    error: hubError
  } = useQuery('hubStatus', nexusService.getHubStatus);
  
  // Fetch servers
  const { 
    data: servers, 
    isLoading: isLoadingServers,
    error: serversError
  } = useQuery('servers', nexusService.getAllServers);
  
  // Fetch recent documents
  const { 
    data: recentDocs, 
    isLoading: isLoadingDocs,
    error: docsError
  } = useQuery('recentDocuments', () => docsService.getRecentDocuments(5));
  
  // Calculate server stats
  const serverStats = React.useMemo(() => {
    if (!servers) return { total: 0, running: 0, connected: 0 };
    
    const serversArray = Object.values(servers);
    return {
      total: serversArray.length,
      running: serversArray.filter(server => server.running).length,
      connected: serversArray.filter(server => server.connected).length
    };
  }, [servers]);
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to MCP Portal
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Your unified interface for the Documentation Library and Nexus Hub.
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Nexus Hub Status */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            className="hover-card"
          >
            <Typography variant="h5" gutterBottom>
              Nexus Hub
            </Typography>
            
            {isLoadingHub ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : hubError ? (
              <Box sx={{ my: 2 }}>
                <Typography color="error">
                  Error loading Nexus Hub status
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    icon={hubStatus?.running ? <CheckCircleIcon /> : <ErrorIcon />}
                    label={hubStatus?.running ? "Running" : "Offline"}
                    color={hubStatus?.running ? "success" : "error"}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date().toLocaleTimeString()}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>
                    Total Servers: {serverStats.total}
                  </Typography>
                  <Typography>
                    Running: {serverStats.running}
                  </Typography>
                  <Typography>
                    Connected: {serverStats.connected}
                  </Typography>
                </Box>
              </Box>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              MCP Servers
            </Typography>
            
            {isLoadingServers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : serversError ? (
              <Typography color="error">
                Error loading servers
              </Typography>
            ) : servers && Object.keys(servers).length > 0 ? (
              <List dense>
                {Object.values(servers).slice(0, 3).map((server) => (
                  <ListItem key={server.id}>
                    <ListItemIcon>
                      <StorageIcon color={server.running ? "success" : "disabled"} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={server.id} 
                      secondary={server.running ? "Running" : "Stopped"} 
                    />
                  </ListItem>
                ))}
                {Object.keys(servers).length > 3 && (
                  <ListItem>
                    <ListItemText 
                      primary={`${Object.keys(servers).length - 3} more servers...`}
                      sx={{ color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography color="text.secondary">
                No servers registered
              </Typography>
            )}
            
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button 
                component={RouterLink} 
                to="/servers" 
                variant="contained" 
                endIcon={<ArrowForwardIcon />}
                fullWidth
              >
                Manage Servers
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Documentation Library */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
            className="hover-card"
          >
            <Typography variant="h5" gutterBottom>
              Documentation Library
            </Typography>
            
            <Typography variant="body1" paragraph>
              Access and manage your documentation resources.
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Recent Documents
            </Typography>
            
            {isLoadingDocs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : docsError ? (
              <Typography color="error">
                Error loading documents
              </Typography>
            ) : recentDocs && recentDocs.length > 0 ? (
              <List dense>
                {recentDocs.map((doc) => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Link component={RouterLink} to={`/docs/${doc.id}`}>
                          {doc.title}
                        </Link>
                      }
                      secondary={doc.tags?.join(', ')}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">
                No documents found
              </Typography>
            )}
            
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button 
                component={RouterLink} 
                to="/docs" 
                variant="contained" 
                endIcon={<ArrowForwardIcon />}
                fullWidth
              >
                Browse Documentation
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
