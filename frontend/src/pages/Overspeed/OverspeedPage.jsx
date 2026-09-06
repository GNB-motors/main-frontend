import React, { useState, useEffect, useCallback } from 'react';
import { Truck, RefreshCw, Search, AlertTriangle, CheckCircle2, MapPinOff } from 'lucide-react';
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
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import TableShimmer from '../../components/ui/TableShimmer';
import PlaceLabel from '../../components/ui/PlaceLabel';
import OverspeedEvidenceCard from '../../components/ui/OverspeedEvidenceCard';
import SearchableDropdown from '../../components/SearchableDropdown/SearchableDropdown';
import './Overspeed.css';

const DEFAULT_FILTERS = () => ({
  vehicleId: '',
  speedKmh: SPEED_DEFAULT,
  durationMin: DURATION_DEFAULT_MINUTES,
  windowHours: 24,
});

// FleetEdge alerts are a sampler, not a source (audit §3.1) — the provenance
// is stated on every row, never a raw enum.
const FLEETEDGE_PROVENANCE = 'FleetEdge alert — sampler, not a source';

const EVENT_EXPORT_COLUMNS = [
  { key: 'startedAt', label: 'Started' },
  { key: 'maxSpeedKmh', label: 'Max speed (km/h)', type: 'number' },
  { key: 'avgSpeedKmh', label: 'Avg speed (km/h)', type: 'number' },
  { key: 'durationMin', label: 'Duration (min)', type: 'number' },
  { key: 'pingCount', label: 'Position pings', type: 'number' },
  { key: 'place', label: 'Place' },
];

const CORROBORATING_COLUMNS = [
  {
    key: 'eventDateTime',
    label: 'Time',
    render: (row) => (row.eventDateTime ? formatDateTimeIST(row.eventDateTime) : '—'),
  },
  { key: 'speedKph', label: 'Speed (km/h)', type: 'number', align: 'right' },
  { key: 'durationSeconds', label: 'Duration (s)', type: 'number', align: 'right' },
  {
    key: 'place',
    label: 'Place',
    render: (row) => {
      const loc = row.location;
      const lat = Number(loc?.lat ?? loc?.latitude);
      const lng = Number(loc?.lng ?? loc?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return <PlaceLabel lat={lat} lng={lng} showMap={false} />;
      }
      return loc && typeof loc === 'object' && loc.name ? loc.name : '—';
    },
  },
  { key: 'type', label: 'Type', render: (row) => (row.type ? humanise(row.type) : '—') },
  {
    key: 'provenance',
    label: 'Source',
    render: () => <span className="osp-provenance">{FLEETEDGE_PROVENANCE}</span>,
  },
];

const filterCount = (f) =>
  (f.vehicleId ? 1 : 0) +
  (clampSpeed(f.speedKmh) !== SPEED_DEFAULT ? 1 : 0) +
  (clampDurationMinutes(f.durationMin) !== DURATION_DEFAULT_MINUTES ? 1 : 0) +
  (normaliseWindowHours(f.windowHours) !== 24 ? 1 : 0);

const OverspeedPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [draft, setDraft] = useState(DEFAULT_FILTERS); // editable inputs
  const [committed, setCommitted] = useState(DEFAULT_FILTERS); // drives the query
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

  // Export resolves every event's start coordinate to a place first, so the
  // file carries names, never coordinates. resolvePlace batches through the
  // PlaceService cache — the cards' PlaceLabels usually warm it already.
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

  const renderBody = () => {
    if (!committed.vehicleId) {
      return (
        <div className="osp-state" role="status">
          <Truck size={36} strokeWidth={1.5} aria-hidden="true" />
          <p className="osp-state-title">Select a vehicle to check for sustained overspeed</p>
          <span>
            Events are recomputed from position history against your thresholds — pick a truck, set
            “over X km/h for more than Y minutes”, and choose a window.
          </span>
        </div>
      );
    }
    if (loading) {
      return (
        <div
          className="osp-state osp-state--plain"
          role="status"
          aria-label="Computing overspeed events"
        >
          <p className="osp-state-title">Computing from position history…</p>
          <TableShimmer columns={4} rows={6} />
        </div>
      );
    }
    if (status === 422) {
      return (
        <div className="osp-state osp-state--missing" role="alert">
          <MapPinOff size={36} strokeWidth={1.5} aria-hidden="true" />
          <p className="osp-state-title">No position data for this vehicle in the window</p>
          <span>
            Overspeed cannot be computed without position pings. This is missing data, not an
            all-clear — widen the window or check that the device is reporting.
          </span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="osp-state osp-state--error" role="alert">
          <AlertTriangle size={36} strokeWidth={1.5} aria-hidden="true" />
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
      // The all-clear is only reachable with pings in the window (422 covers
      // the no-pings case) — "no sustained overspeed" means the truck moved
      // and never held over the threshold.
      return (
        <>
          <div className="osp-state osp-state--clear" role="status">
            <CheckCircle2 size={36} strokeWidth={1.5} aria-hidden="true" />
            <p className="osp-state-title">No sustained overspeed in this window</p>
            <span>
              {reg || 'This vehicle'} stayed at or under{' '}
              {data.thresholdsUsed?.speedThresholdKmh ?? committed.speedKmh} km/h for less than{' '}
              {Math.round((data.thresholdsUsed?.durationSec ?? committed.durationMin * 60) / 60)}{' '}
              minutes at a time, across {pingCount.toLocaleString('en-IN')} position pings.
            </span>
          </div>
          {corroborating.length > 0 && (
            <section className="osp-section">
              <h2 className="osp-section-title">FleetEdge device alerts — corroboration only</h2>
              <p className="osp-section-sub">
                The device fired on {corroborating.length} instantaneous sample
                {corroborating.length === 1 ? '' : 's'} while our computation found none — the
                sampler records a second of throttle as an offence. Shown with provenance, never
                merged.
              </p>
              <DataTable
                columns={CORROBORATING_COLUMNS}
                rows={corroborating}
                rowKey={(r, i) => r._id ?? r.eventDateTime ?? i}
                showing={corroborating.length}
                total={corroborating.length}
                emptyTitle="No FleetEdge alerts in this window"
              />
            </section>
          )}
        </>
      );
    }
    if (data && events.length > 0) {
      const disagree = sourcesDisagree(events, corroborating);
      return (
        <>
          {/* Summary — both sources with provenance, never averaged (audit §3.3). */}
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
              <AlertTriangle size={13} aria-hidden="true" />
              Our calculation and the device alerts disagree — shown side by side with their
              provenance so you can decide, never averaged.
            </p>
          )}

          <section className="osp-section">
            <h2 className="osp-section-title">
              Our calculation — recomputed from position history
            </h2>
            <div className="osp-cards">
              {events.map((event, i) => (
                <OverspeedEvidenceCard key={event.startAt ?? i} event={event} />
              ))}
            </div>
          </section>

          <section className="osp-section">
            <h2 className="osp-section-title">FleetEdge device alerts — corroboration only</h2>
            <p className="osp-section-sub">
              {FLEETEDGE_PROVENANCE} — it fires on an instantaneous sample, so it cannot see a
              sustained violation. Kept beside our computation, never merged into it.
            </p>
            <DataTable
              columns={CORROBORATING_COLUMNS}
              rows={corroborating}
              rowKey={(r, i) => r._id ?? r.eventDateTime ?? i}
              showing={corroborating.length}
              total={corroborating.length}
              emptyTitle="No FleetEdge alerts in this window"
              emptyHint="The device reported nothing here — our computation stands on its own."
            />
          </section>
        </>
      );
    }
    return null;
  };

  return (
    <PageShell
      className="osp-page"
      title="Overspeed"
      subtitle="Sustained overspeed recomputed from position history — device alerts shown separately as corroboration"
      count={data ? events.length : null}
      freshnessAt={data?.computedAt || null}
      actions={
        <button
          type="button"
          className="osp-btn"
          onClick={fetchEvents}
          disabled={loading || !committed.vehicleId}
        >
          <RefreshCw size={14} className={loading ? 'osp-spin' : ''} aria-hidden="true" />
          Refresh
        </button>
      }
      filters={
        <FilterBar
          activeCount={filterCount(committed)}
          onClear={clearFilters}
          right={
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
          }
        />
      }
    >
      <div className="osp-filters">
        <div className="osp-field osp-field--vehicle">
          <label htmlFor="osp-vehicle">Vehicle</label>
          <SearchableDropdown
            options={vehicles.map((v) => v.registrationNumber).filter(Boolean)}
            selectedOption={vehicleById(draft.vehicleId)?.registrationNumber || ''}
            onSelect={(regNum) => {
              const vehicle = vehicles.find((v) => v.registrationNumber === regNum);
              setDraft((d) => ({ ...d, vehicleId: vehicle?._id || '' }));
            }}
            placeholder="Select vehicle"
          />
        </div>
        <div className="osp-field">
          <label htmlFor="osp-speed">Over speed (km/h)</label>
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
          <label htmlFor="osp-duration">For at least (minutes)</label>
          <input
            id="osp-duration"
            type="number"
            min={1}
            max={10}
            value={draft.durationMin}
            onChange={(e) => setDraft((d) => ({ ...d, durationMin: e.target.value }))}
          />
        </div>
        <div className="osp-field">
          <label htmlFor="osp-window">Window</label>
          <select
            id="osp-window"
            value={draft.windowHours}
            onChange={(e) => setDraft((d) => ({ ...d, windowHours: Number(e.target.value) }))}
          >
            {WINDOW_OPTIONS.map((w) => (
              <option key={w.hours} value={w.hours}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div className="osp-filter-actions">
          <button
            type="button"
            className="osp-btn osp-btn--primary"
            onClick={applyFilters}
            disabled={loading}
          >
            <Search size={14} aria-hidden="true" /> Apply
          </button>
        </div>
      </div>

      {renderBody()}
    </PageShell>
  );
};

export default OverspeedPage;
