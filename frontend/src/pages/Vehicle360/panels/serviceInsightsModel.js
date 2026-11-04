/**
 * Service insights — the pure part.
 *
 * Three questions the service tab has to answer for one truck: what is left
 * of the tyres, where the nearest workshop is by road, and what the
 * predictive sweep thinks the next service is. Each comes from its own
 * endpoint with its own shape, so each is read defensively here: an unknown
 * is a dash with a reason, never a zero.
 */

/** What we print when a figure was never measured. */
export const DASH = '—';

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function key(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** The tyre set row for this vehicle, whichever identifier we hold. */
export function pickTyreRow(payload, { vehicleId, registrationNumber } = {}) {
  const rows = Array.isArray(payload?.vehicles) ? payload.vehicles : [];
  if (!rows.length) return null;
  const byId = vehicleId ? rows.find((row) => row?.vehicleId === vehicleId) : null;
  if (byId) return byId;
  const reg = key(registrationNumber);
  if (!reg) return null; // never another truck's tyres
  return rows.find((row) => key(row?.registrationNumber) === reg) || null;
}

/** Pill tone for a tyre band. */
export function tyreBandTone(band) {
  switch (band) {
    case 'OVERDUE':
      return 'crit';
    case 'DUE_SOON':
      return 'warn';
    case 'OK':
      return 'ok';
    default:
      return 'grey';
  }
}

/**
 * The tyre figures, with the reason attached to every one we do not have.
 * A tyre set that has not moved yet has no cost per km — that is a fact
 * about the truck, not a missing row.
 */
export function tyreFacts(row) {
  if (!row) return null;
  const costPerKm = num(row.costPerKmInr);
  const remaining = num(row.remainingKm);
  const lifeUsed = num(row.lifeUsedPct);
  const kmRun = num(row.kmRun);
  const perDay = num(row.avgKmPerDay);
  const odometer = num(row.currentOdometer);
  return {
    band: row.band || null,
    tyreCount: num(row.tyreCount),
    kmRun,
    costPerKm,
    costPerKmReason: costPerKm === null ? row.note || 'no km recorded yet' : null,
    lifeUsed,
    lifeUsedReason: lifeUsed === null ? 'no odometer reading against the fitted set' : null,
    remaining,
    remainingReason: remaining === null ? 'no odometer reading against the fitted set' : null,
    perDay,
    perDayReason: perDay === null ? 'not enough running to average a day' : null,
    odometer,
    odometerReason: odometer === null ? 'no live odometer reading' : null,
    projectedReplacementDate: row.projectedReplacementDate || null,
    projectedReplacementReason: row.projectedReplacementDate
      ? null
      : 'not projected — the rolling daily average is unknown',
    source: row.odometerSource || null,
  };
}

/** The reason text for a missing piece of evidence, in plain words. */
export function missingReasonText(list) {
  const items = Array.isArray(list) ? list : [];
  return items.length ? items.join('; ') : null;
}

/**
 * One row per candidate centre: the road distance our engine produced, or
 * the reason it could not produce one. The straight-line distance never
 * wears the road label.
 */
export function centreRows(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  return list.map((centre) => {
    const cost = centre?.cost || {};
    const roadKm = num(cost.roadKm);
    const roadMinutes = num(cost.roadMinutes);
    const detourKm = num(cost.detourKm);
    const directKm = num(cost.directKm);
    const reasons = [];
    if (roadKm === null) {
      reasons.push(
        cost.roadBasis === 'ROAD_ENGINE_UNAVAILABLE'
          ? 'road distance unavailable — our road engine could not route here'
          : missingReasonText(centre?.missingText) || 'road distance unavailable',
      );
    }
    if (detourKm === null) {
      reasons.push(
        cost.detourBasis === 'NO_DESTINATION'
          ? 'no detour cost — we do not know where the truck was headed'
          : 'no detour cost on record',
      );
    }
    if (!centre?.phone) reasons.push('no phone number on file');
    return {
      id: centre?.id || centre?.name || null,
      name: centre?.name || null,
      brand: centre?.brand || null,
      phone: centre?.phone || null,
      roadKm,
      roadMinutes,
      roadReason: roadKm === null ? reasons[0] : null,
      detourKm,
      detourReason: detourKm === null ? reasons[1] || null : null,
      directKm,
      reasons,
    };
  });
}

/** The predictive sweep's row for this vehicle, if it has one. */
export function pickPrediction(records, registrationNumber) {
  const list = Array.isArray(records) ? records : [];
  const reg = key(registrationNumber);
  if (!reg) return null;
  return list.find((row) => key(row?.registrationNumber) === reg) || null;
}

/** Pill tone for a maintenance risk band. */
export function riskTone(risk) {
  switch (risk) {
    case 'OVERDUE':
      return 'crit';
    case 'DUE_SOON':
      return 'warn';
    case 'OK':
      return 'ok';
    default:
      return 'grey';
  }
}

/** The sweep's figures, each with the reason when it is not there. */
export function predictionFacts(record) {
  if (!record) return null;
  const days = num(record.daysUntilDue);
  const km = num(record.kmUntilDue);
  const dueDate = record.projectedServiceDueDate || null;
  const dueOdo = num(record.projectedServiceDueOdometer);
  const currentOdo = num(record.currentOdometer);
  const perDay = num(record.avgKmPerDay);
  return {
    risk: record.risk || null,
    basis: record.basis || null,
    days,
    daysReason: days === null ? 'no projected service date' : null,
    km,
    kmReason: km === null ? 'no projected service date' : null,
    dueDate,
    dueDateReason: dueDate ? null : 'no projected service date',
    dueOdo,
    dueOdoReason: dueOdo === null ? 'no projected service date' : null,
    currentOdo,
    currentOdoReason: currentOdo === null ? 'no live odometer reading' : null,
    perDay,
    perDayReason: perDay === null ? 'not enough running to average a day' : null,
    lastServiceAt: record.lastServiceAt || null,
    lastServiceOdometer: num(record.lastServiceOdometer),
    computedAt: record.computedAt || null,
  };
}
