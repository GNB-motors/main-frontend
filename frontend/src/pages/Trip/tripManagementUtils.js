/**
 * Pure display/filter logic for TripManagementPage (rule 21): status colors,
 * date formatting, the client-side search applied to both tabs, and the
 * paginator's page-number window. Framework-free so it is unit-testable.
 */

export const PAGE_SIZE = 10;

export function getStatusColor(status) {
  const c = {
    SUBMITTED: '#4caf50',
    COMPLETED: '#4caf50',
    DRIVER_SELECTED: '#2196f3',
    DOCUMENTS_UPLOADED: '#2196f3',
    OCR_VERIFIED: '#2196f3',
    ROUTES_ASSIGNED: '#2196f3',
    REVENUE_ENTERED: '#ff9800',
    EXPENSES_ENTERED: '#ff9800',
    ONGOING: '#ff9800',
    PLANNED: '#2196f3',
    CANCELLED: '#f44336',
  };
  return c[status] || '#757575';
}

export function formatJourneyDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Client-side filter for the Navbar-driven search (tripSearchChange event).
// The weight-slip ("trips") tab matches a wider field set than refuel journeys.
export function filterTrips(trips, searchQuery, activeTab) {
  if (!searchQuery) return trips;
  const q = searchQuery.toLowerCase();
  return trips.filter((trip) => {
    if (activeTab === 'trips') {
      const reg = (
        trip.journeyId?.vehicleId?.registrationNumber ||
        trip.vehicleId?.registrationNumber ||
        trip.vehicleId ||
        ''
      )
        .toString()
        .toLowerCase();
      const driver = trip.journeyId?.driverId
        ? `${trip.journeyId.driverId.firstName} ${trip.journeyId.driverId.lastName}`.toLowerCase()
        : trip.driverId
          ? `${trip.driverId.firstName || ''} ${trip.driverId.lastName || ''}`.toLowerCase()
          : '';
      return (
        reg.includes(q) ||
        driver.includes(q) ||
        trip.routeData?.name?.toLowerCase().includes(q) ||
        trip.routeData?.sourceLocation?.city?.toLowerCase().includes(q) ||
        trip.routeData?.destLocation?.city?.toLowerCase().includes(q) ||
        trip.materialType?.toLowerCase().includes(q) ||
        trip._id.includes(q)
      );
    }
    const driver = trip.driverId
      ? `${trip.driverId.firstName} ${trip.driverId.lastName}`.toLowerCase()
      : '';
    return (
      trip.vehicleId?.registrationNumber?.toLowerCase().includes(q) ||
      driver.includes(q) ||
      trip._id.includes(q)
    );
  });
}

// Windowed page numbers: first, last, and one page either side of the current
// page, with a single ellipsis run between gaps.
export function renderPageItems(totalPages, currentPage) {
  const items = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      items.push(i);
    } else if (items[items.length - 1] !== '...') {
      items.push('...');
    }
  }
  return items;
}
