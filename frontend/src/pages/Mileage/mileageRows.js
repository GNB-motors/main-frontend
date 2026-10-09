import dayjs from 'dayjs';
import { toISTDateString } from '../../utils/dateUtils';

const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

/**
 * Pure mapping for the /mileage hub: backend rows → what the tabs and the
 * detail drawer render. Nothing here invents a value — a missing field stays
 * null and the UI shows "—".
 */

/**
 * One fill as the owner reads it: the unified feed's verificationStatus, with
 * a flagged bill split by which way it is wrong. Labels and tones live in the
 * vocabulary layer (group `refuel`).
 */
export function refuelResult(status, tankMinusBillL = null) {
  switch (status) {
    case 'VERIFIED':
      return 'BILL_MATCHES';
    case 'FLAGGED':
      return num(tankMinusBillL) > 0 ? 'BILL_TOO_LOW' : 'BILL_TOO_HIGH';
    case 'UNVERIFIED':
      return 'BILL_MISSING';
    case 'SLIP_ONLY':
      return 'NO_TANK_READING';
    case 'SENSOR_GLITCH':
      return 'GAUGE_JUMP';
    default:
      return null;
  }
}

/** Fill-list chips → the feed's `status` param and the `meta` count each reads. */
export const REFUEL_CHIPS = [
  {
    key: 'all',
    label: 'All fills',
    count: (m) => m.verified + m.flagged + m.unverified + m.slipOnly,
  },
  { key: 'verified', label: 'Bill matches', count: (m) => m.verified },
  { key: 'flagged', label: 'Bill to check', count: (m) => m.flagged },
  { key: 'unverified', label: 'Bill missing', count: (m) => m.unverified },
  { key: 'slip_only', label: 'No tank reading', count: (m) => m.slipOnly },
  // Glitches are never in "All fills" or any total; only listed when asked for.
  { key: 'sensor_glitch', label: 'Gauge jumps', count: (m) => m.sensorGlitch },
];

/** /fuel-comparison/records status → the same plain-word fill result. */
export const RECONCILIATION_RESULT = {
  CLEAN: 'BILL_MATCHES',
  FLAGGED: 'BILL_TOO_HIGH',
  REVIEW: 'BILL_TOO_LOW',
};

/** Where a bill's odometer reading came from, in plain words. */
export const ODOMETER_SOURCE = {
  FLEETEDGE: 'Truck tracker',
  OCR: 'Odometer photo',
  MANUAL: null,
};

/** km/L → band. The same cut-offs the old Completed-cycles colouring used. */
export function mileageBand(kmPerL) {
  const k = num(kmPerL);
  if (k == null) return null;
  if (k >= 4) return 'MILEAGE_GOOD';
  if (k >= 3.5) return 'MILEAGE_AVERAGE';
  return 'MILEAGE_LOW';
}

/**
 * One date range for the whole hub. Quick choices plus any from–to; the
 * unified feed scans every bill and fill in the range, so it is never
 * unbounded.
 */
export const HUB_DATE_PRESETS = [
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7DAYS', label: '7 days' },
  { key: '30DAYS', label: '30 days' },
  { key: 'MONTH', label: 'This month' },
  { key: '90DAYS', label: '90 days' },
];

export const DEFAULT_PRESET = '30DAYS';

const DAY = 'YYYY-MM-DD';
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Preset → inclusive { from, to } calendar dates (YYYY-MM-DD, local). */
export function presetRange(key, now = dayjs()) {
  const to = now.format(DAY);
  switch (key) {
    case 'TODAY':
      return { from: to, to };
    case 'YESTERDAY': {
      const y = now.subtract(1, 'day').format(DAY);
      return { from: y, to: y };
    }
    case '7DAYS':
      return { from: now.subtract(6, 'day').format(DAY), to };
    case 'MONTH':
      return { from: now.startOf('month').format(DAY), to };
    case '90DAYS':
      return { from: now.subtract(89, 'day').format(DAY), to };
    case '30DAYS':
    default:
      return { from: now.subtract(29, 'day').format(DAY), to };
  }
}

/**
 * URL → the hub's range. `?dates=7DAYS`, or `?from=…&to=…` for picked dates;
 * anything unreadable falls back to the default 30 days.
 */
export function hubRangeFromParams(params, now = dayjs()) {
  const from = params.get('from');
  const to = params.get('to');
  if (ISO_DAY.test(from || '') && ISO_DAY.test(to || '') && from <= to) {
    return { preset: null, range: { from, to } };
  }
  const key = params.get('dates');
  const preset = HUB_DATE_PRESETS.some((p) => p.key === key) ? key : DEFAULT_PRESET;
  return { preset, range: presetRange(preset, now) };
}

