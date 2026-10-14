import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Save, RotateCcw, Shield, Lock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../Drivers/Component';
import RbacApi from './rbacService';
import keysOfRole from './rbac/keysOfRole';
import RoleList from './rbac/RoleList';
import PermissionGroups from './rbac/PermissionGroups';
import CreateRoleModal from './rbac/CreateRoleModal';
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
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
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
        <RoleList
          loading={loading}
          roles={roles}
          selectedId={selectedId}
          selectRole={selectRole}
          setAddError={setAddError}
          setAddOpen={setAddOpen}
        />

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

                  <PermissionGroups
                    groups={groups}
                    collapsed={collapsed}
                    groupState={groupState}
                    granted={granted}
                    toggleCollapse={toggleCollapse}
                    toggleGroup={toggleGroup}
                    toggleKey={toggleKey}
                    readOnly={readOnly}
                  />

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
        <CreateRoleModal
          newName={newName}
          setNewName={setNewName}
          newBaseRole={newBaseRole}
          setNewBaseRole={setNewBaseRole}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          addError={addError}
          adding={adding}
          setAddOpen={setAddOpen}
          submitAdd={submitAdd}
        />
      )}
    </div>
  );
};

export default RbacRolesPage;
