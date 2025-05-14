import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography } from '@mui/material';

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
          minHeight: '80vh',
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" color="primary" sx={{ fontSize: '8rem', fontWeight: 'bold' }}>
          404
        </Typography>
        
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
