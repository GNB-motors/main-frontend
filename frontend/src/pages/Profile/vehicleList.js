/**
 * Pure list logic for the Vehicles page: API-shape normalization, client-side
 * filtering, FleetEdge account lookup, and typed export column config.
 * Kept framework-free so it is unit-testable (rule 21).
 */
import { linkForAccount, linkStatus, needsAction } from '../../lib/fleetLink';

/** Normalize the camelCase API vehicle shape to the snake_case UI shape. */
export function normalizeVehicle(v) {
  return {
    id: v._id || v.id || v._id, // keep id if present
    registration_no: v.registrationNumber || v.registration_no || v.registrationNumber,
    vehicle_type: v.vehicleType || v.vehicle_type || '',
    chassis_number: v.chassisNumber || v.chassis_number || '',
    model: v.model || '',
    status: v.status || '',
    inventory: v.inventory || [],
    // New classification fields
    manufacturer: v.manufacturer || null,
    vehicleCategory: v.vehicleCategory || null,
    classification: v.classification || null,
    fleetEdgeAccountId: v.fleetEdgeAccountId || null,
    // Server-computed — which of the tracked document types this vehicle has
    // not uploaded yet (plan WS3/WS6). Empty when everything is on file.
    missingDocTypes: v.missingDocTypes || [],
    // Branch membership state (present only in a branch view).
    branchStatus: v.branchStatus,
    isImported: v.isImported,
    averageMileage: v.averageMileage ?? v.avgMileage ?? v.mileage ?? null,
  };
}

/**
 * Build a lookup map from accountId (stringified) → account object
 * for fast FleetEdge-account column resolution.
 */
export function buildAccountMap(accounts) {
  const map = {};
  for (const a of accounts || []) map[String(a._id)] = a;
  return map;
}

/**
 * Client-side filter: registration-number substring search plus
 * FleetEdge account bucket ('all' | 'untagged' | <accountId>).
 */
export function filterVehicles(vehicles, { search = '', accountFilter = 'all' } = {}) {
  const term = search.trim().toLowerCase();
  return (vehicles || []).filter((vehicle) => {
    if (
      term &&
      !String(vehicle.registration_no || '')
        .toLowerCase()
        .includes(term)
    )
      return false;
    if (accountFilter === 'untagged') return !vehicle.fleetEdgeAccountId;
    if (accountFilter !== 'all') return String(vehicle.fleetEdgeAccountId) === accountFilter;
    return true;
  });
}

/** True when the vehicle's FleetEdge account must be re-linked (now, or before it expires). */
export function vehicleNeedsRelink(vehicle, linkIndex) {
  return needsAction(linkForAccount(linkIndex, vehicle?.fleetEdgeAccountId));
}

/**
 * Resolve the FleetEdge account badge model for a vehicle row. `linkIndex`
 * (from lib/fleetLink) adds the link verdict when the viewer can see it.
 */
export function describeFleetEdgeAccount(vehicle, accountMap = {}, linkIndex = null) {
  if (!vehicle?.fleetEdgeAccountId) return { tagged: false };
  const linkAccount = linkForAccount(linkIndex, vehicle.fleetEdgeAccountId);
  const acct = accountMap[String(vehicle.fleetEdgeAccountId)];
  const label = acct
    ? acct.friendlyName || acct.externalAccountId
    : String(vehicle.fleetEdgeAccountId).slice(-6);
  const tip = acct
    ? `${acct.source} · ${acct.externalAccountId}${acct.lastSeenAt ? ' · seen ' + new Date(acct.lastSeenAt).toLocaleDateString() : ''}`
    : '';
  return {
    tagged: true,
    label,
    tip,
    isDisabled: acct?.status === 'DISABLED',
    isAuthFailed: acct?.status === 'AUTH_FAILED',
    link: needsAction(linkAccount)
      ? { accountId: linkAccount.accountId, ...linkStatus(linkAccount) }
      : null,
    linkKnown: Boolean(linkAccount),
  };
}

function linkExportText(acct) {
  if (!acct.tagged) return '—';
  if (acct.link) return acct.link.label;
  if (acct.linkKnown) return 'Connected';
  return acct.isAuthFailed ? 'Login failed' : '—';
}

export const VEHICLE_EXPORT_COLUMNS = [
  { key: 'registration_no', label: 'Vehicle No' },
  { key: 'model', label: 'Model' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'vehicleCategory', label: 'Category' },
  { key: 'chassis_number', label: 'Chassis No' },
  { key: 'fleetEdgeAccount', label: 'FleetEdge Account' },
  { key: 'fleetEdgeLink', label: 'FleetEdge Link' },
];

export function mapVehicleForExport(vehicle, accountMap = {}, linkIndex = null) {
  const acct = describeFleetEdgeAccount(vehicle, accountMap, linkIndex);
  return {
    registration_no: vehicle.registration_no || '',
    model: vehicle.model || 'N/A',
    manufacturer:
      vehicle.manufacturer && vehicle.manufacturer !== 'UNKNOWN' ? vehicle.manufacturer : '—',
    vehicleCategory:
      vehicle.vehicleCategory && vehicle.vehicleCategory !== 'UNKNOWN'
        ? vehicle.vehicleCategory
        : '—',
    chassis_number: vehicle.chassis_number || 'N/A',
    fleetEdgeAccount: acct.tagged ? acct.label : 'untagged',
    fleetEdgeLink: linkExportText(acct),
  };
}

export function vehicleExportMeta({ search = '', accountFilter = 'all', accountMap = {} } = {}) {
  const filters = [];
  if (search.trim()) filters.push({ label: 'Search', value: search.trim() });
  if (accountFilter === 'untagged') filters.push({ label: 'FleetEdge account', value: 'Untagged' });
  else if (accountFilter !== 'all') {
    const acct = accountMap[accountFilter];
    filters.push({
      label: 'FleetEdge account',
      value: acct ? acct.friendlyName || acct.externalAccountId : accountFilter,
    });
  }
  return { filters, generatedAt: new Date() };
}
