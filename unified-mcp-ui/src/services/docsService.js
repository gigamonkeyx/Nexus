import { authService } from './authService';

// Constants
const DOCS_API_URL = process.env.REACT_APP_DOCS_API_URL || 'https://docs-library.yourdomain.com';

// Create authenticated axios instance
const api = () => authService.createAuthenticatedAxios();

// Get all documents
const getAllDocuments = async () => {
  try {
    const response = await api().get(`${DOCS_API_URL}/docs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Get recent documents
const getRecentDocuments = async (limit = 5) => {
  try {
    const response = await api().get(`${DOCS_API_URL}/docs/recent?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recent documents:', error);
    throw error;
  }
};

// Get document by ID
const getDocumentById = async (id) => {
  try {
    const response = await api().get(`${DOCS_API_URL}/docs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching document ${id}:`, error);
    throw error;
  }
};

// Search documents
const searchDocuments = async (query) => {
  try {
    const response = await api().get(`${DOCS_API_URL}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

// Create a new document
const createDocument = async (documentData) => {
  try {
    const response = await api().post(`${DOCS_API_URL}/docs/create`, documentData);
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Update a document
const updateDocument = async (id, documentData) => {
  try {
    const response = await api().put(`${DOCS_API_URL}/docs/${id}`, documentData);
    return response.data;
  } catch (error) {
    console.error(`Error updating document ${id}:`, error);
    throw error;
  }
};

// Delete a document
const deleteDocument = async (id) => {
  try {
    const response = await api().delete(`${DOCS_API_URL}/docs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting document ${id}:`, error);
    throw error;
  }
};

export const docsService = {
  getAllDocuments,
  getRecentDocuments,
  getDocumentById,
  searchDocuments,
  createDocument,
  updateDocument,
  deleteDocument
};
