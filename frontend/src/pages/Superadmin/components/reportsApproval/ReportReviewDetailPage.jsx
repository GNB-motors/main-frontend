import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Building,
  User,
  Clock,
  Layers,
  Filter,
  CheckSquare,
  AlertCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Send,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  ReportsApprovalAdminService,
  REPORTS_APPROVAL_CHANGED_EVENT,
} from './ReportsApprovalAdminService';
import { getUserRole } from '../../../../utils/session';
import { formatInIST } from '../../../../utils/dateUtils';
import './ReportsApproval.css';

export default function ReportReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer report passed through location state for instant rendering, fallback to fetching
  const [report, setReport] = useState(location.state?.report || null);
  const [loading, setLoading] = useState(!location.state?.report);
  const [loadError, setLoadError] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  // Enforce Super Admin authorization
  useEffect(() => {
    const role = getUserRole();
    if (role !== 'SUPER_ADMIN') {
      navigate('/profile');
    }
  }, [navigate]);

  // Load fresh report details
  const fetchReport = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ReportsApprovalAdminService.get(id);
      if (data) {
        setReport(data);
        if (data.adminComments || data.rejectionReason) {
          setComments(data.adminComments || data.rejectionReason);
        }
      } else if (!report) {
        setLoadError('Custom report submission not found.');
      }
    } catch (err) {
      if (!report) {
        setLoadError(err?.message || 'Failed to load report submission.');
      }
    } finally {
      setLoading(false);
    }
  }, [id, report]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDecision = async (decisionStatus) => {
    const currentStatus = report.status || 'PENDING';
    if (currentStatus !== 'PENDING') {
      setActionError(`This report has already been ${currentStatus.toLowerCase()} and cannot be changed later.`);
      return;
    }

    if (decisionStatus === 'REJECTED' && !comments.trim()) {
      setActionError('Please provide a reason or feedback when rejecting a report.');
      return;
    }

    setActionError('');
    setSubmitting(true);

    try {
      const updated = await ReportsApprovalAdminService.review({
        id: report._id || report.id || id,
        status: decisionStatus,
        comments: comments.trim(),
        rejectionReason: decisionStatus === 'REJECTED' ? comments.trim() : '',
      });

      setReport((prev) => ({
        ...prev,
        ...updated,
        status: decisionStatus,
        adminComments: comments.trim(),
        rejectionReason: decisionStatus === 'REJECTED' ? comments.trim() : '',
      }));

      toast.success(
        decisionStatus === 'APPROVED'
          ? 'Custom report has been approved successfully.'
          : 'Custom report has been rejected with feedback.',
      );

      // Return to reports approval queue
      setTimeout(() => {
        navigate('/superadmin/reports-approval');
      }, 700);
    } catch (err) {
      setActionError(err?.message || 'Failed to update report status.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ra-page">
        <button
          type="button"
          className="ra-back-btn"
          onClick={() => navigate('/superadmin/reports-approval')}
          aria-label="Back to Reports Approval"
        >
          <ArrowLeft size={16} />
          <span>Back to Reports Approval</span>
        </button>
        <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={24} className="animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading report submission details...</span>
        </div>
      </div>
    );
  }

  if (loadError || !report) {
    return (
      <div className="ra-page">
        <button
          type="button"
          className="ra-back-btn"
          onClick={() => navigate('/superadmin/reports-approval')}
          aria-label="Back to Reports Approval"
        >
          <ArrowLeft size={16} />
          <span>Back to Reports Approval</span>
        </button>
        <div className="ra-card p-12 text-center text-slate-600">
          <FileText size={36} className="text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Report Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {loadError || 'The requested custom report submission could not be located.'}
          </p>
          <button
            type="button"
            className="mt-4 btn-primary-action !py-1.5 !px-4 !text-xs inline-flex items-center gap-1.5"
            onClick={() => navigate('/superadmin/reports-approval')}
          >
            <ArrowLeft size={14} />
            <span>Return to Submissions Queue</span>
          </button>
        </div>
      </div>
    );
  }

  const orgName = report.orgId?.companyName || 'Your Organization';
  const submitterName = report.createdBy
    ? `${report.createdBy.firstName || ''} ${report.createdBy.lastName || ''}`.trim() || 'Fleet User'
    : 'Fleet User';
  const submitterEmail = report.createdBy?.email || '—';
  const submitterPhone = report.createdBy?.mobileNumber || '—';
  const status = report.status || 'PENDING';
  const submittedDate = report.submittedAt || report.createdAt;
  const isFinalized = status === 'APPROVED' || status === 'REJECTED';

  return (
    <div className="ra-detail-container">
      {/* Top Back Navigation */}
      <div className="mb-4">
        <button
          type="button"
          className="ra-back-btn"
          onClick={() => navigate('/superadmin/reports-approval')}
          aria-label="Back to Reports Approval"
        >
          <ArrowLeft size={16} />
          <span>Back to Reports Approval</span>
        </button>
      </div>

      {/* Main Review Header Card */}
      <div className="ra-detail-card ra-detail-header-card">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">{report.name || 'Untitled Report'}</h1>
            <span className={`status-badge ${status.toLowerCase()}`}>
              {status === 'PENDING'
                ? 'Pending Review'
                : status === 'APPROVED'
                  ? 'Approved'
                  : 'Rejected'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
            <span>
              Category: <strong className="text-slate-700">{report.category || 'GENERAL'}</strong>
            </span>
            <span>•</span>
            <span>
              Dataset:{' '}
              <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {report.dataset}
              </code>
            </span>
            {submittedDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Calendar size={13} className="text-slate-400" />
                  Submitted: {formatInIST(submittedDate, 'DD MMM YYYY, hh:mm A')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          {isFinalized ? (
            <span className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Lock size={13} className="text-slate-500" />
              <span>Decision Locked ({status === 'APPROVED' ? 'Approved' : 'Rejected'})</span>
            </span>
          ) : (
            <>
              <button
                type="button"
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                onClick={() => handleDecision('REJECTED')}
                disabled={submitting}
              >
                <XCircle size={14} />
                <span>Reject Report</span>
              </button>

              <button
                type="button"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                onClick={() => handleDecision('APPROVED')}
                disabled={submitting}
              >
                <CheckCircle2 size={14} />
                <span>Approve Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submitter & Organization Metadata Grid */}
      <div className="ra-detail-meta-grid">
        {/* Organization Card */}
        <div className="ra-detail-card !mb-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Building size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Organization
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">{orgName}</h4>
              {report.orgId?.location && (
                <span className="text-xs text-slate-500 block mt-0.5">
                  {report.orgId.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submitter Card */}
        <div className="ra-detail-card !mb-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Submitted By
              </span>
              <h4 className="text-sm font-bold text-slate-800 mt-0.5">{submitterName}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                {submitterEmail !== '—' && (
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    {submitterEmail}
                  </span>
                )}
                {submitterPhone !== '—' && (
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" />
                    {submitterPhone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card (if provided) */}
      {report.description && (
        <div className="ra-detail-card">
          <span className="text-xs font-semibold text-slate-700 block mb-1.5">
            Report Description & Purpose
          </span>
          <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-100 leading-relaxed">
            {report.description}
          </p>
        </div>
      )}

      {/* Selected Fields Card */}
      <div className="ra-detail-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <CheckSquare size={14} className="text-blue-600" />
            <span>Selected Fields ({report.fields?.length || 0})</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Fields chosen for inclusion in this custom report
          </span>
        </div>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          {report.fields?.length ? (
            report.fields.map((fKey) => (
              <span
                key={fKey}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-700 shadow-2xs font-medium"
              >
                {fKey}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No fields selected</span>
          )}
        </div>
      </div>

      {/* Configured Filters Card */}
      <div className="ra-detail-card">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
          <Filter size={14} className="text-blue-600" />
          <span>Configured Filters & Business Scope</span>
        </span>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          {report.filters && Object.keys(report.filters).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">From Date (Start)</span>
                <span className="font-mono text-slate-800 font-semibold block mt-0.5">
                  {report.filters.startDate
                    ? formatInIST(report.filters.startDate, 'DD-MM-YYYY')
                    : 'Not specified'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">To Date (End)</span>
                <span className="font-mono text-slate-800 font-semibold block mt-0.5">
                  {report.filters.endDate
                    ? formatInIST(report.filters.endDate, 'DD-MM-YYYY')
                    : 'Not specified'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Fuel Type</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {report.filters.fuelType || 'All Fuel Types'}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Search Keyword</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {report.filters.search || 'None'}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-slate-400 italic">
              No specific filters applied (Entire dataset scope).
            </span>
          )}
        </div>
      </div>

      {/* Previous Review Feedback Banner (if already reviewed) */}
      {(report.adminComments || report.rejectionReason) && (
        <div className="ra-detail-card !bg-amber-50/70 !border-amber-200">
          <span className="text-xs font-bold text-amber-900 block mb-1">
            Previous Super Admin Decision & Feedback
          </span>
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            {report.rejectionReason || report.adminComments}
          </p>
          {report.reviewedAt && (
            <span className="text-[11px] text-amber-600 block mt-1.5">
              Reviewed on {formatInIST(report.reviewedAt, 'DD MMM YYYY, hh:mm A')}
            </span>
          )}
        </div>
      )}

      {/* Super Admin Review Decision Console */}
      {isFinalized ? (
        <div
          className={`ra-detail-card ${
            status === 'APPROVED'
              ? '!border-emerald-200 !bg-emerald-50/40'
              : '!border-rose-200 !bg-rose-50/40'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {status === 'APPROVED' ? (
              <CheckCircle2 size={20} className="text-emerald-600" />
            ) : (
              <XCircle size={20} className="text-rose-600" />
            )}
            <div>
              <h3
                className={`text-sm font-bold ${
                  status === 'APPROVED' ? 'text-emerald-900' : 'text-rose-900'
                }`}
              >
                Decision Recorded: {status === 'APPROVED' ? 'Report Approved' : 'Report Rejected'}
              </h3>
              <p className="text-[11px] text-slate-500">
                This custom report decision has been finalized. Once approved or rejected by a Super Admin, the review decision cannot be modified.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-md border border-slate-200 text-xs mt-3">
            <span className="font-semibold text-slate-700 block mb-1">
              Super Admin Review Notes / Decision Feedback:
            </span>
            <p className="text-slate-800 italic">
              {report.rejectionReason || report.adminComments || 'No review comments recorded.'}
            </p>
            {report.reviewedAt && (
              <span className="text-[11px] text-slate-400 block mt-2">
                Reviewed on {formatInIST(report.reviewedAt, 'DD MMM YYYY, hh:mm A')}
              </span>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/60 flex justify-end">
            <button
              type="button"
              className="btn-secondary-action !text-xs !py-1.5 !px-3.5 flex items-center gap-1.5"
              onClick={() => navigate('/superadmin/reports-approval')}
            >
              <ArrowLeft size={13} />
              <span>Return to Reports Approval</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="ra-detail-card border-blue-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Send size={15} className="text-blue-600" />
            <span>Super Admin Review Decision</span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Approve this custom report so fleet users can run and export it, or reject it with feedback so they can make adjustments.
            <strong> Note: Once approved or rejected, this decision is final and cannot be changed later.</strong>
          </p>

          {actionError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded mb-3 flex items-center gap-2 border border-red-200" role="alert">
              <AlertCircle size={15} />
              <span>{actionError}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="ra-review-notes" className="text-xs font-semibold text-slate-700 block mb-1">
              Super Admin Review Notes / Rejection Reason
            </label>
            <textarea
              id="ra-review-notes"
              aria-label="Super Admin Review Notes / Rejection Reason"
              rows={3}
              className="builder-input !text-xs w-full !p-3"
              placeholder="Provide comments, feedback, or reason for approval / rejection (required if rejecting)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-3">
            <button
              type="button"
              className="btn-secondary-action !text-xs !py-2 !px-4"
              onClick={() => navigate('/superadmin/reports-approval')}
              disabled={submitting}
            >
              Cancel & Back
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                onClick={() => handleDecision('REJECTED')}
                disabled={submitting}
              >
                <XCircle size={15} />
                <span>{submitting ? 'Updating...' : 'Reject Report'}</span>
              </button>

              <button
                type="button"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                onClick={() => handleDecision('APPROVED')}
                disabled={submitting}
              >
                <CheckCircle2 size={15} />
                <span>{submitting ? 'Updating...' : 'Approve Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
