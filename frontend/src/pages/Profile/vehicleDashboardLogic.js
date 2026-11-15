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

import { isUploadedDoc } from './vehicleDocNormalization';

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

// Bucket a doc into one of: 'missing' | 'pending' | 'expired' | 'critical' | 'warning' | 'healthy' | 'verified' | 'rejected' | 'uploaded'.
export function bucketFor(docEntry, now = new Date()) {
  if (!isUploadedDoc(docEntry)) return 'missing';

  // Explicit rejection
  if (
    docEntry.isRejected ||
    docEntry.status === 'REJECTED' ||
    docEntry.verificationStatus === 'REJECTED'
  ) {
    return 'rejected';
  }

  const days = daysUntil(docEntry.expiryDate, now);

  // Expired
  if (days !== null && days < 0) return 'expired';

  // Expiring soon
  if (days !== null && days < 15) return 'critical';
  if (days !== null && days <= 30) return 'warning';

  // Uploaded but expiry unknown or pending review
  if (days === null) {
    if (docEntry.isVerified || docEntry.verificationStatus === 'VERIFIED') {
      return 'verified';
    }
    return 'pending'; // uploaded, pending OCR / verification
  }

  // Valid / healthy beyond 30 days
  if (docEntry.isVerified || docEntry.verificationStatus === 'VERIFIED') {
    return 'verified';
  }
  return 'healthy';
}

export const BUCKET_STYLES = {
  missing: { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8', label: 'Missing' },
  uploaded: { bg: '#f0fdf4', fg: '#15803d', dot: '#22c55e', label: 'Uploaded' },
  pending: { bg: '#eff6ff', fg: '#1e40af', dot: '#3b82f6', label: 'Pending Verification' },
  verified: { bg: '#dcfce7', fg: '#166534', dot: '#16a34a', label: 'Verified' },
  expired: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: 'Expired' },
  rejected: { bg: '#fef2f2', fg: '#b91c1c', dot: '#ef4444', label: 'Rejected' },
  critical: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626', label: '< 15 days' },
  warning: { bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b', label: '15-30 days' },
  healthy: { bg: '#dcfce7', fg: '#166534', dot: '#16a34a', label: 'Healthy' },
};

// KPI rollups (document-level counts across the whole fleet).
export function computeVehicleDashboardKpis(rows, now = new Date()) {
  let expired = 0;
  let critical = 0; // <15 days
  let warning = 0; // 15-30 days
  let healthy = 0; // >30 days (healthy or verified)
  let pending = 0; // uploaded, pending verification
  let missing = 0; // genuinely not uploaded
  let totalDocSlots = 0;

  rows.forEach((v) => {
    DOC_COLS.forEach(({ key }) => {
      totalDocSlots++;
      const bucket = bucketFor(v.documents?.[key], now);
      if (bucket === 'expired') expired++;
      else if (bucket === 'critical') critical++;
      else if (bucket === 'warning') warning++;
      else if (bucket === 'healthy' || bucket === 'verified' || bucket === 'uploaded') healthy++;
      else if (bucket === 'pending' || bucket === 'rejected') pending++;
      else missing++;
    });
  });

  return {
    total: rows.length,
    expired,
    critical,
    warning,
    healthy,
    pending,
    missing,
    totalDocSlots,
  };
}
