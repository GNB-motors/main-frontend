/**
 * Pure display logic for TripDetailPage: status colors, formatting,
 * mileage normalization, and financial roll-ups.
 * Kept framework-free so it is unit-testable (rule 21).
 */

/** Status → color map for journey/status pills (raw UPPER_SNAKE vocabulary). */
export function getTripStatusColor(status) {
  const colors = {
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
  };
  return colors[status] || '#757575';
}

export function formatTripDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** NOTE: en-IN / min-0 / max-2 digits is intentional here — trip-management
 *  surfaces round large INR figures differently from the ERP formatINR helper. */
export function formatTripCurrency(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Normalize mileage: prefer journeyId.mileage (contains odometer),
 * fall back to top-level trip.mileage.
 */
export function normalizeTripMileage(trip) {
  const journeyMileage = trip?.journeyId?.mileage || {};
  const topMileage = trip?.mileage || {};
  return {
    startOdometer: journeyMileage.startOdometer ?? topMileage.startOdometer,
    endOdometer: journeyMileage.endOdometer ?? topMileage.endOdometer,
    totalDistanceKm:
      journeyMileage.totalDistanceKm ?? topMileage.totalDistanceKm ?? topMileage.distanceKm,
    fuelLitres: journeyMileage.totalFuelUsedL ?? topMileage.fuelLitres ?? topMileage.totalFuelUsedL,
    fuelMileageKmPerL: journeyMileage.fuelMileageKmPerL ?? topMileage.fuelMileageKmPerL,
  };
}

const WEIGHT_SLIP_EXPENSE_KEYS = [
  'materialCost',
  'toll',
  'driverCost',
  'driverTripExpense',
  'royalty',
  'allocatedFuelCost',
];

/**
 * Financial roll-up: use journeyFinancials from the API response when present,
 * otherwise calculate from weightSlipTrips.
 */
export function computeTripFinancials(trip) {
  const weightSlipTrips = trip?.weightSlipTrips || [];
  const totalRevenue =
    trip?.journeyFinancials?.totalRevenue ||
    weightSlipTrips.reduce((sum, wst) => sum + (wst.revenue?.actualAmountReceived || 0), 0) ||
    0;

  const totalExpense =
    trip?.journeyFinancials?.totalExpenses ||
    weightSlipTrips.reduce((sum, wst) => {
      const exp = wst.expenses || {};
      return (
        sum + WEIGHT_SLIP_EXPENSE_KEYS.reduce((expenseSum, key) => expenseSum + (exp[key] || 0), 0)
      );
    }, 0) ||
    0;

  const netProfit = trip?.journeyFinancials?.netProfit ?? totalRevenue - totalExpense;
  const totalTrips = trip?.journeyFinancials?.totalTrips || weightSlipTrips.length || 0;

  return { totalRevenue, totalExpense, netProfit, totalTrips };
}
