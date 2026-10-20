import { num } from './mileageNumbers';

/**
 * Pure mapping for the /mileage hub: backend rows → what the tabs and the
 * detail drawer render. Nothing here invents a value — a missing field stays
 * null and the UI shows "—".
 */

/**
 * Pump honesty over GET /fuel-integrity/pump-ledger rows. The ledger sends
 * litres and ₹ per pump; the verdict is read off its short-delivery % once a
 * pump has enough matched fills to judge.
 */
export const PUMP_MIN_FILLS = 3;

/** Short-delivery % (billed − reached tank, over billed) and fill count → verdict. */
export function pumpHonestyStatus(shortfallPct, fills) {
  if (!(fills >= PUMP_MIN_FILLS)) return 'INSUFFICIENT_DATA';
  const pct = num(shortfallPct) ?? 0;
  if (pct <= 1) return 'HONEST';
  if (pct <= 3) return 'RELIABLE';
  if (pct <= 6) return 'SUSPICIOUS';
  if (pct <= 10) return 'UNRELIABLE';
  return 'CHRONIC_SHORTAGE';
}

const FUEL_BRANDS = [
  [/reliance|bp\s*mobility/i, 'Reliance BP'],
  [/indian\s*oil|iocl/i, 'Indian Oil'],
  [/bharat\s*petroleum|bpcl/i, 'BPCL'],
  [/hindustan\s*petroleum|hpcl/i, 'HPCL'],
  [/nayara/i, 'Nayara'],
  [/shell/i, 'Shell'],
];

/**
 * A bill's station text ("M/s X Dealer of Reliance BP Mobility Limited
 * NH19,…") → short name, oil company and the highway/landmark part.
 */
export function cleanStationName(raw) {
  const str = raw == null ? '' : String(raw).trim();
  if (!str) return { displayName: 'Unknown pump', brand: '', location: '' };
  const brand = (FUEL_BRANDS.find(([re]) => re.test(str)) || [])[1] || '';

  const dealer = str.match(/dealer of ([^,]+)/i);
  const name = dealer
    ? dealer[1].trim()
    : str
        .split(/[,-]/)[0]
        .replace(/^M\/s\.?\s+/i, '')
        .trim();

  const landmark = str.match(
    /(NH\s*-?\s*\d+|[A-Z0-9\s]+(?:RICE MILL|BYPASS|CROSSING|DIST|ROAD|STATION|HIGHWAY))/i,
  );
  const location = landmark ? landmark[0].trim() : str.split(',')[1]?.trim() || '';

  return {
    displayName:
      brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} · ${name}` : name,
    brand,
    location: location && location.toUpperCase() !== name.toUpperCase() ? location : '',
  };
}

/** One pump-ledger row → Pumps table row. */
export function mapPumpRow(p) {
  const claimed = num(p.claimedLitres);
  const short = num(p.shortfallLitres);
  const pct =
    num(p.shortfallPct) ?? (claimed > 0 && short != null ? (short / claimed) * 100 : null);
  const fills = num(p.fills) || 0;
  return {
    id: p.pump,
    pump: p.pump || null,
    station: cleanStationName(p.pump),
    fills,
    flaggedFills: num(p.flaggedFills) || 0,
    claimedLitres: claimed,
    actualLitres: num(p.actualLitres),
    shortfallLitres: short,
    shortfallPct: pct,
    lossInr: num(p.estimatedLossInr),
    lastFillAt: p.lastFillAt || null,
    status: pumpHonestyStatus(pct, fills),
  };
}

/** Totals over the mapped pumps. */
export function pumpLedgerSummary(rows) {
  return {
    pumps: rows.length,
    fills: rows.reduce((s, r) => s + r.fills, 0),
    shortfallLitres: rows.reduce((s, r) => s + (r.shortfallLitres || 0), 0),
    lossInr: rows.reduce((s, r) => s + (r.lossInr || 0), 0),
    chronic: rows.filter((r) => r.status === 'CHRONIC_SHORTAGE').length,
  };
}
