import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bell, AlertTriangle, RefreshCw, Search, Check, Loader2, X,
  ShieldAlert, Info, Truck, CheckCircle2,
} from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from './OwnerAlertsService.jsx';
import AlertDetailsDrawer from './AlertDetailsDrawer.jsx';
import { Panel, StatusPill } from '../Overview/components/overview.primitives.jsx';
import StatusChip from '../../components/ui/StatusChip';
import { formatINR, formatNum } from '../../utils/formatters';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const IST_ZONE = 'Asia/Kolkata';
const LIMIT = 20;

const toIST = (s) => (s ? dayjs.utc(s).tz(IST_ZONE) : null);
const formatIST = (s) => { const d = toIST(s); return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—'; };
const formatRelativeIST = (s) => { const d = toIST(s); return d ? d.fromNow() : null; };

// ── Severity / title / category derived from the alert type ────────────────────
const SEVERITY_BY_TYPE = {
  FUEL_SIPHON_SUSPECTED: 'CRITICAL',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'CRITICAL',
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'WARNING',
  FLEETEDGE_REAUTH_REQUIRED: 'WARNING',
  ADBLUE_BALANCE_FLAG: 'WARNING',
  IDLING_BURN_HIGH: 'WARNING',
  EV_LOW_SOC: 'WARNING',
  FLEETEDGE_ALERT_OVERSPEED: 'WARNING',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'INFO',
  REFUEL_ESTIMATED: 'INFO',
  FLEETEDGE_ALERT_REFUEL: 'INFO',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'INFO',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'INFO',
};
const ALERT_TITLE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'Subscription expired',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'Subscription expiring',
  FLEETEDGE_REAUTH_REQUIRED: 'FleetEdge re-auth needed',
  FUEL_SIPHON_SUSPECTED: 'Fuel loss suspected',
  ADBLUE_BALANCE_FLAG: 'AdBlue balance flag',
  IDLING_BURN_HIGH: 'High idling burn',
  EV_LOW_SOC: 'EV low charge',
  REFUEL_ESTIMATED: 'Refuel estimated',
  FLEETEDGE_ALERT_REFUEL: 'Refuel alert',
  FLEETEDGE_ALERT_FUEL_DRAIN: 'Fuel drain alert',
  FLEETEDGE_ALERT_GEOFENCE_ENTERED: 'Geofence entered',
  FLEETEDGE_ALERT_GEOFENCE_EXITED: 'Geofence exited',
  FLEETEDGE_ALERT_OVERSPEED: 'Overspeed alert',
};
const CATEGORY_BY_TYPE = {
  FLEETEDGE_SUBSCRIPTION_EXPIRED: 'subscription',
  FLEETEDGE_SUBSCRIPTION_EXPIRING: 'subscription',
  FLEETEDGE_REAUTH_REQUIRED: 'data',
  REFUEL_ESTIMATED: 'data',
  ADBLUE_BALANCE_FLAG: 'data',
};
const sevOf = (t) => SEVERITY_BY_TYPE[t] || 'WARNING';
const catOf = (t) => CATEGORY_BY_TYPE[t] || 'other';
const titleOf = (t) => ALERT_TITLE[t] || ALERT_TYPE_LABELS[t] || t;
const SEV_RANK = { CRITICAL: 3, WARNING: 2, INFO: 1 };
const SEV_ROWCLASS = { CRITICAL: 'oa-row-crit', WARNING: 'oa-row-warn', INFO: 'oa-row-info' };
const SEV_ICON = { CRITICAL: ShieldAlert, WARNING: AlertTriangle, INFO: Info };
const cleanMsg = (m) => (m || '').replace(/^Please review:\s*/i, '');

const CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'data', label: 'Data issues' },
  { key: 'acknowledged', label: 'Acknowledged' },
];
const SINCE = [
  { key: 'all', label: 'Any time' },
  { key: '1', label: 'Today' },
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
];
const SORTS = [
  { key: 'triage', label: 'Triage' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'vehicle', label: 'Vehicle' },
];

