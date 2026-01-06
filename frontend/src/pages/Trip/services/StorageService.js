/**
 * StorageService - S3 Storage API operations
 * Handles direct file uploads to S3 storage
 */
import apiClient from '../../../utils/axiosConfig';

class StorageService {
  /**
   * Upload a single file to S3
   * @param {File} file - File to upload
   * @param {string} folder - Optional folder path (e.g., 'odometers', 'weight-slips')
   * @returns {Promise<Object>} Upload result with fileKey and publicUrl
   */
  static async uploadFile(file, folder = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await apiClient.post('/api/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        fileKey: response.data.data.fileKey,
        publicUrl: response.data.data.publicUrl,
      };
    } catch (error) {
      console.error('File upload failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'File upload failed',
      };
    }
  }

  /**
   * Upload multiple files to S3
   * @param {File[]} files - Array of files to upload
   * @param {string} folder - Optional folder path
   * @returns {Promise<Object>} Upload results for each file
   */
  static async uploadFiles(files, folder = '') {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await apiClient.post('/api/storage/upload-bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        files: response.data.data.files,
      };
    } catch (error) {
      console.error('Bulk upload failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Bulk upload failed',
      };
    }
  }

  /**
   * Upload file with OCR processing (combined endpoint)
   * @param {File} file - File to upload
   * @param {string} docType - Document type for OCR
   * @param {string} folder - Optional folder path
   * @returns {Promise<Object>} Upload result with S3 URL and OCR data
   */
  static async uploadWithOCR(file, docType, folder = '') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);
      if (folder) {
        formData.append('folder', folder);
      }

      const response = await apiClient.post('/api/documents/upload-with-ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for OCR processing
      });

      return {
        success: true,
        s3Url: response.data.data.s3Url,
        ocrData: response.data.data.ocrData,
        fileKey: response.data.data.fileKey,
      };
    } catch (error) {
      console.error('Upload with OCR failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Upload with OCR failed',
      };
    }
  }

  /**
   * Delete a file from S3
   * @param {string} fileKey - S3 file key
   * @returns {Promise<Object>} Delete result
   */
  static async deleteFile(fileKey) {
    try {
      const response = await apiClient.delete(`/api/storage/${encodeURIComponent(fileKey)}`);
      return {
        success: true,
        message: response.data.message || 'File deleted successfully',
      };
    } catch (error) {
      console.error('File delete failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'File delete failed',
      };
    }
  }

  /**
   * Get a signed URL for private file access
   * @param {string} fileKey - S3 file key
   * @param {number} expiresIn - URL expiration in seconds (default: 3600)
   * @returns {Promise<Object>} Signed URL result
   */
  static async getSignedUrl(fileKey, expiresIn = 3600) {
    try {
      const response = await apiClient.get(
        `/api/storage/signed-url/${encodeURIComponent(fileKey)}?expiresIn=${expiresIn}`
      );
      return {
        success: true,
        signedUrl: response.data.data.signedUrl,
        expiresAt: response.data.data.expiresAt,
      };
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get signed URL',
      };
    }
  }
}

export default StorageService;
