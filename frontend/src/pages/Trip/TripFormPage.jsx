/**
 * TripFormPage Component
 * 
 * Comprehensive trip creation and editing page with document upload functionality.
 * 
 * Features:
 * - Create new trips with form data (source, destination, vehicle, driver, payload)
 * - Edit existing trips (read-only for filled fields)
 * - Upload and OCR process start documents (odometer, weigh-in slip)
 * - Multiple fuel receipt uploads (diesel/adblue) with batch processing
 * - Upload end documents (odometer end, proof of delivery)
 * - Save trip at any time
 * - End trip only when both end documents are uploaded
 * - View-only mode for completed trips (no action buttons)
 * 
 * Routes:
 * - /trip/new - Create new trip
 * - /trip/:tripId - Edit existing trip or view completed trip
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Loader, Plus, Trash2 } from 'lucide-react';
import './TripFormPage.css';

/**
 * Mock trips data - shared with TripManagementPage
 * TODO: Replace with API calls to backend
 */
const mockTrips = [
  {
    id: 1,
    status: 'In Progress',
    tripStatus: 'active',
    vehicleNo: 'WB-01-1234',
    driverName: 'Driver A (Devayan)',
    startDate: '2025-12-05',
    startLocation: null,
    destination: null,
    odometerStart: 12450,
    odometerEnd: null,
    payloadWeight: 8500,
    lastRefillDate: '2025-12-04',
    lastRefillQuantity: 120,
    distance: null,
    fuelReceipts: []
  },
  {
    id: 2,
    status: 'Completed',
    tripStatus: 'completed',
    vehicleNo: 'WB-02-5678',
    driverName: 'Driver B (Amitansu)',
    startDate: '2025-12-03',
    endDate: '2025-12-03',
    startLocation: 'Ashta - 466114',
    destination: 'Greater Thane - 421302',
    odometerStart: 45200,
    odometerEnd: 45380,
    payloadWeight: 12000,
    lastRefillDate: '2025-12-02',
    lastRefillQuantity: 150,
    distance: 180,
    fuelConsumed: 16.4,
    mileage: 11.0,
    fuelReceipts: [
      {
        id: 1,
        type: 'diesel',
        file: null,
        preview: null,
        ocrData: {
          quantity: '85',
          amount: '8075',
          date: '2025-12-03',
          location: 'Bhopal Fuel Station'
        }
      },
      {
        id: 2,
        type: 'adblue',
        file: null,
        preview: null,
        ocrData: {
          quantity: '8',
          amount: '360',
          date: '2025-12-03',
          location: 'Bhopal Fuel Station'
        }
      }
    ],
    startDocs: {
      odometerStart: {
        file: null,
        preview: null,
        ocrData: { reading: '45200', date: '2025-12-03', time: '08:15' }
      },
      weighInSlip: {
        file: null,
        preview: null,
        ocrData: { grossWeight: '24000', tareWeight: '12000', netWeight: '12000' }
      }
    },
    endDocs: {
      odometerEnd: {
        file: null,
        preview: null,
        ocrData: { reading: '45380', date: '2025-12-03', time: '16:30' }
      },
      proofOfDelivery: {
        file: null,
        preview: null,
        ocrData: { receiverName: 'Priya Sharma', signature: 'Present', date: '2025-12-03' }
      }
    }
  },
  {
    id: 3,
    status: 'In Progress',
    tripStatus: 'active',
    vehicleNo: 'WB-06-9001',
    driverName: 'Driver C',
    startDate: '2025-12-06',
    startLocation: null,
    destination: null,
    odometerStart: 78900,
    odometerEnd: null,
    payloadWeight: 15000,
    lastRefillDate: '2025-12-05',
    lastRefillQuantity: 180,
    distance: null,
    fuelReceipts: []
  },
  {
    id: 4,
    status: 'Completed',
    tripStatus: 'completed',
    vehicleNo: 'WB-03-7890',
    driverName: 'Driver D',
    startDate: '2025-12-04',
    endDate: '2025-12-04',
    startLocation: 'Ahmedabad - 380001',
    destination: 'Chennai - 600001',
    odometerStart: 32100,
    odometerEnd: 32310,
    payloadWeight: 10500,
    lastRefillDate: '2025-12-03',
    lastRefillQuantity: 140,
    distance: 210,
    fuelConsumed: 21.9,
    mileage: 9.6,
    fuelReceipts: [
      {
        id: 1,
        type: 'diesel',
        file: null,
        preview: null,
        ocrData: {
          quantity: '120',
          amount: '11400',
          date: '2025-12-04',
          location: 'Mumbai Highway Fuel Point'
        }
      },
      {
        id: 2,
        type: 'diesel',
        file: null,
        preview: null,
        ocrData: {
          quantity: '95',
          amount: '9025',
          date: '2025-12-04',
          location: 'Surat Fuel Station'
        }
      },
      {
        id: 3,
        type: 'adblue',
        file: null,
        preview: null,
        ocrData: {
          quantity: '12',
          amount: '540',
          date: '2025-12-04',
          location: 'Surat Fuel Station'
        }
      }
    ],
    startDocs: {
      odometerStart: {
        file: null,
        preview: null,
        ocrData: { reading: '32100', date: '2025-12-04', time: '06:00' }
      },
      weighInSlip: {
        file: null,
        preview: null,
        ocrData: { grossWeight: '22500', tareWeight: '12000', netWeight: '10500' }
      }
    },
    endDocs: {
      odometerEnd: {
        file: null,
        preview: null,
        ocrData: { reading: '32310', date: '2025-12-04', time: '22:15' }
      },
      proofOfDelivery: {
        file: null,
        preview: null,
        ocrData: { receiverName: 'Arun Kumar', signature: 'Present', date: '2025-12-04' }
      }
    }
  }
];

