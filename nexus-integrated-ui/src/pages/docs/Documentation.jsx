import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { docsApi } from '../../services/api';

/**
 * Documentation page component
 * Displays documentation and allows searching
 */
const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Fetch documentation
  const {
    data: docs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['docs'],
    queryFn: docsApi.getDocs
  });

  // Search documentation
  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useQuery({
    queryKey: ['docsSearch', searchQuery],
    queryFn: () => docsApi.searchDocs(searchQuery),
    enabled: searchQuery.length > 2,
  });

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle document selection
  const handleDocSelect = (doc) => {
    setSelectedDoc(doc);
  };

  // Filter docs by category
  const getDocsByCategory = (category) => {
    return docs?.filter((doc) => doc.category === category) || [];
  };

  // Get all categories
  const categories = docs
    ? [...new Set(docs.map((doc) => doc.category))]
    : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Documentation
      </Typography>

      {/* Search bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchLoading && (
              <InputAdornment position="end">
                <CircularProgress size={24} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Search results */}
      {searchQuery.length > 2 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search Results
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {searchLoading ? (
            <CircularProgress />
          ) : searchError ? (
            <Alert severity="error">Error searching documentation</Alert>
          ) : searchResults?.length === 0 ? (
            <Typography color="text.secondary">No results found</Typography>
          ) : (
            <List>
              {searchResults?.map((result) => (
                <ListItem
                  key={result.id}
                  button
                  onClick={() => handleDocSelect(result)}
                  selected={selectedDoc?.id === result.id}
                >
                  <ListItemText
                    primary={result.title}
                    secondary={result.excerpt}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Categories and documents */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Categories
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {isLoading ? (
              <CircularProgress />
            ) : error ? (
              <Alert severity="error">Error loading documentation</Alert>
            ) : (
              <>
                {categories.map((category) => (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        textTransform: 'capitalize',
                        fontWeight: 'bold',
                        mb: 1,
                      }}
                    >
                      {category}
                    </Typography>
                    <List dense>
                      {getDocsByCategory(category).map((doc) => (
                        <ListItem
                          key={doc.id}
                          button
                          onClick={() => handleDocSelect(doc)}
                          selected={selectedDoc?.id === doc.id}
                        >
                          <ListItemText primary={doc.title} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </>
            )}
          </Paper>
        </Grid>

        {/* Document content */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            {selectedDoc ? (
              <>
                <Typography variant="h5" gutterBottom>
                  {selectedDoc.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" component="div">
                  {selectedDoc.content}
                </Typography>
              </>
            ) : (
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Welcome to the Documentation
                  </Typography>
                  <Typography variant="body1">
                    Select a document from the left to view its content.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Documentation;
