import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CONSISTENCY_MAP = {
  CONSISTENT: {
    label: 'Consistent',
    bg: '#dcfce7',
    color: '#166534',
    border: '#bbf7d0',
  },
  MODERATE: {
    label: 'Moderate',
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
  },
  VOLATILE: {
    label: 'Volatile',
    bg: '#fee2e2',
    color: '#991b1b',
    border: '#fecaca',
  },
};

export default function DriverTrendTable({ filteredRows }) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12.5px',
        textAlign: 'left',
      }}
    >
      <thead>
        <tr
          style={{
            borderBottom: '1px solid #e2e8f0',
            color: '#64748b',
            fontSize: '11.5px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <th style={{ padding: '8px 12px 10px 0' }}>Driver</th>
          <th style={{ padding: '8px 12px 10px 12px', textAlign: 'right' }}>Score</th>
          <th style={{ padding: '8px 12px 10px 12px', textAlign: 'right' }}>CV %</th>
          <th style={{ padding: '8px 12px 10px 12px' }}>Habit Rating</th>
          <th style={{ padding: '8px 12px 10px 12px', textAlign: 'right' }}>Efficiency Trend</th>
          <th style={{ padding: '8px 0 10px 12px' }}>Coaching Impact</th>
        </tr>
      </thead>
      <tbody>
        {filteredRows.map((row) => {
          const cfg = CONSISTENCY_MAP[row.consistencyClass] || CONSISTENCY_MAP.MODERATE;
          const slope = Number.isFinite(Number(row.trendSlope)) ? Number(row.trendSlope) : 0;
          const isPositive = slope > 0.05;
          const isNegative = slope < -0.05;
          const cv = Number.isFinite(Number(row.coefficientOfVariation))
            ? `${Number(row.coefficientOfVariation).toFixed(1)}%`
            : '—';
          const score = Number.isFinite(Number(row.consistencyIndex)) ? row.consistencyIndex : 0;
          const driverName =
            row.driverName ||
            (typeof row.driverId === 'object' && row.driverId?.name ? row.driverId.name : null) ||
            row.driverId ||
            'Driver';

          return (
            <tr
              key={row._id || row.driverId}
              className="trend-table-row"
              style={{
                borderBottom: '1px solid #f1f5f9',
                transition: 'background-color 0.15s ease',
              }}
            >
              <td style={{ padding: '12px 12px 12px 0', fontWeight: 600, color: '#0f172a' }}>
                {driverName}
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                {score}
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  fontFamily: 'monospace',
                  color: '#64748b',
                }}
              >
                {cv}
              </td>
              <td style={{ padding: '12px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.label}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                    color: isPositive ? '#059669' : isNegative ? '#dc2626' : '#64748b',
                  }}
                >
                  {isPositive && <TrendingUp size={13} />}
                  {isNegative && <TrendingDown size={13} />}
                  {!isPositive && !isNegative && <Minus size={13} />}
                  {isPositive
                    ? `Improving (+${slope.toFixed(2)})`
                    : isNegative
                      ? `Declining (${slope.toFixed(2)})`
                      : `Steady (±${Math.abs(slope).toFixed(2)})`}
                </span>
              </td>
              <td
                style={{
                  padding: '12px 0 12px 12px',
                  color: '#64748b',
                  fontSize: '11.5px',
                }}
              >
                {row.coachingAttribution?.coached ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>
                    +{row.coachingAttribution.improvementScore ?? 0}% post-coaching
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Not coached</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
