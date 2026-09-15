import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const IST_ZONE = 'Asia/Kolkata';

export const toIST = (utcStr) => {
  if (!utcStr) return null;
  return dayjs.utc(utcStr).tz(IST_ZONE);
};

export const formatIST = (utcStr) => {
  const d = toIST(utcStr);
  if (!d) return '—';
  return d.format('DD MMM YYYY, hh:mm A [IST]');
};

export const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  if (!d) return null;
  return d.fromNow();
};

export const formatDateRange = (from, to) => {
  const f = from ? dayjs.utc(from).tz(IST_ZONE).format('DD MMM YY') : '—';
  const t = to ? dayjs.utc(to).tz(IST_ZONE).format('DD MMM YY') : '—';
  return `${f} → ${t}`;
};

export const formatVariance = (variance, variancePercent) => {
  if (variance == null) return '—';
  const isOver = variance > 0;
  const abs = `${isOver ? '+' : ''}${Number(variance).toFixed(2)} L`;
  const pct =
    variancePercent != null ? `(${isOver ? '+' : ''}${Number(variancePercent).toFixed(1)}%)` : '';
  return `${abs} ${pct}`.trim();
};

export const FUEL_COMPARISON_EXPORT_COLUMNS = [
  { key: 'vehicleNo', label: 'Vehicle No.' },
  { key: 'driver', label: 'Driver' },
  { key: 'billFuel', label: 'Bill Fuel (L)' },
  { key: 'fleetEdgeFuel', label: 'FleetEdge Fuel (L)' },
  { key: 'variance', label: 'Variance (L)' },
  { key: 'variancePercent', label: 'Variance (%)' },
  { key: 'status', label: 'Status' },
  { key: 'fromDate', label: 'From Date' },
  { key: 'toDate', label: 'To Date' },
];

export const mapComparisonRowForExport = (rec) => {
  const driverName = rec.driverId
    ? `${rec.driverId.firstName || ''} ${rec.driverId.lastName || ''}`.trim()
    : '';
  return {
    vehicleNo: rec.vehicleId?.registrationNumber || '',
    driver: driverName,
    billFuel: rec.billFuelConsumed != null ? rec.billFuelConsumed.toFixed(2) : '',
    fleetEdgeFuel: rec.fleetEdgeFuelConsumed != null ? rec.fleetEdgeFuelConsumed.toFixed(2) : '',
    variance: rec.variance != null ? rec.variance.toFixed(2) : '',
    variancePercent: rec.variancePercent != null ? rec.variancePercent.toFixed(2) : '',
    status: rec.isFlagged ? 'Flagged' : 'OK',
    fromDate: rec.fromDate ? dayjs.utc(rec.fromDate).tz(IST_ZONE).format('DD/MM/YYYY') : '',
    toDate: rec.toDate ? dayjs.utc(rec.toDate).tz(IST_ZONE).format('DD/MM/YYYY') : '',
  };
};

export const buildFuelComparisonCsv = (records) => {
  const headers = FUEL_COMPARISON_EXPORT_COLUMNS.map((c) => c.label);
  const rows = records.map((rec) => {
    const row = mapComparisonRowForExport(rec);
    return [
      row.vehicleNo,
      row.driver,
      row.billFuel,
      row.fleetEdgeFuel,
      row.variance,
      row.variancePercent,
      row.status,
      row.fromDate,
      row.toDate,
    ]
      .map((val) => `"${String(val).replace(/"/g, '""')}"`)
      .join(',');
  });

  return [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n');
};
