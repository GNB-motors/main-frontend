import { toISTDateString } from '../../utils/dateUtils';
import { num } from './mileageNumbers';

/**
 * Pure mapping for the /mileage hub: backend rows → what the tabs and the
 * detail drawer render. Nothing here invents a value — a missing field stays
 * null and the UI shows "—".
 */

/** km/L → band. The same cut-offs the old Completed-cycles colouring used. */
export function mileageBand(kmPerL) {
  const k = num(kmPerL);
  if (k == null) return null;
  if (k >= 4) return 'MILEAGE_GOOD';
  if (k >= 3.5) return 'MILEAGE_AVERAGE';
  return 'MILEAGE_LOW';
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
    // A loss alert whose bill check used this round (backend withLossChecks).
    lossCheck: r.lossCheck || null,
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
