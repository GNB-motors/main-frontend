import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Clock, Inbox, RefreshCw } from 'lucide-react';
import { LemuService } from '../LemuService';
import { relativeTime, formatTime } from './utils';
import {
  KPI_WINDOWS,
  KPI_SORTS,
  formatPct,
  formatSpan,
  formatCadence,
  successSeverity,
  adherenceSeverity,
  busySeverity,
  sortKpis,
  summarizeTotals,
} from './jobKpis';

const Badge = ({ sev, children }) =>
  sev ? (
    <span className={`lemu-badge lemu-badge--sev-${sev}`}>{children}</span>
  ) : (
    <span>{children}</span>
  );

/*
 * Job KPIs — how each background job has behaved over a window, from the
 * jobruns history (GET /api/lemu/jobs/kpis). Complements Job Health, which
 * shows only the latest heartbeat.
 */
const LemuJobKpisPanel = () => {
  const [hours, setHours] = useState(168);
  const [sort, setSort] = useState('busy');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LemuService.getJobKpis(hours);
      setData(res.data || null);
    } catch (err) {
      setError(err?.message || err?.detail || 'Could not load job KPIs.');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    load();
  }, [load]);

  const jobs = useMemo(() => sortKpis(data?.jobs || [], sort), [data, sort]);
  const totals = summarizeTotals(data?.totals);

  const cards = [
    { label: 'Jobs that ran', value: totals?.jobs, icon: <Activity size={18} />, tone: 'brand' },
    { label: 'Runs', value: totals?.runs, icon: <BarChart3 size={18} />, tone: 'neutral' },
    {
      label: 'Success rate',
      value: formatPct(totals?.successRate),
      icon: <Activity size={18} />,
      tone: 'brand',
    },
    {
      label: totals?.killed ? `Failed / killed (${totals.killed} killed)` : 'Failed / killed',
      value: totals?.failures,
      icon: <AlertTriangle size={18} />,
      tone: totals?.failures ? 'danger' : 'neutral',
    },
    {
      label: 'Worker busy',
      value: formatPct(totals?.busyShare),
      icon: <Clock size={18} />,
      tone: 'warn',
    },
  ];

  return (
    <section className="lemu-section">
      <div className="lemu-section__head">
        <h2 className="lemu-section__title">
          <BarChart3 size={16} /> Job KPIs
        </h2>
        <span className="lemu-meta">
          <select
            className="lemu-select lemu-select--small"
            aria-label="Window"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {KPI_WINDOWS.map((w) => (
              <option key={w.hours} value={w.hours}>
                {w.label}
              </option>
            ))}
          </select>{' '}
          <select
            className="lemu-select lemu-select--small"
            aria-label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {Object.entries(KPI_SORTS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>{' '}
          <button
            type="button"
            className="lemu-btn lemu-btn--outline"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </span>
      </div>

      {error && (
        <div className="lemu-alert lemu-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="lemu-stats">
        {cards.map((c) => (
          <div className="lemu-stat" key={c.label}>
            <span className={`lemu-stat__icon lemu-stat__icon--${c.tone}`}>{c.icon}</span>
            <div className="lemu-stat__body">
              <span className="lemu-stat__value">{loading ? '…' : (c.value ?? '—')}</span>
              <span className="lemu-stat__label">{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="lemu-card">
        <div className="lemu-table-wrap">
          <table className="lemu-table">
            <thead>
              <tr>
                <th>Job</th>
                <th className="lemu-right">Runs</th>
                <th className="lemu-right">Success</th>
                <th className="lemu-right">Failed / killed</th>
                <th className="lemu-right">p50</th>
                <th className="lemu-right">p95</th>
                <th className="lemu-right">Max</th>
                <th className="lemu-right">Busy</th>
                <th className="lemu-right">On schedule</th>
                <th className="lemu-right">Empty runs</th>
                <th>Last run</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11}>
                    <div className="lemu-state">
                      <div className="lemu-spinner" />
                    </div>
                  </td>
                </tr>
              )}
              {!loading && jobs.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="lemu-state">
                      <div className="lemu-state__icon">
                        <Inbox size={22} />
                      </div>
                      <div className="lemu-state__title">No job runs in this window</div>
                      <div>Run history starts recording once the worker build is deployed.</div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                jobs.map((j) => (
                  <tr
                    key={j.job}
                    className={
                      j.lastStatus === 'failed' || j.lastStatus === 'killed'
                        ? 'lemu-row--alert'
                        : ''
                    }
                  >
                    <td>
                      <div className="lemu-job__name">{j.job}</div>
                      <div className="lemu-muted">{formatCadence(j.intervalMs)}</div>
                    </td>
                    <td className="lemu-right lemu-mono">
                      {j.runs}
                      {j.running ? (
                        <span className="lemu-muted"> ({j.running} running)</span>
                      ) : null}
                    </td>
                    <td className="lemu-right">
                      <Badge sev={successSeverity(j.successRate)}>{formatPct(j.successRate)}</Badge>
                    </td>
                    <td className="lemu-right lemu-mono">
                      {j.failed || j.killed ? (
                        <Badge sev="error">
                          {j.failed} / {j.killed}
                        </Badge>
                      ) : (
                        <span className="lemu-muted">0</span>
                      )}
                    </td>
                    <td className="lemu-right lemu-mono">{formatSpan(j.p50Ms)}</td>
                    <td className="lemu-right lemu-mono">{formatSpan(j.p95Ms)}</td>
                    <td className="lemu-right lemu-mono">{formatSpan(j.maxMs)}</td>
                    <td className="lemu-right">
                      <Badge sev={busySeverity(j.busyShare)}>{formatPct(j.busyShare)}</Badge>
                    </td>
                    <td
                      className="lemu-right"
                      title={
                        j.expectedRuns
                          ? `${j.runs} of ${j.expectedRuns} expected runs`
                          : 'No fixed schedule'
                      }
                    >
                      <Badge sev={adherenceSeverity(j.scheduleAdherence)}>
                        {formatPct(j.scheduleAdherence)}
                      </Badge>
                    </td>
                    <td className="lemu-right lemu-mono">
                      {j.zeroOutputRuns || <span className="lemu-muted">0</span>}
                    </td>
                    <td className="lemu-muted" title={formatTime(j.lastStartedAt)}>
                      {relativeTime(j.lastStartedAt)}
                      {j.lastStatus ? ` · ${j.lastStatus}` : ''}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default LemuJobKpisPanel;
