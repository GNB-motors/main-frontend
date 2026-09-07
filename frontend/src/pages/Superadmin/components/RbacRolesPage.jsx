import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Plus,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Shield,
  Lock,
  X,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import RbacApi from './rbacService';
import { getUserRole } from '../../../utils/session';
import './FeatureFlags.css';
import './Rbac.css';

// Preferred order for permission groups; anything else sorts alphabetically after.
// Group order mirrors the sidebar (the catalog is one group per sidebar item).
const GROUP_ORDER = [
  'Overview',
  'Vehicles',
  'Workforce',
  'ERP Home',
  'Planning',
  'Approvals',
  'Pipeline',
  'Billing & Receivables',
  'Payables',
  'Accounts & Ledger',
  'Masters & Settings',
  'Fleet Operations',
  'Fuel Management',
  'Locations',
  'Geofence',
  'Khata Ledger',
  'Reports',
];
const BASE_ROLE_OPTIONS = ['MANAGER', 'DRIVER', 'FIELD_AGENT'];

/* Binary pill toggle (reuses the FeatureFlags switch styling). */
const Toggle = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className="ff-switch"
    onClick={onChange}
  >
    <span className="ff-switch__thumb" />
  </button>
);

/* Group-level tri-state checkbox: all / none / mixed. */
const GroupCheck = ({ state, onToggle, disabled }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'mixed';
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="rbac-group__check"
      checked={state === 'all'}
      disabled={disabled}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      aria-label="Toggle all permissions in this group"
    />
  );
};

const keysOfRole = (role) => {
  if (!role) return [];
  if (Array.isArray(role.permissionKeys)) return role.permissionKeys;
  // Fallback for roles stored only as a { key: bool } map.
  return Object.entries(role.permissions || {})
    .filter(([, v]) => v === true)
    .map(([k]) => k);
};

