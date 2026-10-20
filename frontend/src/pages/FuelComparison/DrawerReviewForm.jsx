import { AlertTriangle, Loader2, Check } from 'lucide-react';

/** Manager reconciliation form shown in the audit drawer for a task pending review. */
const DrawerReviewForm = ({
  task,
  handleApproveInline,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  odometerReading,
  setOdometerReading,
  saving,
}) => (
  <div className="fc-review-card">
    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
      <AlertTriangle size={16} /> Manager Reconciliation
    </div>
    <p className="text-xs text-amber-700 dark:text-amber-400">
      Correct interval boundaries or odometer reading to recalculate consumption:
    </p>
    <form onSubmit={handleApproveInline} className="flex flex-col gap-3">
      <div className="fc-form-group">
        <label htmlFor="drawer-from-date">From Timestamp (IST)</label>
        <input
          id="drawer-from-date"
          type="datetime-local"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="fc-input"
          aria-label="From Timestamp (IST)"
        />
      </div>
      <div className="fc-form-group">
        <label htmlFor="drawer-to-date">To Timestamp (IST)</label>
        <input
          id="drawer-to-date"
          type="datetime-local"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="fc-input"
          aria-label="To Timestamp (IST)"
        />
      </div>
      <div className="fc-form-group">
        <label htmlFor="drawer-odo">Corrected Odometer Reading (km)</label>
        <input
          id="drawer-odo"
          type="number"
          step="0.1"
          placeholder="Enter verified odometer reading..."
          value={odometerReading}
          onChange={(e) => setOdometerReading(e.target.value)}
          className="fc-input"
          aria-label="Corrected Odometer Reading (km)"
        />
        <span className="text-[11px] text-slate-500">
          CAN-bus telematics reported max odometer: {task.maxOdometer ?? '—'} km
        </span>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="fc-btn fc-btn--primary justify-center mt-1"
      >
        {saving ? (
          <>
            <Loader2 size={14} className="fc-spin" /> Approving & Recalculating…
          </>
        ) : (
          <>
            <Check size={14} /> Approve & Recalculate
          </>
        )}
      </button>
    </form>
  </div>
);

export default DrawerReviewForm;
