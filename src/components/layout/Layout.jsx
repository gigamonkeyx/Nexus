import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

// Sidebar width
const DRAWER_WIDTH = 240;

/**
 * Layout component
 * Provides the main layout structure for the application
 */
const Layout = () => {
  const [open, setOpen] = useState(true);

  // Toggle sidebar
  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Header */}
      <Header open={open} drawerWidth={DRAWER_WIDTH} toggleDrawer={toggleDrawer} />
      
      {/* Sidebar */}
      <Sidebar open={open} drawerWidth={DRAWER_WIDTH} toggleDrawer={toggleDrawer} />
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(open && {
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { sm: `${DRAWER_WIDTH}px` },
            transition: theme => theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar />
        <Box sx={{ py: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
