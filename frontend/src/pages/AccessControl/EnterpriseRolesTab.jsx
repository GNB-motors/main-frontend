import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Building2, Pencil, Plus, Shield, Trash2, UserMinus, UserPlus, Users,
} from 'lucide-react';
import AccessControlApi from './accessControlService';
import PermissionTreeView from './PermissionTreeView';
import AssignRoleDrawer from './AssignRoleDrawer';
import RoleFormModal from './RoleFormModal';

const employeeName = (e) =>
  `${e?.firstName || ''} ${e?.lastName || ''}`.trim() || e?.mobileNumber || e?.email || 'Employee';

/**
 * Enterprise Roles tab — the roles this enterprise can assign, who holds them,
 * and the roles it defines itself.
 *  - Platform roles come from SuperAdmin availability and are read-only here.
 *  - Enterprise roles are created on this screen and are fully editable.
 * Assignment to employees happens here for both.
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
  const [revokingId, setRevokingId] = useState(null);

  // Defining roles is Owner-only on the API; hide the affordances for everyone
  // else rather than letting them fail on submit.
  const canManageRoles = localStorage.getItem('user_role') === 'OWNER';

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
      setSelectedId((prev) => (r?.some((role) => role._id === prev) ? prev : r?.[0]?._id || null));
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectedRole = roles.find((r) => r._id === selectedId) || null;
  const granted = useMemo(() => new Set(selectedRole?.permissionKeys || []), [selectedRole]);

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [String(e._id || e.id), e])),
    [employees],
  );

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

  const openCreate = () => { setEditingRole(null); setRoleFormOpen(true); };
  const openEdit = (role) => { setEditingRole(role); setRoleFormOpen(true); };

  const onRoleSaved = async (saved) => {
    await load();
    if (saved?._id) setSelectedId(saved._id);
  };

  const removeRole = async (role) => {
    const holders = holdersByRole.get(String(role._id)) || 0;
    if (holders > 0) {
      toast.error(`${holders} employee(s) still hold "${role.name}". Revoke those assignments first.`);
      return;
    }
     
    if (!window.confirm(`Delete the role "${role.name}"? This cannot be undone.`)) return;
    try {
      await AccessControlApi.deleteRole(role._id);
      toast.success(`Deleted "${role.name}"`);
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to delete role');
    }
  };

  const revoke = async (assignment) => {
    const who = employeeName(employeeById.get(String(assignment.userId)));
     
    if (!window.confirm(`Revoke "${assignment.roleId?.name}" from ${who}? They lose that access immediately.`)) return;
    setRevokingId(assignment._id);
    try {
      await AccessControlApi.revokeAssignment(assignment._id);
      toast.success('Assignment revoked');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to revoke assignment');
    } finally {
      setRevokingId(null);
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
            <button type="button" className="ff-btn ff-btn--secondary" onClick={openCreate}>
              <Plus size={16} /> New role
            </button>
          )}
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

      {!loading && roles.length === 0 && (
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
            {selectedRole && (
              <>
                <div className="ac-detail__head">
                  <div>
                    <div className="rbac-detail__title"><Shield size={16} /> {selectedRole.name}</div>
                    <div className="rbac-detail__sub">
                      {selectedRole.description || 'No description.'} · maps to <strong>{selectedRole.baseRole}</strong>
                    </div>
                  </div>
                  {canManageRoles && selectedRole.isEnterpriseOwned && (
                    <div className="ac-detail__actions">
                      <button type="button" className="ff-btn ff-btn--secondary" onClick={() => openEdit(selectedRole)}>
                        <Pencil size={16} /> Edit
                      </button>
                      <button type="button" className="ff-btn ff-btn--ghost" onClick={() => removeRole(selectedRole)}>
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="rbac-banner">
                  <Users size={16} />
                  {selectedRole.isEnterpriseOwned ? (
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
                </div>

                <PermissionTreeView catalog={catalog} granted={granted} readOnly />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Who holds what ── */}
      {roles.length > 0 && (
        <div className="ff-card ac-assignments">
          <div className="ac-assignments__head">
            <div className="rbac-detail__title"><Users size={16} /> Assigned employees</div>
            <span className="ff-meta">An employee holds one role for the enterprise and one per location.</span>
          </div>

          {assignments.length === 0 ? (
            <div className="ff-state">
              <div className="ff-state__icon"><UserPlus size={22} /></div>
              <div className="ff-state__title">Nobody has been assigned a role yet</div>
              <div>Assign a role to give an employee access to the parts of the product they need.</div>
            </div>
          ) : (
            <div className="ac-table__wrap">
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Applies to</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a._id}>
                      <td>{employeeName(employeeById.get(String(a.userId)))}</td>
                      <td>
                        <Shield size={14} /> {a.roleId?.name || 'Deleted role'}
                        {a.roleId?.baseRole && <span className="ac-chip ac-chip--inherited">{a.roleId.baseRole}</span>}
                      </td>
                      <td>
                        {a.scope === 'BRANCH' ? (
                          <><Building2 size={14} /> {a.branchId?.name || 'Location'}</>
                        ) : (
                          'Enterprise (no location selected)'
                        )}
                      </td>
                      <td className="ac-table__actions">
                        <button
                          type="button"
                          className="ff-btn ff-btn--ghost"
                          onClick={() => revoke(a)}
                          disabled={revokingId === a._id}
                        >
                          <UserMinus size={16} /> {revokingId === a._id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        catalog={catalog}
        role={editingRole}
        onSaved={onRoleSaved}
      />
    </div>
  );
};

export default EnterpriseRolesTab;
