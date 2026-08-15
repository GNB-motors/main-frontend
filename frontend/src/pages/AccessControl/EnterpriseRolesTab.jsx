import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, UserPlus, Users } from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';
import AssignRoleDrawer from './AssignRoleDrawer';

/**
 * Enterprise Roles tab — the roles this enterprise can assign (from SuperAdmin
 * availability) and what each grants. Read-only view of permissions (enterprise
 * defaults are managed by SuperAdmin); assignment to employees happens here.
 */
const EnterpriseRolesTab = () => {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ roles: r, catalog: c }, br, asg] = await Promise.all([
        AccessControlApi.getRolesAndCatalog(),
        AccessControlApi.listBranches(),
        AccessControlApi.listAssignments(),
      ]);
      setRoles(r || []);
      setCatalog(c || []);
      setBranches(br || []);
      setAssignments(asg || []);
      if (r?.length) setSelectedId((prev) => prev || r[0]._id);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedRole = roles.find((r) => r._id === selectedId) || null;
  const granted = useMemo(() => new Set(selectedRole?.permissionKeys || []), [selectedRole]);

  return (
    <div>
      <div className="ff-toolbar">
        <span className="ff-meta">
          {loading ? 'Loading…' : <><strong>{roles.length}</strong> role{roles.length === 1 ? '' : 's'} available · <strong>{assignments.length}</strong> assignment{assignments.length === 1 ? '' : 's'}</>}
        </span>
        <button type="button" className="ff-btn ff-btn--primary" onClick={() => setDrawerOpen(true)} disabled={!roles.length}>
          <UserPlus size={16} /> Assign role
        </button>
      </div>

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      {!loading && roles.length === 0 && (
        <div className="ff-card">
          <div className="ff-state">
            <div className="ff-state__icon"><Shield size={22} /></div>
            <div className="ff-state__title">No roles available yet</div>
            <div>Your platform administrator hasn’t made any roles available to your enterprise.</div>
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
                onClick={() => setSelectedId(role._id)}
              >
                <span className="rbac-role__name"><Shield size={15} /> {role.name}</span>
                <span className="rbac-role__meta">{role.baseRole} · {(role.permissionKeys || []).length} permission(s)</span>
              </button>
            ))}
          </div>

          <div className="rbac-detail">
            {selectedRole && (
              <>
                <div className="rbac-detail__title"><Shield size={16} /> {selectedRole.name}</div>
                <div className="rbac-detail__sub">
                  {selectedRole.description || 'No description.'} · maps to <strong>{selectedRole.baseRole}</strong>
                </div>
                <div className="rbac-banner">
                  <Users size={16} />
                  These are the enterprise defaults for this role (managed by your platform administrator).
                  Use <strong>Branch Access</strong> to override them per location.
                </div>
                <PermissionTreeView catalog={catalog} granted={granted} readOnly />
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
        onAssigned={load}
      />
    </div>
  );
};

export default EnterpriseRolesTab;
