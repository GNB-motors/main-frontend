import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, ShieldCheck, Trash2, UserPlus, Users, Save, X } from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';
import AssignRoleDrawer from './AssignRoleDrawer';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';

const BASE_ROLE_OPTIONS = [
  { value: 'MANAGER', label: 'Manager — office / operations staff' },
  { value: 'DRIVER', label: 'Driver — mobile app access' },
  { value: 'FIELD_AGENT', label: 'Field agent — on-ground staff' },
];

/**
 * Enterprise Roles tab — the roles this enterprise can assign, who holds them,
 * and the roles it defines itself.
 *  - Platform roles come from SuperAdmin availability and are read-only here.
 *  - Enterprise roles are created on this screen and are fully editable (inline).
 * Assignment to employees happens here for both.
 */
const EnterpriseRolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Role pending deletion (drives the confirm modal) + in-flight flag.
  const [deletingRole, setDeletingRole] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Defining roles is Owner-only on the API; hide the affordances for everyone
  // else rather than letting them fail on submit.
  const { hasPermission } = useFeatureFlags();
  const canManageRoles = localStorage.getItem('user_role') === 'OWNER' || hasPermission('workforce.edit');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ roles: r, catalog: c }, br, asg, emp] = await Promise.all([
        AccessControlApi.getRolesAndCatalog(),
        AccessControlApi.listBranches(),
        AccessControlApi.listAssignments(),
        AccessControlApi.listEmployees().catch(() => []),
      ]);
      setRoles(r || []);
      setCatalog(c || []);
      setBranches(br || []);
      setAssignments(asg || []);
      setEmployees(emp || []);
      if (!isCreating) {
        setSelectedId((prev) => (r?.some((role) => role._id === prev) ? prev : r?.[0]?._id || null));
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [isCreating]);

  useEffect(() => { load(); }, [load]);

  const holdersByRole = useMemo(() => {
    const counts = new Map();
    assignments.forEach((a) => {
      const id = String(a.roleId?._id || a.roleId);
      counts.set(id, (counts.get(id) || 0) + 1);
    });
    return counts;
  }, [assignments]);

  const selectedRole = roles.find((r) => r._id === selectedId) || null;
  const isEnterpriseOwned = selectedRole?.isEnterpriseOwned ?? false;
  
  // Inline edit state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editBaseRole, setEditBaseRole] = useState('MANAGER');
  const [granted, setGranted] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // Sync state when role selection changes
  useEffect(() => {
    if (isCreating) {
      setEditName('');
      setEditDesc('');
      setEditBaseRole('MANAGER');
      setGranted(new Set());
    } else if (selectedRole) {
      setEditName(selectedRole.name || '');
      setEditDesc(selectedRole.description || '');
      setEditBaseRole(selectedRole.baseRole || 'MANAGER');
      setGranted(new Set(selectedRole.permissionKeys || []));
    } else {
      setEditName('');
      setEditDesc('');
      setEditBaseRole('MANAGER');
      setGranted(new Set());
    }
  }, [selectedRole, isCreating]);

  const isDirty = useMemo(() => {
    if (isCreating) return true; // Always dirty if creating
    if (!selectedRole) return false;
    if (editName !== (selectedRole.name || '')) return true;
    if (editDesc !== (selectedRole.description || '')) return true;
    if (editBaseRole !== (selectedRole.baseRole || 'MANAGER')) return true;
    const orig = new Set(selectedRole.permissionKeys || []);
    if (granted.size !== orig.size) return true;
    for (const key of granted) if (!orig.has(key)) return true;
    return false;
  }, [isCreating, selectedRole, editName, editDesc, editBaseRole, granted]);

  const toggleKey = (key) => {
    if (!isCreating && (!canManageRoles || !isEnterpriseOwned)) return;
    setGranted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (items, allOn) => {
    if (!isCreating && (!canManageRoles || !isEnterpriseOwned)) return;
    setGranted((prev) => {
      const next = new Set(prev);
      items.forEach((p) => (allOn ? next.delete(p.key) : next.add(p.key)));
      return next;
    });
  };

  const saveRole = async () => {
    if (editName.trim().length < 2) {
      toast.error('Role name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: editName.trim(),
        baseRole: editBaseRole,
        description: editDesc.trim(),
        permissionKeys: [...granted],
      };
      
      let saved;
      if (isCreating) {
        saved = await AccessControlApi.createRole(body);
        toast.success(`Created "${saved.name}"`);
        setIsCreating(false);
      } else {
        saved = await AccessControlApi.updateRole(selectedRole._id, body);
        toast.success(`Saved "${saved.name}"`);
      }
      
      await load();
      if (saved?._id) setSelectedId(saved._id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };
  
  const cancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
      setSelectedId(roles?.[0]?._id || null);
    } else if (selectedRole) {
      setEditName(selectedRole.name || '');
      setEditDesc(selectedRole.description || '');
      setEditBaseRole(selectedRole.baseRole || 'MANAGER');
      setGranted(new Set(selectedRole.permissionKeys || []));
    }
  };

  const openCreate = () => {
    setSelectedId(null);
    setIsCreating(true);
  };

  const removeRole = (role) => {
    const holders = holdersByRole.get(String(role._id)) || 0;
    if (holders > 0) {
      toast.error(`${holders} employee(s) still hold "${role.name}". Revoke those assignments first.`);
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
          {loading ? 'Loading…' : (
            <>
              <strong>{roles.length}</strong> role{roles.length === 1 ? '' : 's'} available ·{' '}
              <strong>{assignments.length}</strong> assignment{assignments.length === 1 ? '' : 's'}
            </>
          )}
        </span>
        <div className="ac-toolbar__actions">
          {canManageRoles && (
            <button type="button" className="ff-btn ff-btn--secondary" onClick={openCreate} disabled={isCreating}>
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

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      {!loading && roles.length === 0 && !isCreating && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon"><Shield size={22} /></div>
            <div className="ff-state__title">No roles yet</div>
            <div>
              {canManageRoles
                ? 'Create a role for your enterprise, or ask your platform administrator to make one available.'
                : 'Your platform administrator hasn’t made any roles available to your enterprise.'}
            </div>
            {canManageRoles && (
              <button type="button" className="ff-btn ff-btn--primary" style={{ marginTop: 12 }} onClick={openCreate}>
                <Plus size={16} /> New role
              </button>
            )}
          </div>
        </div>
      )}

      {(roles.length > 0 || isCreating) && (
        <div className="rbac-layout">
          <div className="rbac-master">
            {isCreating && (
              <button
                type="button"
                className="rbac-role rbac-role--active"
              >
                <span className="rbac-role__name">
                  <Plus size={15} /> New Role
                </span>
                <span className="rbac-role__meta">Creating...</span>
              </button>
            )}
            {roles.map((role) => (
              <button
                key={role._id}
                type="button"
                className={`rbac-role ${!isCreating && role._id === selectedId ? 'rbac-role--active' : ''}`}
                onClick={() => { setIsCreating(false); setSelectedId(role._id); }}
              >
                <span className="rbac-role__name">
                  <Shield size={15} /> {role.name}
                  <span className={`ac-chip ${role.isEnterpriseOwned ? 'ac-chip--owned' : 'ac-chip--platform'}`}>
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
            {(selectedRole || isCreating) && (
              <>
                <div className="ac-detail__head" style={{ display: 'block' }}>
                  {(!isCreating && (!canManageRoles || !isEnterpriseOwned)) ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div className="rbac-detail__title"><ShieldCheck size={16} /> {selectedRole.name}</div>
                        <div className="rbac-detail__sub">
                          {selectedRole.description || 'No description.'} · maps to <strong>{selectedRole.baseRole}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={20} />
                          {isCreating ? 'Create New Role' : 'Edit Role Details'}
                        </h3>
                        <div className="ac-detail__actions" style={{ display: 'flex', gap: '12px' }}>
                          {isDirty && !saving && (
                            <button type="button" className="ff-btn ff-btn--ghost" onClick={cancelEdit}>
                              <X size={16} /> Cancel
                            </button>
                          )}
                          {!isCreating && (
                            <button type="button" className="ff-btn ff-btn--ghost" style={{ color: 'var(--red-600)' }} onClick={() => removeRole(selectedRole)}>
                              <Trash2 size={16} /> Delete
                            </button>
                          )}
                          <button
                            type="button"
                            className="ff-btn ff-btn--primary"
                            onClick={saveRole}
                            disabled={!isDirty || saving}
                          >
                            <Save size={16} /> {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="ff-field" style={{ marginBottom: 0 }}>
                          <label className="ff-field__label" htmlFor="ac-role-name">Role name</label>
                          <input
                            id="ac-role-name"
                            className="ff-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="e.g. Branch Accountant"
                            maxLength={60}
                          />
                        </div>
                        <div className="ff-field" style={{ marginBottom: 0 }}>
                          <label className="ff-field__label" htmlFor="ac-role-base">Access tier</label>
                          <select
                            id="ac-role-base"
                            className="rbac-select ff-input"
                            value={editBaseRole}
                            onChange={(e) => setEditBaseRole(e.target.value)}
                            style={{ height: '36px', width: '100%', padding: '0 12px' }}
                          >
                            {BASE_ROLE_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="ff-field" style={{ marginBottom: 0 }}>
                        <label className="ff-field__label" htmlFor="ac-role-desc">Description</label>
                        <textarea
                          id="ac-role-desc"
                          className="ff-textarea"
                          rows={2}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="What is this role responsible for?"
                          maxLength={300}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* <div className="rbac-banner">
                  <Users size={16} />
                  {isCreating ? (
                    <>
                      Name a role for your enterprise. You can grant its permissions here.
                    </>
                  ) : selectedRole.isEnterpriseOwned ? (
                    <>
                      Your enterprise defines this role. Edit it here, and use <strong>Branch Access</strong> to
                      change what it grants at a single location.
                    </>
                  ) : (
                    <>
                      These are the enterprise defaults for this role (managed by your platform administrator).
                      Use <strong>Branch Access</strong> to override them per location.
                    </>
                  )}
                </div> */}

                <div className="ff-field" style={{ padding: '0 16px' }}>
                  <label className="ff-field__label">
                    Permissions <span className="ff-muted">({granted.size} of {catalog.length} granted)</span>
                  </label>
                </div>
                
                <PermissionTreeView 
                  catalog={catalog} 
                  granted={granted} 
                  onToggleKey={toggleKey}
                  onToggleGroup={toggleGroup}
                  readOnly={!isCreating && (!canManageRoles || !isEnterpriseOwned)} 
                />
              </>
            )}
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

      <ConfirmDeleteModal
        open={!!deletingRole}
        title="Delete this role?"
        message={`"${deletingRole?.name}" will be permanently deleted from the enterprise. Platform roles cannot be deleted here.`}
        busy={deleteBusy}
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeletingRole(null)}
      />
    </div>
  );
};

export default EnterpriseRolesTab;
