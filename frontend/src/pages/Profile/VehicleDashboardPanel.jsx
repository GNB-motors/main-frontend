import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Copy, Check } from 'lucide-react';
import { DOC_COLS, bucketFor, daysUntil } from './vehicleDashboardLogic';
import { VehicleService } from './VehicleService';
import './VehicleDashboardPage.css';
import VehicleDashboardEmptyPanel from './VehicleDashboardEmptyPanel.jsx';
import VehicleDocumentDetail from './VehicleDocumentDetail.jsx';
import logger from '../../utils/logger';

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
        const docs = await VehicleService.getVehicleDocuments(selectedVehicle._id);
        if (!isCancelled) {
          setFullDocs(Array.isArray(docs) ? docs : []);
        }
      } catch (err) {
        logger.warn('VehicleDashboardPanel', 'Could not fetch vehicle document details', err);
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
    return <VehicleDashboardEmptyPanel />;
  }

  // 3. DOCUMENT DETAIL MODE
  if (selectedDocKey) {
    return (
      <VehicleDocumentDetail
        selectedVehicle={selectedVehicle}
        selectedDocKey={selectedDocKey}
        fullDocs={fullDocs}
        loadingDocs={loadingDocs}
        activeSide={activeSide}
        setActiveSide={setActiveSide}
        fullImageModal={fullImageModal}
        setFullImageModal={setFullImageModal}
        onBackToOverview={onBackToOverview}
        onClose={onClose}
        onManageVehicle={onManageVehicle}
      />
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
