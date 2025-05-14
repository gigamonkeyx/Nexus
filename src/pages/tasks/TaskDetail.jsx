import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { TASK_STATUS } from '../../config';

/**
 * TaskDetail page component
 * Displays detailed information about a specific task
 */
const TaskDetail = () => {
  const { id } = useParams();

  // Mock data for task details
  const task = {
    id: parseInt(id),
    name: 'Generate React component',
    description: 'Create a reusable React component for the dashboard',
    status: TASK_STATUS.COMPLETED,
    agent: 'CodeAssistant',
    agentId: 1,
    createdAt: '2023-06-01 10:15:23',
    startedAt: '2023-06-01 10:15:30',
    completedAt: '2023-06-01 10:16:45',
    duration: '1m 15s',
    progress: 100,
    priority: 'High',
    input: `Create a reusable React component for displaying statistics on the dashboard. 
The component should:
- Accept data as props
- Support different visualization types (number, percentage, chart)
- Be responsive
- Include proper TypeScript typing`,
    output: `import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer } from 'recharts';

export type StatCardProps = {
  title: string;
  value: number | string;
  type: 'number' | 'percentage' | 'bar-chart' | 'line-chart';
  data?: Array<{ name: string; value: number }>;
  prefix?: string;
  suffix?: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  type,
  data,
  prefix = '',
  suffix = '',
  change,
  changeType = 'neutral',
}) => {
  const renderValue = () => {
    switch (type) {
      case 'number':
        return (
          <Typography variant="h4">
            {prefix}
            {value}
            {suffix}
          </Typography>
        );
      case 'percentage':
        return (
          <Typography variant="h4">
            {value}%
          </Typography>
        );
      case 'bar-chart':
        return (
          <Box sx={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        );
      case 'line-chart':
        return (
          <Box sx={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <Line type="monotone" dataKey="value" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {renderValue()}
        {change !== undefined && (
          <Typography
            variant="body2"
            color={
              changeType === 'positive'
                ? 'success.main'
                : changeType === 'negative'
                ? 'error.main'
                : 'textSecondary'
            }
            sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
          >
            {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}
            {Math.abs(change)}%
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;`,
    logs: [
      {
        timestamp: '2023-06-01 10:15:30',
        level: 'INFO',
        message: 'Task started',
      },
      {
        timestamp: '2023-06-01 10:15:35',
        level: 'INFO',
        message: 'Analyzing requirements',
      },
      {
        timestamp: '2023-06-01 10:15:45',
        level: 'INFO',
        message: 'Generating component structure',
      },
      {
        timestamp: '2023-06-01 10:16:15',
        level: 'INFO',
        message: 'Implementing component logic',
      },
      {
        timestamp: '2023-06-01 10:16:40',
        level: 'INFO',
        message: 'Adding TypeScript typing',
      },
      {
        timestamp: '2023-06-01 10:16:45',
        level: 'INFO',
        message: 'Task completed successfully',
      },
    ],
  };

  // Get status chip color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case TASK_STATUS.COMPLETED:
        return 'success';
      case TASK_STATUS.RUNNING:
        return 'info';
      case TASK_STATUS.PENDING:
        return 'warning';
      case TASK_STATUS.FAILED:
        return 'error';
      case TASK_STATUS.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              component={RouterLink}
              to="/tasks"
              sx={{ mr: 1 }}
              aria-label="back"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4">{task.name}</Typography>
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>
          <Box>
            {task.status === TASK_STATUS.PENDING && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                sx={{ mr: 1 }}
              >
                Run
              </Button>
            )}
            {task.status === TASK_STATUS.RUNNING && (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                sx={{ mr: 1 }}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Task info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" paragraph>
                  {task.description}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Agent
                    </Typography>
                    <Typography
                      component={RouterLink}
                      to={`/agents/${task.agentId}`}
                      sx={{
                        color: 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {task.agent}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Priority
                    </Typography>
                    <Typography variant="body1">{task.priority}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created
                    </Typography>
                    <Typography variant="body1">{task.createdAt}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Completed
                    </Typography>
                    <Typography variant="body1">
                      {task.completedAt || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Duration
                    </Typography>
                    <Typography variant="body1">{task.duration}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Progress
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={task.progress}
                    color={getStatusColor(task.status)}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="h4" align="center">
                  {task.progress}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Input and Output */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Input
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    maxHeight: 300,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {task.input}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Output
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.100',
                    maxHeight: 300,
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                  }}
                >
                  {task.output}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Logs */}
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Logs</Typography>
              <IconButton size="small" title="Refresh">
                <RefreshIcon />
              </IconButton>
            </Box>
            <Paper
              sx={{
                p: 2,
                backgroundColor: 'grey.100',
                maxHeight: 300,
                overflow: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {task.logs.map((log, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        log.level === 'ERROR'
                          ? 'error.main'
                          : log.level === 'WARNING'
                          ? 'warning.main'
                          : 'text.primary',
                    }}
                  >
                    [{log.timestamp}] [{log.level}] {log.message}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default TaskDetail;
