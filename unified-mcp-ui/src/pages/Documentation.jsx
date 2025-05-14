import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { docsService } from '../services/docsService';

const Documentation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({ title: '', content: '', tags: '' });
  const [error, setError] = useState('');
  
  // Fetch all documents
  const { 
    data: documents, 
    isLoading,
    error: docsError,
    refetch
  } = useQuery('documents', docsService.getAllDocuments);
  
  // Search documents query
  const { 
    data: searchResults, 
    isLoading: isSearching,
    error: searchError,
    refetch: refetchSearch
  } = useQuery(
    ['searchDocuments', searchQuery],
    () => docsService.searchDocuments(searchQuery),
    { 
      enabled: searchQuery.length > 0,
      keepPreviousData: true
    }
  );
  
  // Create document mutation
  const createMutation = useMutation(docsService.createDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents');
      setOpenDialog(false);
      setNewDocument({ title: '', content: '', tags: '' });
    },
    onError: (error) => {
      setError(error.message || 'Failed to create document');
    }
  });
  
  const handleOpenDialog = () => {
    setError('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleCreateDocument = () => {
    if (!newDocument.title || !newDocument.content) {
      setError('Title and content are required');
      return;
    }
    
    // Parse tags as array if provided as string
    let tags = newDocument.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    }
    
    createMutation.mutate({
      title: newDocument.title,
      content: newDocument.content,
      tags
    });
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      refetchSearch();
    }
  };
  
  const handleViewDocument = (docId) => {
    navigate(`/docs/${docId}`);
  };
  
  // Determine which documents to display
  const displayDocuments = searchQuery && searchResults ? searchResults : documents;
  const isLoadingDocuments = searchQuery ? isSearching : isLoading;
  const documentsError = searchQuery ? searchError : docsError;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Documentation Library
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
          >
            New Document
          </Button>
        </Box>
      </Box>
      
      {/* Search Bar */}
      <Paper 
        component="form" 
        sx={{ p: 1, mb: 3, display: 'flex' }}
        elevation={2}
        onSubmit={handleSearch}
      >
        <TextField
          fullWidth
          placeholder="Search documents..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setSearchQuery('')}
                  edge="end"
                >
                  {isSearching ? <CircularProgress size={20} /> : 'Clear'}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      {documentsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading documents: {documentsError.message}
        </Alert>
      )}
      
      {isLoadingDocuments ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : displayDocuments && displayDocuments.length > 0 ? (
        <Grid container spacing={3}>
          {displayDocuments.map((doc) => (
            <Grid item xs={12} md={6} lg={4} key={doc.id}>
              <Card 
                elevation={2} 
                className="hover-card"
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" noWrap>
                      {doc.title}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      mb: 2
                    }}
                  >
                    {doc.content}
                  </Typography>
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {doc.tags.map((tag) => (
                        <Chip 
                          key={tag} 
                          label={tag} 
                          size="small" 
                          icon={<LabelIcon />}
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                  
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleViewDocument(doc.id)}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {searchQuery ? 'No Documents Found' : 'No Documents Available'}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {searchQuery 
              ? `No documents match your search for "${searchQuery}".` 
              : 'Create a new document to get started.'}
          </Typography>
          {!searchQuery && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={handleOpenDialog}
            >
              Create Document
            </Button>
          )}
        </Paper>
      )}
      
      {/* Create Document Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New Document</DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newDocument.title}
            onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={newDocument.content}
            onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Tags (comma separated)"
            fullWidth
            variant="outlined"
            value={newDocument.tags}
            onChange={(e) => setNewDocument({ ...newDocument, tags: e.target.value })}
            placeholder="tag1, tag2, tag3"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateDocument} 
            variant="contained"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Documentation;
