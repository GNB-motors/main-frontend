import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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

export default function FieldRequestsView({ userRole }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminStatus, setAdminStatus] = useState('UNDER_REVIEW');
  const [adminComments, setAdminComments] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = userRole === 'OWNER' || userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await ReportsService.getFieldRequests();
      setRequests(data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Requested Custom Report Fields</h3>
          <p className="text-xs text-slate-500">
            Request fields not currently available in the builder. Product and engineering teams
            review requests regularly.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-action !text-xs !py-1.5"
          onClick={() => setModalOpen(true)}
        >
          <Plus size={14} />
          <span>Request Additional Field</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-sm">Loading field requests...</div>
      ) : !requests.length ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-2">
          <MessageSquare size={32} className="text-slate-400" />
          <h4 className="font-semibold text-slate-800">No field requests yet</h4>
          <p className="text-sm text-slate-500 max-w-sm">
            Need a data point not currently available in the report builder? Click above to submit a
            request.
          </p>
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
      )}

      {/* Admin Review Modal */}
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
                  <select
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
                  </select>
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
