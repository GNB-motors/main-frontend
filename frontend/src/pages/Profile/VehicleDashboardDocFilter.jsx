import { FileText } from 'lucide-react';
import { DOC_COLS } from './vehicleDashboardLogic';

/** The document-compliance dropdown above the dashboard table, with its clear button. */
export default function VehicleDashboardDocFilter({
  docFilter,
  setDocFilter,
  rows,
  displayRows,
  filterOptionsWithCounts,
}) {
  return (
    <div className="v-dash-filter-dropdown-bar" aria-label="Document compliance filters">
      <div className="v-dash-dropdown-wrapper">
        <label htmlFor="v-dash-doc-filter" className="v-dash-filter-label">
          <FileText size={15} color="#2563eb" />
          <span>Document Filter:</span>
        </label>
        <select
          id="v-dash-doc-filter"
          className="v-dash-filter-select"
          value={docFilter}
          onChange={(e) => setDocFilter(e.target.value)}
        >
          <option value="ALL">All Documents (No Filter) — ({rows.length} vehicles)</option>
          <optgroup label="⚡ Quick Status Filters">
            <option value="EXPIRING_SOON">
              ⚠️ Expiring Soon (&lt; 30 Days) — ({filterOptionsWithCounts.anyExpiringSoonCount})
            </option>
            <option value="EXPIRED_ANY">
              🔴 Any Expired Document — ({filterOptionsWithCounts.anyExpiredCount})
            </option>
            <option value="MISSING_ANY">
              ⚪ Missing Documents — ({filterOptionsWithCounts.anyMissingCount})
            </option>
          </optgroup>
          <optgroup label="⚠️ Expiring Soon by Document (< 30 Days)">
            {DOC_COLS.map(({ key, label }) => (
              <option key={`soon-${key}`} value={`SOON_${key}`}>
                Expiring Soon: {label} — ({filterOptionsWithCounts.soonByDoc[key] || 0})
              </option>
            ))}
          </optgroup>
          <optgroup label="🔴 Expired by Document">
            {DOC_COLS.map(({ key, label }) => (
              <option key={`exp-${key}`} value={`EXPIRED_${key}`}>
                Expired: {label} — ({filterOptionsWithCounts.expiredByDoc[key] || 0})
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {docFilter !== 'ALL' && (
        <button
          type="button"
          className="v-dash-filter-reset-btn"
          onClick={() => setDocFilter('ALL')}
        >
          Showing {displayRows.length} of {rows.length} &middot; Clear Filter &times;
        </button>
      )}
    </div>
  );
}
