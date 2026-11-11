import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  FileSpreadsheet,
  Layers,
  Calendar,
  Eye,
  X,
  Play,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { ReportsService } from '../../ReportsService';
import { formatInIST } from '../../../../utils/dateUtils';
import RequestFieldModal from './RequestFieldModal';
import CustomReportPreview from './CustomReportPreview';

const STATUS_CONFIG = {
  SUBMITTED: { label: 'Submitted', className: 'submitted' },
  UNDER_REVIEW: { label: 'Under Review', className: 'under_review' },
  APPROVED: { label: 'Approved', className: 'approved' },
  REJECTED: { label: 'Rejected', className: 'rejected' },
  IMPLEMENTED: { label: 'Implemented', className: 'implemented' },
};

export default function FieldRequestsView({ userRole, onCreateCustomReport = null }) {
  const [activeSubView, setActiveSubView] = useState('REPORTS'); // 'REPORTS' | 'FIELDS'
  const [savedReports, setSavedReports] = useState([]);
  const [fieldRequests, setFieldRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminStatus, setAdminStatus] = useState('UNDER_REVIEW');
  const [adminComments, setAdminComments] = useState('');
  const [updating, setUpdating] = useState(false);

  // Preview / run approved report modal
  const [runReportModal, setRunReportModal] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryError, setQueryError] = useState(null);

  const isAdmin = userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, requestsData] = await Promise.all([
        ReportsService.getSavedCustomReports().catch(() => []),
        ReportsService.getFieldRequests().catch(() => []),
      ]);
      setSavedReports(reportsData || []);
      setFieldRequests(requestsData || []);
    } catch {
      setSavedReports([]);
      setFieldRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to update field request');
    } finally {
      setUpdating(false);
    }
  };

  const handleRunReport = async (report) => {
    setRunReportModal(report);
    setRunningQuery(true);
    setQueryError(null);
    setReportData(null);
    try {
      const result = await ReportsService.executeCustomReportQuery({
        dataset: report.dataset,
        fields: report.fields,
        filters: report.filters || {},
        sorting: report.sorting,
        aggregations: report.aggregations || [],
        page: 1,
        limit: 20,
      });
      setReportData(result);
    } catch (err) {
      setQueryError(err?.message || 'Failed to generate report');
    } finally {
      setRunningQuery(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Requested Custom Reports &amp; Fields</h3>
          <p className="text-xs text-slate-500">
            Track submitted custom reports awaiting Superadmin approval and review requested fields.
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

      {/* Sub-view switcher tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubView === 'REPORTS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setActiveSubView('REPORTS')}
        >
          <FileSpreadsheet size={14} />
          <span>Submitted Custom Reports</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeSubView === 'REPORTS' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {savedReports.length}
          </span>
        </button>

        <button
          type="button"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeSubView === 'FIELDS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
          onClick={() => setActiveSubView('FIELDS')}
        >
          <MessageSquare size={14} />
          <span>Field Requests</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeSubView === 'FIELDS' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {fieldRequests.length}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading records...</div>
      ) : activeSubView === 'REPORTS' ? (
        /* ================= SUBMITTED CUSTOM REPORTS VIEW ================= */
        !savedReports.length ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-3">
            <FileSpreadsheet size={36} className="text-slate-400" />
            <h4 className="font-semibold text-slate-800">No custom reports submitted yet</h4>
            <p className="text-sm text-slate-500 max-w-sm">
              Design a custom report tailored to your fleet and submit it. It will go directly to the
              Superadmin for approval before being activated.
            </p>
            {onCreateCustomReport && (
              <button
                type="button"
                className="btn-primary-action !text-xs !py-1.5 mt-1"
                onClick={onCreateCustomReport}
              >
                <Wrench size={14} />
                <span>Create Custom Report</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {savedReports.map((report) => {
              const id = report._id || report.id;
              const repStatus = report.status || 'PENDING';
              const reqUser = report.createdBy
                ? `${report.createdBy.firstName || ''} ${report.createdBy.lastName || ''}`.trim() ||
                  report.createdBy.email ||
                  'You'
                : 'Fleet Member';

              return (
                <div
                  key={id}
                  className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2.5 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{report.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        {report.category || 'GENERAL'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {(report.dataset || 'fuel_transactions').replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {repStatus === 'APPROVED' ? (
                        <span className="status-badge approved flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Approved</span>
                        </span>
                      ) : repStatus === 'REJECTED' ? (
                        <span className="status-badge rejected flex items-center gap-1">
                          <XCircle size={12} />
                          <span>Rejected</span>
                        </span>
                      ) : (
                        <span className="status-badge under_review flex items-center gap-1 bg-amber-50 text-amber-800 border-amber-200">
                          <Clock size={12} />
                          <span>Pending Approval</span>
                        </span>
                      )}

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatInIST(report.createdAt, 'DD MMM YYYY')}
                      </span>
                    </div>
                  </div>

                  {report.description && (
                    <p className="text-xs text-slate-600">{report.description}</p>
                  )}

                  {/* Fields list */}
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500">Selected Fields:</span>
                    {(report.fields || []).slice(0, 6).map((f) => (
                      <span
                        key={f}
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700"
                      >
                        {f}
                      </span>
                    ))}
                    {(report.fields || []).length > 6 && (
                      <span className="text-[11px] text-slate-400">
                        +{(report.fields || []).length - 6} more
                      </span>
                    )}
                  </div>

                  {/* Status explanation / feedback */}
                  {repStatus === 'PENDING' && (
                    <div className="p-2 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-2">
                      <Clock size={14} className="text-amber-600 flex-shrink-0" />
                      <span>
                        <strong>Awaiting Superadmin Review:</strong> This report has been submitted
                        and will become active once approved by the Superadmin.
                      </span>
                    </div>
                  )}

                  {repStatus === 'REJECTED' && report.rejectionReason && (
                    <div className="p-2 bg-red-50/70 border border-red-200 rounded text-xs text-red-900 flex items-center gap-2">
                      <XCircle size={14} className="text-red-600 flex-shrink-0" />
                      <span>
                        <strong>Superadmin Feedback:</strong> {report.rejectionReason}
                      </span>
                    </div>
                  )}

                  {repStatus === 'APPROVED' && report.adminComments && (
                    <div className="p-2 bg-green-50/70 border border-green-200 rounded text-xs text-green-900 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                      <span>
                        <strong>Superadmin Note:</strong> {report.adminComments}
                      </span>
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>
                      Submitted by: <strong>{reqUser}</strong>
                    </span>

                    {repStatus === 'APPROVED' ? (
                      <button
                        type="button"
                        className="btn-primary-action !py-1 !px-3 !text-xs flex items-center gap-1"
                        onClick={() => handleRunReport(report)}
                      >
                        <Play size={12} />
                        <span>Run Report</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {repStatus === 'PENDING' ? 'Under Review' : 'Closed'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ================= FIELD REQUESTS VIEW ================= */
        !fieldRequests.length ? (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-3">
            <MessageSquare size={32} className="text-slate-400" />
            <h4 className="font-semibold text-slate-800">No field requests yet</h4>
            <p className="text-sm text-slate-500 max-w-sm">
              Need a data point not currently available? Click below to submit a field request.
            </p>
            <button
              type="button"
              className="btn-secondary-action !text-xs !py-1.5 mt-1"
              onClick={() => setModalOpen(true)}
            >
              <Plus size={14} />
              <span>Request Additional Field</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fieldRequests.map((req) => {
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
                      <span className="font-semibold text-slate-900 text-sm">{req.fieldName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {req.module}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-badge ${statusCfg.className}`}>{statusCfg.label}</span>
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
        )
      )}

      {/* Admin Field Request Review Modal */}
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

      {/* Run / Preview Approved Report Modal */}
      {runReportModal && (
        <div className="custom-modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="custom-modal-content"
            style={{ maxWidth: '95vw', width: 1100, maxHeight: '90vh' }}
          >
            <div className="custom-modal-header">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-blue-600" />
                <h3>{runReportModal.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700 font-semibold border border-green-200">
                  Approved
                </span>
              </div>
              <button
                type="button"
                className="col-btn"
                onClick={() => setRunReportModal(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="custom-modal-body p-4 overflow-y-auto">
              {runningQuery ? (
                <div className="p-16 text-center text-slate-500">
                  Executing report query across authorized fleet records...
                </div>
              ) : queryError ? (
                <div className="p-6 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
                  {queryError}
                </div>
              ) : (
                <CustomReportPreview
                  config={runReportModal}
                  reportData={reportData}
                  loading={runningQuery}
                />
              )}
            </div>
            <div className="custom-modal-footer">
              <button
                type="button"
                className="btn-secondary-action"
                onClick={() => setRunReportModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <RequestFieldModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
