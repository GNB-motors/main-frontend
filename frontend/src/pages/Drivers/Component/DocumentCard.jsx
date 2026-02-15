import React from 'react';
import './DocumentCard.css';

// Force refresh: 2026-02-14
const DocumentCard = ({
  documentType,
  label,
  description,
  preview,
  onSelect,
  onRemove,
  isDisabled = false,
}) => {
  return (
    <div className="document-card-wrapper">
      <div className="document-card-label">{label}</div>
      <div className="document-card">
        {preview ? (
          <div className="document-card-preview">
            <img src={preview} alt={label} className="document-preview-image" />
            <div className="document-preview-overlay">
              <button
                type="button"
                className="document-action-button replace-button"
                onClick={onSelect}
                disabled={isDisabled}
                title="Replace document"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 5L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Replace</span>
              </button>
              <button
                type="button"
                className="document-action-button delete-button"
                onClick={onRemove}
                disabled={isDisabled}
                title="Remove document"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 8V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M3 4L3.5 14C3.5 14.5523 3.94772 15 4.5 15H13.5C14.0523 15 14.5 14.5523 14.5 14L15 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 4V2.5C7 2.22386 7.22386 2 7.5 2H10.5C10.7761 2 11 2.22386 11 2.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="document-upload-btn"
            onClick={onSelect}
            disabled={isDisabled}
          >
            <div className="document-upload-content">
              <div className="document-upload-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3.44001V14.85M12 3.44001C11.2 3.44001 9.70999 5.72001 9.14999 6.29001M12 3.44001C12.8 3.44001 14.29 5.72001 14.85 6.29001" stroke="#454547" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21.13 17.14C21.13 19.97 20.54 20.56 17.71 20.56H6.29C3.46 20.56 2.87 19.97 2.87 17.14" stroke="#454547" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="document-upload-text-content">
                <div className="document-upload-main-text">
                  <span className="document-upload-span">Drop an image or</span>
                  <span className="document-upload-span-bold"> browse files</span>
                </div>
              </div>
            </div>
            <div className="document-upload-footer">
              <span className="document-upload-size">up to 10 MB</span>
              <div className="document-upload-divider" />
              <span className="document-upload-formats">.jpg, .jpeg, .png</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
