import { formatInIST } from '../../utils/dateUtils';
import { timeAgo } from '../../utils/formatters';

export const formatRelativeIST = (utcStr) => (utcStr ? timeAgo(utcStr) : null);

export const formatDateRange = (from, to) => {
  const f = (from && formatInIST(from, 'DD MMM YY')) || '—';
  const t = (to && formatInIST(to, 'DD MMM YY')) || '—';
  return `${f} → ${t}`;
};

export const formatClockIST = (iso) => formatInIST(iso, 'HH:mm');

export const formatDateTimeIST = (iso) => formatInIST(iso, 'DD MMM YY, hh:mm A') ?? '—';

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
  const diffMs = new Date(to).getTime() - new Date(from).getTime();
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
    const fromStr = r.fromDate ? formatInIST(r.fromDate, 'YYYY-MM-DD HH:mm') || '' : '';
    const toStr = r.toDate ? formatInIST(r.toDate, 'YYYY-MM-DD HH:mm') || '' : '';
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
