import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const IST_ZONE = 'Asia/Kolkata';
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

export const formatDate = (value) =>
  value ? dayjs.utc(value).tz(IST_ZONE).format('DD MMM YYYY') : '—';

export const toStartOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).startOf('day').toISOString();
};

export const toEndOfDayIso = (dateStr) => {
  if (!dateStr) return undefined;
  return dayjs(dateStr).endOf('day').toISOString();
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
