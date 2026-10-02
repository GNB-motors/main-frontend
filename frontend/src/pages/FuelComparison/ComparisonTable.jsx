import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Gauge,
  Clock,
  Inbox,
  User,
  PencilLine,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDateRange, fmtLitres, fmtDuration } from './formatIST';

const ComparisonTable = ({
  activeTab,
  records = [],
  total = 0,
  totalPages = 1,
  page = 1,
  limit = 20,
  isLoading = false,
  activeFilters = 0,
  onPageChange,
  onSelectRow,
  onReview,
  onResetFilters,
}) => {
  return (
    <div className="fc-card">
      <div className="fc-table-wrap">
        <table className="fc-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Vehicle & Driver</th>
              <th style={{ width: '20%' }}>Interval Window</th>
              <th className="fc-center" style={{ width: '12%' }}>
                Billed
              </th>
              <th className="fc-center" style={{ width: '12%' }}>
                CAN-bus
              </th>
              <th className="fc-center" style={{ width: '15%' }}>
                Variance (Δ)
              </th>
              <th className="fc-center" style={{ width: '10%' }}>
                Status
              </th>
              <th className="fc-center" style={{ width: '9%' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7}>
                  <div className="fc-state">
                    <div className="fc-spinner" />
                    <div className="fc-state__title" style={{ marginTop: 14 }}>
                      Calculating & Auditing Fuel Intervals…
                    </div>
                    <div className="fc-state__sub">
                      Reconciling billed fuel slips against CAN-bus telematics consumption.
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && records.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="fc-state">
                    <div className="fc-state__icon">
                      <Inbox size={26} />
                    </div>
                    <div className="fc-state__title">No comparison intervals found</div>
                    <div className="fc-state__sub">
                      {activeFilters > 0
                        ? 'No intervals match your active search or filter criteria.'
                        : activeTab === 'flagged'
                          ? 'Zero fuel discrepancies detected! All audited intervals match telematics within tolerance.'
                          : activeTab === 'review'
                            ? 'All caught up! No tasks currently pending manager reconciliation.'
                            : 'No fuel comparison records exist for this fleet.'}
                    </div>
                    {activeFilters > 0 && onResetFilters && (
                      <button
                        type="button"
                        className="fc-btn"
                        style={{ marginTop: 14 }}
                        onClick={onResetFilters}
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              records.map((rec) => {
                const reg = rec.vehicleId?.registrationNumber || rec.vehicleNumber || '—';
                const driver = rec.driverId
                  ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim()
                  : null;

                const billedL = rec.billFuelConsumed ?? 0;
                const telematicsL = rec.fleetEdgeFuelConsumed ?? 0;
                const diffL = -(rec.variance ?? 0);
                const diffPct = -(rec.variancePercent ?? 0);
                const varianceTone =
                  diffL < -0.01 ? 'is-over' : Math.abs(diffL) <= 5 ? 'is-clean' : 'is-under';

                let durationStr = '';
                if (rec.fromDate && rec.toDate) {
                  const ms = new Date(rec.toDate) - new Date(rec.fromDate);
                  if (ms > 0) durationStr = fmtDuration(ms / (1000 * 60));
                }

                const isReview = rec.status === 'PENDING_REVIEW' || rec.needsAction;

                return (
                  <tr key={rec._id} className="fc-table__row" onClick={() => onSelectRow?.(rec)}>
                    {/* Vehicle & Driver */}
                    <td>
                      <div className="fc-veh-cell">
                        <span className="fc-plate-badge fc-mono">{reg}</span>
                        <div className="fc-driver-subline" title={driver || 'Unassigned driver'}>
                          <User size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">
                            {driver || (
                              <span className="text-slate-400 font-normal">Unassigned</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Interval Window */}
                    <td>
                      <div className="fc-date-cell">
                        <span className="fc-date-range">
                          {formatDateRange(rec.fromDate, rec.toDate)}
                        </span>
                        {durationStr && (
                          <span className="fc-duration-chip">
                            <Clock size={11} /> {durationStr}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Billed Fuel */}
                    <td className="fc-center">
                      <span className="fc-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        {fmtLitres(billedL)}
                      </span>
                    </td>

                    {/* Telematics Fuel */}
                    <td className="fc-center">
                      <span className="fc-mono font-semibold text-sm text-slate-700 dark:text-slate-300">
                        {fmtLitres(telematicsL)}
                      </span>
                    </td>

                    {/* Variance */}
                    <td className="fc-center">
                      <div className={`fc-variance-chip ${varianceTone}`}>
                        <span className="fc-variance-val fc-mono">
                          {diffL > 0 ? '+' : ''}
                          {diffL.toFixed(1)} L
                        </span>
                        <span className="fc-variance-pct fc-mono">
                          ({diffPct > 0 ? '+' : ''}
                          {diffPct.toFixed(1)}%)
                        </span>
                      </div>
                    </td>

                    {/* Status & Odometer Check */}
                    <td className="fc-center">
                      <div className="fc-status-stack">
                        {rec.isFlagged ? (
                          <span
                            className="fc-badge fc-badge--danger"
                            title={rec.flagReason || 'Billed fuel exceeds CAN-bus telematics'}
                          >
                            <AlertTriangle size={12} /> Flagged
                          </span>
                        ) : isReview ? (
                          <span
                            className="fc-badge fc-badge--warning"
                            title={
                              rec.reviewReason || 'Odometer or date discrepancy requires review'
                            }
                          >
                            <Clock size={12} /> Review
                          </span>
                        ) : rec.status === 'NO_DATA' ? (
                          <span className="fc-badge fc-badge--neutral">No Data</span>
                        ) : (
                          <span className="fc-badge fc-badge--success">
                            <CheckCircle2 size={12} /> Clean
                          </span>
                        )}

                        {rec.isOdometerFlagged ? (
                          <span
                            className="fc-sub-badge fc-sub-badge--danger"
                            title={rec.odometerFlagReason || 'Odometer mismatch'}
                          >
                            <Gauge size={11} /> Odo Diff
                          </span>
                        ) : isReview ? (
                          <span
                            className="fc-sub-badge fc-sub-badge--warning"
                            title="Odometer reading needs confirmation"
                          >
                            <Gauge size={11} /> Odo Check
                          </span>
                        ) : rec.ocrOdometerReading != null ? (
                          <span
                            className="fc-sub-badge fc-sub-badge--success"
                            title="Odometer verified"
                          >
                            <CheckCircle2 size={11} /> Odo OK
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="fc-center" onClick={(e) => e.stopPropagation()}>
                      <div className="fc-row-actions">
                        {isReview ? (
                          <button
                            type="button"
                            className="fc-action-btn fc-action-btn--review"
                            onClick={() => onReview?.(rec)}
                            title="Review and correct odometer reading"
                            aria-label={`Review ${reg}`}
                          >
                            <PencilLine size={13} /> Review
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="fc-action-btn"
                            onClick={() => onSelectRow?.(rec)}
                            title="Audit telematics interval details"
                            aria-label={`Audit ${reg}`}
                          >
                            <Eye size={13} /> Audit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && records.length > 0 && (
        <div className="fc-pagination">
          <div className="fc-pagination__info">
            Showing <span className="fc-mono font-bold">{(page - 1) * limit + 1}</span>–
            <span className="fc-mono font-bold">{Math.min(page * limit, total)}</span> of{' '}
            <span className="fc-mono font-bold">{total}</span> intervals
          </div>

          <div className="fc-pagination__controls">
            <button
              type="button"
              className="fc-pagination__btn"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
              <span>Prev</span>
            </button>

            <span className="fc-pagination__page-indicator fc-mono">
              {page} / {Math.max(1, totalPages)}
            </span>

            <button
              type="button"
              className="fc-pagination__btn"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;
