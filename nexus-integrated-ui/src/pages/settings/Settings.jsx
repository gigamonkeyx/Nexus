import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, MCP_HUB_URL, DOCS_URL } from '../../config';

/**
 * Settings page component
 * Allows users to manage their profile and application settings
 */
const Settings = () => {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // App settings state
  const [appSettings, setAppSettings] = useState({
    darkMode: false,
    notifications: true,
    apiUrl: API_URL,
    mcpHubUrl: MCP_HUB_URL,
    docsUrl: DOCS_URL,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      setSuccess('Profile updated successfully');
      setError('');
    },
    onError: (error) => {
      setError(error.message || 'Failed to update profile');
      setSuccess('');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setSuccess('Password changed successfully');
      setError('');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (error) => {
      setError(error.message || 'Failed to change password');
      setSuccess('');
    }
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setSuccess('');
    setError('');
  };

  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };

  // Handle app settings change
  const handleSettingsChange = (e) => {
    const { name, value, checked } = e.target;
    setAppSettings({
      ...appSettings,
      [name]: e.target.type === 'checkbox' ? checked : value,
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate profile form
  const validateProfileForm = () => {
    if (!profileData.name) {
      setError('Name is required');
      return false;
    }
    if (!profileData.email) {
      setError('Email is required');
      return false;
    }
    return true;
  };

  // Validate password form
  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!passwordData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Handle profile update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      return;
    }
    updateProfileMutation.mutate(profileData);
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  // Handle app settings save
  const handleSettingsSave = (e) => {
    e.preventDefault();
    // In a real app, this would save the settings to localStorage or the server
    setSuccess('Settings saved successfully');
    setError('');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Profile" />
          <Tab label="Password" />
          <Tab label="Application" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Success message */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Profile tab */}
          {tab === 0 && (
            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    disabled={updateProfileMutation.isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={updateProfileMutation.isLoading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={updateProfileMutation.isLoading}
                  >
                    {updateProfileMutation.isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Password tab */}
          {tab === 1 && (
            <Box component="form" onSubmit={handlePasswordChange}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={changePasswordMutation.isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={changePasswordMutation.isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={changePasswordMutation.isLoading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={changePasswordMutation.isLoading}
                  >
                    {changePasswordMutation.isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Application tab */}
          {tab === 2 && (
            <Box component="form" onSubmit={handleSettingsSave}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Appearance
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        name="darkMode"
                        checked={appSettings.darkMode}
                        onChange={handleSettingsChange}
                      />
                    }
                    label="Dark Mode"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Notifications
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifications"
                        checked={appSettings.notifications}
                        onChange={handleSettingsChange}
                      />
                    }
                    label="Enable Notifications"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    API Configuration
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API URL"
                    name="apiUrl"
                    value={appSettings.apiUrl}
                    onChange={handleSettingsChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="MCP Hub URL"
                    name="mcpHubUrl"
                    value={appSettings.mcpHubUrl}
                    onChange={handleSettingsChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Documentation URL"
                    name="docsUrl"
                    value={appSettings.docsUrl}
                    onChange={handleSettingsChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                  >
                    Save Settings
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
