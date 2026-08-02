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
  TRIP: 'Trip',
  FUEL: 'Fuel',
  MAINTENANCE: 'Maintenance',
};

export const SOURCE_COLORS = {
  MANUAL: 'border-blue-300 text-blue-600',
  TRIP: 'border-violet-300 text-violet-600',
  FUEL: 'border-orange-300 text-orange-600',
  MAINTENANCE: 'border-purple-300 text-purple-600',
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

export const getDriverName = (driver) => {
  if (!driver) return '-';
  return [driver.firstName, driver.lastName].filter(Boolean).join(' ') || '-';
};

export const getVehicleLabel = (vehicle) => {
  if (!vehicle) return '-';
  return vehicle.registrationNumber || vehicle.name || '-';
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
