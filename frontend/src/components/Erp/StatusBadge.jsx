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
};

const StatusBadge = ({ status, label = null, className = '', style = {} }) => {
  if (!status) return null;
  const normalized = String(status).toUpperCase();
  const tone = STATE_TONE_MAP[normalized] || 'neutral';
  const displayLabel = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`erp-badge ${tone} ${className}`}
      style={{
        textTransform: 'capitalize',
        fontWeight: 600,
        ...style,
      }}
    >
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
