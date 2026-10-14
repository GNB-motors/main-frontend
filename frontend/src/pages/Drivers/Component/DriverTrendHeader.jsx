import React from 'react';
import { X, TrendingUp, RefreshCw } from 'lucide-react';

export default function DriverTrendHeader({ handleRecompute, recomputing, onClose }) {
  return (
    <div
      style={{
        padding: '18px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <TrendingUp size={22} />
        </div>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: '22px',
            }}
          >
            Performance & Driver Trend Tracking
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '12.5px',
              color: '#64748b',
              lineHeight: '18px',
              marginTop: '2px',
            }}
          >
            Statistical consistency (CV variance), OLS regression trend slope & coaching results
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#334155',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            cursor: recomputing ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <RefreshCw
            size={13}
            style={{
              animation: recomputing ? 'spin 1s linear infinite' : 'none',
            }}
          />
          {recomputing ? 'Computing…' : 'Recompute'}
        </button>
        <button
          onClick={onClose}
          type="button"
          aria-label="Close drawer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid transparent',
            background: 'none',
            color: '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
