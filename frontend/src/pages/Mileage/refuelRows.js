import { num } from './mileageNumbers';
import { fillExplanation, reconciliationExplanation } from './fillExplanations';

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
