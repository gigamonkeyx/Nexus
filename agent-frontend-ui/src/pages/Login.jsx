import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, error } = useAuth();
  
  // State
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setFormErrors({});
  };
  
  // Handle login form change
  const handleLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle register form change
  const handleRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Validate login form
  const validateLoginForm = () => {
    const errors = {};
    
    if (!loginData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!loginData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate register form
  const validateRegisterForm = () => {
    const errors = {};
    
    if (!registerData.name) {
      errors.name = 'Name is required';
    }
    
    if (!registerData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!registerData.password) {
      errors.password = 'Password is required';
    } else if (registerData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!registerData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle login submit
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login(loginData.email, loginData.password);
      
      if (success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle register submit
  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateRegisterForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await register(
        registerData.name,
        registerData.email,
        registerData.password
      );
      
      if (success) {
        // Switch to login tab after successful registration
        setTab(0);
        setLoginData({
          email: registerData.email,
          password: ''
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Nexus Agent Portal
          </Typography>
          
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ width: '100%', mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {tab === 0 ? (
            // Login Form
            <Box component="form" onSubmit={handleLoginSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={loginData.email}
                onChange={handleLoginChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={handleLoginChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
              <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">
                    Forgot password?
                  </Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); setTab(1); }}>
                    {"Don't have an account? Sign Up"}
                  </Link>
                </Grid>
              </Grid>
            </Box>
          ) : (
            // Register Form
            <Box component="form" onSubmit={handleRegisterSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                autoFocus
                value={registerData.name}
                onChange={handleRegisterChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={handleRegisterChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign Up'}
              </Button>
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link href="#" variant="body2" onClick={(e) => { e.preventDefault(); setTab(0); }}>
                    Already have an account? Sign in
                  </Link>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <Divider sx={{ width: '100%', my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Nexus MCP Hub. All rights reserved.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
