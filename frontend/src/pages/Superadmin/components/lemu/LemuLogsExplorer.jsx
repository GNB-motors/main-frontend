import React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Inbox,
  ScrollText,
  Search,
} from 'lucide-react';
import { formatTime, relativeTime } from './utils';

const SEVERITIES = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
const SOURCES = ['EXTENSION', 'BACKEND', 'FRONTEND', 'CRON', 'DRIVERAPP'];

const SeverityBadge = ({ severity }) => (
  <span className={`lemu-badge lemu-badge--sev-${(severity || '').toLowerCase() || 'debug'}`}>
    {severity || '—'}
  </span>
);

/* Logs explorer — filterable, paginated event feed. All state is owned
   by LemuLogsPage so tab switches don't reset filters or the page. */
const LemuLogsExplorer = ({
  events,
  pagination,
  loading,
  error,
  severity,
  source,
  service,
  search,
  page,
  expandedIds,
  onSeverityChange,
  onSourceChange,
  onServiceChange,
  onSearchChange,
  onToggleExpanded,
  onPrevPage,
  onNextPage,
}) => (
  <section className="lemu-section">
    <div className="lemu-section__head">
      <h2 className="lemu-section__title">
        <ScrollText size={16} /> Logs Explorer
      </h2>
      <span className="lemu-meta">
        {loading ? 'Loading…' : <><strong>{pagination.total}</strong> event{pagination.total === 1 ? '' : 's'}</>}
      </span>
    </div>

    <div className="lemu-filters">
      <select
        className="lemu-select"
        value={severity}
        onChange={onSeverityChange}
        aria-label="Filter by severity"
      >
        <option value="">All severities</option>
        {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        className="lemu-select"
        value={source}
        onChange={onSourceChange}
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
        onChange={onServiceChange}
      />
      <div className="lemu-search">
        <span className="lemu-search__icon"><Search size={16} /></span>
        <input
          type="text"
          placeholder="Search messages…"
          value={search}
          onChange={onSearchChange}
        />
      </div>
    </div>

    {error && (
      <div className="lemu-alert lemu-alert--error" role="alert">{error}</div>
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
            {loading && (
              <tr><td colSpan={6}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
            )}
            {!loading && events.length === 0 && (
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
            {!loading && events.map((ev) => {
              const id = ev.eventId || `${ev.timestamp}-${ev.message}`;
              const expanded = expandedIds.has(id);
              return (
                <React.Fragment key={id}>
                  <tr className="lemu-clickable" onClick={() => onToggleExpanded(id)}>
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
            disabled={loading || page <= 1}
            onClick={onPrevPage}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <button
            type="button"
            className="lemu-btn lemu-btn--secondary"
            disabled={loading || page >= (pagination.pages || 1)}
            onClick={onNextPage}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  </section>
);

export default LemuLogsExplorer;
