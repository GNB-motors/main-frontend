import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Info, X } from 'lucide-react';
import AccessControlApi from './accessControlService';

const fullName = (e) => `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.mobileNumber || e.email || 'Employee';

// Owners and platform admins are not governed by role assignment (the API
// rejects them), so they never appear in the picker.
const isAssignable = (e) => !['OWNER', 'SUPER_ADMIN'].includes(e.role);

/**
 * Assign an available role to an employee, at ENTERPRISE or a specific BRANCH.
 * Employees are never given raw permissions — only a role + scope.
 */
const AssignRoleDrawer = ({
  open, onClose, roles = [], branches = [], employees = null, assignments = [], onAssigned,
}) => {
  const [fetchedEmployees, setFetchedEmployees] = useState([]);
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [scope, setScope] = useState('ENTERPRISE');
  const [branchId, setBranchId] = useState('');
  const [branchRoles, setBranchRoles] = useState(null); // roles usable at the picked branch
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setUserId('');
    setRoleId('');
    setScope('ENTERPRISE');
    setBranchId('');
    setBranchRoles(null);
    // The parent normally supplies the roster; fetch only if it didn't.
    if (!employees) {
      AccessControlApi.listEmployees()
        .then(setFetchedEmployees)
        .catch(() => setFetchedEmployees([]));
    }
  }, [open, employees]);

  // A role turned off for a location can't be assigned there — ask the branch
  // what it actually offers instead of failing on submit.
  useEffect(() => {
    let cancelled = false;
    if (open && scope === 'BRANCH' && branchId) {
      AccessControlApi.getBranchRoles(branchId)
        .then((rows) => {
          if (!cancelled) setBranchRoles((rows || []).filter((r) => r.enabled !== false).map((r) => r.role));
        })
        .catch(() => { if (!cancelled) setBranchRoles(null); });
    } else {
      setBranchRoles(null);
    }
    return () => { cancelled = true; };
  }, [open, scope, branchId]);

  const roster = useMemo(
    () => (employees || fetchedEmployees).filter(isAssignable),
    [employees, fetchedEmployees],
  );

  // At a location, only the roles that location actually offers.
  const options = useMemo(() => branchRoles || roles, [branchRoles, roles]);

  // What this employee already holds in the scope being assigned — assigning
  // replaces it, so say so before they submit.
  const replaced = useMemo(() => {
    if (!userId) return null;
    return assignments.find((a) => {
      if (String(a.userId) !== String(userId) || a.scope !== scope) return false;
      if (scope === 'BRANCH') return String(a.branchId?._id || a.branchId) === String(branchId);
      return true;
    }) || null;
  }, [assignments, userId, scope, branchId]);

  useEffect(() => {
    // Clear a role that the newly-picked branch doesn't offer.
    if (roleId && !options.some((r) => r._id === roleId)) setRoleId('');
  }, [options, roleId]);

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

  const handleOverlayKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!submitting) onClose();
    }
  };

  return (
    <div
      className="ff-modal-overlay"
      role="button"
      tabIndex={-1}
      aria-label="Close dialog"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div className="ff-modal" role="dialog" aria-modal="true">
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
              {roster.map((e) => (
                <option key={e._id || e.id} value={e._id || e.id}>
                  {fullName(e)} · {e.role}
                </option>
              ))}
            </select>
          </div>

          <div className="ff-field">
            <label className="ff-field__label">Scope</label>
            <select
              className="rbac-select"
              value={scope}
              onChange={(e) => { setScope(e.target.value); setRoleId(''); }}
            >
              <option value="ENTERPRISE">Enterprise — when no location is selected</option>
              <option value="BRANCH">A specific location</option>
            </select>
          </div>

          {scope === 'BRANCH' && (
            <div className="ff-field">
              <label className="ff-field__label">Location</label>
              <select className="rbac-select" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Select a location…</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="ff-field">
            <label className="ff-field__label">Role</label>
            <select
              className="rbac-select"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={scope === 'BRANCH' && !branchId}
            >
              <option value="">
                {scope === 'BRANCH' && !branchId ? 'Pick a location first…' : 'Select a role…'}
              </option>
              {options.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
            {scope === 'BRANCH' && branchId && options.length === 0 && (
              <span className="ff-field__help">No roles are switched on at this location yet — see Branch Access.</span>
            )}
          </div>

          {/* Scope is strict on purpose: an enterprise role grants nothing while a
              location is selected, and vice versa. Say it plainly here. */}
          <div className="rbac-banner">
            <Info size={16} />
            {scope === 'ENTERPRISE'
              ? 'Applies when the employee is working across the enterprise, with no location selected. It does not grant access inside a location — assign a location role for that.'
              : 'Applies only while the employee is working in this location. It does not grant enterprise-wide access.'}
          </div>

          {replaced && (
            <div className="ff-alert ac-alert--warn" role="status">
              This employee already holds <strong>{replaced.roleId?.name}</strong>
              {replaced.scope === 'BRANCH' ? ' at this location' : ' for the enterprise'}. Assigning replaces it.
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
