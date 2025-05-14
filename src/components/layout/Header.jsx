import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../config';

/**
 * Header component
 * Displays the application header with navigation and user controls
 */
const Header = ({ open, drawerWidth, toggleDrawer }) => {
  const { currentUser, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  // Handle profile menu open
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle profile menu close
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle notifications menu open
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  // Handle notifications menu close
  const handleNotificationsMenuClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Handle logout
  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        transition: (theme) => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        ...(open && {
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component={RouterLink}
          to="/"
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            flexGrow: 1,
          }}
        >
          {APP_NAME}
        </Typography>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationsMenuOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User profile */}
        <Box sx={{ ml: 2 }}>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              {currentUser?.photoURL ? (
                <Avatar
                  alt={currentUser.name}
                  src={currentUser.photoURL}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {currentUser?.name?.charAt(0) || 'U'}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Profile menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem component={RouterLink} to="/settings">
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notifications menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        id="notifications-menu"
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsMenuClose}
        onClick={handleNotificationsMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            width: 320,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Typography variant="body2">New agent task completed</Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="body2">Benchmark results available</Typography>
        </MenuItem>
        <MenuItem>
          <Typography variant="body2">System update available</Typography>
        </MenuItem>
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Button size="small">View All</Button>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
