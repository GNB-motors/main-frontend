import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  MapPinOff,
  Gauge,
  Clock,
  Calendar,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { OverspeedService } from './OverspeedService';
import { humanise } from '../../lib/vocabulary';
import { sourcesDisagree } from '../../lib/overspeedEvidence';
import {
  buildQuery,
  clampSpeed,
  clampDurationMinutes,
  normaliseWindowHours,
  eventsExportRows,
  exportMeta,
  SPEED_DEFAULT,
  DURATION_DEFAULT_MINUTES,
  WINDOW_OPTIONS,
} from '../../lib/overspeedParams';
import { coordKey, resolvePlace } from '../../services/PlaceService';
import { formatDateTimeIST } from '../../utils/dateUtils';
import ApiError from '../../errors/ApiError';
import ExportButton from '../../components/ui/ExportButton';
import TableShimmer from '../../components/ui/TableShimmer';
import PlaceLabel from '../../components/ui/PlaceLabel';
import OverspeedEvidenceCard from '../../components/ui/OverspeedEvidenceCard';
import SearchableDropdown from '../../components/SearchableDropdown/SearchableDropdown';
import { formatNum } from '../../utils/formatters';
import './Overspeed.css';

const DEFAULT_FILTERS = () => ({
  vehicleId: '',
  speedKmh: SPEED_DEFAULT,
  durationMin: DURATION_DEFAULT_MINUTES,
  windowHours: 24,
});

const FLEETEDGE_PROVENANCE = 'FleetEdge alert — sampler, not a source';

const EVENT_EXPORT_COLUMNS = [
  { key: 'startedAt', label: 'Started' },
  { key: 'maxSpeedKmh', label: 'Max speed (km/h)', type: 'number' },
  { key: 'avgSpeedKmh', label: 'Avg speed (km/h)', type: 'number' },
  { key: 'durationMin', label: 'Duration (min)', type: 'number' },
  { key: 'pingCount', label: 'Position pings', type: 'number' },
  { key: 'place', label: 'Place' },
];

