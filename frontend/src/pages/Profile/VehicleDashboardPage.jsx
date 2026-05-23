import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Search, Truck } from 'lucide-react';
import { VehicleService } from './VehicleService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';
import './VehiclesPage.css';

// Document type → display label (must match backend Vehicle.DOCUMENT_TYPES).
const DOC_COLS = [
  { key: 'RC', label: 'RC' },
  { key: 'INSURANCE', label: 'Insurance' },
  { key: 'FITNESS', label: 'Fitness' },
  { key: 'PERMIT', label: 'Permit' },
  { key: 'NATIONAL_PERMIT', label: 'Nat. Permit' },
];

// Pure: days between today (00:00) and the given Date — negative if past.
const daysUntil = (d) => {
  if (!d) return null;
  const target = new Date(d);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

// Bucket a doc into one of: 'missing' | 'expired' | 'critical' | 'warning' | 'healthy'.
const bucketFor = (docEntry) => {
  if (!docEntry?.uploaded) return 'missing';
  const days = daysUntil(docEntry.expiryDate);
  if (days === null) return 'missing';     // uploaded but expiry not yet known (OCR pending)
  if (days < 0) return 'expired';
  if (days < 15) return 'critical';
  if (days <= 30) return 'warning';
  return 'healthy';
};

const BUCKET_STYLES = {
  missing:  { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8', label: 'Missing' },
  expired:  { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: 'Expired' },
  critical: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: '< 15 days' },
  warning:  { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: '15-30 days' },
  healthy:  { bg: '#dcfce7', fg: '#166534', dot: '#16a34a', label: 'Healthy' },
};

const DocBadge = ({ docEntry }) => {
  const bucket = bucketFor(docEntry);
  const style = BUCKET_STYLES[bucket];
  const days = daysUntil(docEntry?.expiryDate);

  const text = (() => {
    if (bucket === 'missing') return docEntry?.uploaded ? 'OCR pending' : 'Not uploaded';
    if (bucket === 'expired') return `Expired ${Math.abs(days)}d ago`;
    return `${days}d left`;
  })();

  return (
    <span
      title={docEntry?.expiryDate ? new Date(docEntry.expiryDate).toLocaleDateString() : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.dot}33`,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: style.dot }} />
      {text}
    </span>
  );
};

const StatCard = ({ title, value, subtext, icon, accent }) => (
  <div
    style={{
      flex: '1 1 220px',
      minWidth: 200,
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        background: `${accent}1a`,
        color: accent,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {title}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>{value}</div>
      {subtext && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{subtext}</div>
      )}
    </div>
  </div>
);

const VehicleDashboardPage = () => {
  const navigate = useNavigate();
  const [themeColors, setThemeColors] = useState(getThemeCSS());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const updateTheme = () => setThemeColors(getThemeCSS());
    updateTheme();
    window.addEventListener('storage', updateTheme);
    return () => window.removeEventListener('storage', updateTheme);
  }, []);

  // Track in-flight request so a stale fetch can't overwrite a fresher one
  // (e.g. user types fast and an earlier response comes back after a later one).
  const requestIdRef = useRef(0);
  const isFirstRenderRef = useRef(true);

  const load = useCallback(async (q) => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const data = await VehicleService.getFleetDashboard(token, q || undefined);
      if (myId !== requestIdRef.current) return; // a newer request superseded us
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load vehicle dashboard');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  // Single effect: fire immediately on first mount, debounce search changes
  // (so the duplicate "load on mount + load 300ms later" double-fetch is gone).
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      load('');
      return undefined;
    }
    const t = setTimeout(() => load(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  // ---- KPI rollups (document-level counts across the whole fleet) ----
  const kpis = useMemo(() => {
    let expired = 0;
    let critical = 0; // <15 days
    let warning = 0;  // 15-30 days
    let healthy = 0;  // >30 days
    let missing = 0;
    let totalDocSlots = 0;

    rows.forEach((v) => {
      DOC_COLS.forEach(({ key }) => {
        totalDocSlots++;
        const bucket = bucketFor(v.documents?.[key]);
        if (bucket === 'expired') expired++;
        else if (bucket === 'critical') critical++;
        else if (bucket === 'warning') warning++;
        else if (bucket === 'healthy') healthy++;
        else missing++;
      });
    });

    return {
      total: rows.length,
      expired,
      critical,
      warning,
      healthy,
      missing,
      totalDocSlots,
    };
  }, [rows]);

  const goEdit = (row) => {
    navigate('/vehicles/add', {
      state: {
        editingVehicle: {
          id: row._id,
          _id: row._id,
          registrationNumber: row.registrationNumber,
          chassisNumber: row.chassisNumber,
          model: row.model,
        },
      },
    });
  };

  return (
    <div className="vehicles-page-container" style={themeColors}>
      <div
        className="vehicles-content-wrapper"
        style={{ paddingBottom: 48, alignItems: 'stretch' }}
      >
        {/* Left-aligned header (replaces PageHeader, which is centred + 920px) */}
        <div style={{ padding: '4px 24px 16px' }}>
          <button
            onClick={() => navigate('/vehicles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 13,
              color: '#2563eb',
              cursor: 'pointer',
              marginBottom: 8,
            }}
          >
            <ArrowLeft size={14} />
            Vehicles
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
            Vehicle Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            Fleet-wide document expiry status. Badges update automatically based on each document's expiry date.
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '0 24px 20px' }}>
          <StatCard
            title="Total Vehicles"
            value={kpis.total}
            subtext={`${kpis.totalDocSlots} document slots`}
            accent="#3b82f6"
            icon={<Truck size={20} />}
          />
          <StatCard
            title="Expired / Critical"
            value={kpis.expired + kpis.critical}
            subtext={`${kpis.expired} expired · ${kpis.critical} < 15d`}
            accent="#dc2626"
            icon={<AlertTriangle size={20} />}
          />
          <StatCard
            title="Expiring 15-30 days"
            value={kpis.warning}
            subtext="Plan renewals soon"
            accent="#f59e0b"
            icon={<Clock size={20} />}
          />
          <StatCard
            title="Healthy"
            value={kpis.healthy}
            subtext={`${kpis.missing} not uploaded yet`}
            accent="#16a34a"
            icon={<CheckCircle2 size={20} />}
          />
        </div>

        {/* Search */}
        <div style={{ padding: '0 24px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '8px 12px',
                minWidth: 280,
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search registration or chassis number"
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  color: '#0f172a',
                  width: '100%',
                  background: 'transparent',
                }}
              />
            </div>
            {loading && rows.length > 0 && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Updating…</span>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ padding: '0 24px' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                    <th style={th}>Vehicle #</th>
                    <th style={th}>Owner</th>
                    <th style={th}>Model</th>
                    <th style={th}>Chassis #</th>
                    {DOC_COLS.map((d) => (
                      <th key={d.key} style={th}>{d.label}</th>
                    ))}
                    <th style={{ ...th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5 + DOC_COLS.length} style={emptyCell}>Loading…</td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5 + DOC_COLS.length} style={emptyCell}>
                        No vehicles found. <button
                          onClick={() => navigate('/vehicles/add')}
                          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
                        >Add one</button>.
                      </td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row._id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={td}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.registrationNumber}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.manufacturer || '—'}</div>
                      </td>
                      <td style={td}>{row.ownerName || '—'}</td>
                      <td style={td}>{row.model || '—'}</td>
                      <td style={{ ...td, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
                        {row.chassisNumber}
                      </td>
                      {DOC_COLS.map(({ key }) => (
                        <td key={key} style={td}>
                          <DocBadge docEntry={row.documents?.[key]} />
                        </td>
                      ))}
                      <td style={{ ...td, textAlign: 'right' }}>
                        <button
                          onClick={() => goEdit(row)}
                          style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 8,
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#1e293b',
                            cursor: 'pointer',
                          }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            padding: '16px 24px 0',
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <LegendDot color="#16a34a" label=">30 days" />
          <LegendDot color="#f59e0b" label="15-30 days" />
          <LegendDot color="#dc2626" label="<15 days or expired" />
          <LegendDot color="#94a3b8" label="Not uploaded / OCR pending" />
        </div>
      </div>
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
    {label}
  </span>
);

const th = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' };
const td = { padding: '12px', color: '#1e293b', verticalAlign: 'middle' };
const emptyCell = { padding: 28, textAlign: 'center', color: '#94a3b8' };

export default VehicleDashboardPage;
