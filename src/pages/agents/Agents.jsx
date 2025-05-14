import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { AGENT_STATUS } from '../../config';

/**
 * Agents page component
 * Displays a list of AI agents
 */
const Agents = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for agents
  const agents = [
    {
      id: 1,
      name: 'CodeAssistant',
      description: 'AI agent for code assistance and generation',
      status: AGENT_STATUS.ACTIVE,
      type: 'Coding',
      createdAt: '2023-05-15',
      lastActive: '2023-06-01',
    },
    {
      id: 2,
      name: 'DataAnalyzer',
      description: 'AI agent for data analysis and visualization',
      status: AGENT_STATUS.INACTIVE,
      type: 'Data',
      createdAt: '2023-04-20',
      lastActive: '2023-05-25',
    },
    {
      id: 3,
      name: 'ContentWriter',
      description: 'AI agent for content creation and editing',
      status: AGENT_STATUS.RUNNING,
      type: 'Content',
      createdAt: '2023-05-10',
      lastActive: '2023-06-02',
    },
    {
      id: 4,
      name: 'ResearchAssistant',
      description: 'AI agent for research and information gathering',
      status: AGENT_STATUS.ERROR,
      type: 'Research',
      createdAt: '2023-03-15',
      lastActive: '2023-05-30',
    },
    {
      id: 5,
      name: 'CustomerSupport',
      description: 'AI agent for customer support and assistance',
      status: AGENT_STATUS.ACTIVE,
      type: 'Support',
      createdAt: '2023-05-01',
      lastActive: '2023-06-01',
    },
  ];

  // Filter agents based on search query
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case AGENT_STATUS.ACTIVE:
        return 'success';
      case AGENT_STATUS.INACTIVE:
        return 'default';
      case AGENT_STATUS.RUNNING:
        return 'info';
      case AGENT_STATUS.ERROR:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4">Agents</Typography>
          <Button
            component={RouterLink}
            to="/agents/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Create Agent
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search agents by name, description, or type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Active</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <Typography
                      component={RouterLink}
                      to={`/agents/${agent.id}`}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {agent.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{agent.description}</TableCell>
                  <TableCell>{agent.type}</TableCell>
                  <TableCell>
                    <Chip
                      label={agent.status}
                      color={getStatusColor(agent.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{agent.lastActive}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      {agent.status === AGENT_STATUS.ACTIVE && (
                        <IconButton
                          color="primary"
                          size="small"
                          title="Run agent"
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                      {agent.status === AGENT_STATUS.RUNNING && (
                        <IconButton
                          color="error"
                          size="small"
                          title="Stop agent"
                        >
                          <StopIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" title="More options">
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default Agents;
