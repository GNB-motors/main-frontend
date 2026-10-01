import React, { useState, useEffect } from 'react';
import { Gauge, X, AlertTriangle, ExternalLink, Loader2, Check } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ReportsService } from '../Reports/ReportsService.jsx';
import { IST_ZONE } from './formatIST.js';

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

const ReviewModal = ({ task, onClose, onSave, onApproved }) => {
  const [fromDate, setFromDate] = useState(() => formatForInput(task?.fromDate));
  const [toDate, setToDate] = useState(() => formatForInput(task?.toDate));
  const [odometerReading, setOdometerReading] = useState(
    task?.ocrOdometerReading != null ? String(task.ocrOdometerReading) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFromDate(formatForInput(task?.fromDate));
    setToDate(formatForInput(task?.toDate));
    setOdometerReading(task?.ocrOdometerReading != null ? String(task.ocrOdometerReading) : '');
  }, [task]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const vehReg = task.vehicleId?.registrationNumber || task.vehicleNumber || '—';

  const handleApprove = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updates = {};
      if (fromDate) {
        updates.fromDate = dayjs.tz(fromDate, IST_ZONE).utc().toISOString();
      }
      if (toDate) {
        updates.toDate = dayjs.tz(toDate, IST_ZONE).utc().toISOString();
      }
      if (odometerReading !== '') {
        const parsedOdo = parseFloat(odometerReading);
        if (isNaN(parsedOdo) || parsedOdo < 0) {
          setError('Please enter a valid positive odometer reading.');
          setSaving(false);
          return;
        }
        updates.odometerReading = parsedOdo;
      }

      const taskId = task._id || task.id;
      if (onSave) {
        await onSave(taskId, updates);
      } else {
        await ReportsService.approveReviewTask(taskId, updates);
        if (onApproved) onApproved();
        onClose();
      }
    } catch (err) {
      setError(
        err?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Failed to approve review task',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fc-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      role="presentation"
    >
      <div
        className="fc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        {/* Modal Header */}
        <div className="fc-modal__header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Gauge size={16} />
            </div>
            <div>
              <h3
                id="review-modal-title"
                className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
              >
                <span>Review Odometer Task</span>
                <span className="fc-plate-badge fc-mono text-[11px]">{vehReg}</span>
              </h3>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                Confirm odometer reading & interval boundaries to reconcile fuel consumption
              </p>
            </div>
          </div>
          <button
            type="button"
            className="fc-modal__close-btn"
            onClick={onClose}
            disabled={saving}
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleApprove} className="fc-modal__body">
          {/* Reason Alert Banner if applicable */}
          {task.reviewReason && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Flagged Reason: </span>
                <span>{task.reviewReason}</span>
              </div>
            </div>
          )}

          {/* Odometer Document Photo Preview */}
          {task.odometerDoc?.publicUrl && (
            <div className="fc-modal__photo-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300">
                  Odometer Document Photo
                </span>
                <a
                  href={task.odometerDoc.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  <span>Open Full Photo</span>
                  <ExternalLink size={12} />
                </a>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-[220px]">
                <img
                  src={task.odometerDoc.publicUrl}
                  alt="Odometer slip"
                  className="w-full max-h-[220px] object-contain"
                />
              </div>
              {task.odometerDoc.ocrData?.confidence != null && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    OCR Status:{' '}
                    <strong>{task.odometerDoc.ocrData.processingStatus || 'COMPLETED'}</strong>
                  </span>
                  <span className="fc-mono">
                    Confidence: <strong>{task.odometerDoc.ocrData.confidence}%</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Input Fields */}
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="review-from-date"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                From Timestamp (IST)
              </label>
              <input
                id="review-from-date"
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="fc-input"
                aria-label="From Date (IST)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="review-to-date"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                To Timestamp (IST)
              </label>
              <input
                id="review-to-date"
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="fc-input"
                aria-label="To Date (IST)"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="review-odometer"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Corrected Odometer Reading (km)
              </label>
              <input
                id="review-odometer"
                type="number"
                step="0.1"
                placeholder="e.g. 125430"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                className="fc-input"
                aria-label="Corrected Odometer Reading (km)"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                CAN-bus telematics reported max odometer:{' '}
                <strong className="fc-mono">
                  {task.maxOdometer
                    ? `${Number(task.maxOdometer).toLocaleString('en-IN')} km`
                    : '—'}
                </strong>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2"
            >
              <AlertTriangle size={14} className="shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="fc-modal__footer">
            <button type="button" className="fc-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="fc-btn fc-btn--primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 size={13} className="fc-spin" />
                  <span>Approving & Recalculating…</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Approve & Release</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
