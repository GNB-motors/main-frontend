import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  ArrowRight,
  AlertTriangle,
  Clock,
  LayoutGrid,
  Rows3,
} from 'lucide-react';
import TripDashboardService from './TripDashboardService';
import ErpDashboardService from '../ErpHome/ErpDashboardService';
import '../../styles/erp.css';
import './TripPipeline.css';

/**
 * The commercial lifecycle, compressed for the row indicator.
 *
 * Mirrors erpTrip.constants.js: Advance and CN run in parallel, but only the CN
 * gate moves the trip to DISPATCHED — advance settlement never blocks dispatch
 * or close. So the *blocking* spine is DO → Placed → CN → Close → POD → Unload
 * → Bill → Paid, and advance is deliberately not a segment here.
 */
const LIFECYCLE = ['DO', 'Placed', 'CN', 'Close', 'POD', 'Unload', 'Bill', 'Paid'];

/** Index of the stage the trip is *waiting on*. -1 = cancelled. */
const stageIndex = (state) => {
  switch (state) {
    case 'CANCELLED':
      return -1;
    case 'PLACED':
    case 'ADVANCE_PENDING':
    case 'ADVANCE_PAID':
    case 'CN_PENDING':
      return 2;
    case 'CN_UPDATED':
    case 'DISPATCHED':
      return 3;
    case 'TRIP_CLOSED':
      return 4;
    case 'POD_RECEIVED':
      return 5;
    case 'UNLOADED':
      return 6;
    case 'BILLED':
      return 7;
    default:
      return 1;
  }
};

/**
 * What the operator has to do next, so nobody has to read two gate columns and
 * infer it. `wait` means the ball is in someone else's court.
 */
const nextAction = (trip) => {
  switch (trip.state) {
    case 'CANCELLED':
      return null;
    case 'PLACED':
    case 'ADVANCE_PENDING':
    case 'ADVANCE_PAID':
    case 'CN_PENDING':
      return { label: 'Create CN', drawer: 'cn' };
    case 'CN_UPDATED':
    case 'DISPATCHED':
      return { label: 'Close trip', drawer: 'close' };
    case 'TRIP_CLOSED':
      return { label: 'Upload POD', drawer: 'pod' };
    case 'POD_RECEIVED':
      return { label: 'Enter unloading', drawer: 'unloading' };
    case 'UNLOADED':
      return { label: 'Generate sale bill', drawer: 'salebill' };
    case 'BILLED':
      return { label: 'Awaiting payment', drawer: 'receipt', wait: true };
    default:
      return null;
  }
};

const BOARD_COLUMNS = [
  { state: 'PLACED', label: 'Placed' },
  { state: 'DISPATCHED', label: 'In transit' },
  { state: 'TRIP_CLOSED', label: 'Closed' },
  { state: 'POD_RECEIVED', label: 'POD in' },
  { state: 'UNLOADED', label: 'Unloaded' },
  { state: 'BILLED', label: 'Billed' },
];

// Only states the backend actually stores. The previous list omitted
// DISPATCHED, so the busiest state on the board could not be filtered at all.
const FILTER_STATES = [
  'PLACED',
  'DISPATCHED',
  'TRIP_CLOSED',
  'POD_RECEIVED',
  'UNLOADED',
  'BILLED',
  'CANCELLED',
];

const badgeClass = (state) => {
  switch (state) {
    case 'PLACED':
      return 'warning';
    case 'DISPATCHED':
    case 'POD_RECEIVED':
    case 'UNLOADED':
      return 'info';
    case 'TRIP_CLOSED':
    case 'BILLED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    default:
      return 'neutral';
  }
};

const day = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

const MiniLifecycle = ({ state }) => {
  const idx = stageIndex(state);
  return (
    <span className="trippipe-mini" title={idx < 0 ? 'Cancelled' : `Waiting on ${LIFECYCLE[idx]}`}>
      <span className="trippipe-mini-segs">
        {LIFECYCLE.map((label, i) => (
          <span
            key={label}
            className={`trippipe-mini-seg ${
              idx < 0 ? 'cancelled' : i < idx ? 'done' : i === idx ? 'current' : ''
            }`}
          />
        ))}
      </span>
      {/* Eight dots alone do not say how far along a trip is. */}
      <span className="trippipe-mini-count">
        {idx < 0 ? 'cancelled' : `${idx} / ${LIFECYCLE.length}`}
      </span>
    </span>
  );
};

