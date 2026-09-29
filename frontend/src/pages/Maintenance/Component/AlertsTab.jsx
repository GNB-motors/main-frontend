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
    <>
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
          title="High Repair Spend"
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
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {SUB_TABS.map((t) => {
            const active_ = t.key === subTab;
            const n = countForTab(t.key);
            return (
              <button
                key={t.key}
                onClick={() => setSubTab(t.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: active_ ? '#1e293b' : '#fff',
                  color: active_ ? '#fff' : '#475569',
                  border: `1px solid ${active_ ? '#1e293b' : '#e2e8f0'}`,
                  borderRadius: 999,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.label}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 999,
                    background: active_ ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                    color: active_ ? '#fff' : '#475569',
                    fontSize: 11,
                  }}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>

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
    </>
  );
};

const AlertCard = ({ alert, resolving, onResolve, onGoToVehicle }) => {
  const meta = TYPE_META[alert.type] || { label: alert.type, icon: Bell, color: '#475569' };
  const Icon = meta.icon;
  const sev = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.WARNING;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: alert.resolved ? '#f8fafc' : '#fff',
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${alert.resolved ? '#16a34a' : sev.dot}`,
        borderRadius: 10,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${meta.color}1a`,
          color: meta.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{meta.label}</span>
          {alert.resolved ? <ResolvedBadge /> : <SeverityBadge severity={alert.severity} />}
          <button
            onClick={onGoToVehicle}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#2563eb',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {alert.vehicleReg}
          </button>
          {alert.model && <span style={{ fontSize: 11, color: '#94a3b8' }}>· {alert.model}</span>}
        </div>
        <div style={{ fontSize: 13, color: '#334155' }}>{alert.description}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          {alert.resolved
            ? `Resolved ${formatTime(alert.resolvedAt)}${alert.resolvedBy ? ` by ${alert.resolvedBy}` : ''}`
            : `Generated ${formatTime(alert.createdDate)}`}
        </div>
      </div>

      {!alert.resolved && (
        <NewButton
          variant="secondary"
          size="sm"
          type="button"
          text={resolving ? 'Resolving…' : 'Resolve'}
          prependIcon={<Check size={14} />}
          onClick={onResolve}
          disabled={resolving}
        />
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
  border: '1px dashed #e2e8f0',
  borderRadius: 12,
  padding: '36px 24px',
  textAlign: 'center',
  color: '#64748b',
  fontSize: 13,
};

export default AlertsTab;
