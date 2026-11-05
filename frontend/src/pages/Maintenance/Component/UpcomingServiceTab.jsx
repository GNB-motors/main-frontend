import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CalendarClock, Wrench, AlertTriangle, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { FleetDataService } from '../../../services/FleetDataService';
import NewButton from '../../../components/ui/NewButton';
import KpiCard from '../../../components/ui/KpiCard';
import { formatKm } from '../../../utils/formatters';

// Predicted next-service position per vehicle (MaintenancePrediction), projected
// from telemetry odometer/engine-hours. This is a different data domain from the
// logged Service/Repair records and the on-the-fly Fleet Alerts — it is the same
// source the Daily Digest calendar uses, surfaced here so the "service due"
// vehicles are visible on the Service Intelligence page too.

const SUB_TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'OVERDUE', label: 'Overdue' },
  { key: 'DUE_SOON', label: 'Due soon' },
  { key: 'OK', label: 'On track' },
];

const RISK_META = {
  OVERDUE: { label: 'Overdue', indicator: 'critical', color: '#dc2626' },
  DUE_SOON: { label: 'Due soon', indicator: 'warning', color: '#ea580c' },
  OK: { label: 'On track', indicator: 'resolved', color: '#16a34a' },
};

const formatDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysText = (days) => {
  if (days == null) return 'Due date not projected';
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
};

const PredictionSkeleton = () => (
  <div className="si-alert-skel-card">
    <div className="si-alert-skel-icon" />
    <div className="si-alert-skel-body">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="si-skel-bar" style={{ width: 90, height: 16 }} />
        <span className="si-skel-bar" style={{ width: 70, height: 16, borderRadius: 12 }} />
        <span className="si-skel-bar" style={{ width: 110, height: 16 }} />
      </div>
      <span className="si-skel-bar" style={{ width: '75%', height: 13 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <span className="si-skel-bar" style={{ width: 90, height: 12 }} />
        <span className="si-skel-bar" style={{ width: 120, height: 12 }} />
      </div>
    </div>
  </div>
);

const UpcomingServiceTab = ({ search = '', refreshKey = 0 }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState('ALL');
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const myId = ++requestIdRef.current;
    setLoading(true);
    try {
      const data = await FleetDataService.getMaintenancePredictions();
      if (myId !== requestIdRef.current) return;
      setRecords(Array.isArray(data?.records) ? data.records : []);
    } catch (err) {
      if (myId !== requestIdRef.current) return;
      toast.error(err?.message || 'Failed to load service predictions');
    } finally {
      if (myId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const counts = useMemo(() => {
    const c = { total: records.length, OVERDUE: 0, DUE_SOON: 0, OK: 0 };
    records.forEach((r) => {
      c[r.risk] = (c[r.risk] || 0) + 1;
    });
    return c;
  }, [records]);

  const filtered = useMemo(() => {
    let list = subTab === 'ALL' ? records : records.filter((r) => r.risk === subTab);
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => (r.registrationNumber || '').toLowerCase().includes(q));
    }
    return list;
  }, [records, subTab, search]);

  const countForTab = (key) => (key === 'ALL' ? counts.total : counts[key] || 0);

  return (
    <div className="si-alerts-wrapper" style={{ width: '100%', gap: 12 }}>
      <div className="si-kpis-strip" style={{ margin: '0 0 12px 0' }}>
        <KpiCard
          title="Tracked vehicles"
          value={loading && records.length === 0 ? <span className="si-skel-kpi-val" /> : counts.total}
          accent="#3b82f6"
          icon={<CalendarClock size={18} />}
        />
        <KpiCard
          title="Overdue"
          value={loading && records.length === 0 ? <span className="si-skel-kpi-val" /> : counts.OVERDUE}
          accent="#dc2626"
          icon={<AlertTriangle size={18} />}
        />
        <KpiCard
          title="Due soon"
          value={loading && records.length === 0 ? <span className="si-skel-kpi-val" /> : counts.DUE_SOON}
          accent="#ea580c"
          icon={<Clock size={18} />}
        />
        <KpiCard
          title="On track"
          value={loading && records.length === 0 ? <span className="si-skel-kpi-val" /> : counts.OK}
          accent="#16a34a"
          icon={<CheckCircle2 size={18} />}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 12px 0',
          gap: 12,
          flexWrap: 'nowrap',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="si-filter-pills-row"
          style={{ padding: 0, width: 'auto', flex: 1, minWidth: 0, margin: 0 }}
        >
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`si-filter-pill ${t.key === subTab ? 'si-filter-pill--active' : ''}`}
            >
              <span>{t.label}</span>
              <span className="si-filter-pill-count">{countForTab(t.key)}</span>
            </button>
          ))}
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

      <div style={{ padding: 0 }}>
        {loading && records.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <PredictionSkeleton />
            <PredictionSkeleton />
            <PredictionSkeleton />
            <PredictionSkeleton />
          </div>
        ) : null}

        {!loading && filtered.length === 0 && (
          <div style={emptyBox}>
            {records.length === 0
              ? 'No service predictions yet. They appear as telemetry builds each vehicle’s odometer and service history.'
              : 'No vehicles in this category.'}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => (
            <PredictionCard
              key={r.registrationNumber}
              row={r}
              onOpen={() => navigate(`/vehicles/${encodeURIComponent(r.registrationNumber)}`)}
            />
          ))}
        </div>
      </div>

      <style>
        {`@keyframes spin-anim { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin-anim { animation: spin-anim 0.8s linear infinite; }`}
      </style>
    </div>
  );
};

