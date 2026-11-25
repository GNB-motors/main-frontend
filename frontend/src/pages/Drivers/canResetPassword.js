import { getUserId } from '../../utils/session.js';

/**
 * Whether the viewer sees "Reset password" on an employee row. Mirrors the
 * backend rule; the backend still decides (branch scope, the `drivers`
 * permission), this only hides buttons that would surely be refused.
 *
 * Fail closed: the row must carry a role and an id, the role must not be
 * OWNER/SUPER_ADMIN, and it must be known WHO is looking — an unknown viewer
 * or an unknown row never gets the button.
 */
const OWNER_CAN_RESET = new Set([
  'DRIVER',
  'MANAGER',
  'FIELD_AGENT',
  'KAM',
  'OPS_EXECUTIVE',
  'ACCOUNTS',
  'APPROVER',
]);

export function canResetRow(viewerRole, row, permissions, viewerId = getUserId()) {
  if (!row) return false;
  // The role comes from the raw row: without it we cannot tell a driver from
  // an owner, so there is no button.
  const role = String(row.role || '').toUpperCase();
  if (!role) return false;
  // The role is the truth (normalizeDriver keeps it): an owner or a superadmin
  // row never gets the button — not for an owner, not for a superadmin.
  if (role === 'OWNER' || role === 'SUPER_ADMIN') return false;
  // The row must be identifiable, and it must not be the viewer's own row.
  const rowId = row.id;
  if (rowId === undefined || rowId === null || rowId === '') return false;
  if (!viewerId) return false; // we do not know who is looking
  if (String(rowId) === String(viewerId)) return false;

  const viewer = String(viewerRole || '').toUpperCase();
  if (viewer === 'OWNER' || viewer === 'SUPER_ADMIN') return OWNER_CAN_RESET.has(role);
  if (viewer === 'MANAGER') return role === 'DRIVER' && permissions?.drivers === true;
  return false;
}

export default canResetRow;
