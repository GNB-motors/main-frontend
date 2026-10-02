import { ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

/**
 * Cell components for the Mileage Tracking fleet-overview table. Kept
 * separate from mileageTrackingColumns.jsx because that module exports a
 * plain function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const HealthStatusBadge = ({ status }) => {
  switch (status) {
    case 'GOOD':
      return (
        <span className="mt-status-badge mt-status-badge--success">
          <CheckCircle2 size={12} /> Good
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span className="mt-status-badge mt-status-badge--warning">
          <Clock size={12} /> Stale Data
        </span>
      );
    case 'NO_DATA':
      return (
        <span className="mt-status-badge mt-status-badge--danger">
          <AlertCircle size={12} /> No Data
        </span>
      );
    default:
      return <span className="mt-status-badge mt-status-badge--neutral">—</span>;
  }
};

export const AvgMileageCell = ({ value }) => {
  if (value == null || value === 0) {
    return <span className="text-slate-400 font-mono">—</span>;
  }
  return (
    <div className="mt-mileage-pill">
      <span className="mt-mono">{value.toFixed(2)}</span>
      <span className="mt-unit">km/L</span>
    </div>
  );
};

export const ViewLogsButton = ({ onClick }) => (
  <button
    type="button"
    className="mt-action-btn"
    onClick={onClick}
    title="Inspect vehicle intervals"
  >
    <span>Logs</span>
    <ChevronRight size={13} />
  </button>
);
