import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, X, Check, Loader2 } from 'lucide-react';
import dayjs from 'dayjs';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from './OwnerAlertsService.jsx';
import AlertDetailsDrawer from './AlertDetailsDrawer.jsx';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import OwnerAlertsSummary from './ownerAlertsSummary.jsx';
import OwnerAlertsTable from './ownerAlertsTable.jsx';
import { LIMIT, CHIPS, SINCE, SORTS, computeView, buildSummary } from './ownerAlertsModel';
import './OwnerAlerts.css';

const OwnerAlertsPage = () => {
  // Filters
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [type, setType] = useState('');
  const [ackFilter, setAckFilter] = useState('unacknowledged');
  const [since, setSince] = useState('all');
  const [refine, setRefine] = useState('all');
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
      if (since !== 'all') {
        params.from = dayjs().subtract(Number(since), 'day').startOf('day').utc().toISOString();
      }
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [vehicle, type, ackFilter, since]);

  useEffect(() => {
    setSelected(new Set());
  }, [alerts]);

  const applyVehicleFilter = () => setVehicle(vehicleQuery.trim());

  const clearFilters = () => {
    setVehicleQuery('');
    setVehicle('');
    setType('');
    setAckFilter('unacknowledged');
    setSince('all');
    setRefine('all');
    setSort('triage');
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

  const view = useMemo(() => computeView(alerts, refine, sort), [alerts, refine, sort]);
  const summary = useMemo(
    () => buildSummary(alerts, unacknowledgedCount),
    [alerts, unacknowledgedCount],
  );

  const activeChip = ackFilter === 'acknowledged' ? 'acknowledged' : refine;
  const onChip = (key) => {
    if (key === 'acknowledged') {
      setAckFilter('acknowledged');
      return;
    }
    if (key === 'all') {
      setRefine('all');
      setAckFilter('unacknowledged');
      return;
    }
    setRefine(key);
    if (ackFilter === 'acknowledged') setAckFilter('unacknowledged');
  };

  const selectableIds = view.filter((a) => !a.acknowledged).map((a) => a.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  };
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const activeFiltersCount =
    (vehicle ? 1 : 0) +
    (type ? 1 : 0) +
    (ackFilter !== 'unacknowledged' ? 1 : 0) +
    (since !== 'all' ? 1 : 0) +
    (refine !== 'all' ? 1 : 0);

  return (
    <PageShell
      title="Owner Alerts"
      subtitle="In-app alerts across your fleet — review and acknowledge"
      count={total}
      actions={
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <span className="oa-torev">
              <AlertTriangle size={13} /> {unacknowledgedCount} to review
            </span>
          )}
          <button className="ov-btn" onClick={fetchData} disabled={isLoading}>
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      }
      filters={
        <FilterBar
          searchValue={vehicleQuery}
          onSearchChange={setVehicleQuery}
          searchPlaceholder="Search vehicle number…"
          chips={CHIPS}
          selectedKeys={[activeChip]}
          onToggleChip={onChip}
          activeCount={activeFiltersCount}
          onClear={clearFilters}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <div className="fi-field">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  aria-label="Alert type"
                >
                  <option value="">All types</option>
                  {Object.entries(ALERT_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fi-field">
                <select
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  aria-label="Date range"
                >
                  {SINCE.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fi-field">
                <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      Sort: {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="ov-btn ov-btn--primary" onClick={applyVehicleFilter}>
                Apply
              </button>
            </div>
          }
        />
      }
      footer={
        totalPages > 1 ? (
          <div className="flex w-full items-center justify-between">
            <span className="text-dim text-xs">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <div className="flex gap-2">
              <button
                className="ov-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={page === 1 ? { opacity: 0.5 } : undefined}
              >
                Prev
              </button>
              <span className="text-dim px-1 text-xs" style={{ alignSelf: 'center' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="ov-btn"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={page === totalPages ? { opacity: 0.5 } : undefined}
              >
                Next
              </button>
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="fi-banner fi-banner--crit">
            <span
              className="fi-banner-icon"
              style={{
                background: 'color-mix(in srgb, var(--critical) 12%, transparent)',
                color: 'var(--critical)',
              }}
            >
              <AlertTriangle size={20} />
            </span>
            <div>
              <div className="fi-banner-title">Something went wrong</div>
              <p className="text-dim text-sm">{error}</p>
            </div>
          </div>
        )}

        <OwnerAlertsSummary summary={summary} />

        <OwnerAlertsTable
          view={view}
          isLoading={isLoading}
          selected={selected}
          selectableIds={selectableIds}
          allSelected={allSelected}
          toggleAll={toggleAll}
          toggleOne={toggleOne}
          ackingId={ackingId}
          handleAck={handleAck}
          onSelectAlert={(a) => setDetail(a)}
        />

        {selected.size > 0 && (
          <div className="oa-bulkbar">
            <span className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
              {selected.size} selected
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button className="ov-btn ov-btn--primary" onClick={bulkAck} disabled={bulkAcking}>
                {bulkAcking ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{' '}
                Acknowledge
              </button>
              <button className="ov-btn" onClick={() => setSelected(new Set())}>
                <X size={14} /> Clear selection
              </button>
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
    </PageShell>
  );
};

export default OwnerAlertsPage;
