/**
 * Pure list logic for the Drivers page: API-shape normalization, client-side
 * vehicle-assignment filtering + sort order, cross-branch move detection,
 * and pagination window generation.
 * Kept framework-free so it is unit-testable (rule 21).
 */

/**
 * Normalize a driver/employee record from the API: stable `id`, name parts,
 * contact fields, and the FIELD_AGENT membership-status special case.
 */
export function normalizeDriver(d) {
  return {
    ...d,
    id: d.id || d._id || d._id,
    firstName: d.firstName || d.first_name || '',
    lastName: d.lastName || d.last_name || '',
    name:
      d.name ||
      `${(d.firstName || d.first_name || '').trim()} ${(d.lastName || d.last_name || '').trim()}`.trim(),
    // normalize contact fields used in UI
    mobileNumber: d.mobileNumber || d.mobile_number || d.mobile || '',
    email: d.email || d.email_address || '',
    // Legacy cross-org field agents carry a per-org membershipStatus; show
    // that. New branch-scoped field agents (and every other role) show their
    // real account status — membershipStatus is absent so this falls through.
    status: d.role === 'FIELD_AGENT' ? d.membershipStatus || d.status : d.status,
  };
}

/** Normalize the lightweight vehicle shape used by the edit-modal dropdown. */
export function normalizeVehicleOption(v) {
  return {
    id: v._id || v.id || v._id,
    registration_no: v.registrationNumber || v.registration_no || v.registrationNumber,
    vehicle_type: v.vehicleType || v.vehicle_type || '',
    chassis_number: v.chassisNumber || v.chassis_number || '',
  };
}

/**
 * Client-side filter (vehicle assignment) + sort: active employees first,
 * deactivated ones sink to the bottom.
 */
export function filterAndSortDrivers(drivers, vehicleAssignment = '') {
  let filtered = drivers || [];

  if (vehicleAssignment === 'assigned') {
    filtered = filtered.filter((driver) => driver.vehicle_registration_no);
  } else if (vehicleAssignment === 'unassigned') {
    filtered = filtered.filter((driver) => !driver.vehicle_registration_no);
  }

  return filtered.slice().sort((a, b) => {
    const ad = a.branchStatus === 'DEACTIVATED' ? 1 : 0;
    const bd = b.branchStatus === 'DEACTIVATED' ? 1 : 0;
    return ad - bd;
  });
}

/** The header count reflects only active employees (deactivated excluded). */
export function countActiveDrivers(drivers) {
  return (drivers || []).filter((d) => d.branchStatus !== 'DEACTIVATED').length;
}

/**
 * Activating an employee who is still active in a DIFFERENT branch MOVES them
 * (deactivates them there) — that needs a warning modal first.
 */
export function isCrossBranchMove(driver, activeBranchId) {
  return Boolean(
    driver?.currentBranchId &&
    activeBranchId &&
    String(driver.currentBranchId) !== String(activeBranchId),
  );
}

export function countActiveFilters(filters) {
  return Object.values(filters || {}).filter((value) => value !== '').length;
}

/**
 * Pagination window: always show first/last, collapse the middle to `...`.
 * (DriversPage variant — shows at most ~5 numbers, unlike VehiclesPage's 7.)
 */
export function generatePageNumbers(currentPage, totalPages) {
  const pages = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
}
