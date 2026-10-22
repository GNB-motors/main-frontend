/**
 * Tolls report formatting + the small pure functions the page and its tests
 * share. Kept apart from the JSX so the money maths is testable without a DOM.
 */

/** Toll classes the plaza fare table can be keyed by (mirrors tollClasses.js). */
export const VEHICLE_CLASSES = [
  'CAR',
  'HUV',
  'LMV',
  'LMV_2AXLE',
  'HMV',
  'HMV_3AXLE',
  'HMV_4AXLE',
  'HMV_6AXLE',
  'HMV_7AXLE',
  'UNKNOWN',
];

/** A vehicle with no explicit class bills at its plaza's default class. */
export const DEFAULT_RADIUS_METERS = 300;

const inr = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : Number(n).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });

export const formatInr = inr;

export const formatPct = (ratio) =>
  ratio == null ? '—' : `${Math.round((Number(ratio) || 0) * 100)}%`;

/** "6h 0m" / "2d 3h" — a gap between two crossings, for the anomaly table. */
export function formatGap(hours) {
  if (hours == null || Number.isNaN(Number(hours))) return '—';
  const totalMinutes = Math.round(Number(hours) * 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/** Local 'YYYY-MM' for <input type="month">, or '' when there is no clock. */
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * The four summary tiles. Month spend and return-rule savings are the numbers
 * the owner actually asks for; crossings and missed returns give them the
 * context to judge the first two.
 */
export function summaryTiles(summary) {
  const s = summary || {};
  return [
    { key: 'spend', label: 'Month spend', value: inr(s.spendInr), suffix: '₹', tone: 'slate' },
    { key: 'crossings', label: 'Crossings', value: s.crossings ?? 0, suffix: '', tone: 'slate' },
    {
      key: 'savings',
      label: 'Saved by return rule',
      value: inr(s.savingsInr),
      suffix: '₹',
      tone: 'green',
    },
    {
      key: 'missed',
      label: 'Missed returns',
      value: inr(s.missedReturnInr),
      suffix: '₹',
      tone: s.anomalyCount ? 'amber' : 'slate',
      hint:
        s.anomalyCount > 0
          ? `${s.anomalyCount} crossing(s) billed onward although a return was inside the window`
          : 'Every return inside the window was discounted',
    },
  ];
}

/** Per-vehicle table rows, flattened for display. */
export function vehicleRows(vehicles = []) {
  return vehicles.map((v) => ({
    ...v,
    vehicleLabel: v.registrationNumber || v.vehicleId,
    plazaSummary: v.plazaBreakdown
      .map((p) => `${p.name || p.plazaId} ×${p.crossings}`)
      .join(', '),
  }));
}

/**
 * Filter the vehicle table. Search matches the registration; the flag filter
 * isolates the population each audience cares about.
 * @param {'all'|'savers'|'overpay'} flag
 */
export function filterVehicles(vehicles = [], { search = '', flag = 'all' } = {}) {
  const needle = search.trim().toLowerCase();
  return vehicles.filter((v) => {
    if (needle && !(v.registrationNumber || '').toLowerCase().includes(needle)) return false;
    if (flag === 'savers') return v.savingsInr > 0;
    if (flag === 'overpay') return v.possibleOverpay;
    return true;
  });
}

/** Rows for the per-vehicle × plaza CSV download button (client-side fallback). */
export function exportCsvText(reportData) {
  const header = [
    'MONTH',
    'VEHICLE',
    'PLAZA',
    'CROSSINGS',
    'ONWARD',
    'RETURN',
    'RETURN SAVINGS INR',
    'SPEND INR',
    'POSSIBLE OVERPAY',
  ];
  const lines = [header.join(',')];
  for (const v of reportData?.vehicles || []) {
    for (const p of v.plazaBreakdown || []) {
      lines.push(
        [
          reportData.month,
          v.registrationNumber || v.vehicleId,
          p.name || p.plazaId,
          p.crossings,
          p.onward,
          p.ret,
          p.savings,
          p.spend,
          v.possibleOverpay ? 'YES' : 'NO',
        ]
          .map((cell) => {
            const s = String(cell ?? '');
            return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(','),
      );
    }
  }
  return `${lines.join('\r\n')}\r\n`;
}

/** Trigger a browser download for a Blob or a text body. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * "HMV_3AXLE=310; CAR=85" -> { HMV_3AXLE: 310, CAR: 85 }. Throws with a message
 * the editor can show verbatim. Lives here, not in the component, so the
 * component file exports nothing but components (react-refresh rule).
 */
export function parseFaresText(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('At least one fare is required');
  const fares = {};
  for (const part of raw.split(/[;|]/)) {
    const piece = part.trim();
    if (!piece) continue;
    const [cls, amount] = piece.split('=');
    const key = String(cls || '').trim().toUpperCase();
    const value = Number(String(amount || '').trim());
    if (!key) throw new Error(`"${piece}" is missing a vehicle class`);
    if (!VEHICLE_CLASSES.includes(key)) throw new Error(`Unknown vehicle class "${key}"`);
    if (!Number.isFinite(value) || value < 0) throw new Error(`Bad amount in "${piece}"`);
    fares[key] = value;
  }
  if (!Object.keys(fares).length) throw new Error('At least one fare is required');
  return fares;
}

/** Inverse of parseFaresText, for filling the edit form. */
export const formatFares = (fares = {}) =>
  Object.entries(fares)
    .map(([cls, amount]) => `${cls}=${amount}`)
    .join('; ');