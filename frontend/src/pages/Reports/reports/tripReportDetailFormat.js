/**
 * Pure display logic for the trip report detail view (rule 21): date/currency
 * formatting, and normalizing a trip record that may arrive in either the
 * TripLedger shape or the flat TripReport shape onto one consistent set of
 * display fields.
 */

export function formatTripReportDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTripReportCurrency(value) {
  if (typeof value !== 'number') return '-';
  return `₹${value.toLocaleString('en-IN')}`;
}

export function normalizeTripReportData(trip) {
  return {
    driverName: trip?.driver?.fullName || trip?.driverName || '-',
    vehicleReg: trip?.vehicle?.registrationNumber || trip?.vehicleRegNo || '-',
    vehicleType: trip?.vehicle?.vehicleType || '-',
    routeName: trip?.route?.name || trip?.route || '-',
    startLoc: trip?.route?.sourceLocation?.city || trip?.startLocation || '-',
    endLoc: trip?.route?.destLocation?.city || trip?.endLocation || '-',
    distanceKm: trip?.route?.distanceKm || trip?.distanceKm,
    revenue: trip?.performance?.totalRevenue,
    expense: trip?.performance?.totalExpense,
    profit: trip?.performance?.netProfit,
    profitMargin: trip?.performance?.profitMargin,
    grossWeight: trip?.weights?.grossWeight,
    tareWeight: trip?.weights?.tareWeight,
    netWeight: trip?.weights?.netWeight,
  };
}
