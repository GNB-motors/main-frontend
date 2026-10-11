import { formatInIST, istDayEndISO, istDayStartISO, istDayString } from '../../../utils/dateUtils';

export const COLUMN_COUNT = 15;
export const PAGE_SIZE = 10;

export const formatNumber = (value, digits = 0) =>
  typeof value === 'number'
    ? value.toLocaleString('en-IN', { maximumFractionDigits: digits })
    : '—';

export const formatCurrency = (value) =>
  typeof value === 'number'
    ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : '—';

export const formatDate = (value) => (value && formatInIST(value, 'DD MMM YYYY')) || '—';

// Filters hand over "YYYY-MM-DD"; anything else is read as an instant and
// reduced to its IST calendar day.
const asIstDay = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : istDayString(value));

export const toStartOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return istDayStartISO(asIstDay(dateStr)) ?? undefined;
};

export const toEndOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return istDayEndISO(asIstDay(dateStr)) ?? undefined;
};

export const buildFilterParams = ({ startDate, endDate, vehicleId, driverId }) => {
  const params = {};
  const startIso = toStartOfDayIso(startDate);
  const endIso = toEndOfDayIso(endDate);
  if (startIso) params.startDate = startIso;
  if (endIso) params.endDate = endIso;
  if (vehicleId && vehicleId !== 'all') params.vehicleId = String(vehicleId);
  if (driverId && driverId !== 'all') params.driverId = String(driverId);
  return params;
};

export const extractVehicleOptions = (vehiclesRes) => {
  const list = Array.isArray(vehiclesRes?.data?.data)
    ? vehiclesRes.data.data
    : Array.isArray(vehiclesRes?.data)
      ? vehiclesRes.data
      : Array.isArray(vehiclesRes)
        ? vehiclesRes
        : [];

  return list
    .map((v) => ({
      id: String(v._id || v.id),
      label: v.registrationNumber || v.vehicleNumber || '—',
    }))
    .filter((v) => v.id && v.id !== 'undefined');
};

export const extractDriverOptions = (employeesRes) => {
  const list = Array.isArray(employeesRes) ? employeesRes : [];

  return list
    .filter((d) => !d.role || d.role === 'DRIVER')
    .map((d) => ({
      id: String(d._id || d.id),
      label: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown',
    }))
    .filter((d) => d.id && d.id !== 'undefined');
};