/** "9 Oct 2026", or "10 Sep – 9 Oct 2026". */
export function rangeLabel({ from, to }) {
  const a = dayjs(from);
  const b = dayjs(to);
  if (from === to) return b.format('D MMM YYYY');
  return `${a.format(a.year() === b.year() ? 'D MMM' : 'D MMM YYYY')} – ${b.format('D MMM YYYY')}`;
}

/** Calendar range → API params: start and end of the IST day, as ISO. */
export function rangeToParams({ from, to }) {
  const params = {};
  if (from) params.from = new Date(`${from}T00:00:00.000+05:30`).toISOString();
  if (to) params.to = new Date(`${to}T23:59:59.999+05:30`).toISOString();
  return params;
}

function effectiveRate(slip) {
  if (!slip) return { value: null, provenance: null };
  if (num(slip.rate)) return { value: num(slip.rate), provenance: 'BILL' };
  if (num(slip.totalAmount) && num(slip.litres)) {
    return { value: num(slip.totalAmount) / num(slip.litres), provenance: 'CALCULATED' };
  }
  return { value: null, provenance: null };
}

/** One /fuel-logs/unified row → Live table row. */
export function mapUnifiedRow(row) {
  const slip = row.slip || null;
  const sensor = row.sensor || null;
  const slipLocation =
    slip?.location && String(slip.location).trim() !== '-' ? String(slip.location).trim() : null;
  // The saved place the sensor fix falls in (Place Hub) names the pump when
  // someone named it; otherwise the bill's text, then the raw coordinates.
  const place = row.place?.hubId
    ? { hubId: row.place.hubId, name: row.place.name || null, siteType: row.place.siteType }
    : null;
  const location = place?.name || slipLocation || sensor?.fuelPumpName || null;
  const coords =
    !location && num(sensor?.lat) != null && num(sensor?.lng) != null
      ? { lat: num(sensor.lat), lng: num(sensor.lng) }
      : null;
  const odometer = num(slip?.odometerReading) || null;

  return {
    id: row.id,
    vehicleNo: row.vehicleNumber || null,
    vehicleId: row.vehicleId || null,
    model: row.vehicleModel || null,
    at: row.at || null,
    status: row.verificationStatus || null,
    result: refuelResult(row.verificationStatus, sensor?.billVarianceL),
    litres: num(row.litres),
    slipLitres: num(slip?.litres),
    // Corrected figure (null for a glitch); rawLitres is how far the gauge rose.
    sensorLitres: num(sensor?.litres),
    rawLitres: num(sensor?.rawLitres),
    bandL: num(sensor?.bandL),
    correction: sensor?.correction || null,
    gainBills: num(sensor?.gainBills),
    billVarianceL: num(sensor?.billVarianceL),
    billToleranceL: num(sensor?.billToleranceL),
    location,
    billLocation: slipLocation,
    coords,
    place,
    rate: effectiveRate(slip),
    totalAmount: num(slip?.totalAmount),
    odometer,
    odometerSource: odometer != null ? slip.odometerSource || null : null,
    fuelType: slip?.fuelType || (sensor ? 'DIESEL' : null),
    raw: row,
  };
}

/** Same fill as the drawer sees it, from either tab's row. */
export function drawerFromLiveRow(row) {
  const { raw } = row;
  const slip = raw.slip || null;
  const sensor = raw.sensor || null;
  return {
    title: row.vehicleNo,
    subtitle: row.model,
    result: row.result,
    explanation: fillExplanation(row),
    bill: slip
      ? {
          id: slip.id || null,
          litres: num(slip.litres),
          amount: num(slip.totalAmount),
          rate: row.rate,
          at: raw.at,
          location: row.location,
          fuelType: slip.fuelType || null,
          fillingType: slip.fillingType || null,
          driverName: slip.driverName || null,
          odometer: row.odometer,
          odometerSource: row.odometerSource,
          channel: slip.submissionChannel || null,
          documentId: slip.documentId || null,
          rawRate: num(slip.rate),
          rawLocation: slipLocationOf(slip),
        }
      : null,
    sensor: sensor
      ? {
          litres: num(sensor.litres),
          rawLitres: num(sensor.rawLitres),
          correction: sensor.correction || null,
          gainBills: num(sensor.gainBills),
          bandL: num(sensor.bandL),
          at: sensor.at || null,
          pumpName: sensor.fuelPumpName || null,
          lat: num(sensor.lat),
          lng: num(sensor.lng),
          confirmationStatus: sensor.confirmationStatus || null,
        }
      : null,
    // As sent: corrected sensor litres − billed (+ ⇒ the tank rose more).
    varianceL: num(sensor?.billVarianceL),
    variancePct: null,
    billCheck:
      slip && sensor
        ? {
            toleranceL: num(sensor.billToleranceL),
            flagged: Boolean(sensor.billFlag),
            v1VarianceL: num(sensor.v1BillVarianceL),
            v1Flagged: sensor.v1BillFlag == null ? null : Boolean(sensor.v1BillFlag),
          }
        : null,
  };
}

