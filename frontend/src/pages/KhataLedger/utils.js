import { formatDateIST } from '@/utils/dateUtils';
import { getDriverName, getVehicleRegistration } from '@/utils/dataFormatters';

export const CATEGORIES = [
  'FUEL',
  'TOLL',
  'MAINTENANCE',
  'REPAIR',
  'DRIVER_SALARY',
  'DRIVER_ALLOWANCE',
  'DRIVER_MEAL',
  'INSURANCE',
  'PERMIT',
  'FINE',
  'TYRE',
  'LOADING_UNLOADING',
  'MISCELLANEOUS',
];

export const CATEGORY_LABELS = {
  FUEL: 'Fuel',
  TOLL: 'Toll',
  MAINTENANCE: 'Maintenance',
  REPAIR: 'Repair',
  DRIVER_SALARY: 'Driver Salary',
  DRIVER_ALLOWANCE: 'Driver Allowance',
  DRIVER_MEAL: 'Driver Meal',
  INSURANCE: 'Insurance',
  PERMIT: 'Permit',
  FINE: 'Fine',
  TYRE: 'Tyre',
  LOADING_UNLOADING: 'Loading/Unloading',
  MISCELLANEOUS: 'Miscellaneous',
  // Synthesised by /api/khata when it normalises rows out of the other
  // collections — they never appear on a manual expense.
  TRIP_EXPENSE: 'Trip Expense',
  FUEL_EXPENSE: 'Fuel Refill',
  SERVICE: 'Service',
};

// Category identity is carried by a small dot, not a pastel background wash.
// Thirteen filled badges in a dense table read as noise; a dot keeps the
// colour coding while letting the amount column stay the loudest thing.
export const CATEGORY_DOTS = {
  FUEL: 'bg-blue-500',
  TOLL: 'bg-amber-500',
  MAINTENANCE: 'bg-purple-500',
  REPAIR: 'bg-red-500',
  DRIVER_SALARY: 'bg-green-600',
  DRIVER_ALLOWANCE: 'bg-teal-500',
  DRIVER_MEAL: 'bg-pink-500',
  INSURANCE: 'bg-indigo-500',
  PERMIT: 'bg-cyan-500',
  FINE: 'bg-rose-600',
  TYRE: 'bg-orange-500',
  LOADING_UNLOADING: 'bg-lime-600',
  MISCELLANEOUS: 'bg-gray-400',
  TRIP_EXPENSE: 'bg-violet-500',
  FUEL_EXPENSE: 'bg-blue-500',
  SERVICE: 'bg-purple-500',
};

/** Everything the khata ledgers can surface. */
export const SOURCES = ['MANUAL', 'TRIP', 'FUEL', 'MAINTENANCE'];

/**
 * /api/expenses merges only these three — maintenance rows are reachable via
 * /api/khata/* only, and asking that endpoint for source=MAINTENANCE is a 400.
 */
export const EXPENSE_SOURCES = ['MANUAL', 'TRIP', 'FUEL'];

export const SOURCE_LABELS = {
  MANUAL: 'Manual',
  TRIP: 'Trip',
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
};

export const ASSIGNMENT_STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-muted text-muted-foreground border-border',
  ENDED: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

/** Stat-card variant — ₹4.82L / ₹1.2Cr so big totals don't blow out the cell. */
export const formatCurrencyCompact = (v) => {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  return formatCurrency(n);
};

export const formatNumber = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);

/** The fleet runs on IST — never format ledger dates off the browser timezone. */
export const formatDate = formatDateIST;

/** `<input type="date">` wants a local yyyy-mm-dd, not an ISO instant. */
export const toDateInputValue = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export { getDriverName, getVehicleRegistration };

/** Kept as an alias — a lot of khata rows carry `registrationNumber` only. */
export const getVehicleLabel = getVehicleRegistration;

/**
 * Khata split fields (vehicleSplit / driverSplit / byVehicle / byDriver) come back
 * from /api/khata as a { label: amount } map — the label is already the registration
 * number or the driver's full name, so there is nothing to look up. Normalise to a
 * descending array so the "top N" slices show the largest contributors.
 */
export const toSplitArray = (split) => {
  if (Array.isArray(split)) return split;
  if (!split || typeof split !== 'object') return [];
  return Object.entries(split)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => (b.amount || 0) - (a.amount || 0));
};

export const getInitialDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};

/** Label for the currently applied range, used as stat-card context copy. */
export const describeDateRange = (range) => {
  if (!range?.startDate || !range?.endDate) return 'All time';
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  }
  return `${formatDateIST(range.startDate)} – ${formatDateIST(range.endDate)}`;
};
