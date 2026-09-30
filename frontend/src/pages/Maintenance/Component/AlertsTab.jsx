import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, Bell, Check, FileWarning, RefreshCw, Wrench } from 'lucide-react';
import { MaintenanceService } from '../MaintenanceService.jsx';
import { getToken } from '../../../utils/session.js';
import NewButton from '../../../components/ui/NewButton';
import KpiCard from '../../../components/ui/KpiCard';

// Sub-tab keys map to backend alert.type, except 'ALL' / 'CRITICAL' / 'RESOLVED'
// which are filters over the same alert set.
const SUB_TABS = [
  { key: 'ALL', label: 'All Alerts' },
  { key: 'CRITICAL', label: 'Critical' },
  { key: 'SERVICE_DUE', label: 'Service' },
  { key: 'HIGH_REPAIR_SPEND', label: 'Repair' },
  { key: 'DOCUMENT_EXPIRY', label: 'Document' },
  { key: 'RESOLVED', label: 'Resolved' },
];

const TYPE_META = {
  SERVICE_DUE: { label: 'Service Due', icon: Wrench, color: '#2563eb' },
  HIGH_REPAIR_SPEND: { label: 'High Repair Spend', icon: AlertTriangle, color: '#dc2626' },
  DOCUMENT_EXPIRY: { label: 'Document Expiry', icon: FileWarning, color: '#ea580c' },
};

const SEVERITY_STYLE = {
  CRITICAL: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: 'Critical' },
  WARNING: { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: 'Warning' },
};

const formatTime = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AlertsTab = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('ALL');
  const [resolvingId, setResolvingId] = useState(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const token = getToken();
      const data = await MaintenanceService.getAlerts(token);
      if (myId !== requestIdRef.current) return;
      setAlerts(data);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.detail || 'Failed to load alerts');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (alert) => {
    setResolvingId(alert.id);
    try {
      const token = getToken();
      await MaintenanceService.resolveAlert(token, alert.id, { fingerprint: alert.fingerprint });
      toast.success('Alert resolved');
      await load();
    } catch (err) {
      toast.error(err?.detail || 'Failed to resolve alert');
    } finally {
      setResolvingId(null);
    }
  };

  // Counts for the sub-tab pill badges + KPI cards — all counted over the
  // active (unresolved) set, so "Active Alerts" reads as the actionable queue.
  const active = useMemo(() => alerts.filter((a) => !a.resolved), [alerts]);
  const resolved = useMemo(() => alerts.filter((a) => a.resolved), [alerts]);

  const counts = useMemo(() => {
    const byType = { SERVICE_DUE: 0, HIGH_REPAIR_SPEND: 0, DOCUMENT_EXPIRY: 0 };
    let critical = 0;
    active.forEach((a) => {
      byType[a.type] = (byType[a.type] || 0) + 1;
      if (a.severity === 'CRITICAL') critical += 1;
    });
    return { total: active.length, critical, resolved: resolved.length, ...byType };
  }, [active, resolved]);

  const filtered = useMemo(() => {
    if (subTab === 'RESOLVED') return resolved;
    if (subTab === 'ALL') return active;
    if (subTab === 'CRITICAL') return active.filter((a) => a.severity === 'CRITICAL');
    return active.filter((a) => a.type === subTab);
  }, [active, resolved, subTab]);

  const countForTab = (tabKey) => {
    if (tabKey === 'ALL') return counts.total;
    if (tabKey === 'CRITICAL') return counts.critical;
    if (tabKey === 'RESOLVED') return counts.resolved;
    return counts[tabKey] || 0;
  };

  return (
    <div className="si-alerts-wrapper">
      {/* KPI strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 24px 16px' }}>
        <KpiCard
          title="Active Alerts"
          value={counts.total}
          accent="#3b82f6"
          icon={<Bell size={18} />}
        />
        <KpiCard
          title="Critical"
          value={counts.critical}
          accent="#dc2626"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Service Due"
          value={counts.SERVICE_DUE}
          accent="#2563eb"
          icon={<Wrench size={18} />}
        />
        <KpiCard
          title="High Spend"
          value={counts.HIGH_REPAIR_SPEND}
          accent="#dc2626"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Doc Expiry"
          value={counts.DOCUMENT_EXPIRY}
          accent="#ea580c"
          icon={<FileWarning size={18} />}
        />
      </div>

      {/* Sub-tabs + refresh */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px 12px',
          gap: 16,
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="si-filter-pills-row"
          style={{ padding: 0, width: 'auto', flex: 1, minWidth: 0 }}
        >
          {SUB_TABS.map((t) => {
            const active_ = t.key === subTab;
            const n = countForTab(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSubTab(t.key)}
                className={`si-filter-pill ${active_ ? 'si-filter-pill--active' : ''}`}
              >
                <span>{t.label}</span>
                <span className="si-filter-pill-count">{n}</span>
              </button>
            );
          })}
        </div>

        <div style={{ flexShrink: 0, marginLeft: 'auto' }}>
          <NewButton
            variant="secondary"
            size="sm"
            type="button"
            text="Refresh"
            prependIcon={<RefreshCw size={14} className={loading ? 'spin-anim' : ''} />}
            onClick={load}
            disabled={loading}
          />
        </div>
      </div>

      {/* Alert list */}
      <div style={{ padding: '0 24px' }}>
        {loading && alerts.length === 0 && <div style={emptyBox}>Loading alerts…</div>}
        {!loading && filtered.length === 0 && (
          <div style={emptyBox}>
            {subTab === 'RESOLVED'
              ? 'No resolved alerts yet.'
              : alerts.length === 0
                ? 'No alerts right now. Everything looks healthy.'
                : 'No alerts in this category.'}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              resolving={resolvingId === a.id}
              onResolve={() => handleResolve(a)}
              onGoToVehicle={() => navigate('/vehicles/dashboard')}
            />
          ))}
        </div>
      </div>

      {/* Inline keyframes for the refresh icon (kept local; not worth a CSS file). */}
      <style>
        {`@keyframes spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin-anim { animation: spin-anim 0.8s linear infinite; }`}
      </style>
    </div>
  );
};

