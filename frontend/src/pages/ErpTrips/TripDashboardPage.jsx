import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, LayoutGrid, Rows3 } from 'lucide-react';
import TripDashboardService from './TripDashboardService';
import PlacementService from '../ErpPlacement/PlacementService';
import ErpDashboardService from '../ErpHome/ErpDashboardService';
import '../../styles/erp.css';
import './TripPipeline.css';
import BOARD_COLUMNS from './dashboard/boardColumns';
import PendingPlacements from './dashboard/PendingPlacements';
import TripTable from './dashboard/TripTable';
import TripBoard from './dashboard/TripBoard';

// Only states the backend actually stores. The previous list omitted
// DISPATCHED, so the busiest state on the board could not be filtered at all.
const FILTER_STATES = [
  'PLANNED',
  'PLACED',
  'DISPATCHED',
  'TRIP_CLOSED',
  'POD_RECEIVED',
  'UNLOADED',
  'BILLED',
  'CANCELLED',
];

const TripDashboardPage = () => {
  const [trips, setTrips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, limit: 20 });
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [state, setState] = useState('');
  /* Placements held at approval. There is deliberately no trip row for these:
     _createTrip runs on approval, not on placement, so the trip document does
     not exist yet. They are shown as a separate pre-pipeline strip rather than
     synthesised as trips, which would corrupt the stage counts and the
     lifecycle bar below. */
  const [pendingPlacements, setPendingPlacements] = useState([]);
  /* Trips whose telematics window is still open long after the load came off.
     Nothing closes automatically — a truck that neither reached a yard nor took
     another load is a real situation, and guessing an end instant would corrupt
     the cost rather than flag it. */
  const [staleWindows, setStaleWindows] = useState([]);

  const fetchTrips = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = { page, limit: view === 'board' ? 100 : 20 };
        if (submittedSearch.trim()) params.search = submittedSearch.trim();
        if (state) params.state = state;
        const res = await TripDashboardService.listTrips(params);
        setTrips(res.data || []);
        setMeta(res.meta || { page: 1, totalPages: 1, limit: 20 });
      } catch (err) {
        toast.error(err.message || 'Failed to fetch trips');
      } finally {
        setLoading(false);
      }
    },
    [state, submittedSearch, view],
  );

  useEffect(() => {
    fetchTrips(1);
  }, [fetchTrips]);

  // Org-wide counts. Deliberately NOT derived from `trips` — that array is one
  // page of 20, so page-local counts would understate the pipeline and quietly
  // lie to the operator.
  useEffect(() => {
    ErpDashboardService.getSummary()
      .then((res) => setSummary(res?.data ?? res ?? null))
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    PlacementService.getPlacements({ status: 'PENDING_APPROVAL', limit: 50 })
      .then((res) => setPendingPlacements(res?.data || []))
      .catch(() => setPendingPlacements([]));
  }, []);

  const fetchStaleWindows = useCallback(() => {
    TripDashboardService.listStaleWindows()
      .then((rows) => setStaleWindows(rows || []))
      .catch(() => setStaleWindows([]));
  }, []);

  useEffect(() => {
    fetchStaleWindows();
  }, [fetchStaleWindows]);

  const resolveWindow = async (tripId) => {
    try {
      await TripDashboardService.resolveWindow(tripId);
      toast.success('Window closed at unload; the run after it is now unattributed');
      fetchStaleWindows();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to close the window');
    }
  };

  const stats = useMemo(() => {
    const p = summary?.pendingCounts;
    if (!p) return [];
    const active = p.activeTrips || {};
    /**
     * Two rows, not seven equal cards.
     *
     * "Awaiting CN" is work for right now; "Awaiting payment" is a trip sitting
     * with accounts. Giving them the same size and weight made the operator read
     * seven numbers to find the one they act on. `lead: true` marks the headline
     * figures — everything else is a stage filter of the same list.
     */
    const awaitingCn = p.pendingCns || 0;
    const readyToClose = p.pendingTripClose || 0;
    const awaitingPod = p.pendingPods || 0;

    return [
      {
        key: '',
        label: 'Active trips',
        value: Object.values(active).reduce((a, b) => a + b, 0),
        lead: true,
      },
      {
        key: 'PLACED',
        label: 'Need action now',
        value: awaitingCn + readyToClose + awaitingPod,
        tone: 'attention',
        lead: true,
        hint: 'CN, close or POD outstanding',
      },
      { key: 'PLACED', label: 'Awaiting CN', value: awaitingCn, tone: 'attention' },
      { key: 'DISPATCHED', label: 'Ready to close', value: readyToClose, tone: 'attention' },
      { key: 'TRIP_CLOSED', label: 'Awaiting POD', value: awaitingPod, tone: 'attention' },
      { key: 'POD_RECEIVED', label: 'To unload', value: p.pendingUnloadings || 0 },
      { key: 'UNLOADED', label: 'Ready to bill', value: active.UNLOADED || 0 },
      { key: 'BILLED', label: 'Awaiting payment', value: active.BILLED || 0, tone: 'idle' },
    ];
  }, [summary]);

  const grouped = useMemo(() => {
    const map = {};
    BOARD_COLUMNS.forEach((c) => {
      map[c.state] = [];
    });
    trips.forEach((t) => {
      if (map[t.state]) map[t.state].push(t);
    });
    return map;
  }, [trips]);

  const submitSearch = (e) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  const clearFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setState('');
  };

  const hasFilters = !!(state || submittedSearch);

  return (
    <div className="erp-page trippipe">
      <header className="erp-header">
        <div>
          <h1>Trip Pipeline</h1>
          <p className="erp-subtitle">Where every active trip sits, and what it is waiting on.</p>
        </div>
      </header>

      {/* ── Trips still counting kilometres long after the load came off ── */}
      {staleWindows.length > 0 && (
        <div className="erp-callout warning" style={{ flexDirection: 'column', gap: 8 }}>
          <span>
            <strong>
              {staleWindows.length} trip{staleWindows.length > 1 ? 's are' : ' is'} still counting
              kilometres after unload.
            </strong>{' '}
            The truck has neither reached a yard nor taken another load. Closing the window
            attributes only the run up to unload; anything after becomes unassigned in Tours.
          </span>
          <ul style={{ margin: 0, paddingLeft: 18, width: '100%' }}>
            {staleWindows.slice(0, 5).map((w) => (
              <li key={w.tripId} style={{ marginBottom: 4 }}>
                <Link to={`/erp/trips/${w.tripId}`}>{w.tripNumber}</Link>
                {' · '}
                {w.registrationNumber || '—'}
                {' · '}
                open {w.openForDays} day{w.openForDays === 1 ? '' : 's'}
                <button
                  type="button"
                  className="btn btn-link"
                  style={{ marginLeft: 8 }}
                  onClick={() => resolveWindow(w.tripId)}
                >
                  Close at unload
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Situational awareness, before the table ── */}
      {stats.length > 0 && (
        <>
          <div className="trippipe-summary trippipe-summary--lead">
            {stats
              .filter((s) => s.lead)
              .map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className={`trippipe-stat lead ${s.tone || ''} ${
                    s.key === '' && !state ? 'active' : ''
                  }`}
                  onClick={() => setState(s.key)}
                >
                  <span className="trippipe-stat-value">{s.value}</span>
                  <span className="trippipe-stat-label">{s.label}</span>
                  {s.hint && <span className="trippipe-stat-hint">{s.hint}</span>}
                </button>
              ))}
          </div>

          <div className="trippipe-stagerow">
            <span className="trippipe-stagerow-label">By stage</span>
            {stats
              .filter((s) => !s.lead)
              .map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className={`trippipe-chip ${s.tone || ''} ${state === s.key ? 'active' : ''}`}
                  onClick={() => setState(state === s.key ? '' : s.key)}
                  aria-pressed={state === s.key}
                >
                  {s.label}
                  <span className="trippipe-chip-count">{s.value}</span>
                </button>
              ))}
          </div>
        </>
      )}

      {/* ── Not in the pipeline yet ──
          A placement waiting on approval has no trip row, so without this the
          operator raises a placement and the pipeline looks unchanged. Kept out
          of `stats` and the stage filters on purpose: these are not trips. */}
      {pendingPlacements.length > 0 && <PendingPlacements pendingPlacements={pendingPlacements} />}

      {/* ── Filters ── */}
      <div className="trippipe-toolbar">
        <form className="trippipe-search" onSubmit={submitSearch}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search trip no, vehicle, route or material…"
            aria-label="Search trips"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <select
          className="trippipe-select"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">All stages</option>
          {FILTER_STATES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button type="button" className="trippipe-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}

        <div className="trippipe-viewtoggle">
          <button
            type="button"
            className={view === 'table' ? 'on' : ''}
            onClick={() => setView('table')}
          >
            <Rows3 size={13} /> Table
          </button>
          <button
            type="button"
            className={view === 'board' ? 'on' : ''}
            onClick={() => setView('board')}
          >
            <LayoutGrid size={13} /> Board
          </button>
        </div>
      </div>

      {/* ── Table view ── */}
      {view === 'table' && <TripTable trips={trips} loading={loading} />}

      {/* ── Board view: the pipeline, literally ── */}
      {view === 'board' && <TripBoard grouped={grouped} loading={loading} />}

      {view === 'table' && !loading && meta.totalPages > 1 && (
        <div className="trippipe-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={meta.page <= 1}
            onClick={() => fetchTrips(meta.page - 1)}
          >
            Previous
          </button>
          <span className="erp-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={meta.page >= meta.totalPages}
            onClick={() => fetchTrips(meta.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TripDashboardPage;
