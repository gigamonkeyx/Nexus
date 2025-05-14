import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Home as HomeIcon,
  SmartToy as AgentsIcon,
  Task as TasksIcon,
  Speed as BenchmarksIcon,
  Storage as MCPServersIcon,
  MenuBook as DocumentationIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { APP_NAME } from '../../config';

/**
 * Sidebar component
 * Displays the application sidebar with navigation links
 */
const Sidebar = ({ open, drawerWidth, toggleDrawer }) => {
  const location = useLocation();

  // Navigation items
  const navItems = [
    {
      text: 'Home',
      icon: <HomeIcon />,
      path: '/',
    },
    {
      text: 'Agents',
      icon: <AgentsIcon />,
      path: '/agents',
    },
    {
      text: 'Tasks',
      icon: <TasksIcon />,
      path: '/tasks',
    },
    {
      text: 'Benchmarks',
      icon: <BenchmarksIcon />,
      path: '/benchmarks',
    },
    {
      text: 'MCP Servers',
      icon: <MCPServersIcon />,
      path: '/mcp-servers',
    },
    {
      text: 'Documentation',
      icon: <DocumentationIcon />,
      path: '/documentation',
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  // Drawer content
  const drawerContent = (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: [1],
        }}
      >
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            color: 'primary.main',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          {APP_NAME}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path))}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: (location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path))) ? 
                    'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Nexus MCP Hub v1.0.0
        </Typography>
      </Box>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
