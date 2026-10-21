/**
 * Lane km beside SAP (backend GET /api/reports/lanes, plan §C). Pure helpers
 * for the report: verdict words, row view, filtering. Every SAP value of a lane
 * is shown as listed; nothing here averages them.
 */

import { compareSap } from '../../Sap/sapModel';
import { matchesSearch } from './reportFilters';

export const LANE_VERDICT = {
  OVER_SAP: { label: 'Runs over SAP', tone: 'critical' },
  NOT_IN_SAP: { label: 'Not in SAP', tone: 'caution' },
  BETWEEN: { label: 'Between SAP values', tone: 'caution' },
  UNDER_SAP: { label: 'Runs under SAP', tone: 'inert' },
  MATCHES: { label: 'Matches SAP', tone: 'ok' },
  THIN: { label: 'Too few trips', tone: 'inert' },
};

/** The verdict filter: every lane, or one verdict (each verdict has an option). */
export const LANE_FILTERS = [
  { key: 'all', label: 'All lanes' },
  ...Object.entries(LANE_VERDICT).map(([key, v]) => ({ key, label: v.label })),
];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** One API row as the table shows it. */
export function laneRow(r) {
  const m = r.register || r.measured || {};
  const gps = r.gps || {};
  const values = (r.sapValues || []).filter((n) => n > 0);
  const policy = r.multiValuePolicy || 'NEAREST';
  const reference =
    policy === 'MIN'
      ? Math.min(...values)
      : policy === 'MAX' || gps.medianLadenKm == null
        ? Math.max(...values)
        : values.reduce(
            (best, v) =>
              Math.abs(v - gps.medianLadenKm) < Math.abs(best - gps.medianLadenKm) ? v : best,
            values[0],
          );
  const comparison = compareSap(
    gps.medianLadenKm,
    reference,
    r.tolerancePct ?? 10,
    r.minKmForVerdict ?? 10,
  );
  const serverVerdict = {
    OVER: 'OVER_SAP',
    UNDER: 'UNDER_SAP',
    WITHIN: 'MATCHES',
    NO_SAP: 'NOT_IN_SAP',
    NO_GPS: 'THIN',
    NO_KM: 'THIN',
  }[r.verdict];
  const verdict =
    serverVerdict ||
    (!r.gps && !r.register
      ? m.verdict || 'THIN'
      : !values.length
        ? 'NOT_IN_SAP'
        : { OVER: 'OVER_SAP', UNDER: 'UNDER_SAP', WITHIN: 'MATCHES' }[comparison.verdict] ||
          'THIN');
  const sap = Array.isArray(r.sapValues) ? r.sapValues : [];
  const extraPerTrip =
    r.gps || r.register
      ? comparison.deltaKm == null
        ? null
        : verdict === 'OVER_SAP'
          ? Math.max(0, comparison.deltaKm)
          : 0
      : num(m.extraKmPerTrip);
  const trips = num(gps.n) ?? num(m.n) ?? 0;
  return {
    id: r.id || r._id || `${r.source || ''}|${r.fromLabel}|${r.toLabel}`,
    gpsKm: num(gps.medianLadenKm),
    gpsTrips: num(gps.n),
    fromName: r.fromName || r.fromSite?.name,
    toName: r.toName || r.toSite?.name,
    from: r.fromLabel,
    to: r.toLabel,
    sap,
    sapText: sap.length ? sap.map((v) => `${v}`).join(' / ') : r.listedWithoutSap ? 'SAP 0' : '—',
    severalSap: sap.length > 1,
    matchingSap: Array.isArray(m.matchingSap) ? m.matchingSap : [],
    measuredKm: num(m.medianKm),
    spreadKm: num(m.spreadKm),
    trips,
    trucks: num(gps.trucks) ?? num(m.trucks) ?? 0,
    verdict,
    ...(LANE_VERDICT[verdict] || LANE_VERDICT.THIN),
    extraPerTrip,
    extraTotal: extraPerTrip != null ? Math.round(extraPerTrip * trips) : null,
    fromRegister: r.source === 'REGISTER',
    possibly: r.possibly || null,
  };
}

/** Rows for a verdict filter and a FROM/TO search (case-insensitive). */
export function filterLanes(rows, filter, search) {
  return rows.filter(
    (r) =>
      (filter === 'all' || !filter || r.verdict === filter) &&
      matchesSearch(search, [r.from, r.to, r.fromName, r.toName]),
  );
}
