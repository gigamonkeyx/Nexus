import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

/**
 * NotFound page component
 * Displayed when a route is not found
 */
const NotFound = () => {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
          
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h4" component="h2" gutterBottom>
            Page Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for does not exist or has been moved.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/"
            sx={{ mt: 2 }}
          >
            Go to Home
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound;
