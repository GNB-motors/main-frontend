import apiClient from '../../utils/axiosConfig';

/**
 * DocumentService
 * Handles uploading documents to the backend using multipart/form-data
 */
const uploadDocument = async ({ file, entityType, entityId, docType }) => {
  if (!file) throw new Error('No file provided');

  const form = new FormData();
  form.append('file', file);
  // Only append optional fields when provided. Allow uploads without entity to support pending documents.
  if (entityType) form.append('entityType', entityType);
  if (entityId) form.append('entityId', entityId);
  if (docType) form.append('docType', docType);

  try {
    const resp = await apiClient.post('/api/documents', form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // Prefer a normalized shape: resp.data.data or resp.data
    if (resp.data && resp.data.status === 'success' && resp.data.data) return resp.data.data;
    return resp.data;
  } catch (err) {
    console.error('Document upload failed', err.response?.data || err.message);
    throw err.response?.data || { detail: err.message || 'Document upload failed' };
  }
};

export const DocumentService = {
  uploadDocument,
};

// Process a previously uploaded document to extract OCR data.
// We try a reasonable REST endpoint: POST /api/documents/:id/process
// If backend uses a different endpoint, update this function accordingly.
export const processDocument = async (documentId) => {
  if (!documentId) throw new Error('documentId required');
  try {
    const resp = await apiClient.post(`/api/documents/${documentId}/process`);
    if (resp.data && resp.data.status === 'success' && resp.data.data) return resp.data.data;
    return resp.data;
  } catch (err) {
    // Try a fallback OCR endpoint
    try {
      const resp2 = await apiClient.post('/api/ocr', { documentId });
      if (resp2.data && resp2.data.status === 'success' && resp2.data.data) return resp2.data.data;
      return resp2.data;
    } catch (err2) {
      console.error('Document processing failed', err.response?.data || err.message, err2.response?.data || err2.message);
      throw err2.response?.data || { detail: err2.message || 'Document processing failed' };
    }
  }
};

export default {
  uploadDocument,
  processDocument,
};

