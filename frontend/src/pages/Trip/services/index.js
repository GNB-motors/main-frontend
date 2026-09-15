/**
 * Trip Services Index
 * Centralized exports for all Trip-related API services
 * 
 * Usage:
 *   import { TripService, OCRService, DocumentService, StorageService } from './services';
 *   // or
 *   import TripService from './services/TripService';
 */

export { default as TripService } from './TripService';
export { default as OCRService } from './OCRService';
export { default as DocumentService } from './DocumentService';
export { default as StorageService } from './StorageService';

// Default export all services as an object
import TripService from './TripService';
import OCRService from './OCRService';
import DocumentService from './DocumentService';
import StorageService from './StorageService';

export default {
  TripService,
  OCRService,
  DocumentService,
  StorageService,
};
