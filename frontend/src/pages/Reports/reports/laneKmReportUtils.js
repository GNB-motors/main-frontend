/**
 * Lane km beside SAP (backend GET /api/reports/lanes, plan §C). Pure helpers
 * for the report: verdict words, row view, filtering. Every SAP value of a lane
 * is shown as listed; nothing here averages them.
 */

export const LANE_VERDICT = {
  OVER_SAP: { label: 'Runs over SAP', tone: 'critical' },
  NOT_IN_SAP: { label: 'Not in SAP', tone: 'caution' },
  BETWEEN: { label: 'Between SAP values', tone: 'caution' },
  UNDER_SAP: { label: 'Runs under SAP', tone: 'inert' },
  MATCHES: { label: 'Matches SAP', tone: 'ok' },
  THIN: { label: 'Too few trips', tone: 'inert' },
};

export const LANE_FILTERS = [
  { key: 'all', label: 'All lanes' },
  { key: 'OVER_SAP', label: 'Over SAP' },
  { key: 'NOT_IN_SAP', label: 'Not in SAP' },
  { key: 'BETWEEN', label: 'Between values' },
  { key: 'MATCHES', label: 'Matches' },
];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** One API row as the table shows it. */
export function laneRow(r) {
  const m = r.measured || {};
  const verdict = m.verdict || 'THIN';
  const sap = Array.isArray(r.sapValues) ? r.sapValues : [];
  const extraPerTrip = num(m.extraKmPerTrip);
  const trips = num(m.n) || 0;
  return {
    id: `${r.fromLabel}|${r.toLabel}`,
    from: r.fromLabel,
    to: r.toLabel,
    sap,
    sapText: sap.length ? sap.map((v) => `${v}`).join(' / ') : r.listedWithoutSap ? 'SAP 0' : '—',
    severalSap: sap.length > 1,
    matchingSap: Array.isArray(m.matchingSap) ? m.matchingSap : [],
    measuredKm: num(m.medianKm),
    spreadKm: num(m.spreadKm),
    trips,
    trucks: num(m.trucks) || 0,
    verdict,
    ...(LANE_VERDICT[verdict] || LANE_VERDICT.THIN),
    extraPerTrip,
    extraTotal: extraPerTrip != null ? Math.round(extraPerTrip * trips) : null,
    fromRegister: r.source === 'REGISTER',
    possibly: r.possibly || null,
  };
}

/** Rows for a verdict filter and a FROM/TO search. */
export function filterLanes(rows, filter, search) {
  const q = String(search || '')
    .trim()
    .toUpperCase();
  return rows.filter(
    (r) =>
      (filter === 'all' || !filter || r.verdict === filter) &&
      (!q || r.from.includes(q) || r.to.includes(q)),
  );
}
