import React from 'react';
import {
  X,
  ArrowLeft,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Maximize2,
  Calendar,
  User,
  Hash,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { DOC_COLS, bucketFor, daysUntil } from './vehicleDashboardLogic';

export default function VehicleDocumentDetail({
  selectedVehicle,
  selectedDocKey,
  fullDocs,
  loadingDocs,
  activeSide,
  setActiveSide,
  fullImageModal,
  setFullImageModal,
  onBackToOverview,
  onClose,
  onManageVehicle,
}) {
  const docMeta = DOC_COLS.find((d) => d.key === selectedDocKey) || {
    key: selectedDocKey,
    label: selectedDocKey,
    fullLabel: selectedDocKey,
    short: selectedDocKey.slice(0, 3),
  };

  const docEntry = selectedVehicle.documents?.[selectedDocKey];
  const bucket = bucketFor(docEntry);
  const days = daysUntil(docEntry?.expiryDate);

  // Find the full document from fetched list
  const fullDoc = fullDocs.find((d) => d.docType === selectedDocKey);
  const files = fullDoc?.files || [];
  const frontFile = files.find((f) => f.side === 'FRONT') || files[0];
  const backFile = files.find((f) => f.side === 'BACK') || files[1];
  const currentFile = activeSide === 'BACK' && backFile ? backFile : frontFile;

  const isPdf = Boolean(
    currentFile?.mimeType === 'application/pdf' ||
    currentFile?.publicUrl?.toLowerCase()?.includes('.pdf'),
  );

  const ocrFields = fullDoc?.ocr?.fields || {};
  const ocrStatus =
    fullDoc?.ocr?.status || docEntry?.ocrStatus || (docEntry?.uploaded ? 'PENDING' : 'NONE');

  let badgeStatusText = '';
  let badgeColorClass = '';
  let badgeIcon = null;

  if (bucket === 'expired') {
    badgeStatusText = `Expired (${Math.abs(days)}d ago)`;
    badgeColorClass = 'v-dash-status-pill--expired';
    badgeIcon = <XCircle size={14} />;
  } else if (bucket === 'healthy') {
    badgeStatusText = `Valid (${days} days left)`;
    badgeColorClass = 'v-dash-status-pill--valid';
    badgeIcon = <CheckCircle2 size={14} />;
  } else if (bucket === 'warning' || bucket === 'critical') {
    badgeStatusText = `Expiring Soon (${days} days left)`;
    badgeColorClass = 'v-dash-status-pill--warning';
    badgeIcon = <AlertTriangle size={14} />;
  } else {
    badgeStatusText = docEntry?.uploaded ? 'OCR In Progress' : 'Document Missing';
    badgeColorClass = 'v-dash-status-pill--missing';
    badgeIcon = <HelpCircle size={14} />;
  }

  return (
    <aside className="v-dash-panel" aria-label="Document detail panel">
      {/* Panel Header */}
      <div className="v-dash-panel-header">
        <button
          type="button"
          className="v-dash-back-btn"
          onClick={onBackToOverview}
          title="Back to all documents"
        >
          <ArrowLeft size={16} />
          <span>All Documents</span>
        </button>
        <button
          type="button"
          className="v-dash-close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="v-dash-panel-scroll">
        {/* Document Header Card */}
        <div className="v-dash-doc-detail-header">
          <div className="v-dash-doc-icon-badge v-dash-doc-icon-badge--lg">{docMeta.short}</div>
          <div className="v-dash-doc-header-info">
            <h2 className="v-dash-doc-title">{docMeta.fullLabel}</h2>
            <div className="v-dash-vehicle-reg-tag">
              <Truck size={13} />
              <span>{selectedVehicle.registrationNumber}</span>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`v-dash-status-pill-banner ${badgeColorClass}`}>
          {badgeIcon}
          <span className="v-dash-status-pill-text">{badgeStatusText}</span>
        </div>

        {/* Scanned Document Preview Card */}
        <div className="v-dash-doc-viewer-card" style={{ flexShrink: 0, width: '100%' }}>
          <div className="v-dash-viewer-head">
            <span className="v-dash-viewer-title">Scanned Document Photo</span>
            {files.length > 1 && (
              <div className="v-dash-side-tabs">
                <button
                  type="button"
                  className={`v-dash-side-tab ${activeSide === 'FRONT' ? 'v-dash-side-tab--active' : ''}`}
                  onClick={() => setActiveSide('FRONT')}
                >
                  Front
                </button>
                <button
                  type="button"
                  className={`v-dash-side-tab ${activeSide === 'BACK' ? 'v-dash-side-tab--active' : ''}`}
                  onClick={() => setActiveSide('BACK')}
                >
                  Back
                </button>
              </div>
            )}
          </div>

          <div
            className="v-dash-preview-frame"
            style={{ minHeight: 280, height: 280, flexShrink: 0 }}
          >
            {loadingDocs ? (
              <div className="v-dash-preview-loading">
                <RefreshCw size={24} className="v-dash-spinner" />
                <span>Loading scanned file preview…</span>
              </div>
            ) : currentFile?.publicUrl ? (
              <div
                className="v-dash-preview-img-wrap"
                style={{ minHeight: 280, height: 280, width: '100%' }}
                onClick={() => setFullImageModal(currentFile.publicUrl)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setFullImageModal(currentFile.publicUrl);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Click to view enlarged document"
              >
                {isPdf ? (
                  <iframe
                    src={`${currentFile.publicUrl}#toolbar=0`}
                    title={`${docMeta.fullLabel} - ${activeSide}`}
                    className="v-dash-preview-iframe"
                    style={{ width: '100%', height: 280, border: 'none' }}
                  />
                ) : (
                  <img
                    src={currentFile.publicUrl}
                    alt={`${docMeta.fullLabel} - ${activeSide}`}
                    className="v-dash-preview-img"
                    style={{ maxWidth: '100%', maxHeight: 260, objectFit: 'contain' }}
                  />
                )}
                <div className="v-dash-preview-overlay">
                  <button
                    type="button"
                    className="v-dash-overlay-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullImageModal(currentFile.publicUrl);
                    }}
                    title="Enlarge photo"
                  >
                    <Maximize2 size={14} />
                    <span>Full View</span>
                  </button>
                  <a
                    href={currentFile.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="v-dash-overlay-btn"
                    onClick={(e) => e.stopPropagation()}
                    title="Open in new window"
                  >
                    <ExternalLink size={14} />
                    <span>Open</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="v-dash-preview-empty">
                <UploadCloud size={32} className="v-dash-empty-icon" />
                <p className="v-dash-preview-empty-text">
                  {docEntry?.uploaded
                    ? 'File processing. Scanned image will appear once verified.'
                    : 'No scanned copy uploaded for this vehicle.'}
                </p>
                <button
                  type="button"
                  className="v-dash-action-btn v-dash-action-btn--primary"
                  onClick={() => onManageVehicle(selectedVehicle)}
                >
                  <UploadCloud size={14} />
                  <span>Upload {docMeta.short} Now</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Document Dates & OCR Information */}
        <div className="v-dash-metadata-section" style={{ flexShrink: 0 }}>
          <h4 className="v-dash-section-subhead">Verification &amp; OCR Metadata</h4>
          <div className="v-dash-metadata-grid">
            <div className="v-dash-meta-row">
              <span className="v-dash-meta-label">
                <Calendar size={13} /> Expiry Date
              </span>
              <span className="v-dash-meta-value">
                {docEntry?.expiryDate
                  ? new Date(docEntry.expiryDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Not specified'}
              </span>
            </div>

            <div className="v-dash-meta-row">
              <span className="v-dash-meta-label">
                <Calendar size={13} /> Issued On
              </span>
              <span className="v-dash-meta-value">
                {ocrFields.issueDate || ocrFields.registrationDate || 'No data found'}
              </span>
            </div>

            <div className="v-dash-meta-row">
              <span className="v-dash-meta-label">
                <User size={13} /> Owner Name (OCR)
              </span>
              <span className="v-dash-meta-value">
                {ocrFields.ownerName || selectedVehicle.ownerName || '—'}
              </span>
            </div>

            <div className="v-dash-meta-row">
              <span className="v-dash-meta-label">
                <Hash size={13} /> Chassis Match
              </span>
              <span className="v-dash-meta-value v-dash-meta-mono">
                {ocrFields.chassisNumber || selectedVehicle.chassisNumber || '—'}
              </span>
            </div>

            <div className="v-dash-meta-row">
              <span className="v-dash-meta-label">
                <FileText size={13} /> OCR Status
              </span>
              <span className={`v-dash-ocr-chip v-dash-ocr-chip--${ocrStatus.toLowerCase()}`}>
                {ocrStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="v-dash-detail-actions" style={{ flexShrink: 0 }}>
          <button
            type="button"
            className="v-dash-action-btn v-dash-action-btn--secondary"
            onClick={() => onManageVehicle(selectedVehicle)}
          >
            Update / Replace File
          </button>
          <button
            type="button"
            className="v-dash-action-btn v-dash-action-btn--ghost"
            onClick={onBackToOverview}
          >
            Back to Overview
          </button>
        </div>
      </div>

      {/* Modal for full screen image/PDF preview */}
      {fullImageModal && (
        <div
          className="v-dash-image-modal-overlay"
          onClick={() => setFullImageModal(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setFullImageModal(null);
          }}
          role="presentation"
          tabIndex={-1}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- onClick only keeps clicks inside the dialog from reaching the backdrop's close; Escape is handled on the backdrop */}
          <div
            className="v-dash-image-modal-inner"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="v-dash-image-modal-close"
              onClick={() => setFullImageModal(null)}
            >
              <X size={20} />
            </button>
            {isPdf ? (
              <iframe
                src={fullImageModal}
                title="Enlarged PDF document"
                style={{ width: '85vw', height: '85vh', border: 'none', background: '#ffffff' }}
              />
            ) : (
              <img
                src={fullImageModal}
                alt="Enlarged document scan"
                className="v-dash-image-modal-img"
              />
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
