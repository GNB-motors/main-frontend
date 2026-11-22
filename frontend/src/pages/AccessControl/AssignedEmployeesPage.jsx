import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, Building2, Shield, UserMinus, UserPlus } from 'lucide-react';
import AccessControlApi from './accessControlService';
import { useConfirm } from '../../components/ui/confirmContext';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { activeFilterCount, footerSummary } from '../../lib/tableState';
import { humanise } from '../../lib/vocabulary';
import { describeError } from '../../errors/errorMessages';
import logger from '../../utils/logger';
import '../Superadmin/components/FeatureFlags.css';
import '../Superadmin/components/Rbac.css';
import './AccessControl.css';

const employeeName = (e) => {
  // No employee record at all is an unknown identity, not a nameless one.
  if (!e) return 'Unknown employee';
  return (
    `${e?.firstName || ''} ${e?.lastName || ''}`.trim() || e?.mobileNumber || e?.email || 'Employee'
  );
};

/**
 * Assigned Employees — the full "who holds what" table, on its own page.
 * Reached from a button on the Employee Access Control screen.
 *
 * The assignments endpoint returns the whole list in one payload, so the
 * search is client-side over the loaded assignments (name, role, mobile).
 */
const AssignedEmployeesPage = () => {
  const [assignments, setAssignments] = useState([]);
  const confirm = useConfirm();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState(null);
  const [employeesError, setEmployeesError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [q, setQ] = useState('');

  /** The employee directory — its own read, its own failure, its own Retry. */
  const loadEmployees = useCallback(async () => {
    setEmployeesError(null);
    try {
      const emp = await AccessControlApi.listEmployees();
      setEmployees(Array.isArray(emp) ? emp : emp || []);
    } catch (e) {
      setEmployeesError(e);
      logger.error('ui', 'Assigned employees: the employee lookup failed', {
        status: e?.status ?? e?.response?.status ?? null,
      });
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setAssignmentsError(null);
    // Two independent reads. A failed employee lookup must not hide the
    // assignments, and a failed assignments read must not hide the names.
    await Promise.allSettled([
      AccessControlApi.listAssignments()
        .then((asg) => setAssignments(asg || []))
        .catch((e) => {
          setAssignmentsError(e);
          logger.error('ui', 'Assigned employees: the assignments failed', {
            status: e?.status ?? e?.response?.status ?? null,
          });
        }),
      loadEmployees(),
    ]);
    setLoading(false);
  }, [loadEmployees]);

  useEffect(() => {
    load();
  }, [load]);

  const employeeById = useMemo(
    () => new Map(employees.map((e) => [String(e._id || e.id), e])),
    [employees],
  );

  // Flatten each assignment with the fields the table, the search and the
  // export all read. baseRole is an UPPER_SNAKE enum — humanise it so it is
  // never rendered raw.
  const rows = useMemo(
    () =>
      assignments.map((a) => {
        const emp = employeeById.get(String(a.userId));
        return {
          ...a,
          // A failed lookup is an unknown identity, never a made-up name and
          // never an empty list that looks like "nobody is assigned".
          employeeNameText: employeesError ? 'Name unavailable' : employeeName(emp),
          employeeMobile: employeesError ? '' : emp?.mobileNumber || '',
          roleName: a.roleId?.name || 'Deleted role',
          baseRoleLabel: a.roleId?.baseRole ? humanise(a.roleId.baseRole) : '',
          appliesTo:
            a.scope === 'BRANCH'
              ? a.branchId?.name || 'Location'
              : 'Enterprise (no location selected)',
        };
      }),
    [assignments, employeeById, employeesError],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.employeeNameText, r.roleName, r.employeeMobile].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [rows, q]);

  const columns = [
    { key: 'employeeNameText', label: 'Employee' },
    {
      key: 'roleName',
      label: 'Role',
      render: (r) => (
        <>
          <Shield size={14} /> {r.roleName}
          {r.baseRoleLabel && <span className="ac-chip ac-chip--inherited">{r.baseRoleLabel}</span>}
        </>
      ),
    },
    {
      key: 'appliesTo',
      label: 'Applies to',
      render: (r) =>
        r.scope === 'BRANCH' ? (
          <>
            <Building2 size={14} /> {r.appliesTo}
          </>
        ) : (
          r.appliesTo
        ),
    },
    {
      key: '_revoke',
      label: '',
      render: (r) => (
        <button
          type="button"
          className="ff-btn ff-btn--ghost"
          onClick={() => revoke(r)}
          disabled={revokingId === r._id}
        >
          <UserMinus size={16} /> {revokingId === r._id ? 'Revoking…' : 'Revoke'}
        </button>
      ),
    },
  ];

  const exportColumns = [
    { key: 'employeeNameText', label: 'Employee' },
    { key: 'employeeMobile', label: 'Mobile' },
    { key: 'roleName', label: 'Role' },
    { key: 'baseRoleLabel', label: 'Base role' },
    { key: 'appliesTo', label: 'Applies to' },
  ];

  const revoke = async (a) => {
    const who = employeeName(employeeById.get(String(a.userId)));
    const ok = await confirm({
      title: `Revoke "${a.roleId?.name}" from ${who}?`,
      body: 'They lose that access immediately.',
      confirmLabel: 'Revoke access',
      danger: true,
    });
    if (!ok) return;
    setRevokingId(a._id);
    try {
      await AccessControlApi.revokeAssignment(a._id);
      toast.success('Assignment revoked');
      await load();
    } catch (e) {
      const info = describeError(e, { fallbackTitle: 'The access could not be removed.' });
      toast.error(`${info.title} ${info.message}`);
      logger.error('ui', 'Assigned employees: the revoke failed', {
        status: e?.status ?? e?.response?.status ?? null,
      });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="ff-page">
      {employeesError && (
        <div className="ff-alert ff-alert--error" role="alert">
          <span>
            We couldn&apos;t load the employee names. The assignments below are correct, but the
            names and mobile numbers are unknown until this is loaded again.
          </span>
          <button type="button" className="ff-btn ff-btn--ghost" onClick={loadEmployees}>
            Retry
          </button>
        </div>
      )}

      <PageShell
        title="Assigned Employees"
        subtitle="Everyone with a role assigned across your enterprise and its locations."
        count={filtered.length}
        actions={
          <button type="button" className="pshell-btn" onClick={() => window.history.back()}>
            ← Back to Access Control
          </button>
        }
        filters={
          <FilterBar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name, role or mobile…"
            activeCount={activeFilterCount({ q })}
            onClear={() => setQ('')}
            right={
              <ExportButton
                rows={filtered}
                columns={exportColumns}
                filename="assigned-employees"
                meta={{
                  filters: [{ label: 'Search', value: q.trim() || '—' }],
                  generatedAt: new Date(),
                }}
              />
            }
          />
        }
        footer={footerSummary({
          showing: filtered.length,
          total: assignments.length,
          activeFilters: activeFilterCount({ q }),
        })}
      >
        {assignmentsError ? (
          <div className="ff-state">
            <div className="ff-state__icon">
              <AlertTriangle size={22} />
            </div>
            <div className="ff-state__title">
              {describeError(assignmentsError).title} {describeError(assignmentsError).message}
            </div>
            <button type="button" className="ff-btn ff-btn--ghost" onClick={load}>
              Retry
            </button>
          </div>
        ) : !loading && assignments.length === 0 ? (
          <div className="ff-state">
            <div className="ff-state__icon">
              <UserPlus size={22} />
            </div>
            <div className="ff-state__title">Nobody has been assigned a role yet</div>
            <div>Assign roles from the Enterprise Roles tab.</div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r) => r._id}
            loading={loading && assignments.length === 0}
            showing={filtered.length}
            total={assignments.length}
            activeFilters={activeFilterCount({ q })}
            emptyTitle="No assignments match your search"
            emptyHint="Try a different name, role or mobile number."
          />
        )}
      </PageShell>
    </div>
  );
};

export default AssignedEmployeesPage;
