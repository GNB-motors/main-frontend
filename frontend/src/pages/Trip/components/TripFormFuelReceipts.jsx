/**
 * TripFormFuelReceipts Component
 *
 * Presentational fuel receipts section for the trip form: Add Diesel / Add
 * AdBlue upload buttons and the grid of fuel receipt upload cards.
 *
 * All state and upload/OCR handlers live in TripFormPage; this component
 * only renders the markup wired through props.
 */

import { Upload, Trash2, Edit2, CheckCircle, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

const TripFormFuelReceipts = ({
  canUpload,
  handleMultipleFuelReceipts,
  fuelReceipts,
  handleFuelReceiptUpload,
  processOCR,
  removeFuelReceipt,
  isProcessing
}) => (
  /* Fuel Receipts */
  <section className="modern-form-section">
    <div className="modern-section-header">
      <h2 className="modern-section-heading" style={{ margin: 0 }}>Fuel Receipts</h2>
      <div className="add-receipt-buttons">
        <label className={`add-receipt-btn diesel ${!canUpload ? 'disabled' : ''}`} title={!canUpload ? 'Select a vehicle to enable uploads' : undefined}>
          <Plus size={16} />
          Add Diesel
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            disabled={!canUpload}
            onChange={(e) => e.target.files.length > 0 && handleMultipleFuelReceipts(e.target.files, 'diesel')}
          />
        </label>
        <label className={`add-receipt-btn adblue ${!canUpload ? 'disabled' : ''}`} title={!canUpload ? 'Select a vehicle to enable uploads' : undefined}>
          <Plus size={16} />
          Add AdBlue
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            disabled={!canUpload}
            onChange={(e) => e.target.files.length > 0 && handleMultipleFuelReceipts(e.target.files, 'adblue')}
          />
        </label>
      </div>
    </div>
    {fuelReceipts.length === 0 && (
      <p className="modern-instruction-text" style={{ marginTop: '12px' }}>No fuel receipts added yet. Click "Add Diesel" or "Add AdBlue" above.</p>
    )}
    <div className="modern-documents-grid" style={{ marginTop: fuelReceipts.length > 0 ? '20px' : '0' }}>
      {fuelReceipts.map(receipt => (
        <FuelReceiptUpload
          key={receipt.id}
          receipt={receipt}
          onUpload={(file) => handleFuelReceiptUpload(receipt.id, file)}
          onProcess={() => processOCR('fuel', null, receipt.id)}
          onRemove={() => removeFuelReceipt(receipt.id)}
          isProcessing={isProcessing}
          canUpload={canUpload}
        />
      ))}
    </div>
  </section>
);

/**
 * FuelReceiptUpload Component
 * Compact component for uploading fuel receipts with remove functionality
 *
 * @param {Object} receipt - Receipt object with id, type, file, preview, and ocrData
 * @param {Function} onUpload - Callback when file is selected
 * @param {Function} onRemove - Callback to remove this receipt
 */
const FuelReceiptUpload = ({ receipt, onUpload, onRemove, canUpload }) => {
  const inputId = `fuel-receipt-${receipt.id}`;

  const handleLabelClick = (e) => {
    if (!canUpload) {
      e.preventDefault();
      toast.warn('Please select a vehicle to upload documents');
    }
  };

  const hasData = receipt && (receipt.preview || receipt.documentMeta?.publicUrl);
  const ocrData = receipt?.ocrData || receipt?.documentMeta?.ocrData;
  const title = receipt.type === 'diesel' ? 'SLOT: DIESEL RECEIPT' : 'SLOT: ADBLUE RECEIPT';

  return (
    <div className="modern-document-slot">
      <div className="slot-header">
        <h3>{title}</h3>
      </div>

      <input
        type="file"
        id={inputId}
        accept="image/*"
        onChange={(e) => onUpload(e.target.files[0])}
        style={{ display: 'none' }}
        disabled={!canUpload}
      />

      {!hasData ? (
        <label
          htmlFor={inputId}
          className={`slot-upload-area ${!canUpload ? 'disabled' : ''}`}
          onClick={handleLabelClick}
          style={{ cursor: canUpload ? 'pointer' : 'not-allowed' }}
        >
          <Upload size={28} color="#94a3b8" />
          <span>Drop receipt here or click to upload</span>
        </label>
      ) : (
        <div className="slot-filled-container">
          <div className="slot-image-wrapper">
            <img src={receipt.documentMeta?.publicUrl || receipt.preview} alt={title} />
            <div className="slot-image-overlay">
              <div className="slot-badge success">
                <CheckCircle size={14} className="badge-icon-svg" /> OCR Done
              </div>
              <div className="slot-actions">
                <label htmlFor={inputId} className="slot-action-btn edit" onClick={handleLabelClick}>
                  <Edit2 size={14} /> Edit
                </label>
                <button className="slot-action-btn delete" onClick={(e) => { e.preventDefault(); onRemove(); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {(ocrData && Object.keys(ocrData).length > 0) && (
            <div className="slot-data-ribbon">
              <div className="slot-data-fields">
                {Object.entries(ocrData).map(([key, value]) => (
                  <div key={key} className="slot-data-item">
                    <span className="data-label">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="data-value">{String(value)}</span>
                  </div>
                ))}
              </div>
              <div className="slot-confidence">
                <div className="confidence-circle">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray="85, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                </div>
                <div className="confidence-text">
                  <span className="confidence-value">85%</span>
                  <span className="confidence-label">Confidence</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TripFormFuelReceipts;