function slipLocationOf(slip) {
  return slip?.location && String(slip.location).trim() !== '-'
    ? String(slip.location).trim()
    : null;
}

export function drawerFromReconciliationRow(r) {
  return {
    title: r.vehicleNumber || null,
    subtitle: r.model || null,
    result: RECONCILIATION_RESULT[r.status] || null,
    explanation: reconciliationExplanation(r),
    bill: {
      litres: num(r.billLitres),
      amount: num(r.totalAmount),
      rate: { value: null, provenance: null },
      at: r.billDate || null,
      location: r.fuelPumpName || null,
      fuelType: 'DIESEL',
      fillingType: null,
      driverName: null,
      odometer: null,
      odometerSource: null,
      channel: null,
      documentId: null,
    },
    sensor: {
      litres: num(r.telemetryLitres),
      at: r.sensorAt || null,
      pumpName: null,
      lat: null,
      lng: null,
      confirmationStatus: r.confirmationStatus || null,
    },
    varianceL: num(r.varianceL),
    variancePct: num(r.variancePct),
    billCheck: null,
  };
}

/**
 * GET /reports/fuel-cycles row (FuelCycleLedger) → Completed cycles row.
 * Fill-to-fill cycles from slips and the OIL REPORT register.
 */
export function mapFuelCycleRow(r) {
  const pct = (v) => (num(v) == null ? null : num(v) * 100);
  return {
    id: r._id || r.cycleKey,
    vehicleNo: r.registrationNumber || null,
    vehicleId: r.vehicleId || null,
    openAt: r.open?.at || null,
    closeAt: r.close?.at || null,
    openSource: r.open?.source || null,
    closeSource: r.close?.source || null,
    openOdo: num(r.open?.odo),
    closeOdo: num(r.close?.odo),
    km: num(r.km?.odo),
    fuelBills: num(r.fuel?.bills),
    fuelEcu: num(r.fuel?.ecu),
    tankDelta: num(r.fuel?.tankDelta),
    kmPerLTankToTank: num(r.mileage?.tankToTank),
    kmPerLEcu: num(r.mileage?.ecu),
    kmCoveragePct: pct(r.coverage?.kmMeasured),
    fuelCoveragePct: pct(r.coverage?.fuelEcu),
    status: r.status || null,
    flags: Array.isArray(r.flags) ? r.flags : [],
  };
}

/**
 * GET /mileage/intervals row → Completed cycles row. Audit status follows the
 * old Mileage Tracking vehicle page: FleetEdge flags, else COMPUTED = matches
 * telematics, else pending / no telematics.
 */
export function mapIntervalRow(c) {
  const fe = c.fleetEdge || {};
  const startOdo = num(c.startOdometer);
  const endOdo = num(c.endOdometer);
  // The FleetEdge check on this cycle: what the truck's own tracker measured.
  let check = 'TRACKER_PENDING';
  if (fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage) check = 'TRACKER_DIFFERS';
  else if (fe.status === 'COMPUTED') check = 'TRACKER_MATCHES';
  else if (fe.status === 'NO_DATA' || fe.status === 'FAILED') check = 'TRACKER_NONE';

  return {
    id: c._id,
    vehicleNo: c.vehicleId?.registrationNumber || null,
    model: c.vehicleId?.model || null,
    startDate: c.startDate || null,
    endDate: c.endDate || null,
    startOdo,
    endOdo,
    distanceKm:
      num(c.distanceKm) ?? (startOdo != null && endOdo != null ? endOdo - startOdo : null),
    fuelL: num(c.fuelConsumedLiters),
    kmPerL: num(c.mileageKmPerL),
    cost: num(c.fuelCost),
    check,
  };
}

/**
 * KPI figures from the unified feed's meta and the model comparison.
 * Reconciled = sensor fills that a bill backs (VERIFIED + FLAGGED) over all
 * sensor fills; slip-only rows have no fill, so they are not in the base.
 */
