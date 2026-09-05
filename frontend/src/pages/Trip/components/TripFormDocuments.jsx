/**
 * TripFormDocuments Component
 *
 * Presentational documents section for the trip form. Renders either the
 * "start" documents (start odometer + weigh-in slip) or the "end" documents
 * (end odometer + proof of delivery) based on the `section` prop.
 *
 * All state and upload/OCR handlers live in TripFormPage; this component
 * only renders the markup wired through props.
 */

import { Upload, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const TripFormDocuments = ({
  section,
  isEditMode,
  isCompletedTrip,
  canUpload,
  isProcessing,
  startDocs,
  endDocs,
  showManualOdometer,
  setShowManualOdometer,
  manualOdometerStart,
  setManualOdometerStart,
  noSlipId,
  setNoSlipId,
  manualPayload,
  setManualPayload,
  showManualOdometerEnd,
  setShowManualOdometerEnd,
  manualOdometerEnd,
  setManualOdometerEnd,
  handleFileUpload,
  processOCR
}) => {
  if (section === 'start') {
    return (
      /* Start Details Section - Start Documents */
      <section className="modern-form-section no-bg">

        {/* Odometer Start and Weigh-in Slip side by side */}
        <div className="documents-grid modern-documents-grid">
          {/* Odometer Start with Manual Toggle */}
          <div className="document-section-with-toggle">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showManualOdometer}
                  onChange={(e) => setShowManualOdometer(e.target.checked)}
                  disabled={isEditMode}
                />
                <span className="toggle-text">No Odometer Document (Enter Manually)</span>
              </label>
            </div>

            {showManualOdometer ? (
              <div className="manual-input-container">
                <div className="form-group">
                  <label>Manual Odometer Reading <span className="required">*</span></label>
                  <input
                    type="number"
                    value={manualOdometerStart}
                    onChange={(e) => setManualOdometerStart(e.target.value)}
                    placeholder="Enter odometer reading"
                    disabled={isEditMode}
                  />
                </div>
              </div>
            ) : (
              <DocumentUpload
                title="SLOT A: START ODOMETER IMAGE"
                required
                document={startDocs.odometerStart}
                onUpload={(file) => handleFileUpload('start', 'odometerStart', file)}
                onProcess={() => processOCR('start', 'odometerStart')}
                isProcessing={isProcessing}
                canUpload={canUpload}
              />
            )}
          </div>

          {/* Weigh-in Slip with No Slip ID Toggle */}
          <div className="document-section-with-toggle">
            <div className="toggle-container">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={noSlipId}
                  onChange={(e) => setNoSlipId(e.target.checked)}
                  disabled={isEditMode}
                />
                <span className="toggle-text">No Slip ID (Enter Payload Manually)</span>
              </label>
            </div>

            {noSlipId ? (
              <div className="manual-input-container">
                <div className="form-group">
                  <label>Manual Payload Weight (kg) <span className="required">*</span></label>
                  <input
                    type="text"
                    value={manualPayload}
                    onChange={(e) => setManualPayload(e.target.value)}
                    placeholder="Enter payload weight (e.g., 1500 KG)"
                    disabled={isEditMode}
                  />
                </div>
              </div>
            ) : (
              <DocumentUpload
                title="SLOT B: WEIGH-IN SLIP"
                required
                document={startDocs.weighInSlip}
                onUpload={(file) => handleFileUpload('start', 'weighInSlip', file)}
                onProcess={() => processOCR('start', 'weighInSlip')}
                isProcessing={isProcessing}
                canUpload={canUpload}
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    /* End Details Section - with End Documents side by side */
    <section className="modern-form-section">
      <h2 className="modern-section-heading">End Documents</h2>

      {/* Odometer End and Proof of Delivery side by side */}
      <div className="documents-grid modern-documents-grid">
        {/* End Odometer with Manual Toggle */}
        <div className="document-section-with-toggle">
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showManualOdometerEnd}
                onChange={(e) => setShowManualOdometerEnd(e.target.checked)}
                disabled={isCompletedTrip}
              />
              <span className="toggle-text">No Odometer Document (Enter Manually)</span>
            </label>
          </div>

          {showManualOdometerEnd ? (
            <div className="manual-input-container">
              <div className="form-group">
                <label>Manual End Odometer Reading <span className="required">*</span></label>
                <input
                  type="number"
                  value={manualOdometerEnd}
                  onChange={(e) => setManualOdometerEnd(e.target.value)}
                  placeholder="Enter end odometer reading"
                  disabled={isCompletedTrip}
                />
              </div>
            </div>
          ) : (
            <DocumentUpload
              title="SLOT C: END ODOMETER IMAGE"
              required
              document={endDocs.odometerEnd}
              onUpload={(file) => handleFileUpload('end', 'odometerEnd', file)}
              onProcess={() => processOCR('end', 'odometerEnd')}
              isProcessing={isProcessing}
              canUpload={canUpload}
            />
          )}
        </div>

        {/* Proof of Delivery - Optional */}
        <div className="document-section-with-toggle">
          <DocumentUpload
            title="SLOT D: PROOF OF DELIVERY (OPTIONAL)"
            document={endDocs.proofOfDelivery}
            onUpload={(file) => handleFileUpload('end', 'proofOfDelivery', file)}
            onProcess={() => processOCR('end', 'proofOfDelivery')}
            isProcessing={isProcessing}
            canUpload={canUpload}
          />
        </div>
      </div>
    </section>
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
 */
const DocumentUpload = ({ title, required, document, onUpload, canUpload, onRemove }) => {
  const inputId = `upload-${title.replace(/\s+/g, '-').toLowerCase()}`;

  const handleLabelClick = (e) => {
    if (!canUpload) {
      e.preventDefault();
      toast.warn('Please select a vehicle to upload documents');
    }
  };

  const hasData = document && (document.preview || document.documentMeta?.publicUrl);
  const ocrData = document?.ocrData || document?.documentMeta?.ocrData;

  return (
    <div className="modern-document-slot">
      <div className="slot-header">
        <h3>{title.toUpperCase()} {required && <span className="required">*</span>}</h3>
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
          <span>Drop files here or click to upload</span>
        </label>
      ) : (
        <div className="slot-filled-container">
          <div className="slot-image-wrapper">
            <img src={document.documentMeta?.publicUrl || document.preview} alt={title} />
            <div className="slot-image-overlay">
              <div className="slot-badge success">
                <CheckCircle size={14} className="badge-icon-svg" /> OCR Done
              </div>
              <div className="slot-actions">
                <label htmlFor={inputId} className="slot-action-btn edit" onClick={handleLabelClick}>
                  <Edit2 size={14} /> Edit
                </label>
                {onRemove && (
                  <button className="slot-action-btn delete" onClick={(e) => { e.preventDefault(); onRemove(); }}>
                    <Trash2 size={14} />
                  </button>
                )}
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

export default TripFormDocuments;
