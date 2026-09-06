export const formatServiceDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatServiceCurrency = (n) => {
  if (n === null || n === undefined) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatServiceKm = (n) =>
  n === null || n === undefined ? '—' : `${Number(n).toLocaleString('en-IN')} km`;
