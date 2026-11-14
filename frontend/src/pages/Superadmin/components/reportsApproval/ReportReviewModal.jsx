import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Calendar,
  Layers,
  Filter,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsApprovalAdminService } from './ReportsApprovalAdminService';
import { formatInIST } from '../../../../utils/dateUtils';

export default function ReportReviewModal({
  report,
  isOpen,
  onClose,
  onUpdated,
}) {
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !report) return null;

  const handleAction = async (status) => {
    if (report.status && report.status !== 'PENDING') {
      setError(`Report has already been ${report.status.toLowerCase()} and cannot be changed later.`);
      return;
    }
    if (status === 'REJECTED' && !comments.trim()) {
      setError('Please provide feedback or a reason when rejecting a report.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const updated = await ReportsApprovalAdminService.review({
        id: report._id || report.id,
        status,
        comments: comments.trim(),
        rejectionReason: status === 'REJECTED' ? comments.trim() : '',
      });
      toast.success(
        status === 'APPROVED'
          ? 'Custom report approved successfully.'
          : 'Custom report rejected with feedback.',
      );
      onUpdated?.(updated);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update report status.');
    } finally {
      setSubmitting(false);
    }
  };

  const orgName = report.orgId?.companyName || 'Unknown Organization';
  const submitterName = report.createdBy
    ? `${report.createdBy.firstName || ''} ${report.createdBy.lastName || ''}`.trim()
    : 'Unknown User';
  const submitterEmail = report.createdBy?.email || '—';
  const submitterPhone = report.createdBy?.mobileNumber || '—';
  const status = report.status || 'PENDING';
  const isFinalized = status === 'APPROVED' || status === 'REJECTED';

  return (
    <div className="custom-modal-backdrop" role="dialog" aria-modal="true">
      <div className="custom-modal-content !max-w-2xl">
        {/* Header */}
        <div className="custom-modal-header">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{report.name}</h3>
              <span className={`status-badge ${status.toLowerCase()}`}>
                {status === 'PENDING'
                  ? 'Pending Review'
                  : status === 'APPROVED'
                    ? 'Approved'
                    : 'Rejected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: <span className="font-medium text-slate-700">{report.category || 'GENERAL'}</span> · Dataset: <span className="font-mono text-slate-700">{report.dataset}</span>
            </p>
          </div>
          <button
            type="button"
            className="col-btn"
            onClick={onClose}
            aria-label="Close review modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="custom-modal-body flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          {error ? (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          ) : null}

          {/* Submitter & Organization Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-start gap-2">
              <Building size={16} className="text-slate-500 mt-0.5" />
              <div>
                <span className="text-slate-400 block">Organization</span>
                <span className="font-semibold text-slate-800">{orgName}</span>
                {report.orgId?.location ? (
                  <span className="text-slate-500 block text-[11px]">{report.orgId.location}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User size={16} className="text-slate-500 mt-0.5" />
              <div>
                <span className="text-slate-400 block">Submitted By</span>
                <span className="font-semibold text-slate-800">{submitterName}</span>
                <span className="text-slate-500 block text-[11px]">{submitterEmail} · {submitterPhone}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {report.description ? (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Description</span>
              <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-100">
                {report.description}
              </p>
            </div>
          ) : null}

          {/* Selected Fields */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckSquare size={13} className="text-blue-600" />
                <span>Selected Fields ({report.fields?.length || 0})</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              {report.fields?.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700 shadow-2xs"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Filters & Scope */}
          <div>
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Filter size={13} className="text-blue-600" />
              <span>Configured Filters</span>
            </span>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              {report.filters && Object.keys(report.filters).length > 0 ? (
                <div className="flex flex-col gap-1 text-slate-600">
                  {report.filters.startDate ? (
                    <div>Start Date: <span className="font-mono text-slate-800">{report.filters.startDate}</span></div>
                  ) : null}
                  {report.filters.endDate ? (
                    <div>End Date: <span className="font-mono text-slate-800">{report.filters.endDate}</span></div>
                  ) : null}
                  {report.filters.fuelType ? (
                    <div>Fuel Type: <span className="font-medium text-slate-800">{report.filters.fuelType}</span></div>
                  ) : null}
                  {report.filters.search ? (
                    <div>Search Text: <span className="font-medium text-slate-800">{report.filters.search}</span></div>
                  ) : null}
                </div>
              ) : (
                <span className="text-slate-400 italic">No specific filters applied (Entire dataset scope)</span>
              )}
            </div>
          </div>

          {/* Previous Admin Review Notes (if already reviewed) */}
          {(report.adminComments || report.rejectionReason) && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
              <span className="font-semibold text-amber-900 block mb-0.5">Previous Admin Feedback</span>
              <p className="text-amber-800">{report.rejectionReason || report.adminComments}</p>
              {report.reviewedAt && (
                <span className="text-[11px] text-amber-600 block mt-1">
                  Reviewed on {formatInIST(report.reviewedAt, 'DD MMM YYYY, hh:mm A')}
                </span>
              )}
            </div>
          )}

          {/* Review Decision Input */}
          <div className="pt-2 border-t border-slate-200">
            <label
              htmlFor="ra-review-comments"
              className="text-xs font-semibold text-slate-800 block mb-1"
            >
              Super Admin Review Notes / Rejection Reason
            </label>
            <textarea
              id="ra-review-comments"
              aria-label="Super Admin Review Notes / Rejection Reason"
              rows={3}
              className="builder-input !text-xs w-full"
              placeholder="Provide comments, feedback, or reason for approval / rejection (required if rejecting)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="custom-modal-footer flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn-secondary-action !text-xs !py-1.5"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>

          {isFinalized ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
                Decision Locked ({status === 'APPROVED' ? 'Approved' : 'Rejected'})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                onClick={() => handleAction('REJECTED')}
                disabled={submitting}
              >
                <XCircle size={14} />
                <span>{submitting ? 'Updating...' : 'Reject Report'}</span>
              </button>

              <button
                type="button"
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                onClick={() => handleAction('APPROVED')}
                disabled={submitting}
              >
                <CheckCircle2 size={14} />
                <span>{submitting ? 'Updating...' : 'Approve Report'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

