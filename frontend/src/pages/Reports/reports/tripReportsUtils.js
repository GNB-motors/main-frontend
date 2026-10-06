// Shared helpers for the Trip Economics reports (fuel-cycles, non-business,
// running-cost). Reuses the mileage report's formatters; the only real
// difference is the filter param names — these endpoints take `from`/`to`
// (per the Trip Economics API contract), not `startDate`/`endDate`.
import {
  PAGE_SIZE,
  formatNumber,
  formatCurrency,
  formatDate,
  toStartOfDayIso,
  toEndOfDayIso,
  extractVehicleOptions,
} from './mileageIntervalReportUtils';

export { PAGE_SIZE, formatNumber, formatCurrency, formatDate, extractVehicleOptions };

export const fmtKm = (v) => (typeof v === 'number' ? `${v.toFixed(1)} km` : '—');
export const fmtL = (v) => (typeof v === 'number' ? `${v.toFixed(2)} L` : '—');
export const fmtPct = (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '—');

export const buildTripFilterParams = ({ from, to, vehicleId, status, groupBy } = {}) => {
  const params = {};
  const fromIso = toStartOfDayIso(from);
  const toIso = toEndOfDayIso(to);
  if (fromIso) params.from = fromIso;
  if (toIso) params.to = toIso;
  if (vehicleId && vehicleId !== 'all') params.vehicleId = String(vehicleId);
  if (status && status !== 'all') params.status = status;
  if (groupBy) params.groupBy = groupBy;
  return params;
};
