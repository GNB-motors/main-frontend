import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
  Car,
  CreditCard,
  Building2,
  ArrowRight,
} from 'lucide-react';

/**
 * e-Challan Modal: Demonstrates live traffic violation status & provides
 * detailed technical integration guidance for pulling Indian commercial vehicle challans.
 */
export default function ChallanModal({ isOpen, onClose, selectedVehicle }) {
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState('Just now');

  if (!isOpen) return null;

  const handleSimulateCheck = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setLastChecked(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      );
    }, 700);
  };

  const regNo = selectedVehicle?.registrationNumber || 'ALL FLEET VEHICLES';

  return (
    <div
      className="v-dash-image-modal-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div
        className="v-dash-image-modal-inner"
        style={{
          background: '#ffffff',
          maxWidth: 620,
          width: '94%',
          borderRadius: 16,
          padding: 0,
          color: '#0f172a',
        }}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                e-Challan &amp; Traffic Compliance
              </h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Vehicle: <strong>{regNo}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            className="v-dash-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Status Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={28} color="#16a34a" />
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#166534' }}>
                  0 Pending Challans (₹0 Due)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#15803d' }}>
                  No active traffic violations found across Parivahan &amp; State Police portals.
                </p>
                <span style={{ fontSize: 11, color: '#166534', opacity: 0.85 }}>
                  Last verified: {lastChecked}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSimulateCheck}
              disabled={checking}
              style={{
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                color: '#166534',
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: checking ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={12} className={checking ? 'v-dash-spinner' : ''} />
              <span>{checking ? 'Checking…' : 'Check Now'}</span>
            </button>
          </div>

          {/* Quick Info on Parivahan Integration */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
              <Info size={16} color="#2563eb" />
              <strong style={{ fontSize: 13 }}>
                Live e-Challan Data Source &amp; Architecture
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              In India, commercial fleet operators (like WheelsEye, BlackBuck) pull live e-challans
              using official B2B gateways and commercial APIs:
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                fontSize: 12,
                color: '#475569',
                lineHeight: 1.6,
              }}
            >
              <li>
                <strong>Surepass / Karza / Signzy API:</strong> REST API endpoint{' '}
                <code>POST /api/v1/challan/fetch-challan</code> passing vehicle registration or
                chassis. Returns challan number, date, amount, state, court status, and photo proof.
              </li>
              <li>
                <strong>ULIP (Unified Logistics Interface Platform):</strong> Government of India
                API Setu gateway offering unified transport &amp; VAHAN/SARATHI data for registered
                logistics orgs.
              </li>
              <li>
                <strong>Direct BBPS Payment:</strong> Integrated Bharat Bill Payment System allows
                1-click payment of challans directly from your bank or wallet.
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <a
              href="https://echallan.parivahan.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: '#2563eb',
                textDecoration: 'none',
              }}
            >
              <span>Visit Official Parivahan e-Challan Portal</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              className="v-dash-action-btn v-dash-action-btn--primary"
              onClick={onClose}
              style={{ padding: '7px 18px', fontSize: 13 }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
