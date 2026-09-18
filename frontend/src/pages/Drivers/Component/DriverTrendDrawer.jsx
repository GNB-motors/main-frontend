import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Minus, RefreshCw, Activity } from 'lucide-react';
import KaaranService from '../../../services/KaaranService';
import { toast } from 'react-toastify';

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

export default function DriverTrendDrawer({ isOpen, onClose }) {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, CONSISTENT, VOLATILE, IMPROVING

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await KaaranService.getDriverTrends();
      setTrends(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.message || 'Failed to load driver trends');
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrends();
    }
  }, [isOpen]);

  // Keyboard accessibility: ESC closes drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await KaaranService.recomputeDriverTrends();
      toast.success(res.message || 'Driver consistency trends recomputed');
      await fetchTrends();
    } catch (err) {
      toast.error(err.message || 'Recomputation failed');
    } finally {
      setRecomputing(false);
    }
  };

  // Filtered rows with defensive guards
  const filteredRows = useMemo(() => {
    return trends.filter((row) => {
      if (!row) return false;
      if (filter === 'CONSISTENT') return row.consistencyClass === 'CONSISTENT';
      if (filter === 'VOLATILE') return row.consistencyClass === 'VOLATILE';
      if (filter === 'IMPROVING') return Number(row.trendSlope ?? 0) > 0.05;
      return true;
    });
  }, [trends, filter]);

  // KPI aggregates with safe math
  const validScores = useMemo(() => {
    return trends
      .map((t) => Number(t.consistencyIndex))
      .filter((n) => Number.isFinite(n) && n >= 0);
  }, [trends]);

  const consistentCount = useMemo(
    () => trends.filter((t) => t.consistencyClass === 'CONSISTENT').length,
    [trends],
  );

  const volatileCount = useMemo(
    () => trends.filter((t) => t.consistencyClass === 'VOLATILE').length,
    [trends],
  );

  const avgConsistency = useMemo(() => {
    if (!validScores.length) return 0;
    return Math.round(validScores.reduce((acc, v) => acc + v, 0) / validScores.length);
  }, [validScores]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Performance and Driver Trend Tracking"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        transition: 'opacity 0.2s ease',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes trend-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0.95;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .trend-drawer-panel {
          animation: trend-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .trend-table-row:hover {
          background-color: #f8fafc;
        }
      `}</style>

      <div
        className="trend-drawer-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: '#ffffff',
          height: '100%',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
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

        {/* Metrics Strip */}
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

        {/* Filter Bar */}
        <div
          style={{
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginRight: '4px' }}>
            Filter:
          </span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CONSISTENT', label: 'Consistent' },
            { id: 'VOLATILE', label: 'Needs Attention' },
            { id: 'IMPROVING', label: 'Improving (β > 0)' },
          ].map((f) => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Table Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 24px',
            backgroundColor: '#ffffff',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '64px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                color: '#94a3b8',
                fontSize: '13px',
              }}
            >
              <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading trend metrics…</span>
            </div>
          ) : filteredRows.length === 0 ? (
            <div
              style={{
                padding: '64px 24px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '13px',
                lineHeight: '20px',
              }}
            >
              <Activity size={32} style={{ color: '#cbd5e1', margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 600, color: '#1e293b' }}>No trend records in this view</div>
              <div
                style={{
                  marginTop: '4px',
                  color: '#94a3b8',
                  maxWidth: '420px',
                  margin: '4px auto 0',
                }}
              >
                {trends.length === 0
                  ? 'No driver trends accumulated yet. Click "Recompute" to derive statistical consistency from recent trip and fuel data.'
                  : 'Try selecting a different filter above.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                    <th style={{ padding: '8px 12px 10px 12px', textAlign: 'right' }}>
                      Efficiency Trend
                    </th>
                    <th style={{ padding: '8px 0 10px 12px' }}>Coaching Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const cfg = CONSISTENCY_MAP[row.consistencyClass] || CONSISTENCY_MAP.MODERATE;
                    const slope = Number.isFinite(Number(row.trendSlope))
                      ? Number(row.trendSlope)
                      : 0;
                    const isPositive = slope > 0.05;
                    const isNegative = slope < -0.05;
                    const cv = Number.isFinite(Number(row.coefficientOfVariation))
                      ? `${Number(row.coefficientOfVariation).toFixed(1)}%`
                      : '—';
                    const score = Number.isFinite(Number(row.consistencyIndex))
                      ? row.consistencyIndex
                      : 0;
                    const driverName =
                      row.driverName ||
                      (typeof row.driverId === 'object' && row.driverId?.name
                        ? row.driverId.name
                        : null) ||
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
                        <td
                          style={{ padding: '12px 12px 12px 0', fontWeight: 600, color: '#0f172a' }}
                        >
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
                        <td
                          style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}
                        >
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
