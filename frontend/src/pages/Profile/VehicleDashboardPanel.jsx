import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  ShieldCheck,
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
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { DOC_COLS, bucketFor, daysUntil } from './vehicleDashboardLogic';
import { VehicleService } from './VehicleService';
import { getToken } from '../../utils/session';
import './VehicleDashboardPage.css';

/**
 * WheelsEye-style slide-over / split panel for Vehicle Dashboard.
 * 3 Modes:
 *   1. Empty state: No vehicle selected.
 *   2. Vehicle Overview: All 7 documents + Challans for selected vehicle.
 *   3. Document Detail: Single document's photo, status, OCR metadata & actions.
 */
export default function VehicleDashboardPanel({
  selectedVehicle,
  selectedDocKey,
  onSelectDoc,
  onBackToOverview,
  onClose,
  onManageVehicle,
  onOpenChallanModal,
}) {
  const [activeSide, setActiveSide] = useState('FRONT'); // 'FRONT' | 'BACK'
  const [fullDocs, setFullDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [fullImageModal, setFullImageModal] = useState(null);
  const [copiedReg, setCopiedReg] = useState(false);

  // Fetch full vehicle documents (with presigned S3 URLs) whenever selected vehicle changes
  useEffect(() => {
    if (!selectedVehicle?._id) {
      setFullDocs([]);
      return;
    }
    let isCancelled = false;
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const token = getToken();
        const docs = await VehicleService.getVehicleDocuments(selectedVehicle._id, token);
        if (!isCancelled) {
          setFullDocs(Array.isArray(docs) ? docs : []);
        }
      } catch (err) {
        console.warn('Could not fetch vehicle document details', err);
        if (!isCancelled) setFullDocs([]);
      } finally {
        if (!isCancelled) setLoadingDocs(false);
      }
    };
    fetchDocs();
    return () => {
      isCancelled = true;
    };
  }, [selectedVehicle?._id]);

  // Reset side tab when docKey changes
  useEffect(() => {
    setActiveSide('FRONT');
  }, [selectedDocKey]);

  const handleCopyReg = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedReg(true);
    setTimeout(() => setCopiedReg(false), 2000);
  };

  // 1. EMPTY STATE (No vehicle selected)
  if (!selectedVehicle) {
    return (
      <aside className="v-dash-panel v-dash-panel--empty" aria-label="Vehicle details panel">
        <div className="v-dash-empty-content">
          <div className="v-dash-empty-illustration">
            <svg
              width="120"
              height="90"
              viewBox="0 0 120 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="15"
                y="10"
                width="70"
                height="55"
                rx="6"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              <rect x="25" y="22" width="50" height="4" rx="2" fill="#E2E8F0" />
              <rect x="25" y="32" width="38" height="4" rx="2" fill="#E2E8F0" />
              <rect x="25" y="42" width="44" height="4" rx="2" fill="#E2E8F0" />
              <circle cx="70" cy="40" r="12" fill="#DCFCE7" stroke="#22C55E" strokeWidth="2" />
              <path
                d="M66 40L69 43L75 37"
                stroke="#16A34A"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M45 68H100C103.314 68 106 65.3137 106 62V48C106 46.8954 105.105 46 104 46H94L88 38H72V68H45Z"
                fill="#3B82F6"
                fillOpacity="0.15"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <circle cx="60" cy="68" r="6" fill="#1E293B" />
              <circle cx="92" cy="68" r="6" fill="#1E293B" />
            </svg>
          </div>
          <h3 className="v-dash-empty-title">No vehicle selected</h3>
          <p className="v-dash-empty-desc">
            Select any vehicle to view all document &amp; challan details
          </p>
          <div className="v-dash-empty-hints">
            <div className="v-dash-empty-hint-item">
              <span className="v-dash-hint-bullet">1</span>
              <span>
                Click on a <strong>Vehicle Number</strong> to view all 7 documents &amp; challans.
              </span>
            </div>
            <div className="v-dash-empty-hint-item">
              <span className="v-dash-hint-bullet">2</span>
              <span>
                Click on any <strong>Document Cell</strong> to view its scanned photo &amp; OCR
                data.
              </span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // 3. DOCUMENT DETAIL MODE
  if (selectedDocKey) {
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
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            <div
              className="v-dash-image-modal-inner"
              onClick={(e) => e.stopPropagation()}
              role="document"
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

  // 2. VEHICLE OVERVIEW MODE (All 7 documents + Challans)
  return (
    <aside className="v-dash-panel" aria-label="Vehicle overview panel">
      {/* Panel Header */}
      <div className="v-dash-panel-header">
        <h3 className="v-dash-panel-title">Documents &amp; Challan</h3>
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
        {/* Vehicle Registration Card */}
        <div className="v-dash-vehicle-header-card">
          <div className="v-dash-vehicle-main-row">
            <div className="v-dash-plate-box">
              <span className="v-dash-plate-ind">IND</span>
              <span className="v-dash-plate-num">{selectedVehicle.registrationNumber}</span>
              <button
                type="button"
                className="v-dash-copy-btn"
                onClick={() => handleCopyReg(selectedVehicle.registrationNumber)}
                title="Copy Registration Number"
              >
                {copiedReg ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
              </button>
            </div>
            <button
              type="button"
              className="v-dash-edit-link"
              onClick={() => onManageVehicle(selectedVehicle)}
            >
              Edit Vehicle &rarr;
            </button>
          </div>
          <div className="v-dash-vehicle-meta-sub">
            <span>
              {[selectedVehicle.manufacturer, selectedVehicle.model].filter(Boolean).join(' · ') ||
                'Commercial Vehicle'}
            </span>
            {selectedVehicle.chassisNumber && (
              <span className="v-dash-chassis-sub">Chassis: {selectedVehicle.chassisNumber}</span>
            )}
          </div>
        </div>

        {/* Pending Challans Card (WheelsEye style) */}
        <div className="v-dash-challan-summary-card">
          <div className="v-dash-challan-main">
            <div className="v-dash-challan-icon">
              <ShieldCheck size={22} className="v-dash-shield-icon" />
            </div>
            <div className="v-dash-challan-text-wrap">
              <h4 className="v-dash-challan-title">0 Pending Challans worth &#8377;0</h4>
              <p className="v-dash-challan-sub">
                No active traffic or transport violation penalties reported.
              </p>
            </div>
          </div>
          <button type="button" className="v-dash-challan-verify-btn" onClick={onOpenChallanModal}>
            Check Live Status
          </button>
        </div>

        {/* Vehicle Documents Grid Section */}
        <div className="v-dash-docs-section">
          <div className="v-dash-docs-section-head">
            <h4 className="v-dash-section-title">Vehicle Documents</h4>
            <span className="v-dash-docs-count-hint">Click any document to view photo</span>
          </div>

          <div className="v-dash-doc-cards-grid">
            {DOC_COLS.map(({ key, fullLabel, short }) => {
              const docEntry = selectedVehicle.documents?.[key];
              const bucket = bucketFor(docEntry);
              const days = daysUntil(docEntry?.expiryDate);

              let statusLabel = '';
              let statusClass = '';
              let issuedText = 'Issued on: No data found';

              if (bucket === 'expired') {
                statusLabel = `Expired (${Math.abs(days)}d ago)`;
                statusClass = 'v-dash-card-status--expired';
              } else if (bucket === 'healthy') {
                statusLabel = `Expires in ${days} days`;
                statusClass = 'v-dash-card-status--valid';
              } else if (bucket === 'warning' || bucket === 'critical') {
                statusLabel = `Expiring soon (${days}d left)`;
                statusClass = 'v-dash-card-status--warning';
              } else {
                statusLabel = docEntry?.uploaded ? 'OCR processing' : 'Not uploaded';
                statusClass = 'v-dash-card-status--missing';
              }

              if (docEntry?.expiryDate) {
                const expDate = new Date(docEntry.expiryDate);
                issuedText = `Expires: ${expDate.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}`;
              }

              return (
                <div
                  key={key}
                  className="v-dash-doc-card"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDoc(key);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDoc(key);
                    }
                  }}
                  title={`View ${fullLabel} for ${selectedVehicle.registrationNumber}`}
                >
                  <div className="v-dash-doc-card-top">
                    <div className={`v-dash-doc-icon-badge v-dash-doc-icon-badge--${bucket}`}>
                      {short}
                    </div>
                    <span className={`v-dash-card-status ${statusClass}`}>{statusLabel}</span>
                  </div>
                  <div className="v-dash-doc-card-title">{fullLabel}</div>
                  <div className="v-dash-doc-card-date">{issuedText}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
