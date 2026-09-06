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
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#187A32',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Good
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#C56200',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <Clock size={14} style={{ marginRight: 4 }} /> Stale Data
        </span>
      );
    case 'NO_DATA':
      return (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={14} style={{ marginRight: 4 }} /> No Data
        </span>
      );
    default:
      return '-';
  }
};

export const AvgMileageCell = ({ value }) =>
  value ? <span style={{ color: '#2563eb', fontWeight: 600 }}>{value.toFixed(2)}</span> : '-';

export const ViewLogsButton = ({ onClick }) => (
  <button className="view-details-btn" onClick={onClick}>
    View logs <ChevronRight size={14} />
  </button>
);
