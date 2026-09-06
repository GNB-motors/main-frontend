import { formatDateTimeIST } from '../../utils/dateUtils';
import { humanise } from '../../lib/vocabulary';

export const FIELD_AGENT_FUEL_PAGE_SIZE = 20;

const pad = (n) => String(n).padStart(2, '0');
export const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const fmtNum = (v, digits = 2) =>
  v == null ? '-' : Number(v).toLocaleString('en-IN', { maximumFractionDigits: digits });
export const fmtMoney = (v) =>
  v == null ? '₹0' : `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const agentName = (u) =>
  u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || '-' : '-';

export const LOG_EXPORT_COLUMNS = [
  { key: 'refuelTime', label: 'Date' },
  { key: 'organization', label: 'Organization' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'uploadedBy', label: 'Uploaded by' },
  { key: 'fuelType', label: 'Fuel' },
  { key: 'fillingType', label: 'Type' },
  { key: 'litres', label: 'Litres', type: 'number' },
  { key: 'rate', label: 'Rate (₹)', type: 'currency' },
  { key: 'totalAmount', label: 'Amount (₹)', type: 'currency' },
  { key: 'odometerReading', label: 'Odometer', type: 'number' },
  { key: 'location', label: 'Location' },
  { key: 'reviewStatus', label: 'Review' },
];

export const buildLogExportRows = (records) =>
  records.map((log) => ({
    refuelTime: log.refuelTime ? formatDateTimeIST(log.refuelTime) : '—',
    organization: log.orgId?.companyName || 'Unknown',
    vehicle: log.vehicleId?.registrationNumber || '—',
    uploadedBy: agentName(log.loggedBy),
    fuelType: log.fuelType || '—',
    fillingType: log.fillingType ? humanise(log.fillingType) : '—',
    litres: log.litres,
    rate: log.rate,
    totalAmount: log.totalAmount,
    odometerReading: log.odometerReading,
    location: log.location || '—',
    reviewStatus: humanise(log.reviewStatus),
  }));

export const buildDefaultFilters = () => ({
  vehicleId: '',
  from: toInputDate(daysAgo(30)),
  to: toInputDate(new Date()),
});

/**
 * Server query for the logs endpoint. `from`/`to` are local date-input values
 * widened to day bounds and sent as UTC ISO strings; empty values are omitted
 * so the backend applies no bound.
 */
export const buildLogQueryParams = ({ filters, page, pageSize = FIELD_AGENT_FUEL_PAGE_SIZE }) => ({
  vehicleId: filters.vehicleId || undefined,
  from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
  to: filters.to ? new Date(`${filters.to}T23:59:59.999`).toISOString() : undefined,
  page,
  limit: pageSize,
});

// The logs endpoint accepts no q param, so the needle narrows the records
// already loaded on the current page.
export const filterLogsByNeedle = (logs, needle) => {
  const q = needle.trim().toLowerCase();
  if (!q) return logs;
  return logs.filter((log) =>
    [
      log.vehicleId?.registrationNumber,
      log.orgId?.companyName,
      agentName(log.loggedBy),
      log.fuelType,
      log.fillingType,
      log.location,
      log.reviewStatus,
    ].some((f) =>
      String(f ?? '')
        .toLowerCase()
        .includes(q),
    ),
  );
};

export const countLogFilters = (filters, needle) =>
  (filters.vehicleId ? 1 : 0) + (needle.trim() ? 1 : 0);

/** Vehicles grouped by org name for the filter dropdown's optgroups. */
export const groupVehiclesByOrg = (vehicles) => {
  const groups = {};
  vehicles.forEach((v) => {
    const orgName = v.orgId?.companyName || 'Unknown Org';
    if (!groups[orgName]) groups[orgName] = [];
    groups[orgName].push(v);
  });
  return Object.entries(groups);
};
