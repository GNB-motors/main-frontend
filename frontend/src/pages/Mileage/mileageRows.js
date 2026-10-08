import dayjs from 'dayjs';

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
};

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

/** Calendar range → API params (start/end of the local day, ISO). */
export function rangeToParams({ from, to }) {
  const params = {};
  if (from) params.from = dayjs(from).startOf('day').toISOString();
  if (to) params.to = dayjs(to).endOf('day').toISOString();
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
  const location = slipLocation || sensor?.fuelPumpName || null;
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
    slipLitres: num(slip?.litres),
    sensorLitres: num(sensor?.litres),
    location,
    coords,
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
        }
      : null,
    sensor: sensor
      ? {
          litres: num(sensor.litres),
          at: sensor.at || null,
          pumpName: sensor.fuelPumpName || null,
          lat: num(sensor.lat),
          lng: num(sensor.lng),
          confirmationStatus: sensor.confirmationStatus || null,
        }
      : null,
    // billVarianceL = tank rise − billed litres (negative ⇒ bill claims more).
    varianceL: num(sensor?.billVarianceL),
    variancePct:
      num(sensor?.billVarianceL) != null && num(sensor?.claimedLitres)
        ? (num(sensor.billVarianceL) / num(sensor.claimedLitres)) * 100
        : null,
  };
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
