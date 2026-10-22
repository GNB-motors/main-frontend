/** Why a trip has no SAP comparison. The last four are snapshots from before SAP moved to routes. */
export const SAP_REASONS = {
  NO_DROP: 'Drop not known',
  NO_PLACE: 'Plant or drop is not a saved place',
  NO_ROUTE_SAP: 'No SAP for this route yet',
  DROP_UNNAMED: 'Drop place has no name',
  NO_PLANT_MATCH: 'No SAP for this route yet',
  NO_DROP_MATCH: 'No SAP for this route yet',
  NO_LANE: 'No SAP for this route yet',
};
export const BASIS_LABEL = { ONE_WAY: 'One way', ROUND_TRIP: 'Round trip' };
/** What a SAP of this basis is compared with. */
export const COMPARED_WITH = {
  ONE_WAY: 'Loaded km (plant → drop)',
  ROUND_TRIP: 'Loaded + return km',
};
export const SOURCE_LABEL = { MANUAL: 'Entered by a person', IMPORTED: 'Imported from a sheet' };
export const DIRECTION_LABEL = {
  DIRECTED: 'Each direction is its own route (A → B and B → A need their own SAP)',
  UNDIRECTED: 'One SAP for both directions between two places',
};
export const BASIS_POLICY_LABEL = {
  DECLARED: 'The person entering SAP says whether it is one way or round trip',
  AUTO: 'Decide from the shortest truck road (×1 = one way, ×2 = round trip)',
};
export const canEditSap = (role) => ['OWNER', 'MANAGER'].includes(role);
export const kmText = (n) =>
  n == null ? '—' : `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
export const signed = (n, suffix = '') =>
  n == null
    ? '—'
    : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 1 })}${suffix}`;
export function verdictView(comparison, tolerance = 10) {
  const v = comparison?.verdict;
  if (v === 'WITHIN') return { tone: 'within', text: `Within ${tolerance}%` };
  if (v === 'OVER' || v === 'UNDER')
    return { tone: v.toLowerCase(), text: signed(comparison.deltaPct, '%') };
  return { tone: 'none', text: '—' };
}
/**
 * What the road engine says about a typed SAP km, in words. `hint` is GET /sap/routes/hint.
 * A suggestion only: the person chooses the basis.
 */
export function hintText(hint, sapKm) {
  if (!hint || hint.shortestOneWayKm == null) return null;
  const road = `Shortest truck road: ${kmText(hint.shortestOneWayKm)} one way.`;
  const s = hint.suggestion;
  if (!(sapKm > 0) || !s) return road;
  if (s.basis === 'ONE_WAY' || s.basis === 'ROUND_TRIP') {
    const looks = `${kmText(sapKm)} looks like ${BASIS_LABEL[s.basis].toLowerCase()}.`;
    const below = s.belowShortest
      ? ` It is ${kmText(s.shortfallKm)} below the shortest road — every trip loses that.`
      : '';
    return `${road} ${looks}${below}`;
  }
  return `${road} ${kmText(sapKm)} is neither close to one way nor to round trip.`;
}
export async function sheetCsv(file) {
  if (/\.csv$/i.test(file.name)) return file.text();
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose a CSV or XLSX file.');
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  if (!book.SheetNames.length) throw new Error('The workbook has no sheets.');
  return XLSX.utils.sheet_to_csv(book.Sheets[book.SheetNames[0]]);
}
