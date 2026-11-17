import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wrench,
  FileText,
  Copy,
  Trash2,
  RotateCcw,
  Edit3,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsService } from '../../ReportsService';
import { formatInIST } from '../../../../utils/dateUtils';
import RequestFieldModal from './RequestFieldModal';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', className: 'submitted' },
  UNDER_REVIEW: { label: 'Under Review', className: 'under_review' },
  APPROVED: { label: 'Approved', className: 'approved' },
  REJECTED: { label: 'Rejected', className: 'rejected' },
  IMPLEMENTED: { label: 'Implemented', className: 'implemented' },
};

export default function FieldRequestsView({
  userRole,
  onCreateCustomReport = null,
  onLoadReport = null,
}) {
  const [activeSubTab, setActiveSubTab] = useState('submitted'); // 'submitted' | 'fields'

  // Submitted Custom Reports state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Field Requests state
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminStatus, setAdminStatus] = useState('UNDER_REVIEW');
  const [adminComments, setAdminComments] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await ReportsService.getSavedCustomReports();
      setReports(data || []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await ReportsService.getFieldRequests();
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    fetchRequests();
  }, [fetchReports, fetchRequests]);

  const handleDeleteReport = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete report "${name}"?`)) return;
    try {
      await ReportsService.deleteSavedCustomReport(id);
      toast.success('Custom report deleted successfully');
      setReports((prev) => prev.filter((r) => (r._id || r.id) !== id));
    } catch (err) {
      toast.error(err?.message || 'Failed to delete custom report');
    }
  };

  const handleDuplicateReport = async (report) => {
    try {
      const payload = {
        name: `Copy of ${report.name}`,
        description: report.description,
        category: report.category,
        dataset: report.dataset,
        fields: report.fields,
        filters: report.filters,
        sorting: report.sorting,
        aggregations: report.aggregations,
      };
      await ReportsService.createSavedCustomReport(payload);
      toast.success('Report duplicated and submitted for approval');
      fetchReports();
    } catch (err) {
      toast.error(err?.message || 'Failed to duplicate report');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      await ReportsService.updateFieldRequestStatus(selectedRequest._id || selectedRequest.id, {
        status: adminStatus,
        adminComments,
      });
      toast.success('Field request updated successfully');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(err?.message || 'Failed to update field request');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Requested Custom Report Fields</h3>
          <p className="text-xs text-slate-500">
            Monitor custom reports awaiting Super Admin approval and track custom field requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCreateCustomReport && (
            <button
              type="button"
              className="btn-primary-action !text-xs !py-1.5"
              onClick={onCreateCustomReport}
            >
              <Wrench size={14} />
              <span>Create Custom Report</span>
            </button>
          )}
          <button
            type="button"
            className="btn-secondary-action !text-xs !py-1.5"
            onClick={() => setModalOpen(true)}
          >
            <Plus size={14} />
            <span>Request Additional Field</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          type="button"
          className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'submitted'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveSubTab('submitted')}
        >
          <FileText size={15} />
          <span>Submitted Custom Reports</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
              activeSubTab === 'submitted'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {reports.length}
          </span>
        </button>

        <button
          type="button"
          className={`pb-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'fields'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveSubTab('fields')}
        >
          <MessageSquare size={15} />
          <span>Requested Fields</span>
          <span
            className={`text-[11px] px-1.5 py-0.2 rounded-full font-medium ${
              activeSubTab === 'fields'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {requests.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Submitted Custom Reports */}
      {activeSubTab === 'submitted' && (
        <div>
          {loadingReports ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Loading submitted custom reports...
            </div>
          ) : !reports.length ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-2">
              <FileText size={32} className="text-slate-400" />
              <h4 className="font-semibold text-slate-800">No submitted custom reports yet</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Create a custom report with your required data points and submit it for Super Admin
                approval.
              </p>
              {onCreateCustomReport && (
                <button
                  type="button"
                  className="btn-primary-action !text-xs !py-1.5 mt-2"
                  onClick={onCreateCustomReport}
                >
                  <Wrench size={14} />
                  <span>Create Custom Report</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((r) => {
                const id = r._id || r.id;
                const isApproved = r.status === 'APPROVED';
                const isRejected = r.status === 'REJECTED';
                const isPending = !isApproved && !isRejected;

                return (
                  <div
                    key={id}
                    className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between gap-3 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {r.category || 'GENERAL'}
                          </span>
                          <h4 className="font-semibold text-slate-900 text-base">{r.name}</h4>
                        </div>

                        {/* Status Badges */}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Approved by Super Admin</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={13} className="text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={13} className="text-amber-500" />
                            <span>Pending Super Admin Review</span>
                          </span>
                        )}
                      </div>

                      {r.description ? (
                        <p className="text-xs text-slate-600">{r.description}</p>
                      ) : null}

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>
                          Dataset:{' '}
                          <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono">
                            {r.dataset}
                          </code>
                        </span>
                        <span>•</span>
                        <span>
                          <strong>{r.fields?.length || 0}</strong> columns
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Submitted:{' '}
                          {formatInIST(r.submittedAt || r.createdAt, 'DD MMM YYYY, hh:mm A')}
                        </span>
                        {r.reviewedAt && (
                          <>
                            <span>•</span>
                            <span>
                              Reviewed: {formatInIST(r.reviewedAt, 'DD MMM YYYY, hh:mm A')}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Super Admin Rejection Reason Banner */}
                      {isRejected && (r.rejectionReason || r.adminComments) && (
                        <div className="mt-1 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-900">
                          <div className="flex items-center gap-1.5 font-semibold text-rose-800 mb-1">
                            <AlertCircle size={14} className="text-rose-600" />
                            <span>Super Admin Rejection Feedback:</span>
                          </div>
                          <p className="text-rose-800 font-medium whitespace-pre-line">
                            {r.rejectionReason || r.adminComments}
                          </p>
                          <p className="mt-2 text-[11px] text-rose-600">
                            Click <strong>&quot;Edit &amp; Resubmit&quot;</strong> below to modify
                            fields or filters and resubmit for approval.
                          </p>
                        </div>
                      )}

                      {/* Super Admin Approval Note */}
                      {isApproved && r.adminComments && (
                        <div className="mt-1 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900">
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-800 mb-0.5">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Super Admin Notes:</span>
                          </div>
                          <p className="text-emerald-700">{r.adminComments}</p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="col-btn"
                          title="Duplicate Configuration"
                          onClick={() => handleDuplicateReport(r)}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          className="col-btn is-delete"
                          title="Delete Report"
                          onClick={() => handleDeleteReport(id, r.name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isRejected && (
                          <button
                            type="button"
                            className="btn-primary-action !py-1 !px-3 !text-xs !bg-amber-600 hover:!bg-amber-700 inline-flex items-center gap-1"
                            onClick={() => onLoadReport?.(r, false)}
                          >
                            <RotateCcw size={12} />
                            <span>Edit &amp; Resubmit</span>
                          </button>
                        )}

                        {isPending && (
                          <button
                            type="button"
                            className="btn-secondary-action !py-1 !px-3 !text-xs inline-flex items-center gap-1"
                            onClick={() => onLoadReport?.(r, false)}
                          >
                            <Edit3 size={12} />
                            <span>Edit Configuration</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Requested Additional Fields */}
      {activeSubTab === 'fields' && (
        <div>
          {loadingRequests ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Loading field requests...
            </div>
          ) : !requests.length ? (
            <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-2">
              <MessageSquare size={32} className="text-slate-400" />
              <h4 className="font-semibold text-slate-800">No field requests yet</h4>
              <p className="text-sm text-slate-500 max-w-sm">
                Need a data point not currently available in the report builder? Click above to
                submit a request, or create a custom report directly.
              </p>
              <div className="flex items-center gap-2 mt-2">
                {onCreateCustomReport && (
                  <button
                    type="button"
                    className="btn-primary-action !text-xs !py-1.5"
                    onClick={onCreateCustomReport}
                  >
                    <Wrench size={14} />
                    <span>Create Custom Report</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-secondary-action !text-xs !py-1.5"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Request Additional Field</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map((req) => {
                const id = req._id || req.id;
                const statusCfg = STATUS_CONFIG[req.status] || {
                  label: req.status,
                  className: 'submitted',
                };
                const reqUser = req.requestedBy
                  ? `${req.requestedBy.firstName || ''} ${req.requestedBy.lastName || ''}`.trim()
                  : 'User';

                return (
                  <div
                    key={id}
                    className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {req.fieldName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {req.module}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={12} />
                          {formatInIST(req.createdAt, 'DD MMM YYYY')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Description:</strong> {req.description}
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Business Reason:</strong> {req.reason}
                    </p>
                    {req.exampleOutput ? (
                      <p className="text-xs text-slate-500">
                        <strong>Expected Output:</strong>{' '}
                        <code className="bg-slate-50 px-1 py-0.5 rounded">{req.exampleOutput}</code>
                      </p>
                    ) : null}

                    {req.adminComments ? (
                      <div className="p-2 bg-blue-50/60 border border-blue-100 rounded text-xs text-blue-900 mt-1">
                        <strong>Admin Response:</strong> {req.adminComments}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                      <span>
                        Requested by: <strong>{reqUser || 'Fleet Member'}</strong>
                      </span>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="btn-secondary-action !py-0.5 !px-2.5 !text-xs"
                          onClick={() => {
                            setSelectedRequest(req);
                            setAdminStatus(req.status);
                            setAdminComments(req.adminComments || '');
                          }}
                        >
                          Review Request
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Admin Review Modal for Field Requests */}
      {selectedRequest && (
        <div className="custom-modal-backdrop" role="dialog" aria-modal="true">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <h3>Review Field Request: {selectedRequest.fieldName}</h3>
              <button type="button" className="col-btn" onClick={() => setSelectedRequest(null)}>
                <XCircle size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="custom-modal-body">
                <div className="builder-field-group">
                  <label htmlFor="fr-review-status">Status</label>
                  <SearchableSelect
                    id="fr-review-status"
                    aria-label="Status"
                    className="builder-select"
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value)}
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="IMPLEMENTED">IMPLEMENTED</option>
                  </SearchableSelect>
                </div>
                <div className="builder-field-group">
                  <label htmlFor="fr-review-comments">Admin Review Comments</label>
                  <textarea
                    id="fr-review-comments"
                    aria-label="Admin Review Comments"
                    className="builder-textarea"
                    rows={3}
                    placeholder="Provide feedback or expected implementation timeline."
                    value={adminComments}
                    onChange={(e) => setAdminComments(e.target.value)}
                  />
                </div>
              </div>
              <div className="custom-modal-footer">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setSelectedRequest(null)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action" disabled={updating}>
                  {updating ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RequestFieldModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
