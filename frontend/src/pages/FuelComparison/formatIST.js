import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

// Extending dayjs is global and idempotent — safe to import from many modules.
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const IST_ZONE = 'Asia/Kolkata';

export const toIST = (utcStr) => {
  if (!utcStr) return null;
  return dayjs.utc(utcStr).tz(IST_ZONE);
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

export const formatClockIST = (iso) => {
  if (!iso) return null;
  return dayjs.utc(iso).tz(IST_ZONE).format('HH:mm');
};

export const formatDateTimeIST = (iso) => {
  if (!iso) return '—';
  const d = toIST(iso);
  if (!d || !d.isValid()) return '—';
  return d.format('DD MMM YY, hh:mm A');
};

export const fmtLitres = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;
};

export const fmtKm = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export const fmtDuration = (from, to) => {
  if (!from || !to) return null;
  const f = dayjs(from);
  const t = dayjs(to);
  const diffMs = t.diff(f);
  if (diffMs <= 0 || isNaN(diffMs)) return null;

  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const exportComparisonToCsv = (records = [], filename = 'fuel-comparison-audit.csv') => {
  if (!records || records.length === 0) return;

  const headers = [
    'Task ID',
    'Vehicle Registration',
    'Driver Name',
    'From Date (IST)',
    'To Date (IST)',
    'Duration',
    'Billed Fuel (L)',
    'Telematics Fuel (L)',
    'Variance (L)',
    'Variance (%)',
    'Audit Status',
    'Flag Reason',
    'Odometer Status',
    'Distance (km)',
    'Min Odometer',
    'Max Odometer',
    'Fuel Efficiency (km/L)',
    'DEF Consumed (L)',
    'Data Pipeline',
  ];

  const escapeCsv = (val) => {
    if (val == null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = records.map((r) => {
    const driverName = r.driverId
      ? `${r.driverId.firstName || ''} ${r.driverId.lastName || ''}`.trim()
      : '';
    const fromStr = r.fromDate ? toIST(r.fromDate)?.format('YYYY-MM-DD HH:mm') || '' : '';
    const toStr = r.toDate ? toIST(r.toDate)?.format('YYYY-MM-DD HH:mm') || '' : '';
    const durStr = fmtDuration(r.fromDate, r.toDate) || '';

    const varL = r.variance != null ? (-r.variance).toFixed(2) : '';
    const varPct = r.variancePercent != null ? (-r.variancePercent).toFixed(1) : '';
    const auditStatus = r.isFlagged
      ? 'FLAGGED'
      : r.status === 'PENDING_REVIEW'
        ? 'PENDING_REVIEW'
        : r.status === 'NO_DATA'
          ? 'NO_DATA'
          : 'MATCHED';

    const odoStatus = r.isOdometerFlagged
      ? 'MISMATCH'
      : r.status === 'PENDING_REVIEW'
        ? 'REVIEW_NEEDED'
        : r.ocrOdometerReading != null
          ? 'VERIFIED'
          : 'NOT_RECORDED';

    return [
      escapeCsv(r._id),
      escapeCsv(r.vehicleId?.registrationNumber || r.vehicleNumber || ''),
      escapeCsv(driverName),
      escapeCsv(fromStr),
      escapeCsv(toStr),
      escapeCsv(durStr),
      escapeCsv(r.billFuelConsumed != null ? r.billFuelConsumed.toFixed(2) : ''),
      escapeCsv(r.fleetEdgeFuelConsumed != null ? r.fleetEdgeFuelConsumed.toFixed(2) : ''),
      escapeCsv(varL),
      escapeCsv(varPct),
      escapeCsv(auditStatus),
      escapeCsv(r.flagReason || ''),
      escapeCsv(odoStatus),
      escapeCsv(r.distanceTravelled != null ? r.distanceTravelled.toFixed(1) : ''),
      escapeCsv(r.minOdometer != null ? r.minOdometer.toFixed(1) : ''),
      escapeCsv(r.maxOdometer != null ? r.maxOdometer.toFixed(1) : ''),
      escapeCsv(r.fuelEfficiency != null ? r.fuelEfficiency.toFixed(2) : ''),
      escapeCsv(r.defConsumed != null ? r.defConsumed.toFixed(2) : ''),
      escapeCsv(r.dataSource || 'SINK'),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
