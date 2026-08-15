import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import AccessControlApi from './accessControlService';

const fullName = (e) => `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.mobileNumber || e.email || 'Employee';

/**
 * Assign an available role to an employee, at ENTERPRISE or a specific BRANCH.
 * Employees are never given raw permissions — only a role + scope.
 */
const AssignRoleDrawer = ({ open, onClose, roles = [], branches = [], onAssigned }) => {
  const [employees, setEmployees] = useState([]);
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [scope, setScope] = useState('ENTERPRISE');
  const [branchId, setBranchId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setUserId('');
    setRoleId('');
    setScope('ENTERPRISE');
    setBranchId('');
    AccessControlApi.listEmployees()
      .then(setEmployees)
      .catch(() => setEmployees([]));
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError('');
    if (!userId || !roleId) {
      setError('Select an employee and a role.');
      return;
    }
    if (scope === 'BRANCH' && !branchId) {
      setError('Select a branch for a branch-scoped assignment.');
      return;
    }
    setSubmitting(true);
    try {
      const body = { userId, roleId, scope };
      if (scope === 'BRANCH') body.branchId = branchId;
      await AccessControlApi.assignRole(body);
      toast.success('Role assigned');
      onAssigned && onAssigned();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to assign role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ff-modal-overlay" onClick={() => !submitting && onClose()}>
      <div className="ff-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ff-modal__header">
          <div>
            <h2 className="ff-modal__title">Assign a role</h2>
            <p className="ff-modal__subtitle">The employee receives the role — never individual permissions.</p>
          </div>
          <button type="button" className="ff-icon-btn" onClick={onClose} disabled={submitting} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="ff-modal__body">
          {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

          <div className="ff-field">
            <label className="ff-field__label">Employee</label>
            <select className="rbac-select" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Select an employee…</option>
              {employees.map((e) => (
                <option key={e._id || e.id} value={e._id || e.id}>
                  {fullName(e)} · {e.role}
                </option>
              ))}
            </select>
          </div>

          <div className="ff-field">
            <label className="ff-field__label">Role</label>
            <select className="rbac-select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Select a role…</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="ff-field">
            <label className="ff-field__label">Scope</label>
            <select className="rbac-select" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="ENTERPRISE">Enterprise (all locations)</option>
              <option value="BRANCH">A specific branch</option>
            </select>
          </div>

          {scope === 'BRANCH' && (
            <div className="ff-field">
              <label className="ff-field__label">Branch</label>
              <select className="rbac-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Select a branch…</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="ff-modal__footer">
          <button type="button" className="ff-btn ff-btn--ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="ff-btn ff-btn--primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Assigning…' : 'Assign role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRoleDrawer;
