import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Server,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import { WarehouseService } from './WarehouseService';
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

function statusOf(check) {
  if (!check || check.error) return 'error';
  if (check.ok === 1 || check.ok === true) return 'ok';
  return 'fail';
}

function StatusBadge({ status, label }) {
  if (status === 'ok') {
    return (
      <span className="wh-status-badge wh-status-ok">
        <CheckCircle2 size={12} />
        {label || 'OK'}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="wh-status-badge wh-status-error">
        <AlertTriangle size={12} />
        {label || 'Error'}
      </span>
    );
  }
  return (
    <span className="wh-status-badge wh-status-fail">
      <XCircle size={12} />
      {label || 'Fail'}
    </span>
  );
}

function CheckRow({ kind, data }) {
  const Icon = CHECK_ICONS[kind];
  const status = statusOf(data);
  return (
    <div className={`wh-check-row wh-check-${status}`}>
      <div className="wh-check-icon">
        <Icon size={16} />
      </div>
      <div className="wh-check-body">
        <div className="wh-check-header">
          <span className="wh-check-name">{CHECK_LABELS[kind]}</span>
          <StatusBadge status={status} />
        </div>
        <div className="wh-check-meta">
          {data?.error ? (
            <span className="wh-check-error">{data.error}</span>
          ) : (
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
              {data?.checkedAt && (
                <span title={new Date(data.checkedAt).toLocaleString('en-IN')}>
                  <Clock size={11} /> {relativeTime(data.checkedAt)}
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
    if (!checks) return 'error';
    const statuses = [
      statusOf(checks.liveness),
      statusOf(checks.completeness),
      statusOf(checks.correctness),
    ];
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('fail')) return 'fail';
    return 'ok';
  }, [checks]);

  return (
    <div className="wh-table-card">
      <div className="wh-table-header">
        <div className="wh-table-title">
          <Database size={16} />
          <span>{tableName}</span>
        </div>
        <StatusBadge status={overall} label={overall === 'ok' ? 'Healthy' : overall === 'fail' ? 'Degraded' : 'Error'} />
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
    if (localStorage.getItem('user_role') !== 'SUPER_ADMIN') {
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

  const overallHealth = useMemo(() => {
    if (!status?.enabled) return status?.enabled === false ? 'disabled' : 'loading';
    if (!tableNames.length) return 'empty';
    let hasError = false;
    let hasFail = false;
    tableNames.forEach((t) => {
      const checks = status.tables[t];
      if ([statusOf(checks?.liveness), statusOf(checks?.completeness), statusOf(checks?.correctness)].includes('error')) {
        hasError = true;
      }
      if ([statusOf(checks?.liveness), statusOf(checks?.completeness), statusOf(checks?.correctness)].includes('fail')) {
        hasFail = true;
      }
    });
    if (hasError) return 'error';
    if (hasFail) return 'fail';
    return 'ok';
  }, [status, tableNames]);

  return (
    <div className="wh-page">
      <PageHeader title="Data Warehouse" subtitle="ClickHouse pipeline health and reconciliation status" />

      <div className="wh-toolbar">
        <div className="wh-meta">
          {status?.checkedAt ? (
            <>
              Last checked <strong>{relativeTime(status.checkedAt)}</strong>
              {status?.enabled === false && <span className="wh-meta-note"> — warehouse disabled or not configured for ClickHouse</span>}
            </>
          ) : (
            'Checking warehouse status…'
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
        </div>
      )}

      {!error && !loading && status && (
        <div className={`wh-health-card wh-health-${overallHealth}`}>
          <div className="wh-health-icon">
            {overallHealth === 'ok' && <CheckCircle2 size={24} />}
            {overallHealth === 'fail' && <XCircle size={24} />}
            {(overallHealth === 'error' || overallHealth === 'disabled' || overallHealth === 'empty') && <AlertTriangle size={24} />}
          </div>
          <div className="wh-health-body">
            <h3>
              {overallHealth === 'ok' && 'Warehouse healthy'}
              {overallHealth === 'fail' && 'Warehouse degraded'}
              {overallHealth === 'error' && 'Warehouse errors'}
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