const TripFormPage = () => {
  const navigate = useNavigate();
  const { tripId } = useParams();
  
  // Determine page mode
  const isEditMode = !!tripId;
  const existingTrip = isEditMode ? mockTrips.find(t => t.id === parseInt(tripId)) : null;
  const isCompletedTrip = existingTrip && existingTrip.tripStatus === 'completed';

  // Form data state
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    payload: '',
    date: new Date().toISOString().split('T')[0],
    vehicleNo: '',
    driver: ''
  });

  // Document upload states
  const [startDocs, setStartDocs] = useState({
    odometerStart: { file: null, preview: null, ocrData: null },
    weighInSlip: { file: null, preview: null, ocrData: null }
  });

  const [fuelReceipts, setFuelReceipts] = useState([]);

  const [endDocs, setEndDocs] = useState({
    odometerEnd: { file: null, preview: null, ocrData: null },
    proofOfDelivery: { file: null, preview: null, ocrData: null }
  });

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dropdown options
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Remove global page-content padding for add/edit trip view
  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }
    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);

  /**
   * Load existing trip data when in edit mode
   * Pre-fills form fields and documents for editing
   */
  useEffect(() => {
    if (isEditMode && existingTrip) {
      setFormData({
        source: existingTrip.startLocation || '',
        destination: existingTrip.destination || '',
        payload: existingTrip.payloadWeight ? existingTrip.payloadWeight.toString() : '',
        date: existingTrip.startDate || '',
        vehicleNo: existingTrip.vehicleNo || '',
        driver: existingTrip.driverName || ''
      });

      // Load start documents if available
      if (existingTrip.startDocs) {
        setStartDocs(existingTrip.startDocs);
      } else if (existingTrip.odometerStart) {
        // Fallback for trips without startDocs structure
        setStartDocs(prev => ({
          ...prev,
          odometerStart: {
            file: null,
            preview: null,
            ocrData: { reading: existingTrip.odometerStart }
          }
        }));
      }

      // Load fuel receipts if available
      if (existingTrip.fuelReceipts && existingTrip.fuelReceipts.length > 0) {
        setFuelReceipts(existingTrip.fuelReceipts);
      }

      // Load end documents if available
      if (existingTrip.endDocs) {
        setEndDocs(existingTrip.endDocs);
      } else if (existingTrip.odometerEnd) {
        // Fallback for trips without endDocs structure
        setEndDocs(prev => ({
          ...prev,
          odometerEnd: {
            file: null,
            preview: null,
            ocrData: { reading: existingTrip.odometerEnd }
          }
        }));
      }
    }
  }, [isEditMode, existingTrip]);

  /**
   * Load vehicles and drivers dropdown options
   * TODO: Replace with API calls to backend
   */
  useEffect(() => {
    setVehicles([
      { id: 1, number: 'WB-01-1234', model: 'Tata LPT 1618' },
      { id: 2, number: 'WB-02-5678', model: 'Ashok Leyland 1920' },
      { id: 3, number: 'WB-06-9001', model: 'Tata Prima 4038' }
    ]);

    setDrivers([
      { id: 1, name: 'Driver A (Devayan)' },
      { id: 2, name: 'Driver B (Amitansu)' },
      { id: 3, name: 'Driver C' }
    ]);
  }, []);

  /**
   * Handle form input changes
   * @param {string} field - The form field name
   * @param {string} value - The new value
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle single document file upload
   * Reads file and creates preview using FileReader API
   * @param {string} section - 'start' or 'end' documents
   * @param {string} field - Specific document field name
   * @param {File} file - The uploaded file object
   */
  const handleFileUpload = (section, field, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (section === 'start') {
        setStartDocs(prev => ({
          ...prev,
          [field]: { file, preview: reader.result, ocrData: null }
        }));
      } else if (section === 'end') {
        setEndDocs(prev => ({
          ...prev,
          [field]: { file, preview: reader.result, ocrData: null }
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle multiple fuel receipt uploads
   * Allows batch uploading of fuel receipts (diesel/adblue)
   * Automatically triggers OCR processing for each file
   * @param {FileList} files - Array of uploaded files
   * @param {string} type - 'diesel' or 'adblue'
   */
  const handleMultipleFuelReceipts = (files, type) => {
    if (!files || files.length === 0) return;

    const newReceipts = Array.from(files).map((file, index) => {
      const newId = Date.now() + index;
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFuelReceipts(prev =>
          prev.map(receipt =>
            receipt.id === newId
              ? { ...receipt, preview: reader.result }
              : receipt
          )
        );
        // Trigger OCR processing
        processOCR('fuel', type, newId);
      };
      reader.readAsDataURL(file);

      return { 
        id: newId, 
        type, 
        file, 
        preview: null, 
        ocrData: null 
      };
    });

    setFuelReceipts(prev => [...prev, ...newReceipts]);
  };

  /**
   * Remove a fuel receipt from the list
   * @param {number} id - The receipt ID to remove
   */
  const removeFuelReceipt = (id) => {
    setFuelReceipts(prev => prev.filter(receipt => receipt.id !== id));
  };

  /**
   * Simulate OCR processing for uploaded documents
   * TODO: Replace with actual OCR API integration
   * @param {string} section - 'start', 'end', or 'fuel'
   * @param {string} field - Document field name
   * @param {number} receiptId - Fuel receipt ID (for fuel receipts only)
   */
  const processOCR = async (section, field, receiptId = null) => {
    setIsProcessing(true);

    // Simulate OCR processing
    setTimeout(() => {
      const mockOCRData = {
        odometerStart: { reading: '12450', date: '2025-12-07', time: '10:30' },
        weighInSlip: { grossWeight: '25000', tareWeight: '10000', netWeight: '15000' },
        odometerEnd: { reading: '12630', date: '2025-12-07', time: '18:45' },
        proofOfDelivery: { receiverName: 'Rajesh Kumar', signature: 'Present', date: '2025-12-07' },
        diesel: { quantity: '120', amount: '11460', date: '2025-12-07' },
        adblue: { quantity: '10', amount: '450', date: '2025-12-07' }
      };

      if (section === 'start') {
        setStartDocs(prev => ({
          ...prev,
          [field]: { ...prev[field], ocrData: mockOCRData[field] }
        }));
      } else if (section === 'end') {
        setEndDocs(prev => ({
          ...prev,
          [field]: { ...prev[field], ocrData: mockOCRData[field] }
        }));
      } else if (section === 'fuel' && receiptId) {
        setFuelReceipts(prev =>
          prev.map(receipt =>
            receipt.id === receiptId
              ? { ...receipt, ocrData: mockOCRData[receipt.type] }
              : receipt
          )
        );
      }

      setIsProcessing(false);
    }, 1500);
  };

  /**
   * Save trip data
   * Validates required fields before submission
   * TODO: Implement API call to save trip to backend
   */
  const handleSaveTrip = async () => {
    // Validate required fields
    if (!formData.source || !formData.destination || !formData.vehicleNo || !formData.driver) {
      alert('Please fill all required fields');
      return;
    }

    // TODO: Submit to backend
    console.log('Saving trip:', {
      formData,
      startDocs,
      fuelReceipts: fuelReceipts.filter(r => r.file),
      endDocs,
      status: 'active'
    });

    navigate('/trip-management');
  };

  /**
   * End trip and mark as completed
   * Validates that both end documents are uploaded before completion
   * TODO: Implement API call to update trip status to 'completed'
   */
  const handleEndTrip = async () => {
    if ((!endDocs.odometerEnd.file && !endDocs.odometerEnd.ocrData) || 
        (!endDocs.proofOfDelivery.file && !endDocs.proofOfDelivery.ocrData)) {
      alert('Please upload both end odometer and proof of delivery to complete the trip');
      return;
    }

    // TODO: Submit to backend
    console.log('Ending trip:', {
      formData,
      startDocs,
      fuelReceipts: fuelReceipts.filter(r => r.file),
      endDocs,
      status: 'completed'
    });

    navigate('/trip-management');
  };

  /**
   * Determine if End Trip button should be enabled
   * Requires both end documents (odometer and proof of delivery) to be uploaded
   */
  const canEndTrip = (endDocs.odometerEnd.file || endDocs.odometerEnd.ocrData) && 
                     (endDocs.proofOfDelivery.file || endDocs.proofOfDelivery.ocrData);

  return (
      <div className="trip-form-page">
      <div className="trip-form-container">
        {/* Header */}
        <div className="trip-form-header">
          <div className="page-header-section">
            <button className="back-btn" onClick={() => navigate('/trip-management')}>
              <ArrowLeft size={20} />
              <span>Back to Trips</span>
            </button>
            <div>
              <h1 className="page-title">{isEditMode ? 'Edit Trip' : 'Create New Trip'}</h1>
            </div>
          </div>
        </div>        {/* Main Form */}
        <div className="trip-form-content">
          {/* Start Documents */}
          <section className="form-section">
            <h2 className="section-heading">Start Documents</h2>
            <div className="documents-grid">
              <DocumentUpload
                title="Odometer Start"
                required
                document={startDocs.odometerStart}
                onUpload={(file) => handleFileUpload('start', 'odometerStart', file)}
                onProcess={() => processOCR('start', 'odometerStart')}
                isProcessing={isProcessing}
              />

              <DocumentUpload
                title="Weigh-in Slip"
                required
                document={startDocs.weighInSlip}
                onUpload={(file) => handleFileUpload('start', 'weighInSlip', file)}
                onProcess={() => processOCR('start', 'weighInSlip')}
                isProcessing={isProcessing}
              />
            </div>
          </section>

          {/* Basic Information */}
          <section className="form-section">
            <h2 className="section-heading">Trip Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Source <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => handleInputChange('source', e.target.value)}
                  placeholder="Enter source location"
                  disabled={isEditMode && existingTrip?.startLocation}
                />
              </div>

              <div className="form-group">
                <label>Destination <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="Enter destination"
                  disabled={isEditMode && existingTrip?.destination}
                />
              </div>

              <div className="form-group">
                <label>Payload (kg) <span className="required">*</span></label>
                <input
                  type="number"
                  value={formData.payload}
                  onChange={(e) => handleInputChange('payload', e.target.value)}
                  placeholder="Enter payload weight"
                  disabled={isEditMode && existingTrip?.payloadWeight}
                />
              </div>

              <div className="form-group">
                <label>Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={isEditMode && existingTrip?.startDate}
                />
              </div>

              <div className="form-group">
                <label>Vehicle Number <span className="required">*</span></label>
                <select
                  value={formData.vehicleNo}
                  onChange={(e) => handleInputChange('vehicleNo', e.target.value)}
                  disabled={isEditMode && existingTrip?.vehicleNo}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.number}>
                      {vehicle.number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Driver <span className="required">*</span></label>
                <select
                  value={formData.driver}
                  onChange={(e) => handleInputChange('driver', e.target.value)}
                  disabled={isEditMode && existingTrip?.driverName}
                >
                  <option value="">Select driver</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.name}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Fuel Receipts */}
          <section className="form-section">
            <div className="section-header">
              <h2 className="section-heading">Fuel Receipts (Optional)</h2>
              <div className="add-receipt-buttons">
                <label className="add-receipt-btn diesel">
                  <Plus size={16} />
                  Add Diesel
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files.length > 0 && handleMultipleFuelReceipts(e.target.files, 'diesel')}
                  />
                </label>
                <label className="add-receipt-btn adblue">
                  <Plus size={16} />
                  Add AdBlue
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={(e) => e.target.files.length > 0 && handleMultipleFuelReceipts(e.target.files, 'adblue')}
                  />
                </label>
              </div>
            </div>
            <div className="fuel-receipts-grid">
              {fuelReceipts.map(receipt => (
                <FuelReceiptUpload
                  key={receipt.id}
                  receipt={receipt}
                  onUpload={(file) => handleFuelReceiptUpload(receipt.id, file)}
                  onProcess={() => processOCR('fuel', null, receipt.id)}
                  onRemove={() => removeFuelReceipt(receipt.id)}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          </section>

          {/* End Documents */}
          <section className="form-section">
            <h2 className="section-heading">End Documents</h2>
            <div className="documents-grid">
              <DocumentUpload
                title="Odometer End"
                document={endDocs.odometerEnd}
                onUpload={(file) => handleFileUpload('end', 'odometerEnd', file)}
                onProcess={() => processOCR('end', 'odometerEnd')}
                isProcessing={isProcessing}
              />

              <DocumentUpload
                title="Proof of Delivery"
                document={endDocs.proofOfDelivery}
                onUpload={(file) => handleFileUpload('end', 'proofOfDelivery', file)}
                onProcess={() => processOCR('end', 'proofOfDelivery')}
                isProcessing={isProcessing}
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        {!isCompletedTrip && (
          <div className="trip-form-footer">
            <div className="footer-actions">
              <button className="btn-primary save-btn" onClick={handleSaveTrip}>
                Save Trip
              </button>
              <button 
                className="btn-primary end-btn" 
                onClick={handleEndTrip}
                disabled={!canEndTrip}
            >
              End Trip
            </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * DocumentUpload Component
 * Reusable component for uploading and processing single documents
 * 
 * @param {string} title - Display title for the document
 * @param {boolean} required - Whether the document is required
 * @param {Object} document - Document state object with file, preview, and ocrData
 * @param {Function} onUpload - Callback when file is selected
 * @param {Function} onProcess - Callback to trigger OCR processing
 * @param {boolean} isProcessing - Whether OCR is currently processing
 */
const DocumentUpload = ({ title, required, document, onUpload, onProcess, isProcessing }) => {
  const inputId = `upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="document-upload-card">
      <div className="document-header">
        <h3>{title} {required && <span className="required">*</span>}</h3>
      </div>

      <input
        type="file"
        id={inputId}
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
        style={{ display: 'none' }}
      />

      {!document.preview ? (
        <label htmlFor={inputId} className="upload-area">
          <Upload size={32} />
          <span>Click to upload image</span>
          <small>PNG, JPG up to 10MB</small>
        </label>
      ) : (
        <div className="document-preview">
          <img src={document.preview} alt={title} />
          <div className="preview-overlay">
            <label htmlFor={inputId} className="change-btn">
              <Upload size={16} />
              Change
            </label>
          </div>
        </div>
      )}

      {document.file && !document.ocrData && (
        <button
          className="process-btn"
          onClick={onProcess}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader size={16} className="spinner" />
              Processing...
            </>
          ) : (
            'Process Document'
          )}
        </button>
      )}

      {document.ocrData && (
        <div className="ocr-data">
          <h4>Extracted Data</h4>
          <div className="ocr-fields">
            {Object.entries(document.ocrData).map(([key, value]) => (
              <div key={key} className="ocr-field">
                <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * FuelReceiptUpload Component
 * Compact component for uploading fuel receipts with remove functionality
 * 
 * @param {Object} receipt - Receipt object with id, type, file, preview, and ocrData
 * @param {Function} onUpload - Callback when file is selected
 * @param {Function} onProcess - Callback to trigger OCR processing
 * @param {Function} onRemove - Callback to remove this receipt
 * @param {boolean} isProcessing - Whether OCR is currently processing
 */
const FuelReceiptUpload = ({ receipt, onUpload, onProcess, onRemove, isProcessing }) => {
  const inputId = `fuel-receipt-${receipt.id}`;

  return (
    <div className="fuel-receipt-card">
      <div className="receipt-header">
        <h3>{receipt.type === 'diesel' ? 'Diesel' : 'AdBlue'} Receipt</h3>
        <button className="remove-btn" onClick={onRemove}>
          <Trash2 size={16} />
        </button>
      </div>

      <input
        type="file"
        id={inputId}
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
        style={{ display: 'none' }}
      />

      {!receipt.preview ? (
        <label htmlFor={inputId} className="upload-area small">
          <Upload size={24} />
          <span>Upload receipt</span>
        </label>
      ) : (
        <div className="receipt-preview">
          <img src={receipt.preview} alt={`${receipt.type} receipt`} />
          <label htmlFor={inputId} className="change-overlay">
            <Upload size={14} />
          </label>
        </div>
      )}

      {receipt.file && !receipt.ocrData && (
        <button
          className="process-btn small"
          onClick={onProcess}
          disabled={isProcessing}
        >
          {isProcessing ? <Loader size={14} className="spinner" /> : 'Process'}
        </button>
      )}

      {receipt.ocrData && (
        <div className="ocr-data small">
          {Object.entries(receipt.ocrData).map(([key, value]) => (
            <div key={key} className="ocr-field-inline">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripFormPage;
