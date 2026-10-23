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

export const CATEGORY_COLORS = {
  FUEL: 'bg-blue-100 text-blue-700',
  TOLL: 'bg-amber-100 text-amber-700',
  MAINTENANCE: 'bg-purple-100 text-purple-700',
  REPAIR: 'bg-red-100 text-red-700',
  DRIVER_SALARY: 'bg-green-100 text-green-700',
  DRIVER_ALLOWANCE: 'bg-teal-100 text-teal-700',
  DRIVER_MEAL: 'bg-pink-100 text-pink-700',
  INSURANCE: 'bg-indigo-100 text-indigo-700',
  PERMIT: 'bg-cyan-100 text-cyan-700',
  FINE: 'bg-rose-100 text-rose-700',
  TYRE: 'bg-orange-100 text-orange-700',
  LOADING_UNLOADING: 'bg-lime-100 text-lime-700',
  MISCELLANEOUS: 'bg-gray-100 text-gray-700',
  TRIP_EXPENSE: 'bg-violet-100 text-violet-700',
};

export const SOURCE_LABELS = {
  MANUAL: 'Manual',
  DRIVER_BILL: 'Driver Bill',
  TRIP: 'Trip',
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
};

export const SOURCE_COLORS = {
  MANUAL: 'border-blue-300 text-blue-600 bg-blue-50/50',
  DRIVER_BILL: 'border-cyan-300 text-cyan-700 bg-cyan-50/50',
  TRIP: 'border-violet-300 text-violet-600 bg-violet-50/50',
  FUEL: 'border-orange-300 text-orange-600 bg-orange-50/50',
  MAINTENANCE: 'border-purple-300 text-purple-600 bg-purple-50/50',
};

export const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-800 border border-amber-200',
  CONFIRMED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border border-rose-200',
};

export const TRIP_STATE_LABELS = {
  PLANNED: 'Planned',
  PLACED: 'Placed',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export const TRIP_STATE_COLORS = {
  PLANNED: 'bg-slate-100 text-slate-700 border-slate-200',
  PLACED: 'bg-blue-100 text-blue-700 border-blue-200',
  DISPATCHED: 'bg-amber-100 text-amber-800 border-amber-200',
  DELIVERED: 'bg-teal-100 text-teal-800 border-teal-200',
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
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
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      profit: 0,
    };
  }
  if (profit > 0) {
    return {
      status: 'PROFITABLE',
      label: 'Profitable',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      profit,
    };
  }
  if (profit === 0) {
    return {
      status: 'BREAK_EVEN',
      label: 'Break-even',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      profit: 0,
    };
  }
  return {
    status: 'LOSS_MAKING',
    label: 'Loss-making',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
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

export const getInitialDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
};
