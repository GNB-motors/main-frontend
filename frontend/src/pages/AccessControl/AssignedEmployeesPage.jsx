import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Building2, Shield, UserMinus, UserPlus } from 'lucide-react';
import { PageHeader } from '../Drivers/Component';
import AccessControlApi from './accessControlService';
import '../Superadmin/components/FeatureFlags.css';
import '../Superadmin/components/Rbac.css';
import './AccessControl.css';

const employeeName = (e) =>
  `${e?.firstName || ''} ${e?.lastName || ''}`.trim() || e?.mobileNumber || e?.email || 'Employee';

/**
 * Assigned Employees — the full "who holds what" table, on its own page.
 * Reached from a button on the Employee Access Control screen.
 */
const AssignedEmployeesPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revokingId, setRevokingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [asg, emp] = await Promise.all([
        AccessControlApi.listAssignments(),
        AccessControlApi.listEmployees().catch(() => []),
      ]);
      setAssignments(asg || []);
      setEmployees(emp || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [String(e._id || e.id), e])),
    [employees],
  );

  const revoke = async (a) => {
    const who = employeeName(employeeById.get(String(a.userId)));
    if (!window.confirm(`Revoke "${a.roleId?.name}" from ${who}? They lose that access immediately.`)) return;
    setRevokingId(a._id);
    try {
      await AccessControlApi.revokeAssignment(a._id);
      toast.success('Assignment revoked');
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to revoke assignment');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="ff-page">
      <PageHeader
        backLabel="Access Control"
        backPath="/access-control"
        currentLabel="Assigned Employees"
        title="Assigned Employees"
        description="Everyone with a role assigned across your enterprise and its locations."
      />

      {error && <div className="ff-alert ff-alert--error" role="alert">{error}</div>}

      <div className="ff-card ac-assignments">
        <div className="ac-assignments__head">
          <span className="ff-meta">
            {loading ? 'Loading…' : <><strong>{assignments.length}</strong> assignment{assignments.length === 1 ? '' : 's'}</>}
          </span>
        </div>

        {!loading && assignments.length === 0 ? (
          <div className="ff-state">
            <div className="ff-state__icon"><UserPlus size={22} /></div>
            <div className="ff-state__title">Nobody has been assigned a role yet</div>
            <div>Assign roles from the Enterprise Roles tab.</div>
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
    </div>
  );
};

export default AssignedEmployeesPage;
