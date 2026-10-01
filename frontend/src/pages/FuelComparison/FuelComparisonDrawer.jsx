import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Calendar,
  User,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Loader2,
  Check,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { IST_ZONE, formatDateTimeIST, fmtLitres, fmtKm, fmtDuration } from './formatIST';

dayjs.extend(utc);
dayjs.extend(timezone);

const formatForInput = (iso) => {
  if (!iso) return '';
  try {
    const d = dayjs.utc(iso).tz(IST_ZONE);
    return d.isValid() ? d.format('YYYY-MM-DDTHH:mm') : '';
  } catch {
    return '';
  }
};

const FuelComparisonDrawer = ({
  task,
  isOpen,
  onClose,
  onApproved,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Inline review form state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setZoom(1);
      setRotation(0);
      setFromDate(formatForInput(task.fromDate));
      setToDate(formatForInput(task.toDate));
      setOdometerReading(task.ocrOdometerReading ?? '');
    }
  }, [task]);

  // Keyboard navigation & escape listener
  const isDrawerOpen = isOpen !== undefined ? isOpen : Boolean(task);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isDrawerOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev?.();
      if (e.key === 'ArrowRight' && hasNext) onNext?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!isDrawerOpen || !task) return null;

  const vehReg = task.vehicleId?.registrationNumber || task.vehicleNumber || '—';
  const driverName = task.driverId
    ? `${task.driverId.firstName || ''} ${task.driverId.lastName || ''}`.trim()
    : 'Unassigned';

  const billedL = task.billFuelConsumed ?? 0;
  const telematicsL = task.fleetEdgeFuelConsumed ?? 0;
  const diffL = -(task.variance ?? 0);
  const diffPct = -(task.variancePercent ?? 0);

  const isClean = Math.abs(diffL) <= 5;
  const varianceTone = diffL < -0.01 ? 'is-over' : isClean ? 'is-clean' : 'is-under';

  const isReview = task.status === 'PENDING_REVIEW';
  const hasPhoto = Boolean(task.odometerDoc?.publicUrl);

  const handleApproveInline = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      if (fromDate) updates.fromDate = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
      if (toDate) updates.toDate = dayjs.tz(toDate, IST_ZONE).utc().toISOString();
      if (odometerReading !== '') updates.odometerReading = parseFloat(odometerReading);

      const taskId = task._id || task.id;
      await ReportsService.approveReviewTask(taskId, updates);
      toast.success(`Task for ${vehReg} approved and queued for recalculation`);
      onApproved?.();
    } catch (err) {
      toast.error(
        err?.detail || err?.response?.data?.message || err?.message || 'Failed to approve task',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fc-drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <aside className="fc-drawer" aria-label="Fuel comparison audit details">
        {/* Header */}
        <div className="fc-drawer__header">
          <div className="fc-drawer__header-left">
            <span className="fc-plate-badge fc-mono">{vehReg}</span>
            {task.isFlagged ? (
              <span className="fc-badge fc-badge--danger">
                <AlertTriangle size={12} /> Flagged · Overbilled
              </span>
            ) : isReview ? (
              <span className="fc-badge fc-badge--warning">
                <Clock size={12} /> Needs Manager Review
              </span>
            ) : task.status === 'NO_DATA' ? (
              <span className="fc-badge fc-badge--neutral">No Telematics Data</span>
            ) : (
              <span className="fc-badge fc-badge--success">
                <CheckCircle2 size={12} /> Verified Match
              </span>
            )}
          </div>

          <div className="fc-drawer__header-right">
            <button
              type="button"
              className="fc-drawer__icon-btn"
              onClick={onPrev}
              disabled={!hasPrev}
              title="Previous comparison (Left arrow)"
              aria-label="Previous comparison"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="fc-drawer__icon-btn"
              onClick={onNext}
              disabled={!hasNext}
              title="Next comparison (Right arrow)"
              aria-label="Next comparison"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className="fc-drawer__icon-btn"
              onClick={onClose}
              title="Close drawer (Escape)"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="fc-drawer__body">
          {/* Hero Gauge Comparison */}
          <div className="fc-hero-gauge">
            <div className="fc-hero-gauge__item">
              <span className="fc-hero-gauge__label flex items-center gap-1.5">
                <Fuel size={13} className="text-blue-500" /> Billed Fuel
              </span>
              <span className="fc-hero-gauge__val fc-mono">{fmtLitres(billedL)}</span>
            </div>

            <div className={`fc-hero-gauge__diff ${varianceTone}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider">Variance</span>
              <span className="fc-mono text-[16px] font-bold">
                {diffL > 0 ? '+' : ''}
                {diffL.toFixed(2)} L
              </span>
              <span className="fc-mono text-[11px] font-semibold">
                ({diffPct > 0 ? '+' : ''}
                {diffPct.toFixed(1)}%)
              </span>
            </div>

            <div className="fc-hero-gauge__item text-right">
              <span className="fc-hero-gauge__label flex items-center justify-end gap-1.5">
                <Radio size={13} className="text-emerald-500" /> CAN-bus Telematics
              </span>
              <span className="fc-hero-gauge__val fc-mono">{fmtLitres(telematicsL)}</span>
            </div>
          </div>

          {/* Audit Diagnostic Finding */}
          <div
            className={`fc-diag-banner ${
              task.isFlagged
                ? 'fc-diag-banner--danger'
                : isReview
                  ? 'fc-diag-banner--alert'
                  : 'fc-diag-banner--clean'
            }`}
          >
            {task.isFlagged ? (
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            ) : isReview ? (
              <Clock size={18} className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            )}
            <div>
              <div className="fc-diag-banner__title">
                {task.isFlagged
                  ? 'Variance Alert: Possible Overbilling / Discrepancy'
                  : isReview
                    ? 'Pending Manager Audit & Reconciliation'
                    : 'Audit Check Passed: Fuel Consumption Verified'}
              </div>
              <div className="fc-diag-banner__msg">
                {task.flagReason ||
                  (task.isFlagged
                    ? `Billed volume (${billedL.toFixed(2)}L) diverges from telematics engine consumption (${telematicsL.toFixed(2)}L) by ${Math.abs(diffL).toFixed(2)}L.`
                    : isReview
                      ? task.reviewReason ||
                        'Odometer doc reading or date window requires manual confirmation.'
                      : 'Billed diesel slip volume corresponds accurately with CAN-bus sensor telemetry within acceptable ±5% tolerance.')}
              </div>
              <div className="fc-diag-banner__source">
                <Sparkles size={11} className="text-blue-500" />
                <span>Calculated directly via GNB Edge Telematics Engine (SINK Source)</span>
              </div>
            </div>
          </div>

          {/* Interval & Trip Telemetry Grid */}
          <div>
            <div className="fc-section-title">
              <Calendar size={14} /> Interval & Trip Telemetry
            </div>
            <div className="fc-telemetry-grid">
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">From Timestamp (IST)</span>
                <span className="fc-telemetry-val fc-mono text-[12.5px]">
                  {formatDateTimeIST(task.fromDate)}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">To Timestamp (IST)</span>
                <span className="fc-telemetry-val fc-mono text-[12.5px]">
                  {formatDateTimeIST(task.toDate)}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">Window Duration</span>
                <span className="fc-telemetry-val">
                  {fmtDuration(task.fromDate, task.toDate) || '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">GPS Distance Travelled</span>
                <span className="fc-telemetry-val fc-mono">{fmtKm(task.distanceTravelled)}</span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">Calculated Fuel Efficiency</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.fuelEfficiency ? `${task.fuelEfficiency.toFixed(2)} km/L` : '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">DEF (AdBlue) Consumed</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.defConsumed ? fmtLitres(task.defConsumed) : '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell" style={{ gridColumn: '1 / -1' }}>
                <span className="fc-telemetry-label">Assigned Driver</span>
                <span className="fc-telemetry-val flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  {driverName}
                  {task.driverId?.mobileNumber && (
                    <span className="text-xs text-slate-400 font-normal">
                      ({task.driverId.mobileNumber})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Odometer Cross-Check */}
          <div>
            <div className="fc-section-title">
              <Gauge size={14} /> Odometer Cross-Verification
            </div>
            <div className="fc-telemetry-grid">
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">Start Odometer (Min)</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.minOdometer != null
                    ? `${task.minOdometer.toLocaleString('en-IN')} km`
                    : '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">End Odometer (Max)</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.maxOdometer != null
                    ? `${task.maxOdometer.toLocaleString('en-IN')} km`
                    : '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">Odometer Span</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.maxOdometer != null && task.minOdometer != null
                    ? `${(task.maxOdometer - task.minOdometer).toFixed(1)} km`
                    : '—'}
                </span>
              </div>
              <div className="fc-telemetry-cell">
                <span className="fc-telemetry-label">OCR Doc Reading</span>
                <span className="fc-telemetry-val fc-mono">
                  {task.ocrOdometerReading != null
                    ? `${task.ocrOdometerReading.toLocaleString('en-IN')} km`
                    : 'Not captured'}
                </span>
              </div>
            </div>
          </div>

          {/* Odometer Slip Photo Viewer */}
          {hasPhoto && (
            <div>
              <div className="fc-section-title">
                <Gauge size={14} /> Odometer Slip Photo Proof
              </div>
              <div className="fc-photo-box">
                <div className="fc-photo-tools">
                  <span className="text-xs font-semibold text-slate-500">Document Image</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="fc-drawer__icon-btn"
                      onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                      title="Zoom Out"
                      aria-label="Zoom out photo"
                    >
                      <ZoomOut size={14} />
                    </button>
                    <span className="text-xs fc-mono px-1 font-semibold text-slate-600">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      className="fc-drawer__icon-btn"
                      onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                      title="Zoom In"
                      aria-label="Zoom in photo"
                    >
                      <ZoomIn size={14} />
                    </button>
                    <button
                      type="button"
                      className="fc-drawer__icon-btn"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      title="Rotate Clockwise"
                      aria-label="Rotate photo"
                    >
                      <RotateCw size={14} />
                    </button>
                    <a
                      href={task.odometerDoc.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fc-drawer__icon-btn"
                      title="Open full image in new tab"
                      aria-label="Open image in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                <div className="fc-photo-canvas">
                  <img
                    src={task.odometerDoc.publicUrl}
                    alt="Odometer verification slip"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  />
                </div>

                {task.odometerDoc?.ocrData && (
                  <div className="fc-photo-meta">
                    <span>
                      OCR Status:{' '}
                      <strong>{task.odometerDoc.ocrData.processingStatus || 'COMPLETED'}</strong>
                    </span>
                    {task.odometerDoc.ocrData.confidence != null && (
                      <span className="fc-mono">
                        Confidence: <strong>{task.odometerDoc.ocrData.confidence}%</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inline Manager Audit / Correction Form for PENDING_REVIEW */}
          {isReview && (
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
          )}
        </div>

        {/* Footer */}
        <div className="fc-drawer__footer">
          <div className="fc-drawer__footer-id fc-mono">Task ID: {task._id}</div>
          <button type="button" className="fc-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};

export default FuelComparisonDrawer;
