import {
  cellNumber,
  cellReason,
  cellSource,
  cellUnit,
  cellUncertainty,
  isUnknownCell,
} from '../performanceCells';
import { partForSignal } from './issueParts';

/**
 * coachingModel.js — the pure part of Performance → Drivers.
 *
 * Everything the coaching home shows is derived here, with no component and no
 * request: the row models, the coverage of the window, the ranking, the grade
 * and its ingredients, the idle burn of the observed window and the projected
 * mileage.
 *
 * The rules this file keeps:
 *   - a number we do not have is null with a reason — never 0, never ₹0;
 *   - a grade is shown only when the server published one AND the coverage is
 *     not below the published minimum;
 *   - an idle burn uses THAT VEHICLE's own measured litres-per-hour and the
 *     price the server disclosed — never a fleet peer upper bound;
 *   - a projected mileage needs distance, actual fuel and a defensible
 *     avoidable-fuel figure: all known, all positive, and the saving smaller
 *     than the fuel;
 *   - an interval is only attributed to a driver when the assignment is
 *     unambiguous; shared or unassigned time is left out and said so.
 */

/** What we print when a figure was never measured. */
export const DASH = '—';

/** The window the API uses when the URL does not name one. */
export const DEFAULT_WINDOW_DAYS = 30;

/** The concerns the owner can rank by — the signals the API already sends. */
export const CONCERNS = [
  {
    key: 'coverage',
    label: 'Data coverage first',
    meaning: 'The drivers we have the most measured days for come first.',
  },
  {
    key: 'safeDriving',
    label: 'Safe driving',
    meaning: 'Harsh events per 100 km — more events first.',
  },
  {
    key: 'excessIdling',
    label: 'Excess idling',
    meaning: 'The share of the driving time the engine was idling — more first.',
  },
  {
    key: 'speed',
    label: 'Speed',
    meaning: 'Road pace against the road’s own pace — slower than the road first.',
  },
];

/** The default ordering is the neutral one: coverage, then nothing else. */
export const DEFAULT_CONCERN = 'coverage';

/** What the owner can do about a thin window. Advice, never a measurement. */
export const NEXT_STEP_COVERAGE =
  'Next step to improve coverage: check that every truck in this window is still reporting its ECU/OBU feed, and that the driver-to-truck assignment is recorded for the whole window.';

/* ── the three signals the ranking can use ────────────────────────────── */

const SIGNAL_SPECS = [
  {
    key: 'safeDriving',
    label: 'Harsh events',
    unit: 'per 100 km',
    decimals: 1,
    signal: 'harsh',
    read: (d) => d?.harshPer100Km ?? d?.harshEventsPer100Km ?? null,
  },
  {
    key: 'excessIdling',
    label: 'Idle share',
    unit: '%',
    decimals: 1,
    signal: 'idling',
    read: (d) => d?.idlePct ?? d?.idleSharePct ?? null,
  },
  {
    key: 'speed',
    label: 'Road pace',
    unit: '× road pace',
    decimals: 2,
    signal: 'speed',
    read: (d) => d?.paceFactor ?? d?.speedPct ?? null,
  },
];

const SCORE_KEYS = new Set([
  'drivingScore',
  'score',
  'dnaScore',
  'grade',
  'scoreVersion',
  'scoringVersion',
  'version',
  'coverage',
  'minimumCoverage',
  'minCoverage',
]);

/* ── small readers ────────────────────────────────────────────────────── */

/** A number from a plain value, a contract cell, or a wrapper object. */
export function numberFromValue(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    if (value.trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'object') {
    if (typeof value.value === 'number' || typeof value.value === 'string') {
      return numberFromValue(value.value);
    }
  }
  return null;
}

/** The first of several named fields that holds a number. */
export function firstNumber(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const n = numberFromValue(source[key]);
    if (n != null) return n;
  }
  return null;
}

const isCell = (value) =>
  !!value && typeof value === 'object' && !Array.isArray(value) && 'source' in value;

