/**
 * OCRService - OCR API operations
 * Handles document scanning and OCR processing
 * Standalone OCR endpoints that can be called independently from S3 storage
 */
import apiClient from '../../../utils/axiosConfig';

class OCRService {
  /**
   * Supported document types for OCR
   */
  static SUPPORTED_TYPES = [
    'ODOMETER',
    'FUEL_RECEIPT',
    'FUEL_SLIP',
    'WEIGH_IN',
    'WEIGH_OUT',
    'WEIGHT_SLIP',
    'WEIGHT_CERTIFICATE',
  ];

  /**
   * Scan any document type using unified endpoint
   * @param {File} file - Image file to scan
   * @param {string} docType - Document type (ODOMETER, FUEL_RECEIPT, WEIGH_IN, etc.)
   * @returns {Promise<Object>} OCR scan result with extracted data
   */
  static async scan(file, docType) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docType', docType);

      const response = await apiClient.post('/api/ocr/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        docType: response.data.docType,
        data: response.data.data,
        parsedFields: response.data.parsedFields,
        missingFields: response.data.missingFields || [],
        fileInfo: response.data.fileInfo,
      };
    } catch (error) {
      console.error(`OCR scan failed for ${docType}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'OCR scan failed',
        docType,
      };
    }
  }

  /**
   * Scan odometer image
   * @param {File} file - Odometer image file
   * @returns {Promise<Object>} OCR result with reading, confidence, etc.
   */
  static async scanOdometer(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/ocr/scan/odometer', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        data: response.data.data,
        parsedFields: response.data.parsedFields,
      };
    } catch (error) {
      console.error('Odometer OCR scan failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Odometer scan failed',
      };
    }
  }

  /**
   * Scan fuel receipt image
   * @param {File} file - Fuel receipt image file
   * @returns {Promise<Object>} OCR result with location, volume, rate, etc.
   */
  static async scanReceipt(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/ocr/scan/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        data: response.data.data,
        parsedFields: response.data.parsedFields,
      };
    } catch (error) {
      console.error('Fuel receipt OCR scan failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Receipt scan failed',
      };
    }
  }

  /**
   * Scan weight certificate/slip image
   * @param {File} file - Weight cert image file
   * @returns {Promise<Object>} OCR result with weights, ticket number, etc.
   */
  static async scanWeightCert(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/ocr/scan/weight-cert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      return {
        success: true,
        data: response.data.data,
        parsedFields: response.data.parsedFields,
      };
    } catch (error) {
      console.error('Weight cert OCR scan failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Weight cert scan failed',
      };
    }
  }

  /**
   * Get supported document types from backend
   * @returns {Promise<Object>} List of supported types
   */
  static async getSupportedTypes() {
    try {
      const response = await apiClient.get('/api/ocr/supported-types');
      return {
        success: true,
        types: response.data.data,
      };
    } catch (error) {
      console.error('Failed to get supported types:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Batch process multiple documents
   * @param {Array<{file: File, docType: string}>} documents - Documents to process
   * @param {Function} onProgress - Callback for progress updates
   * @returns {Promise<Array>} - Array of processed document data
   */
  static async batchScan(documents, onProgress = null) {
    if (!Array.isArray(documents) || documents.length === 0) {
      throw new Error('Documents array is required');
    }

    const results = [];
    let processed = 0;

    for (const doc of documents) {
      try {
        const result = await this.scan(doc.file, doc.docType);
        results.push({
          ...result,
          file: doc.file,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          file: doc.file,
          docType: doc.docType,
        });
      }

      processed++;
      if (onProgress) {
        onProgress({ processed, total: documents.length });
      }
    }

    return results;
  }

  /**
   * Validate image file before upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  static validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const errors = [];

    if (!file) {
      return { valid: false, errors: ['No file provided'] };
    }

    if (!validTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP`);
    }

    if (file.size > maxSize) {
      errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
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

  /**
   * Extract text from OCR data
   * @param {Object} ocrData - OCR data from processing
   * @returns {string} - Extracted text
   */
  static extractOCRText(ocrData) {
    if (!ocrData) return '';

    if (typeof ocrData === 'string') {
      return ocrData;
    }

    if (ocrData.text) {
      return ocrData.text;
    }

    if (Array.isArray(ocrData)) {
      return ocrData.map((item) => item.text || '').join('\n');
    }

    return JSON.stringify(ocrData);
  }

  /**
   * Handle API errors with user-friendly messages
   * @param {Error} error - API error
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(error) {
    if (error.response?.status === 400) {
      return error.response.data?.message || 'Invalid file or document type';
    } else if (error.response?.status === 413) {
      return 'File is too large. Maximum size is 10MB.';
    } else if (error.response?.status === 415) {
      return 'Unsupported file format. Please upload an image.';
    } else if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      return 'Processing took too long. Please try again.';
    } else if (error.message === 'Network Error') {
      return 'Network connection error. Please check your internet.';
    }
    return error.message || 'OCR processing failed';
  }
}

export default OCRService;