const OwnerAlertsPage = () => {
  // Filters
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [type, setType] = useState('');
  const [ackFilter, setAckFilter] = useState('unacknowledged');
  const [since, setSince] = useState('all');
  const [refine, setRefine] = useState('all'); // client severity/category
  const [sort, setSort] = useState('triage');

  // Data
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ackingId, setAckingId] = useState(null);
  const [bulkAcking, setBulkAcking] = useState(false);

  // Selection / drawer
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, limit: LIMIT };
      if (vehicle) params.vehicle = vehicle;
      if (type) params.type = type;
      if (ackFilter !== 'all') params.acknowledged = ackFilter === 'acknowledged';
      if (since !== 'all') params.from = dayjs().subtract(Number(since), 'day').startOf('day').utc().toISOString();
      const data = await OwnerAlertsService.getAlerts(params);
      setAlerts(data.records || []);
      setTotal(data.total || 0);
      setUnacknowledgedCount(data.unacknowledgedCount || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.detail || 'Could not load alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [vehicle, type, ackFilter, since, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [vehicle, type, ackFilter, since]);
  useEffect(() => { setSelected(new Set()); }, [alerts]);

  const applyVehicleFilter = () => setVehicle(vehicleQuery.trim());

  const clearFilters = () => {
    setVehicleQuery(''); setVehicle(''); setType(''); setAckFilter('unacknowledged');
    setSince('all'); setRefine('all'); setSort('triage');
  };

  const handleAck = async (id) => {
    setAckingId(id);
    try {
      await OwnerAlertsService.acknowledgeAlert(id);
      await fetchData();
      setDetail((d) => (d && d.id === id ? { ...d, acknowledged: true } : d));
    } catch (err) {
      setError(err.detail || 'Could not acknowledge the alert.');
    } finally {
      setAckingId(null);
    }
  };

  const bulkAck = async () => {
    const ids = [...selected].filter((id) => !alerts.find((a) => a.id === id)?.acknowledged);
    if (!ids.length) return;
    setBulkAcking(true);
    try {
      await Promise.all(ids.map((id) => OwnerAlertsService.acknowledgeAlert(id)));
      await fetchData();
      setSelected(new Set());
    } catch (err) {
      setError(err.detail || 'Could not acknowledge the selected alerts.');
    } finally {
      setBulkAcking(false);
    }
  };

  // Enrich + client refine + sort
  const view = useMemo(() => {
    let list = alerts.map((a) => ({
      ...a,
      severity: sevOf(a.type),
      category: catOf(a.type),
      title: titleOf(a.type),
      typeLabel: ALERT_TYPE_LABELS[a.type] || a.type,
      detectedRel: formatRelativeIST(a.at),
      detectedAbs: formatIST(a.at),
    }));
    if (refine === 'critical') list = list.filter((a) => a.severity === 'CRITICAL');
    else if (refine === 'warning') list = list.filter((a) => a.severity === 'WARNING');
    else if (refine === 'subscription') list = list.filter((a) => a.category === 'subscription');
    else if (refine === 'data') list = list.filter((a) => a.category === 'data');

    const byDateDesc = (a, b) => new Date(b.at) - new Date(a.at);
    if (sort === 'newest') list.sort(byDateDesc);
    else if (sort === 'oldest') list.sort((a, b) => new Date(a.at) - new Date(b.at));
    else if (sort === 'vehicle') list.sort((a, b) => (a.vehicleNumber || 'zzz').localeCompare(b.vehicleNumber || 'zzz'));
    else list.sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged) || SEV_RANK[b.severity] - SEV_RANK[a.severity] || byDateDesc(a, b));
    return list;
  }, [alerts, refine, sort]);

  // Summary tiles (derived only from what we have)
  const summary = useMemo(() => {
    const enriched = alerts.map((a) => ({ ...a, severity: sevOf(a.type), category: catOf(a.type) }));
    const vehicles = new Set(enriched.filter((a) => a.vehicleNumber).map((a) => a.vehicleNumber));
    return {
      toReview: unacknowledgedCount,
      critical: enriched.filter((a) => a.severity === 'CRITICAL').length,
      subscription: enriched.filter((a) => a.category === 'subscription').length,
      vehicles: vehicles.size,
    };
  }, [alerts, unacknowledgedCount]);

  const activeChip = ackFilter === 'acknowledged' ? 'acknowledged' : refine;
  const onChip = (key) => {
    if (key === 'acknowledged') { setAckFilter('acknowledged'); return; }
    if (key === 'all') { setRefine('all'); setAckFilter('unacknowledged'); return; }
    setRefine(key);
    if (ackFilter === 'acknowledged') setAckFilter('unacknowledged');
  };

  const selectableIds = view.filter((a) => !a.acknowledged).map((a) => a.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  };
  const toggleOne = (id) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <div className="mx-auto space-y-5 p-1" style={{ maxWidth: 1500 }}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'color-mix(in srgb, var(--caution) 12%, transparent)', color: 'var(--caution)' }}>
            <Bell size={22} />
          </span>
          <div>
            <h1 className="cluster-title text-2xl">Owner Alerts</h1>
            <p className="text-dim text-sm">In-app alerts across your fleet</p>
            <p className="text-dim text-[11px]">Everything here means please review — nothing is an accusation.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && <span className="oa-torev"><AlertTriangle size={13} /> {formatNum(unacknowledgedCount)} to review</span>}
          <button className="ov-btn" onClick={fetchData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="fi-banner fi-banner--crit">
          <span className="fi-banner-icon" style={{ background: 'color-mix(in srgb, var(--critical) 12%, transparent)', color: 'var(--critical)' }}><AlertTriangle size={20} /></span>
          <div><div className="fi-banner-title">Something went wrong</div><p className="text-dim text-sm">{error}</p></div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="ov-kpi" style={{ borderLeft: '3px solid var(--caution)' }}>
          <span className="ov-kpi-label"><AlertTriangle size={13} style={{ color: 'var(--caution)' }} /> To review</span>
          <span className="ov-kpi-value" style={{ color: 'var(--caution)' }}>{formatNum(summary.toReview)}</span>
          <span className="ov-kpi-sub">unacknowledged alerts</span>
        </div>
        <div className="ov-kpi" style={summary.critical > 0 ? { borderLeft: '3px solid var(--critical)' } : undefined}>
          <span className="ov-kpi-label"><ShieldAlert size={13} style={{ color: 'var(--critical)' }} /> Critical</span>
          <span className="ov-kpi-value" style={summary.critical > 0 ? { color: 'var(--critical)' } : undefined}>{formatNum(summary.critical)}</span>
          <span className="ov-kpi-sub">on this page</span>
        </div>
        <div className="ov-kpi">
          <span className="ov-kpi-label"><Bell size={13} style={{ color: 'var(--gnb-400)' }} /> Subscription</span>
          <span className="ov-kpi-value">{formatNum(summary.subscription)}</span>
          <span className="ov-kpi-sub">plan issues on this page</span>
        </div>
        <div className="ov-kpi">
          <span className="ov-kpi-label"><Truck size={13} style={{ color: 'var(--gnb-400)' }} /> Vehicles</span>
          <span className="ov-kpi-value">{formatNum(summary.vehicles)}</span>
          <span className="ov-kpi-sub">affected on this page</span>
        </div>
      </div>

      {/* Triage toolbar */}
      <div className="fi-toolbar flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="fi-field fi-field--grow">
            <Search size={16} className="text-dim" />
            <input type="text" placeholder="Search vehicle number…" value={vehicleQuery} onChange={(e) => setVehicleQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyVehicleFilter()} style={{ flex: 1 }} />
          </div>
          <div className="fi-field"><select value={type} onChange={(e) => setType(e.target.value)} aria-label="Alert type">
            <option value="">All types</option>
            {Object.entries(ALERT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select></div>
          <div className="fi-field"><select value={ackFilter} onChange={(e) => setAckFilter(e.target.value)} aria-label="Status">
            <option value="unacknowledged">To review</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="all">All statuses</option>
          </select></div>
          <div className="fi-field"><select value={since} onChange={(e) => setSince(e.target.value)} aria-label="Date range">
            {SINCE.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select></div>
          <div className="fi-field"><select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {SORTS.map((s) => <option key={s.key} value={s.key}>Sort: {s.label}</option>)}
          </select></div>
          <button className="ov-btn ov-btn--primary" onClick={applyVehicleFilter}>Apply</button>
          <button className="ov-btn" onClick={clearFilters}><X size={14} /> Clear</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {CHIPS.map((c) => (
            <button key={c.key} className="fi-chip" aria-pressed={activeChip === c.key} onClick={() => onChip(c.key)}>{c.label}</button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      <Panel eyebrow="Alerts" question="Which alert should I act on first?" action={<span className="text-dim text-xs">{view.length} shown{total > view.length ? ` of ${total}` : ''}</span>}>
        {isLoading ? (
          <div className="flex flex-col gap-2">{[...Array(6)].map((_, i) => <div key={i} className="ov-inset h-12 animate-pulse" />)}</div>
        ) : view.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--ok) 12%, transparent)', color: 'var(--ok)' }}><CheckCircle2 size={26} /></span>
            <p className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>You're all caught up</p>
            <p className="text-dim max-w-xs text-xs">No alerts currently require your attention with these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ov-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" disabled={selectableIds.length === 0} />
                  </th>
                  <th>Alert</th><th>Vehicle</th><th>Detected</th><th>Status</th><th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {view.map((a) => {
                  const Icon = SEV_ICON[a.severity] || AlertTriangle;
                  const color = a.severity === 'CRITICAL' ? 'var(--critical)' : a.severity === 'INFO' ? 'var(--gnb-400)' : 'var(--caution)';
                  return (
                    <tr key={a.id} className={`fi-row-click ${a.acknowledged ? 'oa-row--acked' : SEV_ROWCLASS[a.severity]}`} onClick={() => setDetail(a)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} disabled={a.acknowledged} aria-label={`Select ${a.title}`} />
                      </td>
                      <td>
                        <div className="flex items-start gap-2.5">
                          <Icon size={16} style={{ color, marginTop: 2, flex: '0 0 auto' }} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>{a.title}</span>
                              <StatusChip group="severity" value={a.severity} />
                              {a.inrEstimate != null && <span className="num text-xs" style={{ color }}>{formatINR(a.inrEstimate)}</span>}
                            </div>
                            <div className="oa-clamp text-dim mt-0.5 text-xs">{cleanMsg(a.message)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.vehicleNumber ? <span className="reg-plate">{a.vehicleNumber}</span> : <span className="text-dim text-xs">Fleet-wide</span>}</td>
                      <td className="num text-dim" title={a.detectedAbs}>{a.detectedRel || '—'}</td>
                      <td>{a.acknowledged ? <StatusPill tone="ok">Acknowledged</StatusPill> : <StatusPill tone="caution">To review</StatusPill>}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        {a.acknowledged ? (
                          <span className="inline-flex items-center gap-1 text-xs text-dim"><Check size={13} /> Done</span>
                        ) : (
                          <button className="ov-btn" style={{ padding: '5px 10px', fontSize: 12 }} disabled={ackingId === a.id} onClick={() => handleAck(a.id)}>
                            {ackingId === a.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-dim text-xs">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
            <div className="flex gap-2">
              <button className="ov-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={page === 1 ? { opacity: 0.5 } : undefined}>Prev</button>
              <span className="text-dim px-1 text-xs" style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
              <button className="ov-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} style={page === totalPages ? { opacity: 0.5 } : undefined}>Next</button>
            </div>
          </div>
        )}
      </Panel>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="oa-bulkbar">
          <span className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <button className="ov-btn ov-btn--primary" onClick={bulkAck} disabled={bulkAcking}>
              {bulkAcking ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Acknowledge
            </button>
            <button className="ov-btn" onClick={() => setSelected(new Set())}><X size={14} /> Clear selection</button>
          </div>
        </div>
      )}

      <AlertDetailsDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        alert={detail}
        onAck={handleAck}
        acking={detail ? ackingId === detail.id : false}
      />
    </div>
  );
};

export default OwnerAlertsPage;
