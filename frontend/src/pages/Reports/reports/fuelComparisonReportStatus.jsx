import { Clock, Activity, CheckCircle2, XCircle, Flag, RefreshCw, Loader2 } from 'lucide-react';
import { formatRelativeIST, formatIST } from './fuelComparisonReportUtils';

export const StatusKpiCard = (props) => {
  const Icon = props.icon;
  const { label, value, iconColor, bgColor, accent } = props;
  return (
    <div
      className="trip-ledger-kpi-card fuel-kpi-card"
      style={accent ? { outline: `2px solid ${accent}` } : {}}
    >
      <div
        className="trip-ledger-kpi-icon"
        style={{ background: bgColor || 'rgba(47,88,238,0.10)' }}
      >
        <Icon size={18} color={iconColor || '#2F58EE'} />
      </div>
      <div className="trip-ledger-kpi-content">
        <span className="trip-ledger-kpi-label">{label}</span>
        <span className="trip-ledger-kpi-value">{value ?? '—'}</span>
      </div>
    </div>
  );
};

export const SyncStatusBar = ({ status, isLoading, error, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="fuel-status-bar">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontSize: 13, color: '#5d5d5e' }}>Loading sync status…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fuel-status-bar">
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1 text-[13px] text-amber-700"
        >
          {error}
        </div>
      </div>
    );
  }

  if (!status) return null;

  const lastSync = status.lastSyncAt ? formatRelativeIST(status.lastSyncAt) : null;
  const lastSyncFull = status.lastSyncAt ? formatIST(status.lastSyncAt) : null;

  return (
    <div className="fuel-status-bar">
      <div className="fuel-status-kpis">
        <StatusKpiCard
          icon={Clock}
          label="Pending"
          value={status.pending ?? 0}
          iconColor="#F39C12"
          bgColor="rgba(243,156,18,0.10)"
        />
        <StatusKpiCard
          icon={Activity}
          label="In Progress"
          value={status.inProgress ?? 0}
          iconColor="#2F58EE"
          bgColor="rgba(47,88,238,0.10)"
        />
        <StatusKpiCard
          icon={CheckCircle2}
          label="Completed"
          value={status.completed ?? 0}
          iconColor="#2ECC71"
          bgColor="rgba(46,204,113,0.10)"
        />
        <StatusKpiCard
          icon={XCircle}
          label="Failed"
          value={status.failed ?? 0}
          iconColor="#E74C3C"
          bgColor="rgba(231,76,60,0.10)"
        />
        <StatusKpiCard
          icon={Flag}
          label="Flagged"
          value={status.flagged ?? 0}
          iconColor="#E67E22"
          bgColor="rgba(230,126,34,0.10)"
          accent={status.flagged > 0 ? '#E67E22' : undefined}
        />
      </div>

      <div className="fuel-status-meta">
        <div className="fuel-sync-state">
          {status.isUpToDate ? (
            <span className="fuel-sync-badge fuel-sync-ok">
              <CheckCircle2 size={13} /> All caught up
            </span>
          ) : (
            <span className="fuel-sync-badge fuel-sync-pending">
              <Clock size={13} /> {status.pending ?? 0} pending
            </span>
          )}
        </div>
        {lastSync && (
          <span className="fuel-last-sync" title={lastSyncFull}>
            Last sync: {lastSync}
          </span>
        )}
        <button
          type="button"
          className="fuel-refresh-btn"
          onClick={onRefresh}
          title="Refresh status"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
};