const AlertCard = ({ alert, resolving, onResolve, onGoToVehicle }) => {
  const meta = TYPE_META[alert.type] || { label: alert.type, icon: Bell, color: '#475569' };
  const Icon = meta.icon;

  return (
    <div className={`si-alert-card ${alert.resolved ? 'si-alert-card--resolved' : ''}`}>
      <div
        className={`si-alert-indicator ${
          alert.resolved
            ? 'si-alert-indicator--resolved'
            : alert.severity === 'CRITICAL'
              ? 'si-alert-indicator--critical'
              : 'si-alert-indicator--warning'
        }`}
      />
      <div
        className="si-alert-icon-box"
        style={{
          background: `${meta.color}18`,
          color: meta.color,
        }}
      >
        <Icon size={18} />
      </div>

      <div className="si-alert-content">
        <div className="si-alert-headline-row">
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{meta.label}</span>
          {alert.resolved ? <ResolvedBadge /> : <SeverityBadge severity={alert.severity} />}
          <button
            type="button"
            onClick={onGoToVehicle}
            className="si-veh-reg-btn"
            title={`Open details for ${alert.vehicleReg}`}
          >
            <span className="si-veh-reg-ind">IND</span>
            <span className="si-veh-reg-num">{alert.vehicleReg}</span>
          </button>
          {alert.model && <span style={{ fontSize: 11.5, color: '#64748b' }}>· {alert.model}</span>}
        </div>
        <div className="si-alert-desc">{alert.description}</div>
        <div className="si-alert-footer">
          {alert.resolved ? (
            <span className="si-alert-resolution-pill">
              <Check size={12} />
              Resolved {formatTime(alert.resolvedAt)}
              {alert.resolvedBy ? ` by ${alert.resolvedBy}` : ''}
            </span>
          ) : (
            <span>Generated {formatTime(alert.createdDate)}</span>
          )}
        </div>
      </div>

      {!alert.resolved && (
        <button
          type="button"
          className="si-action-resolve-btn"
          onClick={onResolve}
          disabled={resolving}
          style={{ alignSelf: 'center', padding: '6px 14px', fontSize: 12.5 }}
        >
          <Check size={14} />
          <span>{resolving ? 'Resolving…' : 'Resolve'}</span>
        </button>
      )}
    </div>
  );
};

const SeverityBadge = ({ severity }) => {
  const s = SEVERITY_STYLE[severity] || SEVERITY_STYLE.WARNING;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.dot}33`,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  );
};

const ResolvedBadge = () => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #16a34a33',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
    }}
  >
    <Check size={11} />
    Resolved
  </span>
);

const emptyBox = {
  background: '#fff',
  border: '1px dashed #cbd5e1',
  borderRadius: 12,
  padding: '36px 24px',
  textAlign: 'center',
  color: '#64748b',
  fontSize: 13,
};

export default AlertsTab;
