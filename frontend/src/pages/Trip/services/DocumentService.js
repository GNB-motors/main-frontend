/**
 * DocumentService - Document API operations
 * Handles document upload, retrieval, and processing
 */
import apiClient from '../../../utils/axiosConfig';

class DocumentService {
  /**
   * Upload a document to the backend
   * @param {Object} params - Upload parameters
   * @param {File} params.file - File to upload
   * @param {string} params.entityType - Entity type (TRIP, VEHICLE, etc.)
   * @param {string} params.entityId - Entity ID
   * @param {string} params.docType - Document type
   * @returns {Promise<Object>} Uploaded document data
   */
  static async uploadDocument({ file, entityType, entityId, docType }) {
    if (!file) throw new Error('No file provided');

    const form = new FormData();
    form.append('file', file);
    if (entityType) form.append('entityType', entityType);
    if (entityId) form.append('entityId', entityId);
    if (docType) form.append('docType', docType);

    try {
      const resp = await apiClient.post('/api/documents', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (resp.data && resp.data.status === 'success' && resp.data.data) {
        return resp.data.data;
      }
      return resp.data;
    } catch (err) {
      console.error('Document upload failed', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Document upload failed' };
    }
  }

  /**
   * Upload document with pre-scanned OCR data
   * @param {Object} params - Upload parameters
   * @param {File} params.file - File to upload
   * @param {string} params.entityType - Entity type
   * @param {string} params.entityId - Entity ID
   * @param {string} params.docType - Document type
   * @param {Object} params.ocrData - Pre-scanned OCR data
   * @returns {Promise<Object>} Uploaded document data
   */
  static async uploadWithOcrData({ file, entityType, entityId, docType, ocrData }) {
    if (!file) throw new Error('No file provided');

    const form = new FormData();
    form.append('file', file);
    if (entityType) form.append('entityType', entityType);
    if (entityId) form.append('entityId', entityId);
    if (docType) form.append('docType', docType);
    // Do NOT include ocrData for file uploads; backend will run OCR

    try {
      const resp = await apiClient.post('/api/documents', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (resp.data && resp.data.status === 'success' && resp.data.data) {
        return resp.data.data;
      }
      return resp.data;
    } catch (err) {
      console.error('Document upload with OCR failed', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Document upload failed' };
    }
  }

  /**
   * Get document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document data
   */
  static async getDocument(documentId) {
    try {
      const resp = await apiClient.get(`/api/documents/${documentId}`);
      if (resp.data && resp.data.status === 'success' && resp.data.data) {
        return resp.data.data;
      }
      return resp.data;
    } catch (err) {
      console.error('Failed to fetch document', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Failed to fetch document' };
    }
  }

  /**
   * Get documents by entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<Array>} Array of documents
   */
  static async getDocumentsByEntity(entityType, entityId) {
    try {
      const resp = await apiClient.get(`/api/documents?entityType=${entityType}&entityId=${entityId}`);
      if (resp.data && resp.data.status === 'success' && resp.data.data) {
        return resp.data.data;
      }
      return resp.data?.data || [];
    } catch (err) {
      console.error('Failed to fetch documents', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Failed to fetch documents' };
    }
  }

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  static async deleteDocument(documentId) {
    try {
      await apiClient.delete(`/api/documents/${documentId}`);
    } catch (err) {
      console.error('Failed to delete document', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Failed to delete document' };
    }
  }

  /**
   * Process a document with OCR
   * @param {string} documentId - Document ID to process
   * @returns {Promise<Object>} Processed document with OCR data
   */
  static async processDocument(documentId) {
    if (!documentId) throw new Error('documentId required');

    try {
      const resp = await apiClient.post(`/api/documents/${documentId}/process`);
      if (resp.data && resp.data.status === 'success' && resp.data.data) {
        return resp.data.data;
      }
      return resp.data;
    } catch (err) {
      console.error('Document processing failed', err.response?.data || err.message);
      throw err.response?.data || { detail: err.message || 'Document processing failed' };
    }
  }

  /**
   * Validate a file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @param {number} options.maxSize - Max file size in bytes (default: 10MB)
   * @param {string[]} options.allowedTypes - Allowed MIME types
   * @returns {Object} Validation result
   */
  static validateFile(file, options = {}) {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
    } = options;

    const errors = [];

    if (!file) {
      return { valid: false, errors: ['No file provided'] };
    }

    if (file.size > maxSize) {
      errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
    };
  }
}

export default DocumentService;