export default function OverspeedPage() {
  const [vehicles, setVehicles] = useState([]);
  const [draft, setDraft] = useState(DEFAULT_FILTERS);
  const [committed, setCommitted] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    OverspeedService.getVehicles()
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, []);

  const vehicleById = useCallback((id) => vehicles.find((v) => v._id === id) || null, [vehicles]);

  const fetchEvents = useCallback(async () => {
    const query = buildQuery(committed);
    if (!query) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await OverspeedService.getEvents(query);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err : ApiError.from(err));
    } finally {
      setLoading(false);
    }
  }, [committed]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const applyFilters = () => {
    setCommitted({
      vehicleId: draft.vehicleId,
      speedKmh: clampSpeed(draft.speedKmh),
      durationMin: clampDurationMinutes(draft.durationMin),
      windowHours: normaliseWindowHours(draft.windowHours),
    });
  };

  const clearFilters = () => {
    setDraft(DEFAULT_FILTERS());
    setCommitted(DEFAULT_FILTERS());
  };

  const events = Array.isArray(data?.events) ? data.events : [];
  const corroborating = Array.isArray(data?.corroborating) ? data.corroborating : [];
  const pingCount = Number(data?.pingCount) || 0;
  const status = error?.status ?? error?.response?.status ?? null;
  const selectedVehicle = vehicleById(committed.vehicleId);
  const reg = selectedVehicle?.registrationNumber || data?.registrationNumber || null;

  const exportAllRows = async () => {
    const entries = await Promise.all(
      events.map(async (e) => {
        if (e?.startLat == null || e?.startLng == null) return [null, null];
        const place = await resolvePlace(e.startLat, e.startLng);
        return [coordKey(e.startLat, e.startLng), place];
      }),
    );
    const placesByKey = Object.fromEntries(entries.filter(([k]) => k));
    return eventsExportRows(events, placesByKey);
  };

  const exportDisabled =
    loading || !!error || !committed.vehicleId || (data && events.length === 0);

  const isDirty =
    draft.vehicleId !== committed.vehicleId ||
    draft.speedKmh !== committed.speedKmh ||
    draft.durationMin !== committed.durationMin ||
    draft.windowHours !== committed.windowHours;

  const renderBody = () => {
    if (!committed.vehicleId) {
      return (
        <div className="osp-state" role="status">
          <Truck size={42} strokeWidth={1.5} className="text-slate-400" />
          <p className="osp-state-title">Select a vehicle to audit sustained overspeed</p>
          <span>
            Events are recomputed from raw position history against your exact thresholds — select a
            truck above, set your speed limit and duration, and click “Run Audit”.
          </span>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="osp-state" role="status" aria-label="Computing overspeed events">
          <p className="osp-state-title">Computing from position history…</p>
          <TableShimmer columns={4} rows={6} />
        </div>
      );
    }
    if (status === 422) {
      return (
        <div className="osp-state osp-state--missing" role="alert">
          <MapPinOff size={42} strokeWidth={1.5} />
          <p className="osp-state-title">No GPS telemetry pings in this window</p>
          <span>
            Overspeed cannot be computed without position pings. This indicates missing device data,
            not an all-clear — check device connectivity or widen the analysis window.
          </span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="osp-state osp-state--error" role="alert">
          <AlertTriangle size={42} strokeWidth={1.5} />
          <p className="osp-state-title">
            {error.displayMessage || 'Failed to compute overspeed events'}
          </p>
          <button type="button" className="osp-btn" onClick={fetchEvents}>
            <RefreshCw size={14} aria-hidden="true" /> Try again
          </button>
        </div>
      );
    }
    if (data && events.length === 0) {
      return (
        <>
          <div className="osp-state osp-state--clear" role="status">
            <CheckCircle2 size={42} strokeWidth={1.5} />
            <p className="osp-state-title">No sustained overspeed detected in this window</p>
            <span>
              {reg || 'This vehicle'} stayed under{' '}
              {data.thresholdsUsed?.speedThresholdKmh ?? committed.speedKmh} km/h for less than{' '}
              {Math.round((data.thresholdsUsed?.durationSec ?? committed.durationMin * 60) / 60)}{' '}
              minutes continuously, verified across {pingCount.toLocaleString('en-IN')} raw
              telemetry fixes.
            </span>
          </div>
          {corroborating.length > 0 && (
            <section className="osp-section">
              <h2 className="osp-section-title">FleetEdge device alerts — corroboration only</h2>
              <p className="osp-section-sub">
                The device fired on {corroborating.length} instantaneous sample
                {corroborating.length === 1 ? '' : 's'} while our computation found no sustained
                violations. Shown with independent provenance.
              </p>
              <div className="oa-table-wrapper">
                <table className="oa-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th style={{ textAlign: 'right' }}>Speed</th>
                      <th style={{ textAlign: 'right' }}>Duration</th>
                      <th>Place</th>
                      <th>Type</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corroborating.map((row, i) => (
                      <tr key={row._id ?? row.eventDateTime ?? i}>
                        <td className="num font-mono text-xs text-slate-800">
                          {row.eventDateTime ? formatDateTimeIST(row.eventDateTime) : '—'}
                        </td>
                        <td
                          style={{ textAlign: 'right' }}
                          className="num font-mono font-bold text-rose-600"
                        >
                          {row.speedKph != null ? `${Math.round(row.speedKph)} km/h` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }} className="num font-mono text-slate-600">
                          {row.durationSeconds != null ? `${row.durationSeconds}s` : '—'}
                        </td>
                        <td>
                          {row.location?.lat != null ? (
                            <PlaceLabel
                              lat={Number(row.location.lat)}
                              lng={Number(row.location.lng)}
                              showMap={false}
                            />
                          ) : (
                            row.location?.name || '—'
                          )}
                        </td>
                        <td>
                          <span className="num text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {row.type ? humanise(row.type) : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="osp-provenance">{FLEETEDGE_PROVENANCE}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      );
    }
    if (data && events.length > 0) {
      const disagree = sourcesDisagree(events, corroborating);
      return (
        <>
          <OverspeedEvidenceCard
            event={null}
            computedTotal={events.length}
            computedOverMinutes={Math.round(
              events.reduce((sum, e) => sum + (Number(e?.durationSec) || 0), 0) / 60,
            )}
            corroboratingCount={corroborating.length}
            thresholds={data.thresholdsUsed || null}
          />
          {disagree && (
            <p className="osp-disagree-note" role="note">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                Our calculation and hardware device alerts disagree — displayed side by side with
                provenance so you make the informed operational call.
              </span>
            </p>
          )}

          <section className="osp-section">
            <h2 className="osp-section-title">
              Calculated Incidents — Recomputed from Position History
            </h2>
            <div className="osp-cards">
              {events.map((event, i) => (
                <OverspeedEvidenceCard key={event.startAt ?? i} event={event} />
              ))}
            </div>
          </section>

          {corroborating.length > 0 && (
            <section className="osp-section">
              <h2 className="osp-section-title">FleetEdge Device Alerts — Corroboration Only</h2>
              <p className="osp-section-sub">
                {FLEETEDGE_PROVENANCE} — fires on instantaneous samples, so it cannot distinguish
                sustained violations. Kept beside our audit, never merged.
              </p>
              <div className="oa-table-wrapper">
                <table className="oa-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th style={{ textAlign: 'right' }}>Speed</th>
                      <th style={{ textAlign: 'right' }}>Duration</th>
                      <th>Place</th>
                      <th>Type</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corroborating.map((row, i) => (
                      <tr key={row._id ?? row.eventDateTime ?? i}>
                        <td className="num font-mono text-xs text-slate-800">
                          {row.eventDateTime ? formatDateTimeIST(row.eventDateTime) : '—'}
                        </td>
                        <td
                          style={{ textAlign: 'right' }}
                          className="num font-mono font-bold text-rose-600"
                        >
                          {row.speedKph != null ? `${Math.round(row.speedKph)} km/h` : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }} className="num font-mono text-slate-600">
                          {row.durationSeconds != null ? `${row.durationSeconds}s` : '—'}
                        </td>
                        <td>
                          {row.location?.lat != null ? (
                            <PlaceLabel
                              lat={Number(row.location.lat)}
                              lng={Number(row.location.lng)}
                              showMap={false}
                            />
                          ) : (
                            row.location?.name || '—'
                          )}
                        </td>
                        <td>
                          <span className="num text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {row.type ? humanise(row.type) : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="osp-provenance">{FLEETEDGE_PROVENANCE}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className="pshell min-h-screen">
      {/* Header */}
      <header className="pshell-head mb-6">
        <div className="pshell-head-main">
          <div className="flex items-center gap-3">
            <h1 className="pshell-title text-2xl font-bold text-slate-900 tracking-tight">
              Overspeed Audit
            </h1>
            {data && (
              <span className="num inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                {events.length} violations
              </span>
            )}
          </div>
          <p className="pshell-subtitle text-sm text-slate-500 mt-1">
            Sustained overspeed mathematically recomputed from high-resolution position history —
            eliminating instantaneous false triggers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="ov-btn"
            onClick={fetchEvents}
            disabled={loading || !committed.vehicleId}
            title="Recompute overspeed audit"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <ExportButton
            rows={eventsExportRows(events)}
            columns={EVENT_EXPORT_COLUMNS}
            filename="overspeed-events"
            fetchAll={exportAllRows}
            disabled={exportDisabled}
            meta={{
              generatedAt: new Date(),
              filters: exportMeta({
                registrationNumber: reg,
                windowHours: committed.windowHours,
                speedKmh: committed.speedKmh,
                durationMin: committed.durationMin,
              }),
            }}
          />
        </div>
      </header>

      {/* Operations KPI Rail */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* 1. Speed Threshold */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Speed Threshold</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              <Gauge size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">&gt; {committed.speedKmh} km/h</span>
          <span className="ov-kpi-sub">sustained speed cutoff</span>
        </div>

        {/* 2. Sustained Duration */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Min Duration</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              <Clock size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">{committed.durationMin} mins</span>
          <span className="ov-kpi-sub">consecutive overspeed filter</span>
        </div>

        {/* 3. Monitored Window */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #6366f1' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Audit Window</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Calendar size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">{committed.windowHours} Hours</span>
          <span className="ov-kpi-sub">telematics lookback span</span>
        </div>

        {/* 4. Fleet Vehicles */}
        <div className="ov-kpi" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="flex items-center justify-between">
            <span className="ov-kpi-label">Fleet Coverage</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Truck size={14} />
            </span>
          </div>
          <span className="ov-kpi-value text-slate-900">{formatNum(vehicles.length)}</span>
          <span className="ov-kpi-sub">connected fleet vehicles</span>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="osp-filters">
        <div className="osp-field osp-field--vehicle">
          <label htmlFor="osp-vehicle">Select Vehicle</label>
          <SearchableDropdown
            options={vehicles.map((v) => v.registrationNumber).filter(Boolean)}
            selectedOption={vehicleById(draft.vehicleId)?.registrationNumber || ''}
            onSelect={(regNum) => {
              const vehicle = vehicles.find((v) => v.registrationNumber === regNum);
              setDraft((d) => ({ ...d, vehicleId: vehicle?._id || '' }));
            }}
            placeholder="Search vehicle number (e.g. WB25R9540)…"
          />
        </div>

        <div className="osp-field">
          <label htmlFor="osp-speed">Over Speed (km/h)</label>
          <input
            id="osp-speed"
            type="number"
            min={20}
            max={160}
            value={draft.speedKmh}
            onChange={(e) => setDraft((d) => ({ ...d, speedKmh: e.target.value }))}
          />
        </div>

        <div className="osp-field">
          <label htmlFor="osp-duration">Min Duration (min)</label>
          <input
            id="osp-duration"
            type="number"
            min={1}
            max={120}
            value={draft.durationMin}
            onChange={(e) => setDraft((d) => ({ ...d, durationMin: e.target.value }))}
          />
        </div>

        <div className="osp-field">
          <label htmlFor="osp-window">Time Window</label>
          <select
            id="osp-window"
            value={draft.windowHours}
            onChange={(e) => setDraft((d) => ({ ...d, windowHours: Number(e.target.value) }))}
          >
            {WINDOW_OPTIONS.map((opt) => (
              <option key={opt.hours} value={opt.hours}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="osp-filter-actions">
          <button
            type="button"
            className="osp-btn osp-btn--primary"
            onClick={applyFilters}
            disabled={!draft.vehicleId || loading}
          >
            <Gauge size={14} />
            <span>Run Audit</span>
          </button>
          {isDirty && (
            <button
              type="button"
              className="osp-btn"
              onClick={clearFilters}
              title="Reset to default thresholds"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      {renderBody()}
    </div>
  );
}
