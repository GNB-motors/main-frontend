/**
 * Route Hub formatting + geometry helpers, kept out of the component file so
 * fast-refresh stays happy.
 */

/* ================= formatters (ported from the mockup) ================= */

export const inr = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');

export const inrK = (n) => {
  const v = n || 0;
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + 'L';
  if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'k';
  return '₹' + Math.round(v);
};

export const fmtT = (d) =>
  d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();

export const fmtDT = (d) =>
  `${d.getDate()} ${d.toLocaleDateString('en-IN', { month: 'short' })} ${d.getFullYear()}, ${fmtT(d)}`;

export const ago = (h) => {
  if (h < 1) return 'just now';
  if (h < 24) return `${Math.round(h)} hours ago`;
  return `${Math.floor(h / 24)} day${h >= 48 ? 's' : ''} ago`;
};

export const hm = (m) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;

/** Local-midnight YYYY-MM-DD, matching the mockup's date-input round-tripping. */
export const dkey = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

/** Great-circle distance in km between two [lat, lng] pairs. */
export function haversineKm(a, b) {
  const R = 6371;
  const r = Math.PI / 180;
  const dLa = (b[0] - a[0]) * r;
  const dLo = (b[1] - a[1]) * r;
  const s =
    Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Margin-health band — the design's four-colour scale. */
export const HEALTH = (p) => {
  if (p >= 25) return { l: 'Optimal', c: '#187A32', tint: 'rgba(37,186,76,.14)' };
  if (p >= 18) return { l: 'Healthy', c: '#2F58EE', tint: 'var(--nova-rage-a10)' };
  if (p >= 12) return { l: 'Monitor', c: '#C56200', tint: 'rgba(240,170,72,.18)' };
  return { l: 'Low margin', c: '#C2323A', tint: 'rgba(229,104,107,.16)' };
};

export function downloadCsv(name, rows) {
  const body = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
  a.download = `${name}-${dkey(new Date())}.csv`;
  a.click();
}
