import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound, Search } from 'lucide-react';
import { OrgUsersService } from './OrgUsersService';
import ResetPasswordDialog from '../../../../components/auth/ResetPasswordDialog.jsx';
import { getUserId } from '../../../../utils/session.js';

const PAGE_LIMIT = 50;

const EMPTY_META = { page: 1, limit: PAGE_LIMIT, total: 0, pages: 1 };

const fullName = (user) =>
  `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || '—';

const ROLE_LABELS = {
  OWNER: 'Owner',
  SUPER_ADMIN: 'Super Admin',
  DRIVER: 'Driver',
  MANAGER: 'Manager',
  FIELD_AGENT: 'Field Agent',
  KAM: 'Key Account Manager',
  OPS_EXECUTIVE: 'Ops Executive',
  ACCOUNTS: 'Accounts',
  APPROVER: 'Approver',
};

const roleLabel = (role) => ROLE_LABELS[role] || role || 'Employee';

/**
 * The accounts of one organisation: every account, the owner first, with a
 * "Reset password" action on each (never on the superadmin's own account).
 */
export default function OrgUsersSection({ orgId }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [pageState, setPageState] = useState({ orgId, page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [target, setTarget] = useState(null);

  // Every request gets a number; only the newest one may write to the state.
  const requestId = useRef(0);

  // The page belongs to the organisation it was chosen for: a new organisation
  // always starts at page 1, in the very same render.
  const page = pageState.orgId === orgId ? pageState.page : 1;
  const setPage = useCallback(
    (next) =>
      setPageState((prev) => {
        const current = prev.orgId === orgId ? prev.page : 1;
        const value = typeof next === 'function' ? next(current) : next;
        return { orgId, page: value };
      }),
    [orgId],
  );

  // Debounce the search box, so typing does not fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchInput, setPage]);

  // The reset target belongs to the organisation it was opened for.
  useEffect(() => {
    setTarget(null);
  }, [orgId]);

  // Another organisation: the rows on screen belong to the previous one, so
  // they go immediately (not when the new answer arrives).
  useEffect(() => {
    requestId.current += 1; // nothing in flight may write to the state any more
    setRows([]);
    setMeta(EMPTY_META);
    setPageState({ orgId, page: 1 });
    setError('');
    setLoading(Boolean(orgId));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) {
      requestId.current += 1;
      setRows([]);
      setMeta(EMPTY_META);
      setLoading(false);
      return undefined;
    }
    const id = requestId.current + 1;
    requestId.current = id;
    const controller = new AbortController();
    setLoading(true);

    OrgUsersService.listOrgUsers(
      orgId,
      { page, limit: PAGE_LIMIT, ...(search ? { search } : {}) },
      { signal: controller.signal },
    )
      .then((res) => {
        if (requestId.current !== id) return; // a newer request already answered
        setRows(res?.rows ?? []);
        setMeta(res?.meta ?? EMPTY_META);
        setError('');
      })
      .catch((err) => {
        if (requestId.current !== id) return;
        if (err?.code === 'ERR_CANCELED') return; // a cancelled request is not a failure
        setError('Could not load users.');
      })
      .finally(() => {
        if (requestId.current !== id) return;
        setLoading(false);
      });

    return () => {
      controller.abort();
      // The answer that is on its way belongs to a state that no longer exists.
      requestId.current += 1;
    };
  }, [orgId, page, search]);

  const users = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      const ao = a?.role === 'OWNER' ? 0 : 1;
      const bo = b?.role === 'OWNER' ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return fullName(a).localeCompare(fullName(b));
    });
    return list;
  }, [rows]);

  const viewerId = getUserId();
  const currentPage = meta?.page ?? page;
  const totalPages = meta?.pages ?? 1;

  const submitReset = async (body) => {
    if (!target) throw new Error('No account selected.');
    return OrgUsersService.resetUserPassword(target.id, body);
  };

  return (
    <div className="fuel-stats-section">
      <h2 className="fuel-stats-title">
        Users <span>every account of this organisation</span>
      </h2>

      <div className="content-card orgs-table-card">
        <div className="orgs-table-header">
          <div>
            <h3>Users</h3>
            <p className="orgs-table-subtitle">
              {loading ? 'Loading…' : `${users.length} account${users.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="dt-search">
            <Search size={13} aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              placeholder="Name or email"
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search users by name or email"
            />
          </div>
        </div>

        {error ? (
          <div className="empty-state">
            <p className="error-text">{error}</p>
          </div>
        ) : null}

        <div className="orgs-table-wrapper">
          <table className="orgs-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="org-name-cell">
                      <span className="org-company-name">{fullName(user)}</span>
                      {user.mobileNumber ? (
                        <span className="org-email">{user.mobileNumber}</span>
                      ) : null}
                    </div>
                  </td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{user.email || '—'}</td>
                  <td>
                    <span
                      className={`status-badge status-${
                        (user.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'active' : 'pending'
                      }`}
                    >
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td>
                    {viewerId && String(user.id) === String(viewerId) ? null : (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        aria-label={`Reset password for ${fullName(user)}`}
                        onClick={() => setTarget(user)}
                      >
                        <KeyRound size={14} aria-hidden="true" /> Reset password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px',
            borderTop: '1px solid var(--ds-border, #e2e8f0)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      <ResetPasswordDialog
        open={!!target}
        onClose={() => setTarget(null)}
        user={
          target
            ? {
                id: target.id,
                name: fullName(target),
                roleLabel: roleLabel(target.role),
                email: target.email || null,
              }
            : null
        }
        onSubmit={submitReset}
      />
    </div>
  );
}
