import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { docsService } from '../services/docsService';
import ReactMarkdown from 'react-markdown';

const DocumentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch document
  const { 
    data: document, 
    isLoading,
    error: docError
  } = useQuery(['document', id], () => docsService.getDocumentById(id), {
    onSuccess: (data) => {
      // Initialize edited document with current data
      if (!editedDocument) {
        setEditedDocument({
          title: data.title,
          content: data.content,
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || ''
        });
      }
    }
  });
  
  // Update document mutation
  const updateMutation = useMutation(
    (updatedDoc) => docsService.updateDocument(id, updatedDoc),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['document', id]);
        setIsEditing(false);
        setError('');
      },
      onError: (err) => {
        setError(`Failed to update document: ${err.message}`);
      }
    }
  );
  
  // Delete document mutation
  const deleteMutation = useMutation(
    () => docsService.deleteDocument(id),
    {
      onSuccess: () => {
        navigate('/docs');
      },
      onError: (err) => {
        setError(`Failed to delete document: ${err.message}`);
        setDeleteDialogOpen(false);
      }
    }
  );
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditedDocument({
        title: document.title,
        content: document.content,
        tags: Array.isArray(document.tags) ? document.tags.join(', ') : document.tags || ''
      });
    }
    setIsEditing(!isEditing);
    setError('');
  };
  
  const handleSave = () => {
    if (!editedDocument.title || !editedDocument.content) {
      setError('Title and content are required');
      return;
    }
    
    // Parse tags
    const tags = editedDocument.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    updateMutation.mutate({
      title: editedDocument.title,
      content: editedDocument.content,
      tags
    });
  };
  
  const handleDelete = () => {
    deleteMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (docError) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading document: {docError.message}
      </Alert>
    );
  }
  
  if (!document) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Document not found
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit">
          Home
        </Link>
        <Link component={RouterLink} to="/docs" underline="hover" color="inherit">
          Documentation
        </Link>
        <Typography color="text.primary">{document.title}</Typography>
      </Breadcrumbs>
      
      {/* Document Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/docs')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          {isEditing ? (
            <TextField
              value={editedDocument.title}
              onChange={(e) => setEditedDocument({ ...editedDocument, title: e.target.value })}
              variant="outlined"
              fullWidth
              size="small"
              error={!editedDocument.title}
              helperText={!editedDocument.title ? "Title is required" : ""}
            />
          ) : (
            <Typography variant="h4">
              {document.title}
            </Typography>
          )}
        </Box>
        
        <Box>
          {isEditing ? (
            <>
              <Button 
                variant="outlined" 
                startIcon={<CancelIcon />} 
                onClick={handleEditToggle}
                sx={{ mr: 1 }}
              >
                Cancel
              </Button>
              
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />} 
                onClick={handleSave}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />} 
                onClick={handleEditToggle}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              
              <Button 
                variant="outlined" 
                color="error"
                startIcon={<DeleteIcon />} 
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Tags */}
      <Box sx={{ mb: 3 }}>
        {isEditing ? (
          <TextField
            label="Tags (comma separated)"
            value={editedDocument.tags}
            onChange={(e) => setEditedDocument({ ...editedDocument, tags: e.target.value })}
            variant="outlined"
            fullWidth
            size="small"
            placeholder="tag1, tag2, tag3"
          />
        ) : document.tags && document.tags.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {document.tags.map((tag) => (
              <Chip 
                key={tag} 
                label={tag} 
                size="small" 
                icon={<LabelIcon />}
              />
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tags
          </Typography>
        )}
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* Document Content */}
      <Paper elevation={2} sx={{ p: 3 }}>
        {isEditing ? (
          <TextField
            value={editedDocument.content}
            onChange={(e) => setEditedDocument({ ...editedDocument, content: e.target.value })}
            variant="outlined"
            fullWidth
            multiline
            rows={20}
            error={!editedDocument.content}
            helperText={!editedDocument.content ? "Content is required" : ""}
          />
        ) : (
          <Box sx={{ typography: 'body1' }}>
            <ReactMarkdown>
              {document.content}
            </ReactMarkdown>
          </Box>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{document.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error"
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentView;