export function kpisFromSources({ feedMeta, modelData }) {
  const matched = feedMeta ? (feedMeta.verified || 0) + (feedMeta.flagged || 0) : null;
  const sensorFills = feedMeta ? matched + (feedMeta.unverified || 0) : null;

  let fleetKmPerL = null;
  let vehicleCount = null;
  if (Array.isArray(modelData)) {
    const distance = modelData.reduce((s, m) => s + (num(m.totalDistanceKm) || 0), 0);
    const fuel = modelData.reduce((s, m) => s + (num(m.totalFuelL) || 0), 0);
    fleetKmPerL = fuel > 0 ? distance / fuel : null;
    vehicleCount = modelData.reduce((s, m) => s + (num(m.vehicleCount) || 0), 0);
  }

  return {
    fleetKmPerL,
    vehicleCount,
    reconciledPct: sensorFills ? (matched / sensorFills) * 100 : null,
    matched,
    sensorFills,
    flagged: feedMeta ? feedMeta.flagged || 0 : null,
    spendInr: feedMeta ? num(feedMeta.totalSpendInr) : null,
    bills: feedMeta
      ? (feedMeta.verified || 0) + (feedMeta.flagged || 0) + (feedMeta.slipOnly || 0)
      : null,
  };
}

const EXPECTED_SOURCE_LABEL = { REGRESSION: 'Truck model', CATALOG: 'Catalog', NONE: '—' };

/** Hourly windows → one row per IST day; expected/deviation only over scored windows. */
export function dailyRollup(windows) {
  const days = new Map();
  for (const w of windows) {
    const key = toISTDateString(w.windowFrom);
    const d = days.get(key) || {
      day: key,
      at: w.windowFrom,
      windows: 0,
      distanceKm: 0,
      actualL: 0,
      expectedL: 0,
      deviationL: 0,
      scored: 0,
      sources: new Set(),
    };
    d.windows += 1;
    d.distanceKm += w.distanceKm || 0;
    d.actualL += w.actualL || 0;
    if (w.expectedL != null) {
      d.expectedL += w.expectedL;
      d.deviationL += w.deviationL || 0;
      d.scored += 1;
    }
    d.sources.add(w.source);
    days.set(key, d);
  }
  return [...days.values()].map((d) => ({
    ...d,
    expectedL: d.scored ? d.expectedL : null,
    deviationL: d.scored ? d.deviationL : null,
    deviationPct: d.scored && d.expectedL > 0 ? (d.deviationL / d.expectedL) * 100 : null,
    source: [...d.sources].map((s) => EXPECTED_SOURCE_LABEL[s] || s).join(' · '),
  }));
}

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

const L1 = (v) => (num(v) == null ? '—' : `${num(v).toFixed(1)} L`);
const signedL1 = (v) => (num(v) == null ? '—' : `${num(v) > 0 ? '+' : ''}${num(v).toFixed(1)} L`);

/**
 * What the ⓘ next to a fill says: one plain sentence, then the figures it
 * came from. Rows only show the verdict; the arithmetic waits here.
 * @returns {{ title: string, text: string, lines: Array<[string, string]> }}
 */
export function fillExplanation(row) {
  const learned =
    row.gainBills > 0
      ? `from ${row.gainBills} bill${row.gainBills === 1 ? '' : 's'} of this truck`
      : 'fleet average, no bills for this truck yet';
  const tank = [
    ['Gauge rose', L1(row.rawLitres)],
    ['Corrected to', L1(row.sensorLitres)],
    ['Correction', learned],
    ['Normal error', row.bandL == null ? '—' : `± ${L1(row.bandL)}`],
  ];
  const vsBill = [
    ['Bill', L1(row.slipLitres)],
    ['Tank − bill', signedL1(row.billVarianceL)],
    ['Allowed', row.billToleranceL == null ? '—' : `± ${L1(row.billToleranceL)}`],
  ];
  switch (row.result) {
    case 'GAUGE_JUMP':
      return {
        title: 'Not a refill',
        text: 'The tank gauge jumped up and came back down, so no diesel went in. It is left out of every total.',
        lines: [['Gauge jumped', L1(row.rawLitres)]],
      };
    case 'NO_TANK_READING':
      return {
        title: 'Bill without a tank reading',
        text: 'There is a bill, but the tank sensor saw no diesel go in around that time. The sensor may have been offline, or the bill is for another truck.',
        lines: [['Bill', L1(row.slipLitres)]],
      };
    case 'BILL_MISSING':
      return {
        title: 'Diesel went in, no bill',
        text: 'The tank sensor saw diesel go in, but no bill has been uploaded for it yet.',
        lines: tank,
      };
    case 'BILL_MATCHES':
      return {
        title: 'Bill matches the tank',
        text: 'The litres on the bill and the rise in the tank agree, within this truck’s normal error.',
        lines: [...tank, ...vsBill],
      };
    case 'BILL_TOO_HIGH':
      return {
        title: 'Bill is more than the tank got',
        text: 'The bill says more diesel than reached the tank, by more than this truck normally varies.',
        lines: [...tank, ...vsBill],
      };
    case 'BILL_TOO_LOW':
      return {
        title: 'Tank got more than the bill',
        text: 'More diesel reached the tank than the bill says. Check the bill was read correctly.',
        lines: [...tank, ...vsBill],
      };
    default:
      return null;
  }
}

