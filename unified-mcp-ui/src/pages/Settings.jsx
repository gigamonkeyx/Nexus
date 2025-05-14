import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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

const Settings = () => {
  const { currentUser, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [uiSettings, setUiSettings] = useState({
    darkMode: true,
    autoRefresh: false,
    refreshInterval: 30
  });
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Development Key', key: 'dev_api_key_123', created: '2023-05-01T10:00:00Z' },
    { id: 2, name: 'Production Key', key: 'prod_api_key_456', created: '2023-05-10T14:30:00Z' }
  ]);
  const [newApiKey, setNewApiKey] = useState({ name: '' });
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
  
  const handleUiSettingsChange = (e) => {
    const { name, value, checked } = e.target;
    setUiSettings({ 
      ...uiSettings, 
      [name]: e.target.type === 'checkbox' ? checked : value 
    });
  };
  
  const handleToggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleSaveProfile = () => {
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validate passwords if changing
    if (profileData.newPassword) {
      if (!profileData.currentPassword) {
        setError('Current password is required');
        setLoading(false);
        return;
      }
      
      if (profileData.newPassword !== profileData.confirmPassword) {
        setError('New passwords do not match');
        setLoading(false);
        return;
      }
      
      if (profileData.newPassword.length < 8) {
        setError('Password must be at least 8 characters');
        setLoading(false);
        return;
      }
    }
    
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setProfileData({
        ...profileData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }, 1000);
  };
  
  const handleSaveUiSettings = () => {
    setSuccess('UI settings saved successfully');
  };
  
  const handleOpenApiKeyDialog = () => {
    setNewApiKey({ name: '' });
    setApiKeyDialogOpen(true);
  };
  
  const handleCreateApiKey = () => {
    if (!newApiKey.name) {
      setError('API key name is required');
      return;
    }
    
    // Mock API key creation
    const newKey = {
      id: apiKeys.length + 1,
      name: newApiKey.name,
      key: `api_key_${Math.random().toString(36).substring(2, 10)}`,
      created: new Date().toISOString()
    };
    
    setApiKeys([...apiKeys, newKey]);
    setApiKeyDialogOpen(false);
    setSuccess('API key created successfully');
  };
  
  const handleDeleteApiKey = (id) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    setSuccess('API key deleted successfully');
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab label="Profile" />
          <Tab label="UI Settings" />
          <Tab label="API Keys" />
        </Tabs>
        
        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            User Profile
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                label="Email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Change Password
              </Typography>
              
              <TextField
                label="Current Password"
                name="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={profileData.currentPassword}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleToggleShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              
              <TextField
                label="New Password"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={profileData.newPassword}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
              
              <TextField
                label="Confirm New Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={profileData.confirmPassword}
                onChange={handleProfileChange}
                fullWidth
                margin="normal"
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>
        
        {/* UI Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            UI Preferences
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Dark Mode" 
                secondary="Use dark theme for the application"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="darkMode"
                  checked={uiSettings.darkMode}
                  onChange={handleUiSettingsChange}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemText 
                primary="Auto Refresh" 
                secondary="Automatically refresh data at regular intervals"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  name="autoRefresh"
                  checked={uiSettings.autoRefresh}
                  onChange={handleUiSettingsChange}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            {uiSettings.autoRefresh && (
              <ListItem>
                <ListItemText 
                  primary="Refresh Interval" 
                  secondary="Time in seconds between refreshes"
                />
                <ListItemSecondaryAction>
                  <TextField
                    name="refreshInterval"
                    type="number"
                    value={uiSettings.refreshInterval}
                    onChange={handleUiSettingsChange}
                    variant="outlined"
                    size="small"
                    sx={{ width: 80 }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">s</InputAdornment>
                    }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            )}
          </List>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />}
              onClick={handleSaveUiSettings}
            >
              Save Preferences
            </Button>
          </Box>
        </TabPanel>
        
        {/* API Keys Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              API Keys
            </Typography>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleOpenApiKeyDialog}
            >
              Create API Key
            </Button>
          </Box>
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          
          <Paper variant="outlined">
            <List>
              {apiKeys.map((apiKey) => (
                <React.Fragment key={apiKey.id}>
                  <ListItem>
                    <ListItemText 
                      primary={apiKey.name}
                      secondary={`Created: ${new Date(apiKey.created).toLocaleString()}`}
                    />
                    <TextField
                      value={apiKey.key}
                      variant="outlined"
                      size="small"
                      sx={{ width: 200, mr: 2 }}
                      InputProps={{
                        readOnly: true
                      }}
                    />
                    <IconButton 
                      edge="end" 
                      color="error"
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                  {apiKey.id !== apiKeys[apiKeys.length - 1].id && <Divider />}
                </React.Fragment>
              ))}
              
              {apiKeys.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No API keys found"
                    secondary="Create an API key to access the MCP Portal programmatically"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </TabPanel>
      </Paper>
      
      {/* Create API Key Dialog */}
      <Dialog 
        open={apiKeyDialogOpen} 
        onClose={() => setApiKeyDialogOpen(false)}
      >
        <DialogTitle>Create New API Key</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            label="API Key Name"
            value={newApiKey.name}
            onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
            fullWidth
            margin="normal"
            variant="outlined"
            autoFocus
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateApiKey}
            variant="contained"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  );
};

export default Settings;
