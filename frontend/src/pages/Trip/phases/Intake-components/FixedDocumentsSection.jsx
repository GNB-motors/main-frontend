import React, { useCallback, useState } from 'react';
import { Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { OCRService } from '../../services';

function validateImageFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  return validTypes.includes(file.type) &&
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) &&
    file.size <= 10 * 1024 * 1024;
}

/* Stacked document pages SVG icon (inspired by reference design) */
const StackedDocIcon = () => (
  <svg width="56" height="52" viewBox="0 0 56 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Back page */}
    <rect x="16" y="2" width="28" height="36" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" transform="rotate(-8 20 8)" />
    {/* Middle page */}
    <rect x="12" y="5" width="28" height="36" rx="4" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5" transform="rotate(4 28 18)" />
    {/* Front page */}
    <rect x="14" y="8" width="28" height="36" rx="4" fill="white" stroke="#2563eb" strokeWidth="1.5" />
    {/* Image icon on front */}
    <rect x="19" y="18" width="18" height="14" rx="2" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
    <circle cx="23" cy="23" r="2" fill="#60a5fa" />
    <path d="M19 30 L24 24 L28 27 L31 24 L32 30" fill="#bfdbfe" stroke="none" />
  </svg>
);

const SlotUpload = ({ docType, title, label, inputId, required, doc, isScanning, onDrop, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onDrop(docType, files);
  };

  const hasData = !!doc;

  return (
    <div className="modern-document-slot">
      <div className="slot-header">
        <h3>{title}{required && <span className="required" style={{ marginLeft: 4 }}>*</span>}</h3>
      </div>

      <input
        type="file"
        id={inputId}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) { onDrop(docType, [e.target.files[0]]); e.target.value = ''; }
        }}
      />

      {!hasData ? (
        /* ── Empty / drag-drop state ── */
        <div
          className={`slot-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`slot-dropzone-inner ${isDragging ? 'dragging' : ''}`}>
            {isDragging ? (
              /* Drag-over: filled state */
              <>
                <div className="slot-dropzone-drag-icon">⬇️</div>
                <p className="slot-dropzone-drag-text">Drop it right here!</p>
              </>
            ) : (
              /* Normal: icon + text + browse link */
              <>
                <div className="slot-icon-wrapper">
                  <StackedDocIcon />
                </div>
                <p className="slot-dropzone-title">
                  Drag &amp; drop your <span className="slot-highlight">{label}</span>
                </p>
                <p className="slot-dropzone-sub">
                  or{' '}
                  <label htmlFor={inputId} className="slot-browse-link">
                    browse files
                  </label>{' '}
                  on your computer
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Filled state ── */
        <div className="slot-filled-container">
          <div className="slot-image-wrapper">
            <img src={doc.preview} alt={title} />
            <div className="slot-image-overlay">
              <div className={`slot-badge ${doc.ocrStatus === 'success' ? 'success' : ''}`}>
                {isScanning ? (
                  <><Loader2 size={13} className="spinning" /> Scanning...</>
                ) : doc.ocrStatus === 'success' ? (
                  <><CheckCircle size={13} className="badge-icon-svg" /> OCR Done</>
                ) : doc.ocrStatus === 'error' ? (
                  <><AlertCircle size={13} style={{ color: '#ef4444' }} /> OCR Failed</>
                ) : (
                  <><Loader2 size={13} className="spinning" /> Scanning...</>
                )}
              </div>
              <div className="slot-actions">
                <label htmlFor={inputId} className="slot-action-btn edit" style={{ cursor: 'pointer' }}>
                  Replace
                </label>
                <button
                  className="slot-action-btn delete"
                  onClick={(e) => { e.preventDefault(); onRemove(docType); }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>

          {doc.ocrData && (
            <div className="slot-data-ribbon">
              <div className="slot-data-fields">
                {docType === 'odometer' && doc.ocrData.reading && (
                  <div className="slot-data-item">
                    <span className="data-label">Reading</span>
                    <span className="data-value">{doc.ocrData.reading}</span>
                  </div>
                )}
                {docType === 'fuel' && doc.ocrData.volume && (
                  <div className="slot-data-item">
                    <span className="data-label">Volume</span>
                    <span className="data-value">{doc.ocrData.volume}L</span>
                  </div>
                )}
                {docType === 'fuel' && doc.ocrData.rate && (
                  <div className="slot-data-item">
                    <span className="data-label">Rate</span>
                    <span className="data-value">₹{doc.ocrData.rate}/L</span>
                  </div>
                )}
                {docType === 'fuel' && doc.ocrData.location && (
                  <div className="slot-data-item">
                    <span className="data-label">Location</span>
                    <span className="data-value" style={{ fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.ocrData.location}
                    </span>
                  </div>
                )}
              </div>
              {doc.ocrData.confidence && (
                <div className="slot-confidence">
                  <div className="confidence-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="circle" strokeDasharray={`${doc.ocrData.confidence}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                  </div>
                  <div className="confidence-text">
                    <span className="confidence-value">{doc.ocrData.confidence}%</span>
                    <span className="confidence-label">Confidence</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FixedDocumentsSection = ({ fixedDocs, setFixedDocs, ocrScanning, setOcrScanning, onOcrPreview }) => {
  const [, setOcrResults] = useState({ odometer: null, fuel: null });

  const handleFixedDocDrop = useCallback(async (docType, files) => {
    if (files.length === 0) return;
    const file = files[0];
    if (!validateImageFile(file)) { toast.error('Please upload a valid image file (JPG, PNG, WEBP)'); return; }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setFixedDocs(prev => ({ ...prev, [docType]: { file, preview: e.target.result, s3Url: null, ocrData: null, ocrStatus: 'scanning' } }));
      setOcrScanning(prev => ({ ...prev, [docType]: true }));

      try {
        const ocrDocType = docType === 'odometer' ? 'ODOMETER' : 'FUEL_RECEIPT';
        const ocrResult = await OCRService.scan(file, ocrDocType);
        if (ocrResult.success) {
          const hasOdometerData = docType === 'odometer' && ocrResult.data?.reading;
          const hasFuelData = docType === 'fuel' && (ocrResult.data?.volume || ocrResult.data?.rate);
          const hasUsefulData = hasOdometerData || hasFuelData;
          setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrData: ocrResult.data, ocrStatus: hasUsefulData ? 'success' : 'warning' } }));
          setOcrResults(prev => ({ ...prev, [docType]: ocrResult }));
          if (docType === 'odometer' && ocrResult.data?.reading) toast.success(`Odometer: ${ocrResult.data.reading}`);
          else if (docType === 'fuel' && ocrResult.data?.volume) toast.success(`Fuel volume: ${ocrResult.data.volume}L`);
          else if (!hasUsefulData) toast.warning(`No data detected for ${docType}. Please enter manually.`);
        } else {
          setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrData: null, ocrStatus: 'error', ocrError: ocrResult.error } }));
          toast.warning(`OCR scan incomplete for ${docType}.`);
        }
      } catch (error) {
        setFixedDocs(prev => ({ ...prev, [docType]: { ...prev[docType], ocrData: null, ocrStatus: 'error', ocrError: error.message } }));
      } finally {
        setOcrScanning(prev => ({ ...prev, [docType]: false }));
      }
    };
    reader.readAsDataURL(file);
  }, [setFixedDocs, setOcrScanning]);

  const removeFixedDoc = useCallback((docType) => {
    setFixedDocs(prev => ({ ...prev, [docType]: null }));
  }, [setFixedDocs]);

  const slots = [
    { docType: 'odometer', title: 'SLOT A: END ODOMETER IMAGE', label: 'odometer image', inputId: 'fixed-doc-odometer', required: true },
    { docType: 'fuel',     title: 'SLOT B: FULL TANK FUEL SLIP', label: 'fuel slip',      inputId: 'fixed-doc-fuel',     required: true },
  ];

  return (
    <div className="intake-fixed-docs">
      {slots.map(({ docType, title, label, inputId, required }) => (
        <SlotUpload
          key={docType}
          docType={docType}
          title={title}
          label={label}
          inputId={inputId}
          required={required}
          doc={fixedDocs[docType]}
          isScanning={ocrScanning[docType]}
          onDrop={handleFixedDocDrop}
          onRemove={removeFixedDoc}
        />
      ))}
    </div>
  );
};

export default FixedDocumentsSection;