const RbacRolesPage = () => {
  const navigate = useNavigate();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [granted, setGranted] = useState(new Set());
  const [original, setOriginal] = useState(new Set());
  const [collapsed, setCollapsed] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Create-role modal
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBaseRole, setNewBaseRole] = useState('MANAGER');
  const [newDescription, setNewDescription] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/overview');
  }, [navigate]);

  const selectRole = useCallback((role) => {
    setSelectedId(role._id);
    const set = new Set(keysOfRole(role));
    setGranted(set);
    setOriginal(new Set(set));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rolesData, permsData] = await Promise.all([
        RbacApi.listRoles(),
        RbacApi.listPermissions(),
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || []);
      if (rolesData?.length) {
        const keep = rolesData.find((r) => r._id === selectedId) || rolesData[0];
        selectRole(keep);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectRole]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = roles.find((r) => r._id === selectedId) || null;
  const isOwner = selectedRole?.baseRole === 'OWNER';
  const readOnly = isOwner; // Owner = full access, nothing to toggle.

  // Group permissions for the tree.
  const groups = useMemo(() => {
    const byGroup = new Map();
    permissions.forEach((p) => {
      if (p.isActive === false) return;
      const g = p.group || 'General';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g).push(p);
    });
    const entries = [...byGroup.entries()].map(([group, items]) => ({
      group,
      items: items.sort((a, b) => (a.label || a.key).localeCompare(b.label || b.key)),
    }));
    entries.sort((a, b) => {
      const ai = GROUP_ORDER.indexOf(a.group);
      const bi = GROUP_ORDER.indexOf(b.group);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a.group.localeCompare(b.group);
    });
    return entries;
  }, [permissions]);

  const dirty = useMemo(() => {
    if (granted.size !== original.size) return true;
    for (const k of granted) if (!original.has(k)) return true;
    return false;
  }, [granted, original]);

  const toggleKey = (key) => {
    if (readOnly) return;
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupState = (items) => {
    const on = items.filter((p) => granted.has(p.key)).length;
    if (on === 0) return 'none';
    if (on === items.length) return 'all';
    return 'mixed';
  };

  const toggleGroup = (items) => {
    if (readOnly) return;
    const allOn = items.every((p) => granted.has(p.key));
    setGranted((prev) => {
      const next = new Set(prev);
      items.forEach((p) => (allOn ? next.delete(p.key) : next.add(p.key)));
      return next;
    });
  };

  const toggleCollapse = (group) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const save = async () => {
    if (!selectedRole || readOnly) return;
    setSaving(true);
    setError('');
    try {
      const updated = await RbacApi.updateRole(selectedRole._id, { permissionKeys: [...granted] });
      setRoles((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setOriginal(new Set(keysOfRole(updated)));
      setGranted(new Set(keysOfRole(updated)));
      toast.success(`Saved "${updated.name}"`);
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to save role';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setGranted(new Set(original));

  const submitAdd = async () => {
    setAddError('');
    if (newName.trim().length < 2) {
      setAddError('Role name must be at least 2 characters.');
      return;
    }
    setAdding(true);
    try {
      const created = await RbacApi.createRole({
        name: newName.trim(),
        baseRole: newBaseRole,
        description: newDescription.trim(),
        permissionKeys: [],
      });
      setRoles((prev) => [...prev, created]);
      selectRole(created);
      setAddOpen(false);
      setNewName('');
      setNewDescription('');
      setNewBaseRole('MANAGER');
      toast.success(`Created "${created.name}"`);
    } catch (e) {
      setAddError(e.response?.data?.message || 'Failed to create role');
    } finally {
      setAdding(false);
    }
  };

  const grantedCount = granted.size;

  return (
    <div className="ff-page">
      <PageHeader
        backLabel="Dashboard"
        backPath="/superadmin"
        currentLabel="Roles & Permissions"
        title="Roles & Permissions"
        description="Define global roles and assign permissions. These roles are reused across every enterprise."
      />

      {error && (
        <div className="ff-alert ff-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="rbac-layout">
        {/* ── Master: role list ── */}
        <div className="rbac-master">
          {loading && (
            <div className="ff-state">
              <div className="ff-spinner" />
            </div>
          )}
          {!loading &&
            roles.map((role) => (
              <button
                key={role._id}
                type="button"
                className={`rbac-role ${role._id === selectedId ? 'rbac-role--active' : ''}`}
                onClick={() => selectRole(role)}
              >
                <span className="rbac-role__name">
                  {role.baseRole === 'OWNER' ? <ShieldCheck size={15} /> : <Shield size={15} />}
                  {role.name}
                  {role.isImmutable && <Lock size={12} style={{ color: '#a2a8bd' }} />}
                </span>
                <span className="rbac-role__meta">
                  {role.baseRole}
                  {role.isSystem ? ' · system' : role.isImmutable ? ' · built-in' : ' · custom'}
                </span>
              </button>
            ))}
          <button
            type="button"
            className="rbac-fab"
            onClick={() => {
              setAddError('');
              setAddOpen(true);
            }}
          >
            <Plus size={16} /> Add role
          </button>
        </div>

        {/* ── Detail: permission tree ── */}
        <div className="rbac-detail">
          {!selectedRole && !loading && (
            <div className="rbac-empty">
              <Shield size={26} />
              <div>Select a role to view its permissions</div>
            </div>
          )}

          {selectedRole && (
            <>
              <div className="rbac-detail__title">
                {selectedRole.name}
                {selectedRole.isImmutable && <Lock size={14} style={{ color: '#a2a8bd' }} />}
              </div>
              <div className="rbac-detail__sub">
                {selectedRole.description || 'No description.'} · maps to{' '}
                <strong>{selectedRole.baseRole}</strong>
              </div>

              {readOnly ? (
                <div className="rbac-banner">
                  <ShieldCheck size={16} />
                  The Owner is a system role with full access to every permission. It cannot be
                  edited here.
                </div>
              ) : (
                <>
                  <div className="rbac-detail__sub" style={{ marginTop: -8 }}>
                    <strong>{grantedCount}</strong> of <strong>{permissions.length}</strong>{' '}
                    permissions granted
                    {dirty && (
                      <span className="ff-badge ff-badge--brand" style={{ marginLeft: 10 }}>
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  {groups.map(({ group, items }) => {
                    const isCollapsed = collapsed.has(group);
                    const state = groupState(items);
                    const onCount = items.filter((p) => granted.has(p.key)).length;
                    return (
                      <div className="rbac-group" key={group}>
                        <div
                          className="rbac-group__head"
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleCollapse(group)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleCollapse(group);
                            }
                          }}
                        >
                          <span className="rbac-group__title">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                            {group}
                            <span className="rbac-group__count">
                              {onCount}/{items.length}
                            </span>
                          </span>
                          <GroupCheck
                            state={state}
                            onToggle={() => toggleGroup(items)}
                            disabled={readOnly}
                          />
                        </div>
                        {!isCollapsed &&
                          items.map((p) => (
                            <div className="rbac-perm" key={p.key}>
                              <div>
                                <div className="rbac-perm__label">{p.label || p.key}</div>
                                <div className="rbac-perm__desc">
                                  {p.description || <span className="rbac-perm__key">{p.key}</span>}
                                </div>
                              </div>
                              <Toggle
                                checked={granted.has(p.key)}
                                onChange={() => toggleKey(p.key)}
                                disabled={readOnly}
                                label={`Toggle ${p.label || p.key}`}
                              />
                            </div>
                          ))}
                      </div>
                    );
                  })}

                  <div className="rbac-detail__footer">
                    <button
                      type="button"
                      className="ff-btn ff-btn--secondary"
                      onClick={reset}
                      disabled={!dirty || saving}
                    >
                      <RotateCcw size={16} /> Cancel
                    </button>
                    <button
                      type="button"
                      className="ff-btn ff-btn--primary"
                      onClick={save}
                      disabled={!dirty || saving}
                    >
                      <Save size={16} /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create-role modal */}
      {addOpen && (
        <div
          className="ff-modal-overlay"
          role="button"
          tabIndex={-1}
          aria-label="Close dialog"
          onClick={(e) => {
            if (e.target === e.currentTarget && !adding) setAddOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!adding) setAddOpen(false);
            }
          }}
        >
          <div className="ff-modal" role="dialog" aria-modal="true">
            <div className="ff-modal__header">
              <div>
                <h2 className="ff-modal__title">Create a global role</h2>
                <p className="ff-modal__subtitle">
                  Reusable across all enterprises. Assign permissions after creating it.
                </p>
              </div>
              <button
                type="button"
                className="ff-icon-btn"
                onClick={() => setAddOpen(false)}
                disabled={adding}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="ff-modal__body">
              {addError && (
                <div className="ff-alert ff-alert--error" role="alert">
                  {addError}
                </div>
              )}
              <div className="ff-field">
                <label className="ff-field__label" htmlFor="rbac-new-name">
                  Role name
                </label>
                <input
                  id="rbac-new-name"
                  className="ff-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Finance Manager"
                  maxLength={60}
                  autoFocus
                />
              </div>
              <div className="ff-field">
                <label className="ff-field__label" htmlFor="rbac-new-base">
                  Base role (compatibility)
                </label>
                <select
                  id="rbac-new-base"
                  className="rbac-select"
                  value={newBaseRole}
                  onChange={(e) => setNewBaseRole(e.target.value)}
                >
                  {BASE_ROLE_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <span className="ff-field__help">
                  Maps this role onto an existing access tier so legacy route guards keep working.
                </span>
              </div>
              <div className="ff-field">
                <label className="ff-field__label" htmlFor="rbac-new-desc">
                  Description <span className="ff-muted">(optional)</span>
                </label>
                <textarea
                  id="rbac-new-desc"
                  className="ff-textarea"
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  maxLength={300}
                />
              </div>
            </div>
            <div className="ff-modal__footer">
              <button
                type="button"
                className="ff-btn ff-btn--ghost"
                onClick={() => setAddOpen(false)}
                disabled={adding}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ff-btn ff-btn--primary"
                onClick={submitAdd}
                disabled={adding}
              >
                {adding ? 'Creating…' : 'Create role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RbacRolesPage;
