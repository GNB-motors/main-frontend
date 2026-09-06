import React, { useState } from 'react';
import { Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const SlotUpload = ({
  docType,
  title,
  label,
  inputId,
  required,
  doc,
  isScanning,
  onDrop,
  onRemove,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
  };
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
        <h3>
          {title}
          {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
        </h3>
      </div>
      <input
        type="file"
        id={inputId}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files[0]) {
            onDrop(docType, [e.target.files[0]]);
            e.target.value = '';
          }
        }}
      />
      {!hasData ? (
        <div
          className={`slot-dropzone ${isDragging ? 'dragging' : ''}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById(inputId)?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`slot-dropzone-inner ${isDragging ? 'dragging' : ''}`}>
            {isDragging ? (
              <>
                <div className="slot-dropzone-drag-icon">⬇️</div>
                <p className="slot-dropzone-drag-text">Drop it here!</p>
              </>
            ) : (
              <>
                <div className="slot-icon-wrapper">
                  <svg
                    width="46"
                    height="42"
                    viewBox="0 0 56 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="16"
                      y="2"
                      width="28"
                      height="36"
                      rx="4"
                      fill="#f1f5f9"
                      stroke="#cbd5e1"
                      strokeWidth="1.5"
                      transform="rotate(-8 20 8)"
                    />
                    <rect
                      x="12"
                      y="5"
                      width="28"
                      height="36"
                      rx="4"
                      fill="#e0e7ff"
                      stroke="#a5b4fc"
                      strokeWidth="1.5"
                      transform="rotate(4 28 18)"
                    />
                    <rect
                      x="14"
                      y="8"
                      width="28"
                      height="36"
                      rx="4"
                      fill="white"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="19"
                      y="18"
                      width="18"
                      height="14"
                      rx="2"
                      fill="#eff6ff"
                      stroke="#93c5fd"
                      strokeWidth="1"
                    />
                    <circle cx="23" cy="23" r="2" fill="#60a5fa" />
                    <path d="M19 30 L24 24 L28 27 L31 24 L32 30" fill="#bfdbfe" stroke="none" />
                  </svg>
                </div>
                <p className="slot-dropzone-title">
                  Drag & drop <span className="slot-highlight">{label}</span>
                </p>
                <p className="slot-dropzone-sub">
                  or{' '}
                  <label htmlFor={inputId} className="slot-browse-link">
                    browse
                  </label>
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="slot-filled-container">
          <div className="slot-image-wrapper">
            <img src={doc.preview} alt={title} />
            <div className="slot-image-overlay">
              <div className={`slot-badge ${doc.ocrStatus === 'success' ? 'success' : ''}`}>
                {isScanning ? (
                  <>
                    <Loader2 size={13} className="spinning" /> Scanning...
                  </>
                ) : doc.ocrStatus === 'success' ? (
                  <>
                    <CheckCircle size={13} className="badge-icon-svg" /> OCR Done
                  </>
                ) : doc.ocrStatus === 'error' ? (
                  <>
                    <AlertCircle size={13} style={{ color: '#ef4444' }} /> OCR Failed
                  </>
                ) : (
                  <>
                    <Loader2 size={13} className="spinning" /> Scanning...
                  </>
                )}
              </div>
              <div className="slot-actions">
                <label
                  htmlFor={inputId}
                  className="slot-action-btn edit"
                  style={{ cursor: 'pointer' }}
                >
                  Replace
                </label>
                <button
                  className="slot-action-btn delete"
                  onClick={(e) => {
                    e.preventDefault();
                    onRemove(docType);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotUpload;