/** "smoothBraking" → "Smooth braking". */
export function labelFor(key) {
  return String(key ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/** "2026-11-01" or an ISO stamp → "1 Nov 2026". */
export function dateLabel(value) {
  if (!value) return null;
  const text = String(value);
  const iso = text.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return text;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}

/** "YYYY-MM-DD" when the value is a plain date, otherwise null. */
export function parseDateParam(value) {
  if (!value) return null;
  const text = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

/** The window in words: "1 Nov 2026 – 30 Nov 2026" or "the last 30 days". */
export function windowLabel(window = {}) {
  const from = dateLabel(window?.from);
  const to = dateLabel(window?.to);
  if (from && to) return `${from} – ${to}`;
  if (from) return `from ${from}`;
  if (to) return `up to ${to}`;
  const days = numberFromValue(window?.days);
  if (days != null && days > 0) return `the last ${Math.round(days)} days`;
  return 'this window';
}

/* ── coverage ─────────────────────────────────────────────────────────── */

/**
 * The coverage of a row, as a percentage.
 *
 * A percentage field is read as a percentage; a bare number under 1 is read
 * as a fraction. Anything outside 0–100 is not a coverage and is ignored.
 */
export function coverageNumber(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.coveragePct,
    source.coveragePercent,
    source.dataCoveragePct,
    source.coverage,
    source.dna?.coverage,
    source.driver?.coverage,
  ];
  for (const value of candidates) {
    const n = coverageFromValue(value);
    if (n != null) return n;
  }
  return null;
}

function coverageFromValue(value) {
  if (value == null) return null;
  if (typeof value === 'object') {
    const inner =
      value.pct ??
      value.percent ??
      value.coveragePct ??
      value.measured ??
      value.observed ??
      value.value;
    return inner == null ? null : coverageFromValue(inner);
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return n <= 1 ? n * 100 : n;
}

/** The minimum coverage the server published, when it published one. */
export function minimumCoverage(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [
    source.minimumCoverage,
    source.minCoverage,
    source.coverage?.minimum,
    source.coverage?.min,
    source.dna?.minimumCoverage,
    source.dna?.minCoverage,
    source.driver?.minimumCoverage,
    source.driver?.minCoverage,
  ];
  for (const value of candidates) {
    const n = numberFromValue(value);
    if (n != null) return n;
  }
  return null;
}

/* ── the row ──────────────────────────────────────────────────────────── */

/** The trucks a driver row names, however the server spelled them. */
export function vehicleRefs(driver) {
  const raw = Array.isArray(driver?.vehicles) ? driver.vehicles : [];
  return raw
    .map((entry) => {
      if (typeof entry === 'string') {
        return { id: entry, registration: entry, label: entry };
      }
      if (entry && typeof entry === 'object') {
        const registration =
          entry.registration ?? entry.registrationNumber ?? entry.number ?? entry.plate ?? null;
        const id = entry.vehicleId ?? entry.id ?? entry.vehicleKey ?? registration ?? null;
        return { id, registration, label: registration || id || DASH };
      }
      return null;
    })
    .filter((entry) => entry && (entry.id || entry.registration));
}

/** The band the server published, if it published one. */
export function gradeString(source) {
  if (!source || typeof source !== 'object') return null;
  const candidates = [source.grade, source.dnaGrade, source.band, source.dna?.grade];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** The score version, when the payload names one. */
export function scoreVersion(source) {
  if (!source || typeof source !== 'object') return null;
  const keys = ['scoreVersion', 'scoringVersion', 'version'];
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

/** The avoidable fuel the server published, if any. */
export function avoidableFigure(source) {
  if (!source || typeof source !== 'object') return { litres: null, rupees: null };
  return {
    litres: firstNumber(source, [
      'avoidableLitres',
      'avoidableFuelLitres',
      'estimatedAvoidableLitres',
      'avoidableFuel',
    ]),
    rupees: firstNumber(source, ['avoidableRupees', 'avoidableInr', 'estimatedAvoidableRupees']),
  };
}

function observationFor(spec, driver) {
  const cell = spec.read(driver);
  if (!cell) return null;
  const value = cellNumber(cell);
  if (value == null) return null; // an unknown signal is not repeated as a row
  return {
    key: spec.key,
    label: spec.label,
    value,
    unit: cellUnit(cell) || spec.unit,
    decimals: spec.decimals,
    source: cellSource(cell),
    uncertainty: cellUncertainty(cell),
    part: partForSignal(spec.signal),
  };
}

function orderObservations(observations, concern) {
  if (!concern || concern === 'coverage') return observations;
  const first = observations.filter((o) => o.key === concern);
  const rest = observations.filter((o) => o.key !== concern);
  return [...first, ...rest];
}

/**
 * One driver, ready for the list: who they are, which truck they had, the
 * grade and its coverage, the observations we actually measured, and the
 * avoidable fuel when the server published one.
 */
export function driverRow(driver, { concern = DEFAULT_CONCERN } = {}) {
  const observations = SIGNAL_SPECS.map((spec) => observationFor(spec, driver)).filter(Boolean);
  const scoreCell = driver?.dnaScore ?? driver?.dnaScoreCell ?? null;
  const score = cellNumber(scoreCell);
  const coveragePct = coverageNumber(driver);
  const vehicles = vehicleRefs(driver);
  const signals = { safeDriving: null, excessIdling: null, speed: null };
  for (const observation of observations) {
    if (observation.key in signals) signals[observation.key] = observation.value;
  }

  return {
    id: driver?.driverId ?? null,
    driverId: driver?.driverId ?? null,
    name: driver?.name || DASH,
    vehicles,
    truckLabel:
      vehicles
        .map((v) => v.label)
        .filter(Boolean)
        .join(', ') || DASH,
    grade: gradeString(driver),
    score,
    scoreCell,
    scoreKnown: score != null,
    coveragePct,
    hasData: observations.length > 0 || score != null,
    observations: orderObservations(observations, concern),
    topObservations: orderObservations(observations, concern).slice(0, 2),
    signals,
    avoidable: avoidableFigure(driver),
    raw: driver,
  };
}

/** Every driver in the list, as rows. */
export function driverRows(drivers, { concern = DEFAULT_CONCERN } = {}) {
  return (Array.isArray(drivers) ? drivers : []).map((driver) => driverRow(driver, { concern }));
}

/* ── ranking ──────────────────────────────────────────────────────────── */

/**
 * The ordering: coverage first, then the selected concern.
 *
 * A driver with no reading never jumps above one with a reading, and a driver
 * with no value for the concern never jumps above one with a value. This is
 * an ordering of what we measured — not a ranking of people.
 */
export function sortDrivers(rows, concern = DEFAULT_CONCERN) {
  const list = [...(Array.isArray(rows) ? rows : [])];
  list.sort((a, b) => {
    const aCoverage = a.coveragePct ?? -1;
    const bCoverage = b.coveragePct ?? -1;
    if (aCoverage !== bCoverage) return bCoverage - aCoverage;

    if (concern && concern !== 'coverage') {
      const aValue = a.signals?.[concern] ?? null;
      const bValue = b.signals?.[concern] ?? null;
      if (aValue == null && bValue != null) return 1;
      if (aValue != null && bValue == null) return -1;
      if (aValue != null && bValue != null && aValue !== bValue) return bValue - aValue;
    }
    return String(a.name ?? '').localeCompare(String(b.name ?? ''));
  });
  return list;
}

/** What the current ordering means, in the owner's words. */
export function rankingMeaning(concern = DEFAULT_CONCERN) {
  const found = CONCERNS.find((c) => c.key === concern);
  if (!found || found.key === 'coverage') {
    return 'Ordered by data coverage first. Drivers with no reading stay at the bottom — this orders what we measured, it is not a ranking of people.';
  }
  return `Ordered by data coverage first, then by ${found.label.toLowerCase()}: ${found.meaning} Drivers with no reading stay at the bottom — this orders what we measured, it is not a ranking of people.`;
}

/* ── the coverage of the window ───────────────────────────────────────── */

/**
 * How much of the window we actually have, in one place.
 *
 * The repeated "insufficient data" of the old screen is collapsed here into
 * ONE explanation: what is missing, for which dates, and what to do next.
 */
export function coverageSummary(rows, window = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const total = list.length;
  const withData = list.filter((row) => row?.hasData).length;
  const withoutData = total - withData;
  const label = windowLabel(window);

  return {
    total,
    withData,
    withoutData,
    pct: total ? Math.round((withData / total) * 100) : 0,
    windowLabel: label,
    headline: total
      ? `Coverage: ${withData} of ${total} drivers have readings for ${label}.`
      : `Coverage: no driver has a reading for ${label}.`,
    insufficient: withoutData > 0,
    explanation:
      withoutData > 0
        ? `Not enough data for every driver — ${withoutData} of ${total} have no reading between ${label}. Their rows say so instead of showing a guess.`
        : null,
    nextStep: withoutData > 0 ? NEXT_STEP_COVERAGE : null,
  };
}

/* ── the grade and its ingredients ────────────────────────────────────── */

/**
 * The grade, its coverage and the score version.
 *
 * Below the published minimum coverage there is no band: a grade without its
 * evidence is not a verdict, so the pill shows a dash and the reason.
 */
export function gradeDetail(detail) {
  const dna = detail?.dna ?? {};
  const driver = detail?.driver ?? {};
  const scoreCell =
    firstCell([dna.drivingScore, dna.score, dna.dnaScore, driver.dnaScore, detail?.dnaScore]) ??
    null;
  const coveragePct =
    coverageNumber(detail) ?? coverageNumber(dna) ?? coverageNumber(driver) ?? null;
  const minimumPct =
    minimumCoverage(detail) ?? minimumCoverage(dna) ?? minimumCoverage(driver) ?? null;
  const published = gradeString(detail) ?? gradeString(dna) ?? gradeString(driver) ?? null;
  const version = scoreVersion(detail) ?? scoreVersion(dna) ?? scoreVersion(driver) ?? null;

  const belowMinimum = coveragePct != null && minimumPct != null && coveragePct < minimumPct;

  if (!published || belowMinimum) {
    return {
      grade: null,
      score: null,
      reason: 'not enough data',
      coveragePct,
      minimumPct,
      version,
      ingredients: ingredientRows(dna),
    };
  }

  return {
    grade: published,
    score: cellNumber(scoreCell),
    reason: null,
    coveragePct,
    minimumPct,
    version,
    ingredients: ingredientRows(dna),
  };
}

function firstCell(candidates) {
  for (const candidate of candidates) {
    if (isCell(candidate)) return candidate;
  }
  return null;
}

/**
 * The components behind the score — the ingredients, with their own source.
 *
 * A component with no reading is kept (it says why) but the drawer collapses
 * those into one line instead of a bar per missing number.
 */
export function ingredientRows(dna) {
  const rows = [];
  const push = (key, raw) => {
    if (raw == null) return;
    const cell = isCell(raw)
      ? raw
      : { value: raw, unit: null, source: 'measured', uncertainty: null, reason: null };
    rows.push({
      key,
      label: labelFor(key),
      value: cellNumber(cell),
      unit: cellUnit(cell),
      source: cellSource(cell),
      uncertainty: cellUncertainty(cell),
      reason: isUnknownCell(cell) ? cellReason(cell) : null,
      part: partForSignal(key),
    });
  };

  const components = dna?.components;
  if (components && typeof components === 'object' && !Array.isArray(components)) {
    for (const [key, value] of Object.entries(components)) push(key, value);
  }
  for (const [key, value] of Object.entries(dna ?? {})) {
    if (key === 'components' || SCORE_KEYS.has(key)) continue;
    if (isCell(value)) push(key, value);
  }
  return rows;
}

/* ── the idle burn of the observed window ─────────────────────────────── */

/* The field names an idle record may carry. Peer upper bounds (the optional
   fleet-wide ceiling) are deliberately NOT in these lists: a peer's bound is
   never this driver's estimate. */
const IDLE_MINUTES_KEYS = ['durationMin', 'durationMinutes', 'idleMinutes', 'minutes'];
const IDLE_LITRES_KEYS = ['litres', 'idleLitres', 'fuelLitres', 'estimatedLitres'];
const IDLE_RUPEES_KEYS = ['rupees', 'rupeesInr', 'inr', 'amount'];
const IDLE_RATE_KEYS = [
  'idleLph',
  'idleLitresPerHour',
  'litresPerHour',
  'idleRate',
  'rateLph',
  'idleLitresPerHourMeasured',
];
const IDLE_PRICE_KEYS = [
  'pricePerLitre',
  'fuelPriceInrPerL',
  'priceInrPerL',
  'rupeesPerLitre',
  'fuelPrice',
  'price',
];

/** "wb 11 g 0962" → "WB11G0962". */
export function normalisePlate(value) {
  if (value == null) return null;
  const text = String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return text || null;
}

function segmentPlate(segment) {
  if (!segment || typeof segment !== 'object') return null;
  return normalisePlate(
    segment.registrationNumber ??
      segment.vehicleRegistration ??
      segment.registration ??
      segment.vehicleId ??
      segment.truckId ??
      null,
  );
}

/**
 * May this idle interval be attributed to this driver?
 *
 * A driver can change trucks and a truck can change drivers, so an interval
 * is only attributed when the assignment is unambiguous: one truck for the
 * whole window, or exactly one assignment covering the interval. Anything
 * else is left out and said so.
 */
export function attributeSegment(segment, truckPlates, assignments = []) {
  const plate = segmentPlate(segment);
  if (!plate) return { ok: false, why: 'the idle record does not name a truck' };
  if (!truckPlates.length) {
    return { ok: false, why: 'no truck is assigned to this driver in this window' };
  }
  if (truckPlates.length === 1) {
    return plate === truckPlates[0]
      ? { ok: true }
      : { ok: false, why: 'the idle happened on another truck' };
  }

  const at = segment.startAt ?? segment.endAt ?? null;
  const covering = (assignments ?? []).filter((assignment) => {
    const own = normalisePlate(
      assignment?.registration ??
        assignment?.vehicleRegistration ??
        assignment?.vehicleId ??
        assignment?.vehicle ??
        null,
    );
    if (own !== plate) return false;
    if (!at) return false;
    const from = assignment?.from ?? assignment?.startAt ?? null;
    const to = assignment?.to ?? assignment?.endAt ?? null;
    if (from && String(at) < String(from)) return false;
    if (to && String(at) > String(to)) return false;
    return true;
  });

  if (covering.length === 1) return { ok: true };
  if (covering.length > 1) {
    return { ok: false, why: 'two trucks were assigned to this driver at the same time' };
  }
  return {
    ok: false,
    why: 'this driver had more than one truck and the time was not assigned to one of them',
  };
}

/** That vehicle's own measured idle litres per hour for this segment. */
function segmentRate(segment, hours) {
  const explicit = firstNumber(segment, IDLE_RATE_KEYS);
  if (explicit != null && explicit >= 0) return explicit;
  const litres = firstNumber(segment, IDLE_LITRES_KEYS);
  if (litres != null && litres >= 0 && hours > 0) return litres / hours;
  return null;
}

/** The price the server disclosed for this segment. */
function segmentPrice(segment, litres) {
  const explicit = firstNumber(segment, IDLE_PRICE_KEYS);
  if (explicit != null && explicit >= 0) return explicit;
  const rupees = firstNumber(segment, IDLE_RUPEES_KEYS);
  if (rupees != null && rupees >= 0 && litres > 0) return rupees / litres;
  return null;
}

/**
 * The observed-window idle burn for a driver.
 *
 *   litres = attributable eligible idle hours × THAT VEHICLE's measured idle
 *            litres per hour
 *   rupees = litres × the price the server disclosed
 *
 * When the rate, the price or the hours are missing, the figure is a dash
 * with the reason. A fleet peer upper bound is never used as this driver's
 * estimate.
 */
export function idleBurn({ segments = [], trucks = [], assignments = [] } = {}) {
  const plates = (Array.isArray(trucks) ? trucks : [])
    .map((truck) => normalisePlate(truck?.registration ?? truck?.id ?? truck))
    .filter(Boolean);
  const list = Array.isArray(segments) ? segments : [];

  const eligible = [];
  let attributableCount = 0;
  let unattributed = 0;

  for (const segment of list) {
    const verdict = attributeSegment(segment, plates, assignments);
    if (!verdict.ok) {
      unattributed += 1;
      continue;
    }
    attributableCount += 1;
    if (segment?.legitimacy !== 'excess') continue;
    eligible.push(segment);
  }

  let hours = 0;
  let litres = 0;
  let rupees = 0;
  let missingHours = false;
  let missingRate = false;
  let missingPrice = false;

  for (const segment of eligible) {
    const minutes = firstNumber(segment, IDLE_MINUTES_KEYS);
    if (minutes == null || minutes < 0) {
      missingHours = true;
      continue;
    }
    const segmentHours = minutes / 60;
    hours += segmentHours;

    const rate = segmentRate(segment, segmentHours);
    if (rate == null) {
      missingRate = true;
      continue;
    }
    const segmentLitres = segmentHours * rate;
    litres += segmentLitres;

    const price = segmentPrice(segment, segmentLitres);
    if (price == null) {
      missingPrice = true;
      continue;
    }
    rupees += segmentLitres * price;
  }

  if (attributableCount === 0) {
    return {
      hours: null,
      litres: null,
      litresReason: 'no idling reading for this truck in this window',
      rupees: null,
      rupeesReason: 'no idling reading for this truck in this window',
      segments: 0,
      attributableSegments: 0,
      unattributed,
      note: 'No idle record could be tied to this driver’s truck in this window.',
    };
  }

  if (missingHours) {
    return {
      hours: null,
      litres: null,
      litresReason: 'idle time not measured yet',
      rupees: null,
      rupeesReason: 'idle time not measured yet',
      segments: eligible.length,
      attributableSegments: attributableCount,
      unattributed,
      note: null,
    };
  }

  if (missingRate) {
    return {
      hours,
      litres: null,
      litresReason: 'this truck’s idle rate is not measured yet',
      rupees: null,
      rupeesReason: 'this truck’s idle rate is not measured yet',
      segments: eligible.length,
      attributableSegments: attributableCount,
      unattributed,
      note: null,
    };
  }

  const litresKnown = litres;
  const rupeesKnown = missingPrice ? null : rupees;
  const note =
    eligible.length === 0
      ? 'No excess idle was recorded for this driver’s truck in this window.'
      : null;

  return {
    hours,
    litres: litresKnown,
    litresReason: null,
    rupees: litresKnown === 0 ? 0 : rupeesKnown,
    rupeesReason: rupeesKnown == null ? 'the fuel price for this window is not published' : null,
    segments: eligible.length,
    attributableSegments: attributableCount,
    unattributed,
    note,
  };
}

/* ── mileage ──────────────────────────────────────────────────────────── */

const isPositive = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

/**
 * The projected mileage — and only when every input is honest.
 *
 *   projected km/L = distance / (actual fuel − estimated avoidable fuel)
 *
 * Distance, actual fuel and a defensible avoidable-fuel figure must all be
 * known and positive, and the saving must be smaller than the fuel. Anything
 * else is a dash with the reason.
 */
export function projectedMileage({ distanceKm, actualFuelLitres, avoidableLitres } = {}) {
  if (!isPositive(distanceKm)) {
    return { value: null, reason: 'the distance for this window is not measured yet' };
  }
  if (!isPositive(actualFuelLitres)) {
    return { value: null, reason: 'the fuel used in this window is not measured yet' };
  }
  if (!isPositive(avoidableLitres)) {
    return { value: null, reason: 'no avoidable fuel has been measured for this driver yet' };
  }
  if (avoidableLitres >= actualFuelLitres) {
    return {
      value: null,
      reason: 'the saving is not smaller than the fuel used, so no mileage can be projected',
    };
  }
  return { value: distanceKm / (actualFuelLitres - avoidableLitres), reason: null };
}

/** The km/L the truck actually did: distance ÷ fuel. */
export function observedMileage({ distanceKm, actualFuelLitres } = {}) {
  if (!isPositive(distanceKm) || !isPositive(actualFuelLitres)) return null;
  return distanceKm / actualFuelLitres;
}

/** The truck's own baseline km/L, when the payload names it. */
export function baselineKmPerL(drift) {
  if (!drift || typeof drift !== 'object') return null;
  const candidates = [
    drift.baselineKmPerL,
    drift.baseline?.kmPerL,
    drift.baseline,
    drift.baselineKmPerLtr,
    drift.referenceKmPerL,
  ];
  for (const candidate of candidates) {
    const n = numberFromValue(candidate);
    if (n != null) return n;
  }
  return null;
}

/**
 * The mileage of the truck against its OWN baseline, and the projection that
 * is only possible when every input is known.
 */
export function mileageFacts(detail, { avoidableLitres = null } = {}) {
  const vehicle = detail?.vehicle ?? {};
  const drift = detail?.efficiencyDrift ?? null;
  const observed = cellNumber(vehicle.kmPerL) ?? numberFromValue(vehicle.kmPerL);
  const baseline = baselineKmPerL(drift);
  const driftPct = cellNumber(drift?.driftPct);
  const distanceKm = firstNumber(vehicle, [
    'distanceKm',
    'km',
    'distance',
    'totalKm',
    'kmInPeriod',
  ]);
  const actualFuelLitres = firstNumber(vehicle, [
    'fuelLitres',
    'actualFuelLitres',
    'fuelUsedLitres',
    'totalFuelLitres',
    'fuel',
    'litres',
  ]);

  return {
    observed: observed ?? observedMileage({ distanceKm, actualFuelLitres }),
    baseline,
    driftPct,
    distanceKm,
    actualFuelLitres,
    projected: projectedMileage({ distanceKm, actualFuelLitres, avoidableLitres }),
  };
}

/* ── observations for the drawer ──────────────────────────────────────── */

/**
 * The observations of the drawer: the measured components of the score, the
 * harsh events of the truck (grouped by type) and the excess idle.
 *
 * Every one of them carries a part category — the association says the part
 * is relevant to, never that it is damaged.
 */
export function drawerObservations({ grade = null, harshEvents = [], idle = null } = {}) {
  const list = [];

  for (const ingredient of grade?.ingredients ?? []) {
    if (ingredient.value == null) continue;
    list.push({
      key: `dna:${ingredient.key}`,
      label: ingredient.label,
      value: ingredient.value,
      unit: ingredient.unit,
      source: ingredient.source,
      part: ingredient.part,
      evidence: 'drivers',
    });
  }

  const byType = new Map();
  for (const event of Array.isArray(harshEvents) ? harshEvents : []) {
    const type = event?.type ? String(event.type) : null;
    if (!type) continue;
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }
  for (const [type, count] of byType) {
    list.push({
      key: `harsh:${type}`,
      label: `Harsh ${String(type).replace(/[_-]+/g, ' ').toLowerCase()}`,
      value: count,
      unit: 'events recorded',
      source: 'vendor',
      part: partForSignal(type),
      evidence: 'vehicle',
    });
  }

  if (idle && typeof idle.hours === 'number' && idle.hours > 0) {
    list.push({
      key: 'idle',
      label: 'Excess idle',
      value: idle.hours,
      unit: 'hours',
      source: 'estimated',
      part: partForSignal('idling'),
      evidence: 'idling',
    });
  }

  return list;
}
