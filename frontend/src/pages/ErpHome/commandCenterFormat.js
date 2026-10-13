export const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
export const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const pct = (part, total) => (total > 0 ? `${(part / total) * 100}%` : '0%');
