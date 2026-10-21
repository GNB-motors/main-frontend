export const SAP_REASONS = {
  NO_DROP: 'Drop not known',
  DROP_UNNAMED: 'Drop place has no name',
  NO_PLANT_MATCH: 'Plant not linked to SAP sheet',
  NO_DROP_MATCH: 'Drop not linked to SAP sheet',
  NO_LANE: 'No SAP for this route',
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
export function compareSap(actual, reference, tolerance = 10, minKm = 10) {
  if (actual == null || actual < minKm || !(reference > 0)) return { verdict: 'NO_KM' };
  const delta = ((actual - reference) / reference) * 100;
  return {
    deltaKm: actual - reference,
    deltaPct: Math.round(delta * 10) / 10,
    verdict:
      Math.abs(actual - reference) <= (reference * tolerance) / 100 + 1e-9
        ? 'WITHIN'
        : delta > 0
          ? 'OVER'
          : 'UNDER',
  };
}
export const laneLabels = (data, kind) => [
  ...new Set(
    (data?.rows || []).map((r) => (kind === 'PLANT' ? r.fromLabel : r.toLabel)).filter(Boolean),
  ),
];
export async function sheetCsv(file) {
  if (/\.csv$/i.test(file.name)) return file.text();
  if (!/\.xlsx$/i.test(file.name)) throw new Error('Choose a CSV or XLSX file.');
  const XLSX = await import('xlsx');
  const book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  if (!book.SheetNames.length) throw new Error('The workbook has no sheets.');
  return XLSX.utils.sheet_to_csv(book.Sheets[book.SheetNames[0]]);
}
