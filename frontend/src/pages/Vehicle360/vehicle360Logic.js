/** Pure display logic for the Vehicle 360 profile (rule 21). */

export function riskLamp(risk) {
  if (risk === 'OVERDUE') return 'lamp--critical';
  if (risk === 'DUE_SOON') return 'lamp--caution';
  return 'lamp--ok';
}

/**
 * A DEF ledger balance object is all-zero from the backend when nothing has
 * ever been recorded. Treat that as no data rather than a confident "0 L".
 */
export function hasDefLedgerData(balance) {
  if (!balance) return false;
  const hasValue = [balance.claimedAdblueL, balance.telemetryDefL, balance.expectedBalanceL].some(
    (v) => v != null && Number(v) !== 0,
  );
  const hasFlags = (balance.flagCount ?? 0) > 0 || (balance.flags?.length ?? 0) > 0;
  return hasValue || hasFlags;
}

/**
 * Reading states for a telemetry level (fuel, DEF).
 *
 *   OK        a usable number with a unit we understand
 *   NO_DATA   the unit is known but no reading has arrived
 *   NO_UNIT   the sensor reports a unit we can't interpret, so the number is
 *             meaningless — show "unavailable", never a confident-looking dial
 */
export const READING = {
  OK: 'ok',
  NO_DATA: 'no-data',
  NO_UNIT: 'no-unit',
};

/**
 * `litres` and `percent` are both perfectly displayable — the old code collapsed
 * everything but litres into "unverified", which threw away valid percentage
 * readings and rendered the literal string "unit unverified" on the dial.
 */
export function normalizeUnit(unitRaw) {
  if (unitRaw === 'litres') return 'litres';
  if (unitRaw === 'percent' || unitRaw === '%') return '%';
  return null;
}

export function readingOf(value, unitRaw) {
  const unit = normalizeUnit(unitRaw);
  if (!unit) return { state: READING.NO_UNIT, unit: null, value: null };
  if (value == null || Number.isNaN(Number(value))) {
    return { state: READING.NO_DATA, unit, value: null };
  }
  return { state: READING.OK, unit, value: Number(value) };
}

export function fuelReading(health) {
  return readingOf(health?.primaryFuelLevel, health?.fuelLevelUnit);
}

export function defReading(health) {
  return readingOf(health?.defLevel, health?.defLevelUnit);
}

/**
 * Service standing, folded into one display object.
 *
 * The backend reports `kmUntilDue`/`daysUntilDue` as NEGATIVE once a vehicle is
 * past due, which reads terribly as "-3,353 km". Callers get absolute magnitudes
 * plus an explicit `overdue` flag so the copy can say "3,353 km overdue".
 */
export function serviceState(prediction) {
  if (!prediction) return { level: 'none', label: 'No forecast' };

  const km = prediction.kmUntilDue;
  const days = prediction.daysUntilDue;
  const overdue =
    prediction.risk === 'OVERDUE' || (km != null && km < 0) || (days != null && days < 0);

  return {
    level: overdue ? 'critical' : prediction.risk === 'DUE_SOON' ? 'warn' : 'ok',
    label: overdue ? 'Overdue' : prediction.risk === 'DUE_SOON' ? 'Due soon' : 'On schedule',
    overdue,
    km: km == null ? null : Math.abs(km),
    days: days == null ? null : Math.abs(days),
    projectedAt: prediction.projectedServiceDueDate || null,
    basis: prediction.basis || null,
  };
}

/**
 * One-line service headline for the KPI strip, e.g. "3,353 km overdue".
 * Prefers distance over time — a fleet operator schedules on the odometer.
 */
export function serviceHeadline(svc, formatKm, formatNum) {
  if (!svc || svc.level === 'none') return '—';
  if (svc.km != null) return `${formatKm(svc.km)} ${svc.overdue ? 'overdue' : 'left'}`;
  if (svc.days != null) return `${formatNum(svc.days)} days ${svc.overdue ? 'overdue' : 'left'}`;
  return svc.label;
}

/**
 * Compliance roll-up for the documents card: an operator needs to know what's
 * missing or lapsing, not just read a list of expiry dates.
 */
export function documentSummary(documents, now = Date.now(), soonDays = 30) {
  const rows = documents || [];
  const soonMs = soonDays * 24 * 3600 * 1000;
  let expired = 0;
  let expiring = 0;

  for (const d of rows) {
    if (!d.expiryDate) continue;
    const t = new Date(d.expiryDate).getTime();
    if (Number.isNaN(t)) continue;
    if (t < now) expired += 1;
    else if (t - now <= soonMs) expiring += 1;
  }

  return { total: rows.length, expired, expiring, needsAttention: expired + expiring };
}

/**
 * Status chips for the vehicle header — the "can this thing operate?" answer.
 * Ordered most-severe first so the header reads left to right by urgency.
 */
export function statusChips({ fleetMaster, livePosition, prediction } = {}) {
  const chips = [];
  const svc = serviceState(prediction);

  if (svc.level === 'critical')
    chips.push({ id: 'service', tone: 'crit', label: 'Service overdue' });
  else if (svc.level === 'warn')
    chips.push({ id: 'service', tone: 'warn', label: 'Service due soon' });

  if (fleetMaster?.status) {
    const raw = String(fleetMaster.status);
    chips.push({
      id: 'availability',
      tone: raw === 'ON_TRIP' ? 'info' : 'ok',
      label: raw.replace(/_/g, ' ').toLowerCase(),
    });
  }

  if (livePosition?.speed != null) {
    const moving = Number(livePosition.speed) > 0;
    chips.push({
      id: 'motion',
      tone: 'neutral',
      label: moving ? `moving · ${Math.round(livePosition.speed)} km/h` : 'parked',
    });
  }

  return chips;
}

