import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import KaaranService from '../../../services/KaaranService';
import { toast } from 'react-toastify';
import DriverTrendHeader from './DriverTrendHeader.jsx';
import DriverTrendMetrics from './DriverTrendMetrics.jsx';
import DriverTrendTable from './DriverTrendTable.jsx';

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
      role="presentation"
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
        role="dialog"
        aria-modal="true"
        aria-label="Performance and Driver Trend Tracking"
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
        <DriverTrendHeader
          handleRecompute={handleRecompute}
          recomputing={recomputing}
          onClose={onClose}
        />

        {/* Metrics Strip */}
        <DriverTrendMetrics
          avgConsistency={avgConsistency}
          consistentCount={consistentCount}
          volatileCount={volatileCount}
        />

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
              <DriverTrendTable filteredRows={filteredRows} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
