import { toISTDateString, toISTTimeString, formatDateIST } from '../../../utils/dateUtils';

export const FUEL_TYPES = ['DIESEL', 'ADBLUE'];
export const FILLING_TYPES = ['PARTIAL', 'FULL_TANK'];
export const PAGE_SIZE = 10;

export const TAB_TO_FUEL_TYPE = {
  all: undefined,
  diesel: 'DIESEL',
  adblue: 'ADBLUE',
};

export const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'adblue', label: 'AdBlue' },
];

export const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromDatetimeLocal = (localString) => {
  if (!localString) return null;
  const date = new Date(localString);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '-';
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const mapRawLog = (log) => ({
  id: log._id,
  date: log.refuelTime ? toISTDateString(log.refuelTime) : null,
  time: log.refuelTime ? toISTTimeString(log.refuelTime) : null,
  vehicleNo: log.vehicleId?.registrationNumber || '-',
  vehicleModel: log.vehicleId?.vehicleType || '-',
  vehicleId: log.vehicleId?._id,
  driverName: (() => {
    const d = log.driverId || log.tripId?.driverId;
    return d ? `${d.firstName || ''} ${d.lastName || ''}`.trim() || '-' : '-';
  })(),
  driverPhone: '-',
  location: log.location || '-',
  vendor: '-',
  fuelType: log.fuelType ? log.fuelType.toLowerCase() : 'unknown',
  quantity: log.litres || '-',
  unitPrice: log.rate || null,
  totalAmount: log.totalAmount || '-',
  odometer: log.odometerReading || '-',
  notes: log.fillingType ? (log.fillingType === 'FULL_TANK' ? 'Full Tank' : log.fillingType) : '-',
  tripId: log.tripId,
  documentId: log.documentId,
  odometerDocId: log.odometerDocId,
  loggedBy: log.loggedBy,
  createdAt: log.createdAt,
  refuelTime: log.refuelTime,
  rawFuelType: log.fuelType,
  rawFillingType: log.fillingType,
  rawLitres: log.litres,
  rawRate: log.rate,
  rawOdometer: log.odometerReading,
  rawLocation: log.location,
});

export const formatLogTimestamp = (date, time) => {
  const timestamp = date ? `${date}${time ? `T${time}` : ''}` : null;
  return timestamp ? formatDateIST(timestamp) : formatDateIST(date);
};