const NextActionCell = ({ trip }) => {
  const action = nextAction(trip);
  if (!action) return <span className="trippipe-action none">—</span>;
  return (
    <Link
      to={`/erp/trips/${trip._id}${action.wait ? '' : `?drawer=${action.drawer}`}`}
      className={`trippipe-action ${action.wait ? 'wait' : 'act'}`}
    >
      {action.label}
      {!action.wait && <ArrowRight size={13} />}
    </Link>
  );
};

const AgeingFlag = ({ trip }) => {
  if (trip.ageingFlag) {
    return (
      <span className="trippipe-flag">
        <AlertTriangle size={11} /> {trip.ageingDays}d
      </span>
    );
  }
  if (trip.ageingDays >= 30) {
    return (
      <span className="trippipe-flag warn">
        <Clock size={11} /> {trip.ageingDays}d
      </span>
    );
  }
  return null;
};

const TripDashboardPage = () => {
  const [trips, setTrips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, limit: 20 });
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [state, setState] = useState('');

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
          <p className="erp-subtitle">
            Where every active trip sits, and what it is waiting on.
          </p>
        </div>
      </header>

      {/* ── Situational awareness, before the table ── */}
      {stats.length > 0 && (
        <>
          <div className="trippipe-summary trippipe-summary--lead">
            {stats.filter((s) => s.lead).map((s) => (
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
            {stats.filter((s) => !s.lead).map((s) => (
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

      {/* ── Filters ── */}
      <div className="trippipe-toolbar">
        <form className="trippipe-search" onSubmit={submitSearch}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search trip no, vehicle, route or material…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <select className="trippipe-select" value={state} onChange={(e) => setState(e.target.value)}>
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
      {view === 'table' && (
        <div className="trippipe-tablewrap">
          <table className="trippipe-table">
            <thead>
              <tr>
                <th>Trip</th>
                <th>Date</th>
                <th>Progress</th>
                <th>Stage</th>
                <th>Next action</th>
                <th>Vehicle</th>
                <th>Client</th>
                <th>Route</th>
                <th>Qty (P/L)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="trippipe-empty">
                    Loading trips…
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="trippipe-empty">
                    No trips match these filters.
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/erp/trips/${t._id}`} className="trippipe-trip">
                        {t.tripNumber}
                      </Link>
                      {t.cnNumber && <span className="trippipe-sub">CN {t.cnNumber}</span>}
                    </td>
                    <td className="trippipe-num">
                      {day(t.tripDate)}
                      <AgeingFlag trip={t} />
                    </td>
                    <td>
                      <MiniLifecycle state={t.state} />
                    </td>
                    <td>
                      <span className={`erp-badge ${badgeClass(t.state)}`}>
                        {t.state?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <NextActionCell trip={t} />
                    </td>
                    <td className="trippipe-num">{t.vehicleNumber || '—'}</td>
                    <td>{t.partyId?.name || '—'}</td>
                    <td className="trippipe-route">
                      {t.fromLocation ? `${t.fromLocation} → ${t.toLocation}` : '—'}
                      {t.material && <span className="trippipe-sub">{t.material}</span>}
                    </td>
                    <td className="trippipe-num">
                      {t.plannedQty || 0} / {t.loadedQty ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Board view: the pipeline, literally ── */}
      {view === 'board' && (
        <div className="trippipe-board">
          {BOARD_COLUMNS.map((col) => {
            const items = grouped[col.state] || [];
            return (
              <section key={col.state} className="trippipe-col">
                <header className="trippipe-col-head">
                  {col.label}
                  <span className="trippipe-col-count">{items.length}</span>
                </header>
                <div className="trippipe-col-body">
                  {loading ? (
                    <p className="trippipe-col-empty">Loading…</p>
                  ) : items.length === 0 ? (
                    <p className="trippipe-col-empty">Nothing here.</p>
                  ) : (
                    items.map((t) => (
                      <Link key={t._id} to={`/erp/trips/${t._id}`} className="trippipe-card">
                        <div className="trippipe-card-top">
                          <span className="trippipe-card-no">{t.tripNumber}</span>
                          <span style={{ marginLeft: 'auto' }}>
                            <AgeingFlag trip={t} />
                          </span>
                        </div>
                        <div className="trippipe-card-meta">
                          {t.vehicleNumber || '—'} · {t.partyId?.name || '—'}
                          <br />
                          {t.fromLocation ? `${t.fromLocation} → ${t.toLocation}` : '—'}
                        </div>
                        <div className="trippipe-card-foot">
                          <NextActionCell trip={t} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

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
