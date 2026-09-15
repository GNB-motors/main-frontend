/**
 * formatters.js — the single place for number/₹ formatting and data freshness.
 *
 * Rules of the house:
 *  - Indian grouping everywhere: ₹1,23,456 — never ₹123,456.
 *  - Lakh/crore abbreviations on tiles: ₹1.2L, ₹3.4Cr.
 *  - Every ₹/litre/km figure renders through these helpers, in the tabular
 *    mono face (`.num` class) at the call site.
 *  - Freshness is a shared contract: any surface showing telemetry/pulled data
 *    badges it through `freshnessOf` + `timeAgo`.
 */

const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const numIN = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const numIN1 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 });
const numIN2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

/** ₹1,23,456 — pass decimals for paise. null/NaN → '—'. */
export function formatINR(value, { decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return (decimals > 0 ? inr2 : inr0).format(Number(value));
}

/** ₹1.2L / ₹3.4Cr / ₹45.3k — compact Indian scale for tiles. */
export function formatInrCompact(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1e7) return `${sign}₹${numIN2.format(abs / 1e7)}Cr`;
  if (abs >= 1e5) return `${sign}₹${numIN1.format(abs / 1e5)}L`;
  if (abs >= 1e3) return `${sign}₹${numIN1.format(abs / 1e3)}k`;
  return `${sign}₹${numIN.format(abs)}`;
}

/** 1,23,456 (plain number, Indian grouping). */
export function formatNum(value, { decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  if (decimals === 1) return numIN1.format(Number(value));
  if (decimals === 2) return numIN2.format(Number(value));
  return numIN.format(Number(value));
}

/** 1,234 km */
export function formatKm(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${numIN.format(Math.round(Number(value)))} km`;
}

/** 152.4 L */
export function formatLitres(value, { decimals = 1 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${decimals === 0 ? numIN.format(Number(value)) : numIN1.format(Number(value))} L`;
}

/** 87.2% */
export function formatPct(value, { decimals = 0 } = {}) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${decimals === 1 ? numIN1.format(Number(value)) : numIN.format(Number(value))}%`;
}

/**
 * "8h ago" / "just now" / "3d ago" — compact relative time for freshness
 * badges. Future timestamps clamp to 'just now'.
 */
export function timeAgo(input, now = Date.now()) {
  if (!input) return 'never';
  const t = input instanceof Date ? input.getTime() : new Date(input).getTime();
  if (Number.isNaN(t)) return 'never';
  const diffMin = Math.floor((now - t) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return `${Math.floor(diffD / 30)}mo ago`;
}

/**
 * Freshness contract (system-wide):
 *   fresh    < 1h   — no chrome needed
 *   aging    1–6h   — muted timestamp
 *   stale    6–24h  — amber "Last updated …"
 *   dead     > 24h or null — red "data stopped arriving" territory
 */
export function freshnessOf(input, now = Date.now()) {
  if (!input) return 'dead';
  const t = input instanceof Date ? input.getTime() : new Date(input).getTime();
  if (Number.isNaN(t)) return 'dead';
  const ageMs = now - t;
  if (ageMs < 60 * 60 * 1000) return 'fresh';
  if (ageMs < 6 * 60 * 60 * 1000) return 'aging';
  if (ageMs < 24 * 60 * 60 * 1000) return 'stale';
  return 'dead';
}

/** Grade → signal word for the health gauge bands. */
export function gradeSignal(grade) {
  switch (grade) {
    case 'A':
      return 'ok';
    case 'B':
      return 'ok';
    case 'C':
      return 'caution';
    default:
      return 'critical';
  }
}
