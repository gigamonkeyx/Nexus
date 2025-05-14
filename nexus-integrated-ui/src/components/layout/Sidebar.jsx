import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  SmartToy as AgentsIcon,
  Assignment as TasksIcon,
  Speed as BenchmarksIcon,
  Settings as SettingsIcon,
  Description as DocumentationIcon,
  Storage as MCPServersIcon,
} from '@mui/icons-material';
import { FEATURES } from '../../config';

/**
 * Sidebar component for the application
 * Includes navigation links to different sections
 */
const Sidebar = ({ open }) => {
  const location = useLocation();
  const drawerWidth = 240;

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: (theme) => theme.palette.background.paper,
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      <Box sx={{ marginTop: '64px' }}>
        {/* Main Navigation */}
        <List>
          {/* Dashboard */}
          <ListItem
            button
            component={RouterLink}
            to="/"
            selected={isActive('/')}
            sx={{
              '&.Mui-selected': {
                backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
              },
            }}
          >
            <Tooltip title="Dashboard" placement="right">
              <ListItemIcon>
                <DashboardIcon color={isActive('/') ? 'primary' : 'inherit'} />
              </ListItemIcon>
            </Tooltip>
            <ListItemText primary="Dashboard" />
          </ListItem>

          {/* Agents */}
          {FEATURES.enableAgents && (
            <ListItem
              button
              component={RouterLink}
              to="/agents"
              selected={isActive('/agents')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="Agents" placement="right">
                <ListItemIcon>
                  <AgentsIcon color={isActive('/agents') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Agents" />
            </ListItem>
          )}

          {/* Tasks */}
          {FEATURES.enableTasks && (
            <ListItem
              button
              component={RouterLink}
              to="/tasks"
              selected={isActive('/tasks')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="Tasks" placement="right">
                <ListItemIcon>
                  <TasksIcon color={isActive('/tasks') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Tasks" />
            </ListItem>
          )}

          {/* Benchmarks */}
          {FEATURES.enableBenchmarks && (
            <ListItem
              button
              component={RouterLink}
              to="/benchmarks"
              selected={isActive('/benchmarks')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="Benchmarks" placement="right">
                <ListItemIcon>
                  <BenchmarksIcon color={isActive('/benchmarks') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Benchmarks" />
            </ListItem>
          )}

          {/* Documentation */}
          {FEATURES.enableDocumentation && (
            <ListItem
              button
              component={RouterLink}
              to="/documentation"
              selected={isActive('/documentation')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="Documentation" placement="right">
                <ListItemIcon>
                  <DocumentationIcon color={isActive('/documentation') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Documentation" />
            </ListItem>
          )}

          {/* MCP Servers */}
          {FEATURES.enableMCPServers && (
            <ListItem
              button
              component={RouterLink}
              to="/mcp-servers"
              selected={isActive('/mcp-servers')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="MCP Servers" placement="right">
                <ListItemIcon>
                  <MCPServersIcon color={isActive('/mcp-servers') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="MCP Servers" />
            </ListItem>
          )}
        </List>

        <Divider />

        {/* Settings */}
        {FEATURES.enableSettings && (
          <List>
            <ListItem
              button
              component={RouterLink}
              to="/settings"
              selected={isActive('/settings')}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: (theme) => `${theme.palette.primary.main}20`,
                  borderRight: (theme) => `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <Tooltip title="Settings" placement="right">
                <ListItemIcon>
                  <SettingsIcon color={isActive('/settings') ? 'primary' : 'inherit'} />
                </ListItemIcon>
              </Tooltip>
              <ListItemText primary="Settings" />
            </ListItem>
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
