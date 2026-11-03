import { useSearchParams } from 'react-router-dom';
import { istDayString, istDayStartISO, shiftDay } from '../../utils/dateUtils';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, AlertTriangle, X, Check, Loader2 } from 'lucide-react';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from './OwnerAlertsService.js';
import {
  LIMIT,
  CHIPS,
  LEGACY_CHIPS,
  DEFAULT_CHIP,
  SINCE,
  SORTS,
  computeView,
  countsOf,
  viewParams,
} from './ownerAlertsModel';
import AlertDetailsDrawer from './AlertDetailsDrawer.jsx';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import OwnerAlertsSummary from './ownerAlertsSummary.jsx';
import OwnerAlertsTable from './ownerAlertsTable.jsx';
import './OwnerAlerts.css';

const OwnerAlertsPage = () => {
  const [params] = useSearchParams();
  // Filters
  const [vehicleQuery, setVehicleQuery] = useState(params.get('vehicle') || '');
  const [vehicle, setVehicle] = useState(params.get('vehicle') || '');
  const [type, setType] = useState('');
  // The view: Critical by default — the owner reads critical alerts only.
  const [chip, setChip] = useState(DEFAULT_CHIP);
  const [since, setSince] = useState('all');
  const [sort, setSort] = useState('triage');

  // Data
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  // The server's counts over the whole filter; null until the server sends
  // them (before B0b), and then nothing on the page claims a severity count.
  const [counts, setCounts] = useState(null);
  const [legacy, setLegacy] = useState(false);
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
      const params = { page, limit: LIMIT, ...viewParams(chip) };
      if (vehicle) params.vehicle = vehicle;
      if (type) params.type = type;
      if (since !== 'all') {
        params.from = istDayStartISO(shiftDay(istDayString(), -Number(since)));
      }
      const data = await OwnerAlertsService.getAlertsForView(params);
      setAlerts(data.records || []);
      setTotal(data.total || 0);
      setCounts(countsOf(data));
      setLegacy(Boolean(data.legacy));
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError(err.message || 'Could not load alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [vehicle, type, chip, since, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [vehicle, type, chip, since]);

  useEffect(() => {
    setSelected(new Set());
  }, [alerts]);

  const applyVehicleFilter = () => setVehicle(vehicleQuery.trim());

  const clearFilters = () => {
    setVehicleQuery('');
    setVehicle('');
    setType('');
    setChip(DEFAULT_CHIP);
    setSince('all');
    setSort('triage');
  };

  const handleAck = async (id) => {
    setAckingId(id);
    try {
      await OwnerAlertsService.acknowledgeAlert(id);
      await fetchData();
      setDetail((d) => (d && d.id === id ? { ...d, acknowledged: true } : d));
    } catch (err) {
      setError(err.message || 'Could not acknowledge the alert.');
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
      setError(err.message || 'Could not acknowledge the selected alerts.');
    } finally {
      setBulkAcking(false);
    }
  };

  // Enrich + sort — pure, lives in ownerAlertsModel (rule 21). The server
  // already filtered by severity.
  const view = useMemo(() => computeView(alerts, sort), [alerts, sort]);

  // Before the server knows severity, Critical and Warnings cannot be shown
  // honestly: the page shows every open alert under "All".
  const chips = legacy ? LEGACY_CHIPS : CHIPS;
  const activeChip = legacy && (chip === 'critical' || chip === 'warning') ? 'all' : chip;
  const onChip = (key) => setChip(key);

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
    (activeChip !== DEFAULT_CHIP && !legacy ? 1 : 0) +
    (since !== 'all' ? 1 : 0);

  return (
    <PageShell
      title="Owner Alerts"
      subtitle={
        legacy
          ? 'Every open alert across your fleet, newest problems first'
          : 'Critical alerts across your fleet — review and acknowledge'
      }
      count={total}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {counts && !isLoading ? (
            counts.critical > 0 ? (
              <span className="oa-torev">
                <AlertTriangle size={13} /> {counts.critical} critical to review
              </span>
            ) : (
              <span className="oa-torev oa-torev--calm">
                Nothing critical · {counts.warning} warning{counts.warning === 1 ? '' : 's'}{' '}
                {counts.warning > 0 ? (
                  <button type="button" className="oa-link" onClick={() => setChip('warning')}>
                    See warnings
                  </button>
                ) : null}
              </span>
            )
          ) : null}
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
          chips={chips}
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

        {legacy ? (
          <div className="oa-legacy-note" role="note">
            <strong>Critical count needs the server update.</strong> Until it is live, this page
            shows every open alert and no severity totals.
          </div>
        ) : (
          <OwnerAlertsSummary counts={counts} />
        )}

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