/** Which backend sources know this vehicle — provenance, not navigation. */
export function coverageSources(coverage) {
  if (!coverage) return [];
  return [
    coverage.inFleetMaster ? 'Fleet master' : null,
    coverage.inFleetEdge ? 'FleetEdge' : null,
    coverage.hasLiveStatus ? 'Live status' : null,
  ].filter(Boolean);
}

/** Whole days between a timestamp and now; null when there's no timestamp. */
export function daysSince(at, now = Date.now()) {
  if (!at) return null;
  const t = new Date(at).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((now - t) / 86400000));
}

/**
 * Distance covered inside the telemetry window, from the odometer history.
 *
 * This is the honest version of a "utilisation" figure: it's the difference
 * between the first and last CAN odometer reading we actually hold, not an
 * estimate. Needs two readings — one reading tells you nothing about movement.
 */
export function distanceInWindow(history) {
  const odos = (history || []).map((h) => h.odo).filter((v) => v != null && !Number.isNaN(v));
  if (odos.length < 2) return null;
  return Math.max(0, odos[odos.length - 1] - odos[0]);
}

/**
 * The "what is due" list — every open obligation on this vehicle, worst first.
 * Only items we can actually evidence; nothing is invented to fill the card.
 */
export function buildDueItems({ prediction, documents, health }, now = Date.now()) {
  const items = [];
  const svc = serviceState(prediction);

  if (svc.level === 'critical' || svc.level === 'warn') {
    items.push({
      id: 'service',
      tone: svc.level === 'critical' ? 'red' : 'amber',
      title:
        svc.km != null
          ? `Service — ${svc.km} km ${svc.overdue ? 'overdue' : 'to go'}`
          : 'Service due',
      detail: [
        svc.projectedAt ? `Projected due ${svc.projectedAt}` : null,
        svc.days != null ? `${svc.days} days ${svc.overdue ? 'ago' : 'away'}` : null,
        svc.basis ? `Basis: ${String(svc.basis).replace(/_/g, ' ').toLowerCase()}` : null,
      ]
        .filter(Boolean)
        .join('. '),
      cta: 'Open service',
      tab: 'service',
    });
  }

  const docs = documentSummary(documents, now);
  if (docs.total === 0) {
    items.push({
      id: 'documents',
      tone: 'grey',
      title: 'No documents on record',
      detail:
        'RC, insurance, fitness and permits have never been uploaded. Nothing can be checked for expiry.',
      cta: 'Open documents',
      tab: 'documents',
    });
  } else if (docs.needsAttention > 0) {
    items.push({
      id: 'documents',
      tone: docs.expired > 0 ? 'red' : 'amber',
      title:
        docs.expired > 0
          ? `${docs.expired} document${docs.expired === 1 ? '' : 's'} expired`
          : `${docs.expiring} document${docs.expiring === 1 ? '' : 's'} expiring soon`,
      detail: 'Border checks and claims both depend on these being current.',
      cta: 'Open documents',
      tab: 'documents',
    });
  }

  const silentDays = daysSince(health?.pulledAt, now);
  if (silentDays != null && silentDays >= 1) {
    items.push({
      id: 'telemetry',
      tone: silentDays >= 7 ? 'amber' : 'grey',
      title: `Telemetry silent ${silentDays} day${silentDays === 1 ? '' : 's'}`,
      detail: 'Every figure on this page is that old or older.',
      cta: 'Open telemetry',
      tab: 'telemetry',
    });
  }

  return items;
}

/**
 * Per-signal status for the Telemetry tab.
 *
 * Only signals this payload actually covers are listed. Notably absent: tyre
 * pressure and brake fluid — the API has no such fields, and a fleet page must
 * not imply a sensor exists just because a dashboard mockup had a dial for it.
 */
export function buildSignals(health, livePosition, now = Date.now()) {
  const silent = daysSince(health?.pulledAt, now);
  const ageText =
    silent == null
      ? 'never reported'
      : silent === 0
        ? 'arriving'
        : `silent ${silent} day${silent === 1 ? '' : 's'}`;

  const present = (value) =>
    value == null
      ? { tone: 'grey', state: 'never reported' }
      : silent && silent >= 1
        ? { tone: 'amber', state: `was arriving · ${ageText}` }
        : { tone: 'ok', state: 'arriving' };

  const fuel = fuelReading(health);
  const def = defReading(health);
  const unitless = (r) =>
    r.state === READING.NO_UNIT
      ? { tone: 'grey', state: 'unit not reported by the sensor' }
      : present(r.value);

  return [
    { name: 'Position (GPS)', ...present(livePosition?.latitude) },
    { name: 'Odometer (CAN)', ...present(health?.canOdo) },
    { name: 'Engine hours', ...present(health?.engineRunHour) },
    { name: 'Speed', ...present(livePosition?.speed) },
    { name: 'Fuel level', ...unitless(fuel) },
    { name: 'DEF level', ...unitless(def) },
  ];
}
