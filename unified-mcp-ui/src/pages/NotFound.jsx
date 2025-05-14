import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500
        }}
      >
        <Typography variant="h1" color="primary" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
