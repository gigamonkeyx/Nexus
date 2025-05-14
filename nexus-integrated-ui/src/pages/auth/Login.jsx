import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../config';

/**
 * Login page component
 * Handles user authentication and registration
 */
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, error: authError } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Update error message when auth error changes
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
  };

  // Handle login form change
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
    });
  };

  // Handle register form change
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData({
      ...registerData,
      [name]: value,
    });
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Validate login form
  const validateLoginForm = () => {
    if (!loginData.email) {
      setError('Email is required');
      return false;
    }
    if (!loginData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  // Validate register form
  const validateRegisterForm = () => {
    if (!registerData.name) {
      setError('Name is required');
      return false;
    }
    if (!registerData.email) {
      setError('Email is required');
      return false;
    }
    if (!registerData.password) {
      setError('Password is required');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Handle login submit
  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await login({
        email: loginData.email,
        password: loginData.password
      });
      
      if (success) {
        navigate(from, { replace: true });
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
      const success = await register({
        name: registerData.name,
        email: registerData.email,
        password: registerData.password
      });
      
      if (success) {
        // Switch to login tab after successful registration
        setTab(0);
        setLoginData({
          email: registerData.email,
          password: ''
        });
        setError('');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          {/* Logo and title */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <LockIcon
              sx={{
                fontSize: 40,
                color: 'primary.main',
                mb: 1,
              }}
            />
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              {APP_NAME}
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {/* Error message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Login form */}
          {tab === 0 && (
            <Box component="form" onSubmit={handleLoginSubmit}>
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
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={loginData.password}
                onChange={handleLoginChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Remember me"
                />
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
            </Box>
          )}

          {/* Register form */}
          {tab === 1 && (
            <Box component="form" onSubmit={handleRegisterSubmit}>
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
                disabled={loading}
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
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                value={registerData.password}
                onChange={handleRegisterChange}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={registerData.confirmPassword}
                onChange={handleRegisterChange}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          )}

          {/* Footer */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} {APP_NAME}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