/** ⓘ for a Bill vs tank row (raw gauge rise, fixed 10 L allowance). */
export function reconciliationExplanation(r) {
  return {
    title: 'Bill vs tank',
    text: 'The bill compared with how far the tank gauge rose at that fill.',
    lines: [
      ['Bill', L1(r.billLitres)],
      ['Tank rose', L1(r.telemetryLitres)],
      ['Tank − bill', signedL1(r.varianceL)],
      ['Allowed', '± 10.0 L'],
    ],
  };
}

/** "Used vs should use" for one day: within 5 % is normal. */
export function dieselUse(deviationPct) {
  const p = num(deviationPct);
  if (p == null) return null;
  if (Math.abs(p) <= 5) return 'USED_NORMAL';
  return p > 0 ? 'USED_EXTRA' : 'USED_LESS';
}

/**
 * /mileage/model-comparison → one row per truck, best mileage first. The
 * response already carries each truck's distance-weighted km/L for the range.
 */
export function trucksFromModels(models) {
  return (models || [])
    .flatMap((m) =>
      (m.vehicles || []).map((v) => ({
        id: String(v.vehicleId),
        vehicleId: v.vehicleId,
        vehicleNo: v.vehicleNumber || null,
        model: m.model || null,
        kmPerL: num(v.avgMileage),
        rounds: num(v.recordCount) || 0,
        distanceKm: num(v.totalDistanceKm),
        fuelL: num(v.totalFuelL),
      })),
    )
    .sort((a, b) => (b.kmPerL ?? -1) - (a.kmPerL ?? -1));
}

/** Share of tank-seen fills that have a bill → coverage verdict. */
export function billCoverage(pct) {
  if (pct == null) return null;
  if (pct >= 90) return 'BILLS_UP_TO_DATE';
  if (pct >= 60) return 'SOME_BILLS_MISSING';
  return 'MANY_BILLS_MISSING';
}

const L0 = (v) => (num(v) == null ? null : `${Math.round(num(v)).toLocaleString('en-IN')} L`);

/**
 * The drawer's opening line for one fill, and what to do about it.
 * @returns {{ headline: string, next: string } | null}
 */
export function fillVerdict(detail) {
  const bill = L0(detail?.bill?.litres);
  const tank = L0(detail?.sensor?.litres);
  const driver = detail?.bill?.driverName?.split(' ')[0];
  switch (detail?.result) {
    case 'BILL_MATCHES':
      return { headline: 'The bill and the tank agree.', next: 'Nothing to do.' };
    case 'BILL_TOO_HIGH':
      return {
        headline: `The bill says ${bill}, the tank got about ${tank}.`,
        next: 'Check the bill photo and ask the driver. If it keeps happening at this pump, avoid the pump.',
      };
    case 'BILL_TOO_LOW':
      return {
        headline: `The tank got about ${tank}, more than the ${bill} on the bill.`,
        next: 'Check the litres were read off the bill correctly.',
      };
    case 'BILL_MISSING':
      return {
        headline: `About ${tank} went into the tank. No bill uploaded yet.`,
        next: driver ? `Ask ${driver} to upload the bill.` : 'Ask the driver to upload the bill.',
      };
    case 'NO_TANK_READING':
      return {
        headline: `Bill for ${bill}, but the tank sensor saw nothing go in.`,
        next: 'Check the bill is for this truck. The tank sensor may have been offline.',
      };
    case 'GAUGE_JUMP':
      return {
        headline: 'The gauge jumped and came back. Not a refill.',
        next: 'Nothing to do.',
      };
    default:
      return null;
  }
}
