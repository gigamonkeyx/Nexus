import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Main layout component for the application
 * Includes the header, sidebar, and main content area
 */
const Layout = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calculate main content width based on sidebar state
  const mainContentWidth = sidebarOpen ? 'calc(100% - 240px)' : '100%';
  const mainContentLeft = sidebarOpen ? '240px' : '0';

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Sidebar */}
      {isAuthenticated && (
        <Sidebar 
          open={sidebarOpen} 
        />
      )}
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: mainContentWidth,
          marginLeft: mainContentLeft,
          padding: 3,
          transition: 'all 0.3s ease',
          marginTop: '64px', // Header height
          overflow: 'auto',
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
