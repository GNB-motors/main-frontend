import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Inbox,
  RefreshCw,
  Search,
  ScrollText,
  Server,
  Users,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { LemuService } from './LemuService';
import './LemuLogsPage.css';

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────────────── */
const SEVERITIES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const SOURCES = ['EXTENSION', 'BACKEND', 'FRONTEND', 'CRON', 'DRIVERAPP'];
const PAGE_SIZE = 25;

/** "5m ago" / "2h ago" style relative time; '—' for missing values. */
const relativeTime = (iso) => {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
};

const formatTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
};

const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const SeverityBadge = ({ severity }) => (
  <span className={`lemu-badge lemu-badge--sev-${(severity || '').toLowerCase() || 'debug'}`}>
    {severity || '—'}
  </span>
);

const JobStatusPill = ({ status }) => (
  <span className={`lemu-pill lemu-pill--${status || 'unmonitored'}`}>
    <span className="lemu-pill__dot" />
    {status || 'unknown'}
  </span>
);

/* ─────────────────────────────────────────────────────────────────────────
   LemuLogsPage
──────────────────────────────────────────────────────────────────────────── */
const LemuLogsPage = () => {
  const navigate = useNavigate();

  /* ── Dashboard strip ── */
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  /* ── Jobs panel ── */
  const [jobs, setJobs] = useState([]);
  const [jobsCheckedAt, setJobsCheckedAt] = useState(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  /* ── Events explorer ── */
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [service, setService] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  /* ── Errors inbox ── */
  const [trackers, setTrackers] = useState([]);
  const [errorsSummary, setErrorsSummary] = useState(null);
  const [trackersLoading, setTrackersLoading] = useState(true);
  const [trackersError, setTrackersError] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('false'); // 'true' | 'false' | ''
  const [resolvingFp, setResolvingFp] = useState(null);

  /* ── Auto-refresh ── */
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  /* ── Loaders ── */
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setDashboardLoading(true);
    setDashboardError('');
    try {
      const data = await LemuService.getDashboard();
      setDashboard(data);
    } catch (e) {
      setDashboardError(e.detail || e.message || 'Failed to load dashboard stats');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadJobs = useCallback(async (silent = false) => {
    if (!silent) setJobsLoading(true);
    setJobsError('');
    try {
      const data = await LemuService.getJobs();
      setJobs(data.data || []);
      setJobsCheckedAt(data.checkedAt || null);
    } catch (e) {
      setJobsError(e.detail || e.message || 'Failed to load job health');
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async (silent = false) => {
    if (!silent) setEventsLoading(true);
    setEventsError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (severity) params.severity = severity;
      if (source) params.source = source;
      if (service.trim()) params.service = service.trim();
      if (search.trim()) params.search = search.trim();
      const data = await LemuService.getEvents(params);
      setEvents(data.data || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: PAGE_SIZE, pages: 1 });
    } catch (e) {
      setEventsError(e.detail || e.message || 'Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  }, [page, severity, source, service, search]);

  const loadTrackers = useCallback(async (silent = false) => {
    if (!silent) setTrackersLoading(true);
    setTrackersError('');
    try {
      const params = {};
      if (resolvedFilter) params.resolved = resolvedFilter;
      const data = await LemuService.getErrorTrackers(params);
      setTrackers(data.trackers || []);
      setErrorsSummary(data.summary || null);
    } catch (e) {
      setTrackersError(e.detail || e.message || 'Failed to load error trackers');
    } finally {
      setTrackersLoading(false);
    }
  }, [resolvedFilter]);

  /* Initial loads */
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadTrackers(); }, [loadTrackers]);

  /* Events: debounce filter changes, refetch on page/filter change */
  const eventsTimer = useRef(null);
  useEffect(() => {
    eventsTimer.current = setTimeout(() => loadEvents(), 300);
    return () => clearTimeout(eventsTimer.current);
  }, [loadEvents]);

  /* Auto-refresh (30s) — refreshes stats, jobs and the current events page */
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const id = setInterval(() => {
      loadDashboard(true);
      loadJobs(true);
      loadEvents(true);
    }, 30000);
    return () => clearInterval(id);
  }, [autoRefresh, loadDashboard, loadJobs, loadEvents]);

  const resetPageAnd = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResolve = async (tracker) => {
    const fp = tracker.fingerprint;
    if (!fp || resolvingFp) return;
    setResolvingFp(fp);
    setTrackersError('');
    try {
      await LemuService.resolveError(fp, { resolvedBy: localStorage.getItem('user_email') || undefined });
      setTrackers((prev) => prev.filter((t) => t.fingerprint !== fp));
      setErrorsSummary((prev) => prev && {
        ...prev,
        totalUnresolved: Math.max(0, (prev.totalUnresolved ?? 0) - 1),
        totalResolved: (prev.totalResolved ?? 0) + 1,
      });
      loadDashboard(true);
    } catch (e) {
      setTrackersError(e.detail || e.message || 'Failed to resolve error');
    } finally {
      setResolvingFp(null);
    }
  };

  const refreshAll = () => {
    loadDashboard(true);
    loadJobs(true);
    loadEvents(true);
    loadTrackers(true);
  };

  /* ── Stat cards ── */
  const stats = [
    { label: 'Events (24h)', value: dashboard?.last24h?.total, icon: <ScrollText size={18} />, tone: 'brand' },
    { label: 'Errors (24h)', value: dashboard?.last24h?.errors, icon: <AlertTriangle size={18} />, tone: 'warn' },
    { label: 'Fatals (24h)', value: dashboard?.last24h?.fatals, icon: <AlertTriangle size={18} />, tone: 'danger' },
    { label: 'Unresolved Errors', value: dashboard?.unresolvedErrors, icon: <Activity size={18} />, tone: 'danger' },
    { label: 'Affected Users Today', value: dashboard?.affectedUsersToday, icon: <Users size={18} />, tone: 'neutral' },
  ];

  return (
    <div className="lemu-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="LEMU Logs"
        title="LEMU Observability"
        description="Cross-surface event logs, cron job health and unresolved errors."
      />

      <div className="lemu-toolbar">
        <span className="lemu-meta">
          {jobsCheckedAt && <>Jobs checked <strong>{relativeTime(jobsCheckedAt)}</strong></>}
        </span>
        <div className="lemu-toolbar__actions">
          <button
            type="button"
            className={`lemu-switch${autoRefresh ? ' lemu-switch--on' : ''}`}
            role="switch"
            aria-checked={autoRefresh}
            onClick={() => setAutoRefresh((v) => !v)}
            title="Auto-refresh every 30s"
          >
            <span className="lemu-switch__thumb" />
          </button>
          <span className="lemu-meta">Auto-refresh (30s)</span>
          <button type="button" className="lemu-btn lemu-btn--secondary" onClick={refreshAll}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── 1. Stats strip ─────────────────────────────────────────── */}
      {dashboardError && (
        <div className="lemu-alert lemu-alert--error" role="alert">{dashboardError}</div>
      )}
      <div className="lemu-stats">
        {stats.map((s) => (
          <div className="lemu-stat" key={s.label}>
            <span className={`lemu-stat__icon lemu-stat__icon--${s.tone}`}>{s.icon}</span>
            <div className="lemu-stat__body">
              <span className="lemu-stat__value">
                {dashboardLoading ? '…' : (s.value ?? '—')}
              </span>
              <span className="lemu-stat__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 2. Jobs health ─────────────────────────────────────────── */}
      <section className="lemu-section">
        <div className="lemu-section__head">
          <h2 className="lemu-section__title">
            <Server size={16} /> Job Health
          </h2>
          <span className="lemu-meta">
            {jobsLoading ? 'Loading…' : <><strong>{jobs.length}</strong> monitored job{jobs.length === 1 ? '' : 's'}</>}
          </span>
        </div>
        {jobsError && (
          <div className="lemu-alert lemu-alert--error" role="alert">{jobsError}</div>
        )}
        <div className="lemu-card">
          <div className="lemu-table-wrap">
            <table className="lemu-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Last OK</th>
                  <th className="lemu-right">Duration</th>
                  <th className="lemu-right">Rows Written</th>
                  <th className="lemu-right">Consec. Failures</th>
                </tr>
              </thead>
              <tbody>
                {jobsLoading && (
                  <tr><td colSpan={6}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
                )}
                {!jobsLoading && jobs.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="lemu-state">
                        <div className="lemu-state__icon"><Inbox size={22} /></div>
                        <div className="lemu-state__title">No jobs reporting</div>
                        <div>No job heartbeats have been recorded yet.</div>
                      </div>
                    </td>
                  </tr>
                )}
                {!jobsLoading && jobs.map((job) => (
                  <tr key={job.job} className={job.status === 'stalled' || job.status === 'late' ? 'lemu-row--alert' : ''}>
                    <td>
                      <div className="lemu-job__name">{job.job}</div>
                      {job.lastError && (
                        <div className="lemu-job__error" title={job.lastError}>{job.lastError}</div>
                      )}
                    </td>
                    <td><JobStatusPill status={job.status} /></td>
                    <td className="lemu-muted" title={formatTime(job.lastOkAt)}>
                      <Clock size={12} className="lemu-inline-icon" />
                      {relativeTime(job.lastOkAt)}
                    </td>
                    <td className="lemu-right lemu-mono">{formatDuration(job.lastDurationMs)}</td>
                    <td className="lemu-right lemu-mono">{job.rowsWritten ?? '—'}</td>
                    <td className="lemu-right">
                      {job.consecutiveFailures > 0 ? (
                        <span className="lemu-badge lemu-badge--sev-error">{job.consecutiveFailures}</span>
                      ) : (
                        <span className="lemu-muted">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 3. Logs explorer ───────────────────────────────────────── */}
      <section className="lemu-section">
        <div className="lemu-section__head">
          <h2 className="lemu-section__title">
            <ScrollText size={16} /> Logs Explorer
          </h2>
          <span className="lemu-meta">
            {eventsLoading ? 'Loading…' : <><strong>{pagination.total}</strong> event{pagination.total === 1 ? '' : 's'}</>}
          </span>
        </div>

        <div className="lemu-filters">
          <select
            className="lemu-select"
            value={severity}
            onChange={resetPageAnd(setSeverity)}
            aria-label="Filter by severity"
          >
            <option value="">All severities</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="lemu-select"
            value={source}
            onChange={resetPageAnd(setSource)}
            aria-label="Filter by source"
          >
            <option value="">All sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            className="lemu-input"
            type="text"
            placeholder="Service (e.g. FleetGuardian)"
            value={service}
            onChange={resetPageAnd(setService)}
          />
          <div className="lemu-search">
            <span className="lemu-search__icon"><Search size={16} /></span>
            <input
              type="text"
              placeholder="Search messages…"
              value={search}
              onChange={resetPageAnd(setSearch)}
            />
          </div>
        </div>

        {eventsError && (
          <div className="lemu-alert lemu-alert--error" role="alert">{eventsError}</div>
        )}

        <div className="lemu-card">
          <div className="lemu-table-wrap">
            <table className="lemu-table lemu-table--events">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Severity</th>
                  <th>Source</th>
                  <th>Service</th>
                  <th>Message</th>
                  <th aria-label="Expand" />
                </tr>
              </thead>
              <tbody>
                {eventsLoading && (
                  <tr><td colSpan={6}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
                )}
                {!eventsLoading && events.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="lemu-state">
                        <div className="lemu-state__icon"><Inbox size={22} /></div>
                        <div className="lemu-state__title">No events found</div>
                        <div>Try widening the filters or time range.</div>
                      </div>
                    </td>
                  </tr>
                )}
                {!eventsLoading && events.map((ev) => {
                  const id = ev.eventId || `${ev.timestamp}-${ev.message}`;
                  const expanded = expandedIds.has(id);
                  return (
                    <React.Fragment key={id}>
                      <tr className="lemu-clickable" onClick={() => toggleExpanded(id)}>
                        <td className="lemu-muted lemu-nowrap" title={formatTime(ev.timestamp)}>
                          {relativeTime(ev.timestamp)}
                        </td>
                        <td><SeverityBadge severity={ev.severity} /></td>
                        <td className="lemu-muted">{ev.source || '—'}</td>
                        <td className="lemu-muted">{ev.service || '—'}</td>
                        <td>
                          <span className="lemu-msg" title={ev.message}>{ev.message}</span>
                          {ev.userEmail && <span className="lemu-msg__user">{ev.userEmail}</span>}
                        </td>
                        <td className="lemu-right">
                          <span className="lemu-chevron">
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="lemu-detail-row">
                          <td colSpan={6}>
                            <div className="lemu-detail">
                              <div className="lemu-detail__grid">
                                <span className="lemu-detail__label">Event ID</span>
                                <span className="lemu-mono">{ev.eventId || '—'}</span>
                                <span className="lemu-detail__label">Timestamp</span>
                                <span className="lemu-mono">{formatTime(ev.timestamp)}</span>
                                <span className="lemu-detail__label">Layer</span>
                                <span>{ev.layer || '—'}</span>
                                <span className="lemu-detail__label">Fingerprint</span>
                                <span className="lemu-mono">{ev.fingerprint || '—'}</span>
                                <span className="lemu-detail__label">Extension Ver.</span>
                                <span className="lemu-mono">{ev.extensionVersion || '—'}</span>
                                <span className="lemu-detail__label">User</span>
                                <span>{ev.userEmail || '—'}</span>
                              </div>
                              <div className="lemu-detail__message">{ev.message}</div>
                              {ev.errorName && (
                                <div className="lemu-detail__error-name">{ev.errorName}</div>
                              )}
                              {ev.stack && (
                                <pre className="lemu-detail__stack">{ev.stack}</pre>
                              )}
                              {ev.extra && (
                                <pre className="lemu-detail__stack">
                                  {typeof ev.extra === 'string' ? ev.extra : JSON.stringify(ev.extra, null, 2)}
                                </pre>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="lemu-pagination">
            <span className="lemu-meta">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.pages || 1}</strong>
            </span>
            <div className="lemu-pagination__buttons">
              <button
                type="button"
                className="lemu-btn lemu-btn--secondary"
                disabled={eventsLoading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                type="button"
                className="lemu-btn lemu-btn--secondary"
                disabled={eventsLoading || page >= (pagination.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Errors inbox ────────────────────────────────────────── */}
      <section className="lemu-section">
        <div className="lemu-section__head">
          <h2 className="lemu-section__title">
            <AlertTriangle size={16} /> Errors Inbox
          </h2>
          <div className="lemu-toolbar__actions">
            {errorsSummary && (
              <span className="lemu-meta">
                <strong>{errorsSummary.totalUnresolved ?? 0}</strong> unresolved ·{' '}
                <strong>{errorsSummary.totalResolved ?? 0}</strong> resolved
              </span>
            )}
            <select
              className="lemu-select"
              value={resolvedFilter}
              onChange={(e) => setResolvedFilter(e.target.value)}
              aria-label="Filter by resolution state"
            >
              <option value="false">Unresolved</option>
              <option value="true">Resolved</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
        {trackersError && (
          <div className="lemu-alert lemu-alert--error" role="alert">{trackersError}</div>
        )}
        <div className="lemu-card">
          <div className="lemu-table-wrap">
            <table className="lemu-table lemu-table--events">
              <thead>
                <tr>
                  <th>Fingerprint</th>
                  <th>Message</th>
                  <th className="lemu-right">Occurrences</th>
                  <th>Last Seen</th>
                  <th aria-label="Resolve" />
                </tr>
              </thead>
              <tbody>
                {trackersLoading && (
                  <tr><td colSpan={5}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
                )}
                {!trackersLoading && trackers.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="lemu-state">
                        <div className="lemu-state__icon"><CheckCircle2 size={22} /></div>
                        <div className="lemu-state__title">
                          {resolvedFilter === 'true' ? 'No resolved errors' : 'No unresolved errors'}
                        </div>
                        <div>{resolvedFilter === 'true' ? 'Nothing has been resolved yet.' : 'Everything is clean.'}</div>
                      </div>
                    </td>
                  </tr>
                )}
                {!trackersLoading && trackers.map((t) => {
                  const message = t.message || t.lastMessage || '(no message)';
                  const occurrences = t.occurrences ?? t.count ?? t.totalOccurrences ?? '—';
                  const lastSeen = t.lastSeenAt || t.lastSeen || t.updatedAt;
                  return (
                    <tr key={t.fingerprint}>
                      <td className="lemu-mono lemu-fp" title={t.fingerprint}>{t.fingerprint}</td>
                      <td>
                        <span className="lemu-msg" title={message}>{message}</span>
                        {t.errorName && <span className="lemu-msg__user">{t.errorName}</span>}
                      </td>
                      <td className="lemu-right">
                        <span className="lemu-badge lemu-badge--sev-warn">{occurrences}</span>
                      </td>
                      <td className="lemu-muted lemu-nowrap" title={formatTime(lastSeen)}>
                        {relativeTime(lastSeen)}
                      </td>
                      <td className="lemu-right">
                        {resolvedFilter !== 'true' && (
                          <button
                            type="button"
                            className="lemu-btn lemu-btn--outline"
                            disabled={resolvingFp === t.fingerprint}
                            onClick={() => handleResolve(t)}
                          >
                            {resolvingFp === t.fingerprint ? (
                              <><span className="lemu-btn-spinner" /> Resolving…</>
                            ) : (
                              <><CheckCircle2 size={14} /> Resolve</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LemuLogsPage;
