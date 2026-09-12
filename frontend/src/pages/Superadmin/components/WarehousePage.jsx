import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  HelpCircle,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { WarehouseService } from './WarehouseService';
import { getUserRole } from '../../../utils/session';
import './WarehousePage.css';

const CHECK_ICONS = {
  liveness: Activity,
  completeness: Server,
  correctness: CheckCircle2,
};

const CHECK_LABELS = {
  liveness: 'Liveness',
  completeness: 'Completeness',
  correctness: 'Correctness',
};

/* Reconciliation runs hourly. A passing check whose persisted row is older
   than this is reported as Stale — the value describes an old window, not now. */
const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

function relativeTime(iso) {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/* The persisted timestamp of a check row. Liveness carries checkedAt;
   completeness/correctness carry windowTo (end of the window they verified). */
function checkTimestamp(check) {
  if (!check) return null;
  return check.checkedAt || check.windowTo || null;
}

/* A bare { error } object means the status READ against ClickHouse failed —
   no row could be fetched at all. That is "unknown", not a failed check:
   the check may have passed; we simply cannot see its result. */
function isReadError(check) {
  return !!check?.error && check.ok === undefined && !check.tableName;
}

/* One small vocabulary used by every badge on the page:
   ok      — check ran recently and passed
   stale   — check passed, but the persisted result is old (data, not render)
   failed  — check ran and failed (error row) or found a real mismatch (ok=0)
   unknown — never run (no row) or status unreadable (read error) */
function statusOf(check) {
  if (!check) return 'unknown';
  if (isReadError(check)) return 'unknown';
  if (check.error) return 'failed';
  if (check.ok === 1 || check.ok === true) {
    const ts = checkTimestamp(check);
    if (ts && Date.now() - new Date(ts).getTime() > STALE_AFTER_MS) return 'stale';
    return 'ok';
  }
  return 'failed';
}

const STATUS_META = {
  ok: { label: 'OK', Icon: CheckCircle2 },
  stale: { label: 'Stale', Icon: Clock },
  failed: { label: 'Failed', Icon: XCircle },
  unknown: { label: 'Unknown', Icon: HelpCircle },
};

function StatusBadge({ status, label }) {
  const meta = STATUS_META[status] || STATUS_META.unknown;
  return (
    <span className={`wh-status-badge wh-status-${status}`}>
      <meta.Icon size={12} />
      {label || meta.label}
    </span>
  );
}

function CheckRow({ kind, data }) {
  const Icon = CHECK_ICONS[kind];
  const status = statusOf(data);
  const ts = checkTimestamp(data);
  return (
    <div className={`wh-check-row wh-check-${status}`}>
      <div className="wh-check-icon">
        <Icon size={16} />
      </div>
      <div className="wh-check-body">
        <div className="wh-check-header">
          <span className="wh-check-name">{CHECK_LABELS[kind]}</span>
          <StatusBadge status={status} label={status === 'unknown' && !data ? 'Never run' : undefined} />
        </div>
        <div className="wh-check-meta">
          {!data && (
            <span>Never run — no result persisted for this check.</span>
          )}
          {data && isReadError(data) && (
            <span className="wh-check-error">Status unreadable — {data.error}</span>
          )}
          {data && !isReadError(data) && data.error && (
            <span className="wh-check-error">
              Check failed{ts ? ` ${relativeTime(ts)}` : ''} — {data.error}
            </span>
          )}
          {data && !isReadError(data) && !data.error && (
            <>
              {kind === 'liveness' && data?.lagSeconds != null && (
                <span>Lag {data.lagSeconds}s</span>
              )}
              {kind === 'completeness' && (
                <>
                  <span>Mongo {data?.mongoCount ?? '—'}</span>
                  <span>ClickHouse {data?.chCount ?? '—'}</span>
                  {data?.gap != null && <span>Gap {data.gap}</span>}
                </>
              )}
              {kind === 'correctness' && (
                <>
                  <span>Missing in CH {data?.missingInCh ?? '—'}</span>
                  <span>Missing in Mongo {data?.missingInMongo ?? '—'}</span>
                </>
              )}
              {ts && (
                <span title={new Date(ts).toLocaleString('en-IN')}>
                  <Clock size={11} /> {status === 'stale' ? 'data' : 'checked'} {relativeTime(ts)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TableCard({ tableName, checks }) {
  const overall = useMemo(() => {
    if (!checks) return 'unknown';
    const statuses = [
      statusOf(checks.liveness),
      statusOf(checks.completeness),
      statusOf(checks.correctness),
    ];
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('stale')) return 'stale';
    if (statuses.every((s) => s === 'unknown')) return 'unknown';
    if (statuses.includes('unknown')) return 'stale'; // partial data — not verifiably healthy
    return 'ok';
  }, [checks]);

  const overallLabel = {
    ok: 'Healthy',
    stale: 'Degraded',
    failed: 'Failed',
    unknown: 'Unknown',
  }[overall];

  return (
    <div className="wh-table-card">
      <div className="wh-table-header">
        <div className="wh-table-title">
          <Database size={16} />
          <span>{tableName}</span>
        </div>
        <StatusBadge status={overall} label={overallLabel} />
      </div>
      <div className="wh-table-body">
        <CheckRow kind="liveness" data={checks?.liveness} />
        <CheckRow kind="completeness" data={checks?.completeness} />
        <CheckRow kind="correctness" data={checks?.correctness} />
      </div>
    </div>
  );
}

const WarehousePage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') {
      navigate('/overview');
    }
  }, [navigate]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const json = await WarehouseService.getStatus();
      setStatus(json.data || json);
    } catch (err) {
      console.error('[Warehouse] status fetch failed:', err);
      setError(err.detail || err.message || 'Failed to load warehouse status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const tableNames = useMemo(() => {
    if (!status?.tables) return [];
    return Object.keys(status.tables).sort();
  }, [status]);

  /* Timestamp the DATA, not the render: the newest persisted check row. */
  const dataAsOf = useMemo(() => {
    if (!status?.tables) return null;
    let newest = null;
    Object.values(status.tables).forEach((checks) => {
      ['liveness', 'completeness', 'correctness'].forEach((kind) => {
        const ts = checkTimestamp(checks?.[kind]);
        if (ts && (!newest || new Date(ts) > new Date(newest))) newest = ts;
      });
    });
    return newest;
  }, [status]);

  const overallHealth = useMemo(() => {
    if (!status?.enabled) return status?.enabled === false ? 'disabled' : 'loading';
    if (!tableNames.length) return 'empty';
    const statuses = [];
    tableNames.forEach((t) => {
      const checks = status.tables[t];
      statuses.push(statusOf(checks?.liveness), statusOf(checks?.completeness), statusOf(checks?.correctness));
    });
    if (statuses.includes('failed')) return 'failed';
    if (statuses.includes('stale')) return 'stale';
    if (statuses.every((s) => s === 'unknown')) return 'unknown';
    if (statuses.includes('unknown')) return 'stale';
    return 'ok';
  }, [status, tableNames]);

  return (
    <div className="wh-page">
      <PageHeader
        title="Data Warehouse"
        description="ClickHouse analytics mirror — CDC lag, completeness and correctness reconciliation per mirrored table."
      />

      <div className="wh-toolbar">
        <div className="wh-meta">
          {status?.enabled && (
            dataAsOf ? (
              <>
                Data as of <strong>{relativeTime(dataAsOf)}</strong>
                {Date.now() - new Date(dataAsOf).getTime() > STALE_AFTER_MS && (
                  <span className="wh-meta-note"> — stale: reconciliation has not persisted a newer result</span>
                )}
              </>
            ) : (
              'No reconciliation results persisted yet'
            )
          )}
          {!status && loading && 'Checking warehouse status…'}
          {status?.enabled === false && (
            <span className="wh-meta-note">Warehouse disabled or not configured for ClickHouse</span>
          )}
        </div>
        <button className="wh-refresh-btn" onClick={fetchStatus} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'wh-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="wh-banner wh-banner-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button className="wh-refresh-btn" onClick={fetchStatus} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'wh-spin' : ''} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {!error && !loading && status?.enabled && (
        <div className="wh-legend" aria-label="Status legend">
          <span className="wh-legend__item"><StatusBadge status="ok" /> passed recently</span>
          <span className="wh-legend__item"><StatusBadge status="stale" /> passed, data older than 3h</span>
          <span className="wh-legend__item"><StatusBadge status="failed" /> check failed or found a mismatch</span>
          <span className="wh-legend__item"><StatusBadge status="unknown" /> never run / unreadable</span>
        </div>
      )}

      {!error && !loading && status && (
        <div className={`wh-health-card wh-health-${overallHealth}`}>
          <div className="wh-health-icon">
            {overallHealth === 'ok' && <CheckCircle2 size={24} />}
            {overallHealth === 'stale' && <Clock size={24} />}
            {overallHealth === 'failed' && <XCircle size={24} />}
            {(overallHealth === 'unknown' || overallHealth === 'disabled' || overallHealth === 'empty') && <AlertTriangle size={24} />}
          </div>
          <div className="wh-health-body">
            <h3>
              {overallHealth === 'ok' && 'Warehouse healthy'}
              {overallHealth === 'stale' && 'Warehouse degraded'}
              {overallHealth === 'failed' && 'Warehouse errors'}
              {overallHealth === 'unknown' && 'Warehouse status unknown'}
              {overallHealth === 'disabled' && 'Warehouse disabled'}
              {overallHealth === 'empty' && 'No tables configured'}
            </h3>
            <p>
              {status.enabled
                ? `${tableNames.length} table${tableNames.length !== 1 ? 's' : ''} monitored`
                : status.reason || 'ClickHouse analytics store is not enabled for this deployment.'}
            </p>
          </div>
        </div>
      )}

      {loading && !status && (
        <div className="wh-empty">
          <Activity size={28} className="wh-spin" />
          <p>Loading warehouse status…</p>
        </div>
      )}

      {status?.enabled && (
        <div className="wh-tables-grid">
          {tableNames.map((tableName) => (
            <TableCard key={tableName} tableName={tableName} checks={status.tables[tableName]} />
          ))}
        </div>
      )}
    </div>
  );
};

export default WarehousePage;
