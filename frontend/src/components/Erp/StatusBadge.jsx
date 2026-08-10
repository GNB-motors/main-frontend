import React from 'react';

const STATE_TONE_MAP = {
  // Trip / DO / CN States
  PLACED: 'warning',
  DISPATCHED: 'info',
  TRIP_CLOSED: 'info',
  UNLOADED: 'info',
  POD_RECEIVED: 'info',
  UNLOADING_ENTERED: 'purple',
  BILLED: 'success',
  SALE_BILLED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',

  // Gate / Sub-statuses
  ADVANCE_PENDING: 'warning',
  ADVANCE_PAID: 'info',
  PAID: 'success',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  LOCKED: 'danger',
  OPEN: 'warning',
  CLOSED: 'neutral',
  NONE: 'neutral',

  // Document lifecycle (sale bills, purchase bills, supplier invoices)
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  SUBMITTED: 'info',
  PARTIALLY_PAID: 'warning',
  RELEASED: 'success',

  // Receivable / payable ageing views
  OVERDUE: 'danger',
  DUE_TODAY: 'warning',
  UPCOMING: 'info',
  CURRENT: 'success',
  '1-30': 'warning',
  '31-60': 'warning',
  '61-90': 'danger',
  '90+': 'danger',
  UNKNOWN: 'neutral',

  // Voucher adjustment states
  UNADJUSTED: 'warning',
  PARTIALLY_ADJUSTED: 'info',
  FULLY_ADJUSTED: 'success',

  // Ledger / adjustment posting states
  POSTED: 'success',
  REVERSED: 'neutral',
  SETTLED: 'success',

  // Payment notification states
  SENT: 'success',
  FAILED: 'danger',
};

/**
 * Terms that must not be title-cased. The badge applies
 * `text-transform: capitalize`, which would otherwise render payment modes and
 * tax terms as "Upi", "Neft", "Gst" — wrong, and conspicuously so on a
 * financial screen.
 */
const ACRONYMS = new Set([
  'UPI', 'NEFT', 'RTGS', 'IMPS', 'GST', 'IGST', 'CGST', 'SGST', 'TDS',
  'POD', 'CN', 'FCM', 'RCM', 'EMI', 'PAN', 'GSTIN', 'KL', 'MT',
]);

const StatusBadge = ({
  status,
  label = null,
  tone: toneProp = null,
  className = '',
  style = {},
}) => {
  if (!status && !label) return null;

  const normalized = String(status || '').toUpperCase();
  // An explicit tone wins, so callers can colour a value that isn't a status
  // (an ageing day count, a delta) without inventing a fake status string.
  const tone = toneProp || STATE_TONE_MAP[normalized] || 'neutral';
  const displayLabel = label || String(status).replace(/_/g, ' ');

  const isAcronym = ACRONYMS.has(String(displayLabel).toUpperCase().replace(/\s/g, ''));

  return (
    <span
      className={`erp-badge ${tone} ${className}`}
      style={{
        textTransform: isAcronym ? 'uppercase' : 'capitalize',
        fontWeight: 600,
        ...style,
      }}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
