import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataTable from '../../../../components/ui/DataTable';
import { formatDateTimeIST } from '../../../../utils/dateUtils';
import { WhatsAppAuditService } from '../WhatsAppAuditService';
import AuditToast from './AuditToast';
import './AuditGroupsTab.css';

/**
 * WhatsApp groups tab (GF, spec 1).
 *
 * Every group the listener phone is in, the organization it feeds, its last
 * message and its counters. A group without an organization is listed first
 * and marked: its messages are stored but not processed.
 *
 * Mapping a group is optimistic: the row shows the new organization at once
 * and is rolled back (with an error toast) when the server refuses it. One
 * group is mapped at a time — its drop-down is disabled while its own PATCH
 * is in flight.
 */

/** The two words the mapping rules are written in (D4). */
export const REMAP_CONFIRM =
  'Only new messages go to the new org. Messages already processed stay with the old org.';
export const FIRST_MAP_CONFIRM = 'Stored messages will be processed now.';

/** A counter the backend did not report stays unknown — never 0. */
const count = (value) => (typeof value === 'number' ? value.toLocaleString('en-IN') : '—');

/** Unmapped groups first: they are the ones that need a decision. */
const unmappedFirst = (rows) =>
  [...rows].sort((a, b) => {
    const aUnmapped = a?.orgId ? 0 : 1;
    const bUnmapped = b?.orgId ? 0 : 1;
    return bUnmapped - aUnmapped;
  });

const AuditGroupsTab = () => {
  const [groups, setGroups] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // The pending mapping of every group whose PATCH is in flight: a reload
  // must not put the old organization back under the user's cursor.
  const pendingRef = useRef({});
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    try {
      const [rows, orgs] = await Promise.all([
        WhatsAppAuditService.getGroups(),
        WhatsAppAuditService.getOrganizations(),
      ]);
      if (requestRef.current !== requestId) return;
      const pending = pendingRef.current;
      setGroups(
        unmappedFirst(
          rows.map((row) => {
            const keep = pending[row._id];
            return keep ? { ...row, orgId: keep.orgId, orgName: keep.orgName } : row;
          }),
        ),
      );
      setOrganizations(Array.isArray(orgs) ? orgs : []);
      setError(null);
    } catch (err) {
      if (requestRef.current !== requestId) return;
      setError(err.message || 'Could not load the WhatsApp groups.');
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setGroupOrg = (groupId, orgId, orgName) =>
    setGroups((prev) =>
      prev.map((group) =>
        group._id === groupId ? { ...group, orgId: orgId || null, orgName: orgName || null } : group,
      ),
    );

  const onOrgChange = useCallback(
    async (group, nextOrgId) => {
      // One PATCH per group at a time.
      if (saving[group._id]) return;
      const previousOrgId = group.orgId || null;
      const previousOrgName = group.orgName || null;
      if ((nextOrgId || null) === previousOrgId) return;

      const question = previousOrgId ? REMAP_CONFIRM : FIRST_MAP_CONFIRM;
      if (!window.confirm(question)) return;

      const org = organizations.find((o) => o._id === nextOrgId);
      const orgName = org?.companyName || null;
      pendingRef.current[group._id] = { orgId: nextOrgId || null, orgName };
      setSaving((prev) => ({ ...prev, [group._id]: true }));
      setGroupOrg(group._id, nextOrgId, orgName);

      try {
        await WhatsAppAuditService.updateGroupOrg(group._id, nextOrgId || null);
        setToastMessage({
          type: 'success',
          text: `${group.name || 'Group'} now feeds ${orgName || 'no organisation'}.`,
        });
      } catch (err) {
        setGroupOrg(group._id, previousOrgId, previousOrgName);
        setToastMessage({
          type: 'error',
          text: err.message || 'Could not map the group.',
        });
      } finally {
        delete pendingRef.current[group._id];
        setSaving((prev) => {
          const next = { ...prev };
          delete next[group._id];
          return next;
        });
      }
    },
    [organizations, saving],
  );

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Group',
        render: (row) => (
          <>
            <div className="cell-primary">{row.name || row.jid || '—'}</div>
            {row.orgId ? null : (
              <div className="wa-groups-unmapped">Not mapped: messages are stored but not processed</div>
            )}
          </>
        ),
      },
      {
        key: 'participants',
        label: 'Members',
        align: 'right',
        render: (row) => count(row.participantCount),
      },
      {
        key: 'org',
        label: 'Organisation',
        render: (row) => {
          const known = organizations.some((o) => o._id === row.orgId);
          return (
            <select
              aria-label={`Organisation for ${row.name || row.jid || 'group'}`}
              className="wa-audit-select"
              value={row.orgId || ''}
              disabled={Boolean(saving[row._id])}
              onChange={(e) => onOrgChange(row, e.target.value)}
            >
              <option value="">Not mapped</option>
              {row.orgId && !known ? (
                <option value={row.orgId}>{row.orgName || row.orgId}</option>
              ) : null}
              {organizations.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.companyName}
                </option>
              ))}
            </select>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => {
          if (typeof row.active !== 'boolean') return '—';
          return row.active ? 'Active' : 'Left';
        },
      },
      {
        key: 'joined',
        label: 'Joined',
        render: (row) => (row.joinedAt ? formatDateTimeIST(row.joinedAt) : '—'),
      },
      {
        key: 'lastMessage',
        label: 'Last message',
        render: (row) => (row.lastMessageAt ? formatDateTimeIST(row.lastMessageAt) : '—'),
      },
      {
        key: 'messages',
        label: 'Messages',
        align: 'right',
        render: (row) => count(row.counts?.messages),
      },
      {
        key: 'photos',
        label: 'Photos',
        align: 'right',
        render: (row) => count(row.counts?.photos),
      },
      {
        key: 'fills',
        label: 'Fills',
        align: 'right',
        render: (row) => count(row.counts?.fills),
      },
      {
        key: 'unknownTruck',
        label: 'Unknown truck',
        align: 'right',
        render: (row) => count(row.counts?.unknownTruck),
      },
    ],
    [organizations, saving, onOrgChange],
  );

  return (
    <section className="wa-groups" aria-label="WhatsApp groups">
      {toastMessage ? (
        <AuditToast setToastMessage={setToastMessage} toastMessage={toastMessage} />
      ) : null}

      <header className="wa-groups__head">
        <h2>WhatsApp groups</h2>
        <button type="button" className="wa-audit-btn" onClick={load} disabled={loading}>
          Reload
        </button>
      </header>

      <DataTable
        columns={columns}
        rows={groups}
        rowKey={(row) => row._id}
        loading={loading}
        error={error}
        onRetry={load}
        rowClassName={(row) => (row.orgId ? '' : 'wa-groups-row--unmapped')}
        emptyTitle="No WhatsApp group yet."
        emptyHint="The listener phone has not joined a group."
      />
    </section>
  );
};

export default AuditGroupsTab;
