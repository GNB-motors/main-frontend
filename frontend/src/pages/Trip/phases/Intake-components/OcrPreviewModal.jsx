import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const KEY_LABELS = {
  reading: 'Odometer Reading',
  confidence: 'Confidence',
  sharpness: 'Sharpness',
  qualityIssues: 'Quality Issues',
  location: 'Location',
  datetime: 'Date / Time',
  date: 'Date',
  vehicleNo: 'Vehicle No',
  volume: 'Volume',
  rate: 'Rate',
  documentType: 'Document Type',
  grossWeight: 'Gross Weight',
  tareWeight: 'Tare Weight',
  netWeight: 'Net Weight',
  finalWeight: 'Final Weight',
  missingFields: 'Missing Fields',
  status: 'Status',
  materialType: 'Material Type',
  origin: 'Origin',
  destination: 'Destination',
};

function formatKey(key) {
  return KEY_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function formatValue(key, value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'confidence') return `${value}%`;
  if (key === 'volume') return `${value} L`;
  if (key === 'rate') return `₹${value} / L`;
  if (key === 'grossWeight' || key === 'tareWeight' || key === 'netWeight' || key === 'finalWeight') return `${value} kg`;
  return String(value);
}

const PRIORITY_KEYS = ['documentType', 'date', 'datetime', 'vehicleNo', 'reading', 'volume', 'rate', 'grossWeight', 'tareWeight', 'netWeight', 'finalWeight', 'materialType', 'origin', 'destination', 'location', 'confidence'];

const OcrPreviewModal = ({ showOcrModal, setShowOcrModal, selectedOcrData, selectedOcrType }) => {
  if (!showOcrModal || !selectedOcrData) return null;

  // Sort entries: priority keys first, then others
  const entries = Object.entries(selectedOcrData).filter(([, v]) => v !== null && v !== undefined);
  const sorted = [
    ...PRIORITY_KEYS.filter(k => selectedOcrData[k] !== null && selectedOcrData[k] !== undefined).map(k => [k, selectedOcrData[k]]),
    ...entries.filter(([k]) => !PRIORITY_KEYS.includes(k))
  ];

  return (
    <div className="ocr-modal-overlay" onClick={() => setShowOcrModal(false)}>
      <div className="ocr-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ocr-modal-header">
          <div className="ocr-modal-title-group">
            <div className="ocr-modal-badge"><CheckCircle size={14} /></div>
            <div>
              <h3 className="ocr-modal-title">{selectedOcrType}</h3>
              <span className="ocr-modal-subtitle">Extracted OCR Data</span>
            </div>
          </div>
          <button className="ocr-modal-close" onClick={() => setShowOcrModal(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ocr-modal-body">
          <div className="ocr-fields-grid">
            {sorted.map(([key, value]) => (
              <div key={key} className="ocr-field-row">
                <span className="ocr-field-label">{formatKey(key)}</span>
                <span className="ocr-field-value">{formatValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="ocr-modal-footer">
          <button className="ocr-modal-close-btn" onClick={() => setShowOcrModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OcrPreviewModal;