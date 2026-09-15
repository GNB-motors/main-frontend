/**
 * Pure list logic for the Vehicles page: API-shape normalization, client-side
 * filtering, FleetEdge account lookup, and typed export column config.
 * Kept framework-free so it is unit-testable (rule 21).
 */

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
    // Branch membership state (present only in a branch view).
    branchStatus: v.branchStatus,
    isImported: v.isImported,
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

/** Resolve the FleetEdge account badge model for a vehicle row. */
export function describeFleetEdgeAccount(vehicle, accountMap = {}) {
  if (!vehicle?.fleetEdgeAccountId) return { tagged: false };
  const acct = accountMap[String(vehicle.fleetEdgeAccountId)];
  const label = acct
    ? acct.friendlyName || acct.externalAccountId
    : String(vehicle.fleetEdgeAccountId).slice(-6);
  const tip = acct
    ? `${acct.source} · ${acct.externalAccountId}${acct.lastSeenAt ? ' · seen ' + new Date(acct.lastSeenAt).toLocaleDateString() : ''}`
    : '';
  return { tagged: true, label, tip, isDisabled: acct?.status === 'DISABLED' };
}

export const VEHICLE_EXPORT_COLUMNS = [
  { key: 'registration_no', label: 'Vehicle No' },
  { key: 'model', label: 'Model' },
  { key: 'manufacturer', label: 'Manufacturer' },
  { key: 'vehicleCategory', label: 'Category' },
  { key: 'chassis_number', label: 'Chassis No' },
  { key: 'fleetEdgeAccount', label: 'FleetEdge Account' },
];

export function mapVehicleForExport(vehicle, accountMap = {}) {
  const acct = describeFleetEdgeAccount(vehicle, accountMap);
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
