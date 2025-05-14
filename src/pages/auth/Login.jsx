import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../config';

/**
 * Login page component
 * Handles user authentication
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!email) {
      setFormError('Email is required');
      return;
    }
    
    if (!password) {
      setFormError('Password is required');
      return;
    }
    
    setFormError('');
    setLoading(true);
    
    try {
      const success = await login({ email, password });
      
      if (success) {
        navigate('/');
      } else {
        setFormError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setFormError(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Sign in to {APP_NAME}
          </Typography>
          
          {(formError || error) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError || error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Box>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            For demo purposes, you can use any email and password.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
