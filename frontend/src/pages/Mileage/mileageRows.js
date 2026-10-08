import dayjs from 'dayjs';
import { toISTDateString } from '../../utils/dateUtils';

/**
 * Pure mapping for the /mileage hub: backend rows → what the tabs and the
 * detail drawer render. Nothing here invents a value — a missing field stays
 * null and the UI shows "—".
 */

/** /fuel-logs/unified verificationStatus → badge. Tone = `.mileage-badge-<tone>`. */
export const VERIFICATION_META = {
  VERIFIED: {
    label: 'Verified',
    tone: 'genuine',
    hint: 'Bill matched to a tank-level rise within tolerance',
  },
  FLAGGED: {
    label: 'Flagged',
    tone: 'variance',
    hint: 'Bill matched to a tank-level rise, but the litres disagree beyond tolerance',
  },
  UNVERIFIED: {
    label: 'No bill',
    tone: 'noise',
    hint: 'Tank-level rise detected with no matching bill yet',
  },
  SLIP_ONLY: {
    label: 'Bill only',
    tone: 'pending',
    hint: 'Bill uploaded with no matching tank-level rise',
  },
  SENSOR_GLITCH: {
    label: 'Not a refuel',
    tone: 'neutral',
    hint: 'Gauge glitch: the level dipped and came back',
  },
};

/** sensor.correction → badge label (hand-off "How to show a refuel"). */
export const CORRECTION_META = {
  V2_GAIN: { label: 'Corrected', tone: 'genuine' },
  GAIN: { label: 'Calibrated', tone: 'pending' },
  RAW: { label: 'Gauge reading', tone: 'neutral' },
};

/** "Calibrated on N bills", or "Fleet default" while nothing is learned. */
export const calibrationHint = (gainBills) =>
  gainBills > 0 ? `Calibrated on ${gainBills} bill${gainBills === 1 ? '' : 's'}` : 'Fleet default';

export const GLITCH_STATUS = 'sensor_glitch';

/** Status filter chips; `countKey` reads the unified feed's `meta` counts. */
export const STATUS_FILTERS = [
  { key: 'all', label: 'All', countKey: null },
  { key: 'verified', label: 'Verified', countKey: 'verified' },
  { key: 'flagged', label: 'Flagged', countKey: 'flagged' },
  { key: 'unverified', label: 'No bill', countKey: 'unverified' },
  { key: 'slip_only', label: 'Bill only', countKey: 'slipOnly' },
];

/** /fuel-comparison/records status → badge. */
export const RECONCILIATION_META = {
  CLEAN: { label: 'Within tolerance', tone: 'genuine', hint: 'Bill and tank rise agree' },
  FLAGGED: {
    label: 'Flagged overbilling',
    tone: 'variance',
    hint: 'The bill claims more litres than reached the tank',
  },
  REVIEW: {
    label: 'Needs review',
    tone: 'pending',
    hint: 'The tank rose more than the bill states',
  },
};

export const ODOMETER_SOURCE_META = {
  FLEETEDGE: { suffix: 'CAN', hint: 'FleetEdge telematics (CAN) odometer at refuel time' },
  OCR: { suffix: null, hint: 'Read from the odometer photo' },
  MANUAL: { suffix: null, hint: 'Entered manually' },
};

// The unified feed scans every slip and fill in the range, so the hub never
// asks for an unbounded one.
export const DATE_PRESETS = [
  { key: 'TODAY', label: 'Today' },
  { key: '7DAYS', label: '7 days' },
  { key: '30DAYS', label: '30 days' },
  { key: '90DAYS', label: '90 days' },
];

export const DEFAULT_PRESET = '30DAYS';

const DAY = 'YYYY-MM-DD';

/** Preset → inclusive { from, to } calendar dates (YYYY-MM-DD, local). */
export function presetRange(key, now = dayjs()) {
  const to = now.format(DAY);
  switch (key) {
    case 'TODAY':
      return { from: to, to };
    case '7DAYS':
      return { from: now.subtract(6, 'day').format(DAY), to };
    case '90DAYS':
      return { from: now.subtract(89, 'day').format(DAY), to };
    case '30DAYS':
    default:
      return { from: now.subtract(29, 'day').format(DAY), to };
  }
}

/** Calendar range → API params: start and end of the IST day, as ISO. */
export function rangeToParams({ from, to }) {
  const params = {};
  if (from) params.from = new Date(`${from}T00:00:00.000+05:30`).toISOString();
  if (to) params.to = new Date(`${to}T23:59:59.999+05:30`).toISOString();
  return params;
}

const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

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
  const meta = VERIFICATION_META[row.status] || null;
  return {
    title: row.vehicleNo,
    subtitle: row.model,
    badge: meta ? { label: meta.label, tone: meta.tone, hint: meta.hint } : null,
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
  const meta = RECONCILIATION_META[r.status] || null;
  return {
    title: r.vehicleNumber || null,
    subtitle: r.model || null,
    badge: meta ? { label: meta.label, tone: meta.tone, hint: meta.hint } : null,
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
  let audit;
  if (fe.isFlaggedFuel || fe.isFlaggedDistance || fe.isFlaggedMileage) {
    const reasons = [
      fe.isFlaggedFuel && 'fuel',
      fe.isFlaggedDistance && 'distance',
      fe.isFlaggedMileage && 'mileage',
    ].filter(Boolean);
    audit = {
      label: 'Flagged',
      tone: 'variance',
      hint: `Differs from FleetEdge telematics on ${reasons.join(', ')}`,
    };
  } else if (fe.status === 'COMPUTED') {
    audit = { label: 'Matches telematics', tone: 'genuine', hint: 'Checked against FleetEdge' };
  } else if (fe.status === 'NO_DATA' || fe.status === 'FAILED') {
    audit = { label: 'No telematics', tone: 'neutral', hint: 'No FleetEdge data for this cycle' };
  } else {
    audit = { label: 'Pending', tone: 'pending', hint: 'FleetEdge check not run yet' };
  }

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
    audit,
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
