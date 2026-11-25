import { getUserId } from '../../utils/session.js';

/**
 * Whether the viewer sees "Reset password" on an employee row. Mirrors the
 * backend rule; the backend still decides (branch scope, the `drivers`
 * permission), this only hides buttons that would surely be refused.
 *
 * Fail closed: the row must carry a role, and it must be known that the row is
 * not the organisation's owner. A row without a role, or a row that belongs to
 * the owner, never gets the button.
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
  // Ownership: either the row says so, or its role says so. An owner row never
  // gets the button — not for an owner, not for a superadmin.
  if (row.isOwner === true || role === 'OWNER') return false;
  // Never offer to reset the viewer's own password.
  if (viewerId && row.id != null && String(row.id) === String(viewerId)) return false;

  const viewer = String(viewerRole || '').toUpperCase();
  if (viewer === 'OWNER' || viewer === 'SUPER_ADMIN') return OWNER_CAN_RESET.has(role);
  if (viewer === 'MANAGER') return role === 'DRIVER' && permissions?.drivers === true;
  return false;
}

export default canResetRow;
