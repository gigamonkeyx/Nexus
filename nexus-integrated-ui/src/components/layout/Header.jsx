import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../config';

/**
 * Header component for the application
 * Includes the app bar, logo, and user menu
 */
const Header = ({ sidebarOpen, toggleSidebar }) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  // Handle user menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle user menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.primary.main,
      }}
    >
      <Toolbar>
        {/* Sidebar toggle button */}
        {isAuthenticated && (
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo and app name */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          {APP_NAME}
        </Typography>

        {/* User menu */}
        {isAuthenticated ? (
          <>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <NotificationsIcon />
              </IconButton>
            </Tooltip>

            {/* User avatar and menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleMenuOpen}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                >
                  {currentUser?.name ? (
                    <Avatar
                      alt={currentUser.name}
                      src={currentUser.avatar}
                      sx={{ width: 32, height: 32 }}
                    >
                      {currentUser.name.charAt(0)}
                    </Avatar>
                  ) : (
                    <AccountCircle />
                  )}
                </IconButton>
              </Tooltip>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem
                  component={RouterLink}
                  to="/settings/profile"
                  onClick={handleMenuClose}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/settings"
                  onClick={handleMenuClose}
                >
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <>
            <Button
              component={RouterLink}
              to="/login"
              color="inherit"
              variant="outlined"
              sx={{ mr: 1 }}
            >
              Login
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
