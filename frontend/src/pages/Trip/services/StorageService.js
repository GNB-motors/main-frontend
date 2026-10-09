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
}

export default StorageService;
