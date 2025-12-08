import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Upload } from 'lucide-react';
import '../PageStyles.css';
import './AddRefuelPage.css';
import { loadRefuelLogs, persistRefuelLogs, notifyRefuelLogsUpdated } from './refuelStorage';
import {
  mockVehicles as vehicleOptions,
  mockDrivers as driverOptions,
  paymentModes as paymentOptions,
  receiptTypes,
  mockReceiptExtracts
} from './refuelMockData';
import ImageCropperModal from '../../Global-compoent/ImageCropperModal';

const getDefaultDate = () => new Date().toISOString().split('T')[0];

const getDefaultTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '--';
  }
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatQuantity = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '--';
  }
  return `${Number(value).toFixed(1)} L`;
};

const getSlipTypeLabel = (type) => {
  const option = receiptTypes.find((item) => item.id === type);
  return option ? option.label : type;
};

const AddRefuelPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    date: getDefaultDate(),
    time: getDefaultTime(),
    paymentMethod: paymentOptions[0] || 'Fuel Card',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [slipType, setSlipType] = useState(receiptTypes[0]?.id || 'diesel');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [extractionError, setExtractionError] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperSrc, setCropperSrc] = useState('');
  const [pendingCropFile, setPendingCropFile] = useState(null);
  const extractionTimeoutRef = useRef(null);
  const originalUploadUrlRef = useRef('');
  const receiptInputId = 'receipt-upload-input';

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

  useEffect(() => () => {
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
    }
    if (originalUploadUrlRef.current) {
      URL.revokeObjectURL(originalUploadUrlRef.current);
    }
  }, []);

  const handleInputChange = (field, value) => {
    setFormError('');
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    navigate('/refuel-logs');
  };

  const resetExtractionState = () => {
    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
      extractionTimeoutRef.current = null;
    }
    setExtractionStatus('idle');
    setExtractionError('');
    setExtractedData(null);
  };

  const runMockExtraction = (type, file) => {
    if (!file) {
      resetExtractionState();
      return;
    }

    if (extractionTimeoutRef.current) {
      clearTimeout(extractionTimeoutRef.current);
    }

    setExtractionStatus('processing');
    setExtractionError('');
    setExtractedData(null);

    extractionTimeoutRef.current = setTimeout(() => {
      const template = mockReceiptExtracts[type];
      if (!template) {
        setExtractionStatus('error');
        setExtractionError('No mock template available for this slip type yet.');
        extractionTimeoutRef.current = null;
        return;
      }

      const label = getSlipTypeLabel(type);
      const normalizedData = {
        ...template,
        slipType: template.slipType || label
      };

      setExtractionStatus('success');
      setExtractedData(normalizedData);
      setFormError('');

      setFormData((prev) => ({
        ...prev,
        date: normalizedData.date || prev.date,
        time: normalizedData.time || prev.time,
        paymentMethod: normalizedData.paymentMethod || prev.paymentMethod
      }));

      extractionTimeoutRef.current = null;
    }, 850);
  };

  const handleSlipTypeChange = (value) => {
    setSlipType(value);
    setFormError('');
    if (receiptFile) {
      runMockExtraction(value, receiptFile);
    } else {
      resetExtractionState();
    }
  };

  const cleanupOriginalObjectUrl = () => {
    if (originalUploadUrlRef.current) {
      URL.revokeObjectURL(originalUploadUrlRef.current);
      originalUploadUrlRef.current = '';
    }
  };

  const handleCropperCancel = () => {
    cleanupOriginalObjectUrl();
    setIsCropperOpen(false);
    setCropperSrc('');
    setPendingCropFile(null);
  };

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve('');
      }
    };
    reader.onerror = () => reject(new Error('failed-to-read-blob'));
    reader.readAsDataURL(blob);
  });

  const handleCropperComplete = async (blob) => {
    if (!blob) {
      setExtractionStatus('error');
      setExtractionError('We could not process the cropped receipt. Please try again.');
      return;
    }

    const originalName = pendingCropFile?.name || 'receipt.jpg';
    const extensionMatch = originalName.match(/\.[^./]+$/);
    const originalExtension = extensionMatch ? extensionMatch[0] : '.jpg';
    const baseName = originalName.replace(/\.[^./]+$/, '');
    const fileType = blob.type || pendingCropFile?.type || 'image/jpeg';
    const mimeExtensionMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    const derivedExtension = mimeExtensionMap[fileType] || originalExtension;
    const croppedFileName = `${baseName}-cropped${derivedExtension}`;
    const croppedFile = new File([blob], croppedFileName, { type: fileType });

    let previewDataUrl = '';
    try {
      previewDataUrl = await blobToDataUrl(blob);
    } catch (error) {
      console.error('Unable to generate preview from cropped blob', error);
      previewDataUrl = '';
    }

    cleanupOriginalObjectUrl();
  setReceiptFile(croppedFile);
  setReceiptPreview(previewDataUrl || '');
    setIsCropperOpen(false);
    setCropperSrc('');
    setPendingCropFile(null);
    resetExtractionState();
    setFormError('');
    setExtractionError('');
    runMockExtraction(slipType, croppedFile);
  };

  const handleCropperImageUpdate = (nextUrl, file) => {
    cleanupOriginalObjectUrl();
    originalUploadUrlRef.current = nextUrl;
    setPendingCropFile(file);
    setCropperSrc(nextUrl);
  };

  const handleReceiptUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      event.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setExtractionStatus('error');
      setExtractionError('Please upload an image receipt (JPEG or PNG).');
      event.target.value = '';
      return;
    }

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > 10) {
      setExtractionStatus('error');
      setExtractionError('Receipt images should be under 10MB. Please choose a smaller file.');
      event.target.value = '';
      return;
    }

    cleanupOriginalObjectUrl();
    const objectUrl = URL.createObjectURL(file);
    originalUploadUrlRef.current = objectUrl;
    setPendingCropFile(file);
    setCropperSrc(objectUrl);
    setFormError('');
    setExtractionError('');
    setIsCropperOpen(true);
    event.target.value = '';
  };

  const handleDropzoneKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (typeof document !== 'undefined') {
        const input = document.getElementById(receiptInputId);
        if (input) {
          input.click();
        }
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requiredFields = [
      'vehicleId',
      'driverId',
      'date',
      'time',
      'paymentMethod'
    ];

    const hasEmpty = requiredFields.some((field) => !formData[field]);
    if (hasEmpty) {
      setFormError('Please complete all required fields before saving.');
      return;
    }

    if (!receiptFile) {
      setFormError('Please upload a receipt before saving.');
      return;
    }

    if (extractionStatus !== 'success' || !extractedData) {
      setFormError('Wait for the receipt analysis to finish before saving.');
      return;
    }

    const selectedVehicle = vehicleOptions.find(
      (vehicle) => String(vehicle.id) === String(formData.vehicleId)
    );
    const selectedDriver = driverOptions.find(
      (driver) => String(driver.id) === String(formData.driverId)
    );

    if (!selectedVehicle || !selectedDriver) {
      setFormError('Select a valid vehicle and driver.');
      return;
    }

    const quantity =
      extractedData.quantity !== undefined ? Number(extractedData.quantity) : Number.NaN;
    const unitPrice =
      extractedData.unitPrice !== undefined ? Number(extractedData.unitPrice) : Number.NaN;
    const totalAmount = extractedData.totalAmount !== undefined
      ? Number(extractedData.totalAmount)
      : Number.isNaN(quantity) || Number.isNaN(unitPrice)
        ? Number.NaN
        : Number((quantity * unitPrice).toFixed(2));

    if (Number.isNaN(quantity) || Number.isNaN(unitPrice) || Number.isNaN(totalAmount)) {
      setFormError('Receipt analysis did not produce valid fuel numbers. Review the slip and try again.');
      return;
    }

    const odometer =
      extractedData.odometer !== undefined && extractedData.odometer !== null
        ? parseInt(extractedData.odometer, 10)
        : null;

    const slipLabel = getSlipTypeLabel(slipType);
    const derivedFuelType = extractedData.fuelType || slipLabel;

    const newLog = {
      id: `RF-${Date.now()}`,
      date: formData.date,
      time: formData.time,
      vehicleNo: selectedVehicle.number,
      vehicleModel: selectedVehicle.model,
      driverName: selectedDriver.name,
      driverPhone: selectedDriver.phone,
      location: extractedData.location || '',
      vendor: extractedData.vendor || '',
      fuelType: derivedFuelType,
      quantity,
      unitPrice,
      totalAmount,
      odometer,
      paymentMethod: formData.paymentMethod || extractedData.paymentMethod || '',
      notes: formData.notes,
      invoiceNumber: extractedData.invoiceNumber || '',
      gstNumber: extractedData.gstNumber || '',
      receipt: {
        slipType: slipLabel,
        fileName: receiptFile.name,
        preview: receiptPreview,
        extractedAt: new Date().toISOString(),
        source: 'mock'
      }
    };

    setIsSaving(true);
    let didNavigate = false;

    try {
      const existingLogs = loadRefuelLogs();
      persistRefuelLogs([newLog, ...existingLogs]);
      notifyRefuelLogsUpdated();
      navigate('/refuel-logs');
      didNavigate = true;
    } catch (error) {
      console.error('Unable to save refuel log', error);
      setFormError('Something went wrong while saving. Please try again.');
    } finally {
      if (!didNavigate) {
        setIsSaving(false);
      }
    }
  };

  return (
    <>
      <div className="add-refuel-page">
        <div className="add-refuel-container">
        <div className="add-refuel-header">
          <button type="button" className="back-btn" onClick={handleCancel}>
            <ArrowLeft size={20} />
            <span>Back to Refuel Logs</span>
          </button>
          <h1>Add Refuel Entry</h1>
        </div>

        <form className="add-refuel-content" onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}

          <section className="form-section">
            <h2 className="section-title">Trip &amp; Vehicle</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle <span className="required">*</span></label>
                <select
                  value={formData.vehicleId}
                  onChange={(event) => handleInputChange('vehicleId', event.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {vehicleOptions.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Driver <span className="required">*</span></label>
                <select
                  value={formData.driverId}
                  onChange={(event) => handleInputChange('driverId', event.target.value)}
                >
                  <option value="">Select driver</option>
                  {driverOptions.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(event) => handleInputChange('date', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Time <span className="required">*</span></label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(event) => handleInputChange('time', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title">Receipt Upload</h2>
            <div className="receipt-upload-card">
              <div className="receipt-upload-grid">
                <div className="receipt-upload-controls">
                  <div className="form-group">
                    <label>Slip Type</label>
                    <select value={slipType} onChange={(event) => handleSlipTypeChange(event.target.value)}>
                      {receiptTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="receipt-upload-action">
                    <input
                      id={receiptInputId}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden-input"
                      onChange={handleReceiptUpload}
                    />
                    <label
                      htmlFor={receiptInputId}
                      className="upload-dropzone"
                      tabIndex={0}
                      onKeyDown={handleDropzoneKeyDown}
                    >
                      <Upload size={20} />
                      <span className="upload-title">
                        {receiptFile ? 'Replace receipt' : 'Click to upload receipt'}
                      </span>
                      <span className="upload-hint">Supported formats: JPG or PNG</span>
                    </label>
                    {receiptFile && (
                      <div className="upload-meta">
                        <strong>{receiptFile.name}</strong>
                        <span>{(receiptFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>
                </div>

                {receiptPreview && (
                  <div className="receipt-preview">
                    <img src={receiptPreview} alt="Receipt preview" />
                  </div>
                )}
              </div>

              {extractionStatus === 'idle' && !receiptFile && (
                <div className="extraction-hint">
                  Upload a refuel slip to auto-fill fuel details. We are using mock analysis for now.
                </div>
              )}

              {extractionStatus === 'processing' && (
                <div className="extraction-chip processing">
                  <Loader2 size={16} className="spinner" />
                  Analyzing receipt with mock extractor...
                </div>
              )}

              {extractionStatus === 'success' && extractedData && (
                <div className="extraction-chip success">
                  Details extracted from {extractedData.slipType} template.
                </div>
              )}

              {extractionStatus === 'error' && (
                <div className="extraction-chip error">
                  {extractionError || 'Could not analyze this receipt.'}
                </div>
              )}
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title">Fuel Details</h2>
            <div className="extraction-summary">
              {extractionStatus !== 'success' || !extractedData ? (
                <span className="extraction-hint">
                  The extracted values from your receipt will appear here once analysis is complete.
                </span>
              ) : (
                <div className="extracted-details-grid">
                  <div className="extracted-card">
                    <div className="extracted-label">Slip Type</div>
                    <div className="extracted-value">{extractedData.slipType || getSlipTypeLabel(slipType)}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Fuel Type</div>
                    <div className="extracted-value">{extractedData.fuelType || getSlipTypeLabel(slipType)}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Quantity</div>
                    <div className="extracted-value">{formatQuantity(extractedData.quantity)}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Unit Price</div>
                    <div className="extracted-value">
                      {extractedData.unitPrice !== undefined && extractedData.unitPrice !== null
                        ? `${formatCurrency(extractedData.unitPrice)} /L`
                        : '--'}
                    </div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Total Amount</div>
                    <div className="extracted-value">{formatCurrency(extractedData.totalAmount)}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Vendor</div>
                    <div className="extracted-value">{extractedData.vendor || '--'}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Location</div>
                    <div className="extracted-value">{extractedData.location || '--'}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Odometer</div>
                    <div className="extracted-value">
                      {extractedData.odometer !== undefined && extractedData.odometer !== null
                        ? `${extractedData.odometer} km`
                        : '--'}
                    </div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Invoice No.</div>
                    <div className="extracted-value">{extractedData.invoiceNumber || '--'}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">GST</div>
                    <div className="extracted-value">{extractedData.gstNumber || '--'}</div>
                  </div>
                  <div className="extracted-card">
                    <div className="extracted-label">Payment Mode</div>
                    <div className="extracted-value">
                      {extractedData.paymentMethod || formData.paymentMethod || '--'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Payment Method <span className="required">*</span></label>
                <select
                  value={formData.paymentMethod}
                  onChange={(event) => handleInputChange('paymentMethod', event.target.value)}
                >
                  {paymentOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group span-2">
                <label>Notes</label>
                <textarea
                  rows={3}
                  placeholder="Optional remarks about this refuel"
                  value={formData.notes}
                  onChange={(event) => handleInputChange('notes', event.target.value)}
                />
              </div>
            </div>
          </section>

          <div className="form-footer">
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving || extractionStatus === 'processing'}
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Refuel
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>

      <ImageCropperModal
        src={cropperSrc}
        isOpen={isCropperOpen}
        title={`Crop ${getSlipTypeLabel(slipType)}`}
        aspectRatio={0}
        circularCrop={false}
        contextId={slipType}
        isUploading={isSaving}
        onCancel={handleCropperCancel}
        onCropComplete={handleCropperComplete}
        onImageUpdate={handleCropperImageUpdate}
      />
    </>
  );
};

export default AddRefuelPage;
