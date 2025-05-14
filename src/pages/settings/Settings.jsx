import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DEFAULT_SETTINGS, THEME_OPTIONS } from '../../config';

// Create styled components for layout
const FormSection = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '600px',
}));

/**
 * Settings page component
 * Allows users to configure application settings
 */
const Settings = () => {
  const { currentUser, updateProfile, changePassword } = useAuth();
  const { mode, setThemeMode } = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Mock settings data
  const [settings, setSettings] = useState({
    general: {
      theme: mode,
      notifications: true,
      autoUpdate: true,
      telemetry: true,
    },
    profile: {
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      bio: '',
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    advanced: {
      debugMode: false,
      experimentalFeatures: false,
      logLevel: 'info',
      apiTimeout: 30000,
    },
  });

  // Update settings when theme mode changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        theme: mode,
      }
    }));
  }, [mode]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle settings change
  const handleSettingsChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Handle save general settings
  const handleSaveGeneralSettings = () => {
    console.log('Saving general settings:', settings.general);
    // In a real app, this would make an API call to save the settings
  };

  // Handle save profile
  const handleSaveProfile = () => {
    console.log('Saving profile:', settings.profile);
    // In a real app, this would call the updateProfile function
  };

  // Handle change password
  const handleChangePassword = () => {
    console.log('Changing password');
    // In a real app, this would call the changePassword function

    // Reset password fields
    setSettings((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
    }));
  };

  // Handle save advanced settings
  const handleSaveAdvancedSettings = () => {
    console.log('Saving advanced settings:', settings.advanced);
    // In a real app, this would make an API call to save the settings
  };

  // Handle reset settings
  const handleResetSettings = (section) => {
    if (section === 'general') {
      setSettings((prev) => ({
        ...prev,
        general: DEFAULT_SETTINGS,
      }));
    } else if (section === 'advanced') {
      setSettings((prev) => ({
        ...prev,
        advanced: {
          debugMode: false,
          experimentalFeatures: false,
          logLevel: 'info',
          apiTimeout: 30000,
        },
      }));
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="General" />
            <Tab label="Profile" />
            <Tab label="Security" />
            <Tab label="Advanced" />
          </Tabs>
          <Divider />

          {/* General Settings */}
          {tabValue === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                General Settings
              </Typography>
              <FormSection>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="theme-label">Theme</InputLabel>
                  <Select
                    labelId="theme-label"
                    id="theme"
                    value={settings.general.theme}
                    label="Theme"
                    onChange={(e) =>
                      handleSettingsChange('general', 'theme', e.target.value)
                    }
                  >
                    <MenuItem value={THEME_OPTIONS.LIGHT}>Light</MenuItem>
                    <MenuItem value={THEME_OPTIONS.DARK}>Dark</MenuItem>
                    <MenuItem value={THEME_OPTIONS.SYSTEM}>System</MenuItem>
                  </Select>
                </FormControl>

                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.notifications}
                        onChange={(e) =>
                          handleSettingsChange(
                            'general',
                            'notifications',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Enable Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.autoUpdate}
                        onChange={(e) =>
                          handleSettingsChange(
                            'general',
                            'autoUpdate',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Auto Update"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.general.telemetry}
                        onChange={(e) =>
                          handleSettingsChange(
                            'general',
                            'telemetry',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Send Anonymous Usage Data"
                  />
                </FormGroup>
              </FormSection>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveGeneralSettings}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => handleResetSettings('general')}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </Box>
          )}

          {/* Profile Settings */}
          {tabValue === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profile Settings
              </Typography>
              <FormSection>
                <TextField
                  fullWidth
                  label="Name"
                  value={settings.profile.name}
                  onChange={(e) =>
                    handleSettingsChange('profile', 'name', e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) =>
                    handleSettingsChange('profile', 'email', e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Bio"
                  multiline
                  rows={4}
                  value={settings.profile.bio}
                  onChange={(e) =>
                    handleSettingsChange('profile', 'bio', e.target.value)
                  }
                  margin="normal"
                />
              </FormSection>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                >
                  Save Profile
                </Button>
              </Box>
            </Box>
          )}

          {/* Security Settings */}
          {tabValue === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Security Settings
              </Typography>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Change Password
                  </Typography>
                  <FormSection>
                    <TextField
                      fullWidth
                      label="Current Password"
                      type="password"
                      value={settings.security.currentPassword}
                      onChange={(e) =>
                        handleSettingsChange(
                          'security',
                          'currentPassword',
                          e.target.value
                        )
                      }
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="New Password"
                      type="password"
                      value={settings.security.newPassword}
                      onChange={(e) =>
                        handleSettingsChange(
                          'security',
                          'newPassword',
                          e.target.value
                        )
                      }
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      type="password"
                      value={settings.security.confirmPassword}
                      onChange={(e) =>
                        handleSettingsChange(
                          'security',
                          'confirmPassword',
                          e.target.value
                        )
                      }
                      margin="normal"
                    />
                  </FormSection>
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleChangePassword}
                      disabled={
                        !settings.security.currentPassword ||
                        !settings.security.newPassword ||
                        settings.security.newPassword !==
                          settings.security.confirmPassword
                      }
                    >
                      Change Password
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    API Keys
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Manage your API keys for accessing the Nexus MCP Hub API.
                  </Typography>
                  <Button variant="outlined">Manage API Keys</Button>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Advanced Settings */}
          {tabValue === 3 && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Advanced Settings
              </Typography>
              <FormSection>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.debugMode}
                        onChange={(e) =>
                          handleSettingsChange(
                            'advanced',
                            'debugMode',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Debug Mode"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.advanced.experimentalFeatures}
                        onChange={(e) =>
                          handleSettingsChange(
                            'advanced',
                            'experimentalFeatures',
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Experimental Features"
                  />
                </FormGroup>

                <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                  <InputLabel id="log-level-label">Log Level</InputLabel>
                  <Select
                    labelId="log-level-label"
                    id="log-level"
                    value={settings.advanced.logLevel}
                    label="Log Level"
                    onChange={(e) =>
                      handleSettingsChange(
                        'advanced',
                        'logLevel',
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="debug">Debug</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warn">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="API Timeout (ms)"
                  type="number"
                  value={settings.advanced.apiTimeout}
                  onChange={(e) =>
                    handleSettingsChange(
                      'advanced',
                      'apiTimeout',
                      parseInt(e.target.value)
                    )
                  }
                  margin="normal"
                />
              </FormSection>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAdvancedSettings}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => handleResetSettings('advanced')}
                >
                  Reset to Defaults
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Settings;
