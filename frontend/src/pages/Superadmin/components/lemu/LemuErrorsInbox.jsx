import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatTime, relativeTime } from './utils';

/* Errors inbox — unresolved error trackers with one-click resolve. */
const LemuErrorsInbox = ({
  trackers,
  summary,
  loading,
  error,
  resolvedFilter,
  onResolvedFilterChange,
  resolvingFp,
  onResolve,
}) => (
  <section className="lemu-section">
    <div className="lemu-section__head">
      <h2 className="lemu-section__title">
        <AlertTriangle size={16} /> Errors Inbox
      </h2>
      <div className="lemu-toolbar__actions">
        {summary && (
          <span className="lemu-meta">
            <strong>{summary.totalUnresolved ?? 0}</strong> unresolved ·{' '}
            <strong>{summary.totalResolved ?? 0}</strong> resolved
          </span>
        )}
        <select
          className="lemu-select"
          value={resolvedFilter}
          onChange={onResolvedFilterChange}
          aria-label="Filter by resolution state"
        >
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
          <option value="">All</option>
        </select>
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
              <th>Fingerprint</th>
              <th>Message</th>
              <th className="lemu-right">Occurrences</th>
              <th>Last Seen</th>
              <th aria-label="Resolve" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
            )}
            {!loading && trackers.length === 0 && (
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
            {!loading && trackers.map((t) => {
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
                        onClick={() => onResolve(t)}
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
);

export default LemuErrorsInbox;
