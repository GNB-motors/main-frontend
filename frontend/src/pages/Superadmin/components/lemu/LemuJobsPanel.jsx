import React from 'react';
import { Clock, Inbox, Server } from 'lucide-react';
import LemuStatusChip from './LemuStatusChip';
import { formatDuration, formatTime, jobStatusToTrio, relativeTime } from './utils';

/* Job health panel — cron registry + heartbeat status table. */
const LemuJobsPanel = ({ jobs, loading, error }) => (
  <section className="lemu-section">
    <div className="lemu-section__head">
      <h2 className="lemu-section__title">
        <Server size={16} /> Job Health
      </h2>
      <span className="lemu-meta">
        {loading ? 'Loading…' : <><strong>{jobs.length}</strong> monitored job{jobs.length === 1 ? '' : 's'}</>}
      </span>
    </div>
    {error && (
      <div className="lemu-alert lemu-alert--error" role="alert">{error}</div>
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
            {loading && (
              <tr><td colSpan={6}><div className="lemu-state"><div className="lemu-spinner" /></div></td></tr>
            )}
            {!loading && jobs.length === 0 && (
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
            {!loading && jobs.map((job) => (
              <tr key={job.job} className={job.status === 'stalled' || job.status === 'late' ? 'lemu-row--alert' : ''}>
                <td>
                  <div className="lemu-job__name">{job.job}</div>
                  {job.lastError && (
                    <div className="lemu-job__error" title={job.lastError}>{job.lastError}</div>
                  )}
                </td>
                <td><span className="lemu-job-status"><LemuStatusChip state={jobStatusToTrio(job.status)} label={job.status || 'unknown'} /></span></td>
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
);

export default LemuJobsPanel;
