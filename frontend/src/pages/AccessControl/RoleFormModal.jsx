import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import AccessControlApi from './accessControlService';

// The access tier a role maps onto, so the app's existing role-string route
// guards keep working. Owner is not offerable — it is a full-access system role.
const BASE_ROLE_OPTIONS = [
  { value: 'MANAGER', label: 'Manager — office / operations staff' },
  { value: 'DRIVER', label: 'Driver — mobile app access' },
  { value: 'FIELD_AGENT', label: 'Field agent — on-ground staff' },
];

/**
 * Create or edit a role's name, description and access tier. Permissions are
 * NOT set here — they're toggled inline on the Enterprise Roles / Branch
 * Access pages themselves, staged and committed via their own sticky
 * Save/Cancel footer. Platform (GLOBAL) roles never open here — only their
 * availability is the enterprise's to use, not their definition. A built-in
 * default role (Manager/Field Agent/Driver) can open here too — its name and
 * access tier are locked (`role.isImmutable`).
 */
const RoleFormModal = ({ open, onClose, role = null, onSaved, branchId = null }) => {
  const editing = Boolean(role);
  // When branchId is set, a newly created role is scoped to that branch only.
  const creatingBranchRole = !editing && !!branchId;
  // Default roles: permissions are editable (elsewhere), name/access tier are not.
  const locked = editing && !!role?.isImmutable;

  const [name, setName] = useState('');
  const [baseRole, setBaseRole] = useState('MANAGER');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(role?.name || '');
    setBaseRole(role?.baseRole || 'MANAGER');
    setDescription(role?.description || '');
  }, [open, role]);

  if (!open) return null;

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) {
      setError('Role name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      let saved;
      if (editing) {
        const body = { name: name.trim(), baseRole, description: description.trim() };
        saved = await AccessControlApi.updateRole(role._id, body);
      } else {
        // Creating is name-only (+ optional description). Access tier defaults on the
        // backend; permissions are granted afterward on the roles page.
        const body = { name: name.trim(), description: description.trim() };
        saved = creatingBranchRole
          ? await AccessControlApi.createBranchRole(branchId, body)
          : await AccessControlApi.createRole(body);
      }
      toast.success(editing ? `Saved "${saved.name}"` : `Created "${saved.name}"`);
      onSaved && onSaved(saved);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || `Failed to ${editing ? 'save' : 'create'} role`);
    } finally {
      setSaving(false);
    }
  };

  const handleOverlayKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!saving) onClose();
    }
  };

  return (
    <div
      className="ff-modal-overlay"
      role="button"
      tabIndex={-1}
      aria-label="Close dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      onKeyDown={handleOverlayKeyDown}
    >
      <div className="ff-modal" role="dialog" aria-modal="true">
        <div className="ff-modal__header">
          <div>
            <h2 className="ff-modal__title">
              {editing
                ? 'Edit role'
                : creatingBranchRole
                  ? 'Create a branch role'
                  : 'Create a role'}
            </h2>
            <p className="ff-modal__subtitle">
              {editing
                ? 'Changes apply to every employee who holds this role.'
                : creatingBranchRole
                  ? 'Name a role for this location. You can grant its permissions after it is created.'
                  : 'Name a role for your enterprise. You can grant its permissions after it is created.'}
            </p>
          </div>
          <button
            type="button"
            className="ff-icon-btn"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="ff-modal__body">
          {error && (
            <div className="ff-alert ff-alert--error" role="alert">
              {error}
            </div>
          )}

          <div className="ff-field">
            <label className="ff-field__label" htmlFor="ac-role-name">
              Role name
            </label>
            <input
              id="ac-role-name"
              className="ff-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Branch Accountant"
              maxLength={60}
              autoFocus={!locked}
              disabled={locked}
            />
            {locked && (
              <span className="ff-field__help">Default role names can&rsquo;t be changed.</span>
            )}
          </div>

          <div className="ff-field">
            <label className="ff-field__label" htmlFor="ac-role-desc">
              Description <span className="ff-muted">(optional)</span>
            </label>
            <textarea
              id="ac-role-desc"
              className="ff-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
            />
          </div>

          {/* Access tier only applies to a custom role you defined — a default
              role's tier is fixed, so there's nothing to show for those. */}
          {editing && !locked && (
            <div className="ff-field">
              <label className="ff-field__label" htmlFor="ac-role-base">
                Access tier
              </label>
              <select
                id="ac-role-base"
                className="rbac-select"
                value={baseRole}
                onChange={(e) => setBaseRole(e.target.value)}
              >
                {BASE_ROLE_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <span className="ff-field__help">
                Sets which part of the product the role belongs to. Grant its permissions from the
                roles page after saving.
              </span>
            </div>
          )}
        </div>

        <div className="ff-modal__footer">
          <button
            type="button"
            className="ff-btn ff-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ff-btn ff-btn--primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving…' : editing ? 'Save role' : 'Create role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleFormModal;
