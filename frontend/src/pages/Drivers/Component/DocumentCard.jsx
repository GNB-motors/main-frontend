import React from 'react';
import { Eye, RotateCw, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import './DocumentCard.css';
import DigiLockerBadge from './DigiLockerBadge';

/**
 * DocumentCard
 * Renders an employee document card with upload status, verification status,
 * document preview / filename, and View / Replace / Remove actions.
 */
const DocumentCard = ({
  documentType = 'driverLicense',
  label,
  preview,
  fileName,
  name,
  isUploaded: propIsUploaded,
  isVerified = false,
  licenseNumber = null,
  onSelect,
  onRemove,
  onView,
  isDisabled = false,
  digilockerStatus,
}) => {
  const isUploaded = Boolean(propIsUploaded || preview || fileName || name);
  const displayName = fileName || name || '';

  const handleView = (e) => {
    e.stopPropagation();
    if (onView) {
      onView();
    } else if (preview) {
      window.open(preview, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="document-card-wrapper">
      <div className="document-card-label-row">
        <div className="document-card-label">{label}</div>
        <div className="document-card-badges">
          <DigiLockerBadge status={digilockerStatus} />
          {isUploaded ? (
            <span className="doc-status-badge doc-status-badge--uploaded">Uploaded</span>
          ) : (
            <span className="doc-status-badge doc-status-badge--not-uploaded">Not uploaded</span>
          )}
          {isUploaded &&
            (isVerified ? (
              <span
                className="doc-status-badge doc-status-badge--verified"
                title="Document is verified"
              >
                <CheckCircle2 size={11} /> Verified
              </span>
            ) : (
              <span
                className="doc-status-badge doc-status-badge--unverified"
                title="Pending verification"
              >
                <AlertCircle size={11} /> Unverified
              </span>
            ))}
        </div>
      </div>

      <div className="document-card">
        {isUploaded ? (
          <div className="document-card-preview-container">
            <div className="document-card-preview">
              {preview ? (
                <img src={preview} alt={label} className="document-preview-image" />
              ) : (
                <div className="document-preview-fallback">
                  <FileText size={40} className="doc-fallback-icon" />
                  <span className="doc-fallback-text">{displayName || label}</span>
                </div>
              )}
              <div className="document-preview-overlay">
                {(preview || onView) && (
                  <button
                    type="button"
                    className="document-action-button view-button"
                    onClick={handleView}
                    disabled={isDisabled}
                    title="View document"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                )}
                <button
                  type="button"
                  className="document-action-button replace-button"
                  onClick={onSelect}
                  disabled={isDisabled}
                  title="Replace document"
                >
                  <RotateCw size={16} />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  className="document-action-button delete-button"
                  onClick={onRemove}
                  disabled={isDisabled}
                  title="Remove document"
                  aria-label="Remove document"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Document metadata: filename and licence details */}
            <div className="document-card-meta">
              {displayName && (
                <div className="document-filename-row" title={displayName}>
                  <FileText size={13} className="document-file-icon" />
                  <span className="document-filename-text">{displayName}</span>
                </div>
              )}

              {documentType === 'driverLicense' && (
                <div className="document-license-info">
                  <span className="document-license-label">License Number:</span>
                  {licenseNumber ? (
                    <span className="document-license-number">{licenseNumber}</span>
                  ) : (
                    <span className="document-license-not-extracted">Not extracted</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="document-card-unuploaded-container">
            <button
              type="button"
              className="document-upload-btn"
              aria-label={`Browse files for ${label}`}
              onClick={onSelect}
              disabled={isDisabled}
            >
              <div className="document-upload-content">
                <div className="document-upload-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 3.44001V14.85M12 3.44001C11.2 3.44001 9.70999 5.72001 9.14999 6.29001M12 3.44001C12.8 3.44001 14.29 5.72001 14.85 6.29001"
                      stroke="#454547"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M21.13 17.14C21.13 19.97 20.54 20.56 17.71 20.56H6.29C3.46 20.56 2.87 19.97 2.87 17.14"
                      stroke="#454547"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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

            {documentType === 'driverLicense' && (
              <div className="document-license-info document-license-info--empty">
                <span className="document-license-label">License Status:</span>
                <span className="document-license-not-uploaded">Not uploaded</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentCard;