const PredictionCard = ({ row, onOpen }) => {
  const meta = RISK_META[row.risk] || RISK_META.OK;
  const dueDate = formatDate(row.projectedServiceDueDate);
  const lastService = formatDate(row.lastServiceAt);

  const kmText =
    row.kmUntilDue == null
      ? null
      : row.kmUntilDue < 0
        ? `${formatKm(Math.abs(row.kmUntilDue))} over`
        : `${formatKm(row.kmUntilDue)} remaining`;

  return (
    <div className="si-alert-card">
      <div className={`si-alert-indicator si-alert-indicator--${meta.indicator}`} />
      <div
        className="si-alert-icon-box"
        style={{ background: `${meta.color}18`, color: meta.color }}
      >
        <Wrench size={18} />
      </div>

      <div className="si-alert-content">
        <div className="si-alert-headline-row">
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Service due</span>
          <span
            className="si-up-risk-badge"
            style={{ background: `${meta.color}18`, color: meta.color }}
          >
            {meta.label}
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="si-veh-reg-btn"
            title={`Open ${row.registrationNumber} details`}
          >
            <span className="si-veh-reg-ind">IND</span>
            <span className="si-veh-reg-num">{row.registrationNumber}</span>
          </button>
        </div>
        <div className="si-alert-desc">
          {daysText(row.daysUntilDue)}
          {kmText ? ` · ${kmText}` : ''}
          {dueDate ? ` · projected ${dueDate}` : ''}
        </div>
        <div className="si-alert-footer" style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {row.projectedServiceDueOdometer != null && (
            <span>Due at {formatKm(row.projectedServiceDueOdometer)}</span>
          )}
          {row.currentOdometer != null && <span>Now {formatKm(row.currentOdometer)}</span>}
          {row.avgKmPerDay != null && <span>{Math.round(row.avgKmPerDay)} km/day avg</span>}
          {lastService && <span>Last service {lastService}</span>}
        </div>
      </div>
    </div>
  );
};

const emptyBox = {
  padding: '32px 16px',
  textAlign: 'center',
  color: '#64748b',
  fontSize: 13.5,
  background: '#f8fafc',
  border: '1px dashed #e2e8f0',
  borderRadius: 12,
};

export default UpcomingServiceTab;
