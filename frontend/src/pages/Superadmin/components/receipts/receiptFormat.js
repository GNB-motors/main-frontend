// Display formatting for WhatsApp fuel receipts (money, litres, dates).

/**
 * Format currency in Indian Rupees
 */
export const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/**
 * Format fuel volume in Litres
 */
export const fmtLitres = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
};

/**
 * Format date for table & cards
 */
export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time text (e.g. "12 mins ago", "3 hrs ago")
 */
export const fmtRelativeTime = (d) => {
  if (!d) return '—';
  const diffMs = Date.now() - new Date(d).getTime();
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
