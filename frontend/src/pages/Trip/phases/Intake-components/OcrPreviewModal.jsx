import React from 'react';
import { X } from 'lucide-react';

/**
 * Format OCR key to human-readable label
 */
function formatOcrKey(key) {
  const keyMap = {
    reading: 'Reading',
    confidence: 'Confidence',
    sharpness: 'Sharpness',
    qualityIssues: 'Quality Issues',
    location: 'Location',
    datetime: 'Date/Time',
    vehicleNo: 'Vehicle No',
    volume: 'Volume (L)',
    rate: 'Rate (₹/L)',
    documentType: 'Document Type',
    date: 'Date',
    grossWeight: 'Gross Weight (kg)',
    tareWeight: 'Tare Weight (kg)',
    netWeight: 'Net Weight (kg)',
    finalWeight: 'Final Weight (kg)',
    missingFields: 'Missing Fields',
    status: 'Status',
  };
  return keyMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

const OcrPreviewModal = ({
  showOcrModal,
  setShowOcrModal,
  selectedOcrData,
  selectedOcrType
}) => {
  if (!showOcrModal || !selectedOcrData) return null;

  return (
    <div className="ocr-modal-overlay" onClick={() => setShowOcrModal(false)}>
      <div className="ocr-modal" onClick={e => e.stopPropagation()}>
        <div className="ocr-modal-header">
          <h3>{selectedOcrType} - OCR Data</h3>
          <button className="ocr-modal-close" onClick={() => setShowOcrModal(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="ocr-modal-body">
          {Object.entries(selectedOcrData).map(([key, value]) => (
            value !== null && value !== undefined && (
              <div key={key} className="ocr-modal-row">
                <span className="ocr-modal-key">{formatOcrKey(key)}</span>
                <span className="ocr-modal-value">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            )
          ))}
        </div>
        <div className="ocr-modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowOcrModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcrPreviewModal;