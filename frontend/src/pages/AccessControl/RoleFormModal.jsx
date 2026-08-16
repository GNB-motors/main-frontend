import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';

// The access tier a role maps onto, so the app's existing role-string route
// guards keep working. Owner is not offerable — it is a full-access system role.
const BASE_ROLE_OPTIONS = [
  { value: 'MANAGER', label: 'Manager — office / operations staff' },
  { value: 'DRIVER', label: 'Driver — mobile app access' },
  { value: 'FIELD_AGENT', label: 'Field agent — on-ground staff' },
];

/**
 * Create or edit a role owned by this enterprise, with its permissions picked in
 * the same tree the rest of the screen uses. Platform roles never open here —
 * only their availability is the enterprise's to use, not their definition.
 */
const RoleFormModal = ({ open, onClose, catalog = [], role = null, onSaved, branchId = null }) => {
  const editing = Boolean(role);
  // When branchId is set, a newly created role is scoped to that branch only.
  const creatingBranchRole = !editing && !!branchId;

  const [name, setName] = useState('');
  const [baseRole, setBaseRole] = useState('MANAGER');
  const [description, setDescription] = useState('');
  const [granted, setGranted] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setName(role?.name || '');
    setBaseRole(role?.baseRole || 'MANAGER');
    setDescription(role?.description || '');
    setGranted(new Set(role?.permissionKeys || []));
  }, [open, role]);

  const grantedCount = useMemo(
    () => catalog.filter((p) => granted.has(p.key)).length,
    [catalog, granted],
  );

  const toggleKey = (key) =>
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleGroup = (items, allOn) =>
    setGranted((prev) => {
      const next = new Set(prev);
      items.forEach((p) => (allOn ? next.delete(p.key) : next.add(p.key)));
      return next;
    });

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
        // Editing configures everything: name, access tier, description, permissions.
        const body = {
          name: name.trim(),
          baseRole,
          description: description.trim(),
          permissionKeys: [...granted],
        };
        saved = await AccessControlApi.updateRole(role._id, body);
      } else {
        // Creating is name-only (+ optional description). Access tier defaults on the
        // backend; permissions are granted afterward via Edit.
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

  return (
    <div className="ff-modal-overlay" onClick={() => !saving && onClose()}>
      <div className="ff-modal ac-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ff-modal__header">
          <div>
            <h2 className="ff-modal__title">
              {editing ? 'Edit role' : (creatingBranchRole ? 'Create a branch role' : 'Create a role')}
            </h2>
            <p className="ff-modal__subtitle">
              {editing
                ? 'Changes apply to every employee who holds this role.'
                : (creatingBranchRole
                  ? 'Name a role for this location. You can grant its permissions after it is created.'
                  : 'Name a role for your enterprise. You can grant its permissions after it is created.')}
            </p>
          </div>
          <button type="button" className="ff-icon-btn" onClick={onClose} disabled={saving} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="ff-modal__body">
          {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

          <div className="ff-field">
            <label className="ff-field__label" htmlFor="ac-role-name">Role name</label>
            <input
              id="ac-role-name"
              className="ff-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Branch Accountant"
              maxLength={60}
              autoFocus
            />
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

          {/* Access tier and permissions are only configured when editing an
              existing role — a role is created with just a name, then its
              permissions are granted afterward via Edit. */}
          {editing && (
            <>
              <div className="ff-field">
                <label className="ff-field__label" htmlFor="ac-role-base">Access tier</label>
                <select
                  id="ac-role-base"
                  className="rbac-select"
                  value={baseRole}
                  onChange={(e) => setBaseRole(e.target.value)}
                >
                  {BASE_ROLE_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
                <span className="ff-field__help">
                  Sets which part of the product the role belongs to. The permissions below decide what it can actually do.
                </span>
              </div>

              <div className="ff-field">
                <label className="ff-field__label">
                  Permissions <span className="ff-muted">({grantedCount} of {catalog.length} granted)</span>
                </label>
                <div className="ac-modal__tree">
                  <PermissionTreeView
                    catalog={catalog}
                    granted={granted}
                    onToggleKey={toggleKey}
                    onToggleGroup={toggleGroup}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ff-modal__footer">
          <button type="button" className="ff-btn ff-btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="ff-btn ff-btn--primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save role' : 'Create role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleFormModal;
