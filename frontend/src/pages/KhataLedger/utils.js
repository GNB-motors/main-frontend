import { istDayEndISO, istDayStartISO, istDayString } from '@/utils/dateUtils';

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
  TRIP_EXPENSE: 'Trip Expense',
};

export const SOURCE_LABELS = {
  MANUAL: 'Manual',
  DRIVER_BILL: 'Driver bill',
  TRIP: 'Trip',
  FUEL: 'Fuel log',
  MAINTENANCE: 'Maintenance',
  DETECTED_CROSSING: 'Detected toll',
};

export const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const formatCurrency = (v) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

export const formatKm = (km) => {
  if (km == null || isNaN(km)) return 'N/A';
  return `${Math.round(km).toLocaleString('en-IN')} km`;
};

export const formatCostPerKm = (cost, km) => {
  const numCost = Number(cost);
  const numKm = Number(km);
  if (!numKm || numKm <= 0 || isNaN(numCost) || isNaN(numKm)) {
    return null;
  }
  const perKm = numCost / numKm;
  return `₹${perKm.toFixed(2)}/km`;
};

export const getProfitabilityStatus = (revenue, cost) => {
  const rev = Number(revenue) || 0;
  const cst = Number(cost) || 0;
  const profit = rev - cst;

  if (rev === 0 && cst === 0) {
    return {
      status: 'BREAK_EVEN',
      label: 'Break-even',
      profit: 0,
    };
  }
  if (profit > 0) {
    return {
      status: 'PROFITABLE',
      label: 'Profitable',
      profit,
    };
  }
  if (profit === 0) {
    return {
      status: 'BREAK_EVEN',
      label: 'Break-even',
      profit: 0,
    };
  }
  return {
    status: 'LOSS_MAKING',
    label: 'Loss-making',
    profit,
  };
};

export const getDriverName = (driver) => {
  if (!driver) return '-';
  return [driver.firstName, driver.lastName].filter(Boolean).join(' ') || '-';
};

export const getVehicleLabel = (vehicle) => {
  if (!vehicle) return '-';
  return vehicle.registrationNumber || vehicle.name || '-';
};

// Khata split fields (vehicleSplit / driverSplit / byVehicle / byDriver) come back
// from the API as a { label: amount } map. Normalise to a descending array so the
// "top N" slices actually show the largest contributors.
export const toSplitArray = (split) => {
  if (Array.isArray(split)) return split;
  if (!split || typeof split !== 'object') return [];
  return Object.entries(split)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => (b.amount || 0) - (a.amount || 0));
};

// This month so far, in IST days, so the date picker reads "This Month".
export const getInitialDateRange = () => {
  const today = istDayString();
  return {
    startDate: istDayStartISO(`${today.slice(0, 8)}01`),
    endDate: istDayEndISO(today),
  };
};

export const plural = (count, one, many = `${one}s`) =>
  `${Number(count || 0).toLocaleString('en-IN')} ${Number(count) === 1 ? one : many}`;

export const initialsOf = (name) =>
  String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '—';
