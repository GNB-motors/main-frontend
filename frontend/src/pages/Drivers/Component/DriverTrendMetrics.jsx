import React from 'react';

export default function DriverTrendMetrics({ avgConsistency, consistentCount, volatileCount }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        padding: '16px 24px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
          Fleet Avg Consistency
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#0f172a',
            marginTop: '4px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
          }}
        >
          {avgConsistency}
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}>/ 100</span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
          Consistent Drivers
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#059669',
            marginTop: '4px',
          }}
        >
          {consistentCount}
        </div>
      </div>

      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#64748b' }}>
          Irregular Habits
        </div>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#dc2626',
            marginTop: '4px',
          }}
        >
          {volatileCount}
        </div>
      </div>
    </div>
  );
}
