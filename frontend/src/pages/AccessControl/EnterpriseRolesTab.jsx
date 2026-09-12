import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, RotateCcw, Save, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';
import AssignRoleDrawer from './AssignRoleDrawer';
import RoleFormModal from './RoleFormModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { getUserRole } from '../../utils/session.js';

const setsEqual = (a, b) => a.size === b.size && [...a].every((k) => b.has(k));

/**
 * Enterprise Roles tab — the roles this enterprise can assign, who holds them,
 * and the roles it defines itself.
 *  - Platform (GLOBAL) roles come from SuperAdmin availability and are
 *    read-only here — shared across every enterprise.
 *  - Default roles (Manager/Field Agent/Driver) are seeded for this org alone,
 *    so their permissions ARE editable here; only their name/access tier is
 *    locked. Owner is never editable (always full-access).
 *  - Custom roles this enterprise created are fully editable.
 * `role.canEditPermissions` (from the API) is the single source of truth for
 * which of these applies — see accessControl.service.js.
 * Permissions are toggled directly on this page (staged, committed via the
 * sticky Save/Cancel footer — same pattern as Branch Access). The Edit modal
 * (RoleFormModal) only changes name/description/access tier now.
 * Assignment to employees happens here for all of them.
 */
const EnterpriseRolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  // Role pending deletion (drives the confirm modal) + in-flight flag.
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Staged permission edits for the selected role — toggled inline on the page,
  // committed via the sticky footer. `original` is the last-loaded-from-server
  // snapshot; `dirty` compares the two.
  const [granted, setGranted] = useState(new Set());
  const [original, setOriginal] = useState(new Set());
  const [savingPerms, setSavingPerms] = useState(false);

  // Defining roles is Owner-only on the API; hide the affordances for everyone
  // else rather than letting them fail on submit.
  const canManageRoles = getUserRole() === 'OWNER';
  const navigate = useNavigate();

  // Tracks the current selection without going stale inside the memoized
  // `load` below (a plain closed-over `selectedId` would freeze at whatever
  // it was when `load` was first created, since `load`'s deps never change).
  const selectedIdRef = useRef(null);

  // Select a role and (re)snapshot its permissions as the editable/original sets.
  const applySelection = useCallback((role) => {
    selectedIdRef.current = role?._id || null;
    setSelectedId(role?._id || null);
    setGranted(new Set(role?.permissionKeys || []));
    setOriginal(new Set(role?.permissionKeys || []));
  }, []);

  const load = useCallback(
    async (preferId) => {
      setLoading(true);
      setError('');
      try {
        const [{ roles: r, catalog: c }, br, asg, emp] = await Promise.all([
          AccessControlApi.getRolesAndCatalog(),
          AccessControlApi.listBranches(),
          AccessControlApi.listAssignments(),
          AccessControlApi.listEmployees().catch(() => []),
        ]);
        const list = r || [];
        setRoles(list);
        setCatalog(c || []);
        setBranches(br || []);
        setAssignments(asg || []);
        setEmployees(emp || []);
        const wantId = preferId ?? selectedIdRef.current;
        applySelection(list.find((role) => role._id === wantId) || list[0] || null);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    },
    [applySelection],
  );

  useEffect(() => {
    load();
  }, [load]);

  const selectedRole = roles.find((r) => r._id === selectedId) || null;
  const canEditSelected = canManageRoles && !!selectedRole?.canEditPermissions;
  const dirty = useMemo(() => !setsEqual(granted, original), [granted, original]);

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

  const cancelPermissionEdits = () => setGranted(new Set(original));

  const savePermissionEdits = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);
    try {
      await AccessControlApi.updateRole(selectedRole._id, { permissionKeys: [...granted] });
      toast.success(`Saved permissions for "${selectedRole.name}"`);
      await load(selectedRole._id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPerms(false);
    }
  };

  // How many people hold each role — shown on the role rows and used to explain
  // why a delete is blocked.
  const holdersByRole = useMemo(() => {
    const counts = new Map();
    assignments.forEach((a) => {
      const id = String(a.roleId?._id || a.roleId);
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [assignments]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleFormOpen(true);
  };
  const openEdit = (role) => {
    setEditingRole(role);
    setRoleFormOpen(true);
  };

  const onRoleSaved = async (saved) => {
    await load(saved?._id);
  };

  // Open the styled confirm modal. Guard first: a role still held by employees
  // can't be deleted (the backend also blocks it) — surface that up front.
  const removeRole = (role) => {
    const holders = holdersByRole.get(String(role._id)) || 0;
    if (holders > 0) {
      toast.error(
        `${holders} employee(s) still hold "${role.name}". Revoke those assignments first.`,
      );
      return;
    }
    setDeletingRole(role);
  };

  const confirmDeleteRole = async () => {
    if (!deletingRole) return;
    setDeleteBusy(true);
    try {
      await AccessControlApi.deleteRole(deletingRole._id);
      toast.success(`Deleted "${deletingRole.name}"`);
      setDeletingRole(null);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete role');
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div>
      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? (
            'Loading…'
          ) : (
            <>
              <strong>{roles.length}</strong> role{roles.length === 1 ? '' : 's'} available ·{' '}
              <strong>{assignments.length}</strong> assignment{assignments.length === 1 ? '' : 's'}
            </>
          )}
        </span>
        <div className="ac-toolbar__actions">
          {canManageRoles && (
            <button type="button" className="ff-btn ff-btn--secondary" onClick={openCreate}>
              <Plus size={16} /> New role
            </button>
          )}
          <button
            type="button"
            className="ff-btn ff-btn--secondary"
            onClick={() => navigate('/access-control/assigned-employees')}
          >
            <Users size={16} /> Assigned employees
          </button>
          <button
            type="button"
            className="ff-btn ff-btn--primary"
            onClick={() => setDrawerOpen(true)}
            disabled={!roles.length}
          >
            <UserPlus size={16} /> Assign role
          </button>
        </div>
      </div>

      {error && (
        <div className="ff-alert ff-alert--error" role="alert">
          {error}
        </div>
      )}

      {!loading && roles.length === 0 && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon">
              <Shield size={22} />
            </div>
            <div className="ff-state__title">No roles yet</div>
            <div>
              {canManageRoles
                ? 'Create a role for your enterprise, or ask your platform administrator to make one available.'
                : 'Your platform administrator hasn’t made any roles available to your enterprise.'}
            </div>
            {canManageRoles && (
              <button
                type="button"
                className="ff-btn ff-btn--primary"
                style={{ marginTop: 12 }}
                onClick={openCreate}
              >
                <Plus size={16} /> New role
              </button>
            )}
          </div>
        </div>
      )}

      {roles.length > 0 && (
        <div className="rbac-layout">
          <div className="rbac-master">
            {roles.map((role) => (
              <button
                key={role._id}
                type="button"
                className={`rbac-role ${role._id === selectedId ? 'rbac-role--active' : ''}`}
                onClick={() => applySelection(role)}
              >
                <span className="rbac-role__name">
                  <Shield size={15} /> {role.name}
                  <span
                    className={`ac-chip ${role.isEnterpriseOwned ? 'ac-chip--owned' : 'ac-chip--platform'}`}
                  >
                    {role.isEnterpriseOwned ? 'Yours' : 'Platform'}
                  </span>
                </span>
                <span className="rbac-role__meta">
                  {role.baseRole} · {(role.permissionKeys || []).length} permission(s) ·{' '}
                  {holdersByRole.get(String(role._id)) || 0} holder(s)
                </span>
              </button>
            ))}
          </div>

          <div className="rbac-detail">
            {selectedRole && (
              <>
                <div className="ac-detail__head">
                  <div>
                    <div className="rbac-detail__title">
                      <Shield size={16} /> {selectedRole.name}
                    </div>
                    <div className="rbac-detail__sub">
                      {selectedRole.description || 'No description.'} · maps to{' '}
                      <strong>{selectedRole.baseRole}</strong>
                    </div>
                  </div>
                  {canManageRoles && selectedRole.canEditPermissions && (
                    <div className="ac-detail__actions">
                      <button
                        type="button"
                        className="ff-btn ff-btn--secondary"
                        onClick={() => openEdit(selectedRole)}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      {selectedRole.isEnterpriseOwned && (
                        <button
                          type="button"
                          className="ff-btn ff-btn--ghost"
                          onClick={() => removeRole(selectedRole)}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {(selectedRole.isEnterpriseOwned || !selectedRole.canEditPermissions) && (
                  <div className="rbac-banner">
                    <Users size={16} />
                    {selectedRole.isEnterpriseOwned ? (
                      <>
                        Your enterprise defines this role. Edit it here, and use{' '}
                        <strong>Branch Access</strong> to change what it grants at a single
                        location.
                      </>
                    ) : (
                      <>
                        These are the enterprise defaults for this role (managed by your platform
                        administrator). Use <strong>Branch Access</strong> to override them per
                        location.
                      </>
                    )}
                  </div>
                )}

                <PermissionTreeView
                  catalog={catalog}
                  granted={granted}
                  readOnly={!canEditSelected}
                  onToggleKey={toggleKey}
                  onToggleGroup={toggleGroup}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Full-page sticky footer (matches the Employee form's FormFooter) —
          not scoped to the detail card, so it stays anchored to the viewport. */}
      {selectedRole && canEditSelected && (
        <div className="form-footer">
          <div className="form-footer-content">
            <div className="form-footer-actions">
              <button
                type="button"
                className="ff-btn ff-btn--secondary"
                onClick={cancelPermissionEdits}
                disabled={!dirty || savingPerms}
              >
                <RotateCcw size={16} /> Cancel
              </button>
              <button
                type="button"
                className="ff-btn ff-btn--primary"
                onClick={savePermissionEdits}
                disabled={!dirty || savingPerms}
              >
                <Save size={16} /> {savingPerms ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssignRoleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        roles={roles}
        branches={branches}
        employees={employees}
        assignments={assignments}
        onAssigned={load}
      />

      <RoleFormModal
        open={roleFormOpen}
        onClose={() => setRoleFormOpen(false)}
        role={editingRole}
        onSaved={onRoleSaved}
      />

      <ConfirmDeleteModal
        open={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={confirmDeleteRole}
        title="Delete role"
        message="This role will be removed. This cannot be undone."
        itemName={deletingRole?.name}
        confirmLabel="Delete role"
        busy={deleteBusy}
      />
    </div>
  );
};

export default EnterpriseRolesTab;
