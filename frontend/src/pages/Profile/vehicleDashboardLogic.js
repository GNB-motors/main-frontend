/**
 * Pure document-expiry logic for the Vehicle Dashboard (rule 21). `now` is
 * injectable everywhere so bucket/day-count math is deterministic in tests.
 */

// Document type → display label (matches WheelsEye standard).
export const DOC_COLS = [
  { key: 'RC', label: 'RC', fullLabel: 'Registration Certificate', short: 'RC' },
  { key: 'INSURANCE', label: 'Insurance', fullLabel: 'Vehicle Insurance', short: 'INS' },
  { key: 'PERMIT', label: 'State Permit', fullLabel: 'State Permit', short: 'SP' },
  { key: 'NATIONAL_PERMIT', label: 'National Permit', fullLabel: 'National Permit', short: 'NP' },
  { key: 'ROAD_TAX', label: 'Road Tax', fullLabel: 'Road Tax Certificate', short: 'RT' },
  { key: 'FITNESS', label: 'Fitness', fullLabel: 'Fitness Certificate', short: 'FIT' },
  { key: 'PUCC', label: 'PUCC', fullLabel: 'PUCC Certificate', short: 'PUC' },
];

// Quick filter pills matching WheelsEye top bar sequence & labels
export const EXPIRED_FILTER_PILLS = [
  { key: 'RC', label: 'Rc' },
  { key: 'FITNESS', label: 'Fitness' },
  { key: 'INSURANCE', label: 'Insurance' },
  { key: 'PUCC', label: 'PUCC' },
  { key: 'PERMIT', label: 'State Permit' },
  { key: 'NATIONAL_PERMIT', label: 'National Permit' },
  { key: 'ROAD_TAX', label: 'Road Tax' },
];

// Days between today (00:00) and the given Date — negative if past.
export function daysUntil(d, now = new Date()) {
  if (!d) return null;
  const target = new Date(d);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Bucket a doc into one of: 'missing' | 'expired' | 'critical' | 'warning' | 'healthy'.
export function bucketFor(docEntry, now = new Date()) {
  if (!docEntry?.uploaded) return 'missing';
  const days = daysUntil(docEntry.expiryDate, now);
  if (days === null) return 'missing'; // uploaded but expiry not yet known (OCR pending)
  if (days < 0) return 'expired';
  if (days < 15) return 'critical';
  if (days <= 30) return 'warning';
  return 'healthy';
}

export const BUCKET_STYLES = {
  missing: { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8', label: 'Missing' },
  expired: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: 'Expired' },
  critical: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: '< 15 days' },
  warning: { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: '15-30 days' },
  healthy: { bg: '#dcfce7', fg: '#166534', dot: '#16a34a', label: 'Healthy' },
};

// KPI rollups (document-level counts across the whole fleet).
export function computeVehicleDashboardKpis(rows, now = new Date()) {
  let expired = 0;
  let critical = 0; // <15 days
  let warning = 0; // 15-30 days
  let healthy = 0; // >30 days
  let missing = 0;
  let totalDocSlots = 0;

  rows.forEach((v) => {
    DOC_COLS.forEach(({ key }) => {
      totalDocSlots++;
      const bucket = bucketFor(v.documents?.[key], now);
      if (bucket === 'expired') expired++;
      else if (bucket === 'critical') critical++;
      else if (bucket === 'warning') warning++;
      else if (bucket === 'healthy') healthy++;
      else missing++;
    });
  });

  return { total: rows.length, expired, critical, warning, healthy, missing, totalDocSlots };
}
