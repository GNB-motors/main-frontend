import { ChevronRight } from 'lucide-react';
import { getStatusColor, formatJourneyDate } from './tripManagementUtils';

/**
 * Cell components for the trip-management table.
 *
 * Kept separate from tripManagementColumns.jsx because that module exports a
 * plain function; react-refresh requires a file to export components OR
 * non-components, never both (rule 15).
 */

export const StatusBadge = ({ status }) => (
  <span
    className="status-badge"
    style={{ backgroundColor: getStatusColor(status) + '22', color: getStatusColor(status) }}
  >
    {status}
  </span>
);

export const DateCell = ({ trip }) => (
  <div className="last-col">
    <span className="date-text">{formatJourneyDate(trip.createdAt)}</span>
    <button type="button" className="view-details-btn" tabIndex={-1}>
      View details
      <ChevronRight size={14} />
    </button>
  </div>
);
