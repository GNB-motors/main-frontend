import { formatInIST } from '../../utils/dateUtils';
import { formatKm, formatLitres, formatNum } from '../../utils/formatters';

/**
 * The fleet km/L rollup, in words.
 *
 * The roll-up (/api/mileage-rollup) is the ONE fleet mileage figure: Σ km ÷
 * Σ litres over COMPLETED fill-to-full cycles, with an ECU cross-check, a
 * duty-group split, a per-truck ranking and the learned evidence gate that
 * decides what may be published.
 *
 * Every rule of this file: a number that is not there is a dash WITH the
 * reason it is not there. A missing km/L and a broken response must never look
 * the same on the page.
 */

export const DASH = '—';

/** The unit the roll-up is measured in. */
export const UNIT_TEXT = 'km per litre (KM_PER_LITRE)';

/** "3.40 km/L" — or the dash, with the reason kept beside it. */
export const kmPerLText = (value) =>
  value == null || Number.isNaN(Number(value)) ? DASH : `${Number(value).toFixed(2)} km/L`;

/** "+4.3%" — the sign says which way it is off. */
export const varianceText = (value) => {
  if (value == null || Number.isNaN(Number(value))) return DASH;
  const n = Number(value);
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
};

/** The two duty groups the backend names. */
export const DUTY_LABELS = ['Short-haul duty', 'Long-haul duty'];

/** The label of a duty group, preferring the one the backend sent. */
export const dutyLabel = (group, groups = []) => {
  const found = (Array.isArray(groups) ? groups : []).find((g) => g && g.group === group);
  if (found?.label) return found.label;
  if (group === 0) return DUTY_LABELS[0];
  if (group === 1) return DUTY_LABELS[1];
  return group == null ? DASH : `Duty group ${group}`;
};

/** How the expected km/L of a truck was worked out, in words. */
export const expectedBasisText = (basis) => {
  switch (basis) {
    case 'OWN_HISTORY_ONLY':
      return 'from this truck’s own cycles';
    case 'MODEL_POOLED_ONLY':
      return 'from the pooled figure of other trucks of the same model';
    case 'SHRUNK_TO_MODEL_POOLED':
      return 'from this truck’s own cycles, pulled toward the same model’s pooled figure';
    case 'NO_EVIDENCE':
      return 'no evidence yet';
    default:
      return null;
  }
};

/** The fleet headline: one km/L for the whole fleet, and what it is made of. */
export function fleetHeadline(kmPerLitre) {
  const fleet = kmPerLitre?.fleet || {};
  const kmPerL = fleet.kmPerL ?? null;
  const hasCycles = Number(fleet.cycles) > 0;
  return {
    kmPerL,
    text: kmPerLText(kmPerL),
    reason:
      kmPerL == null
        ? hasCycles
          ? 'The cycles counted in this window have no litres behind them yet, so there is nothing to divide.'
          : 'No completed fill-to-full cycle fell in this window, so there is nothing to divide yet.'
        : null,
    foot: hasCycles
      ? `Σ ${formatKm(fleet.km)} ÷ ${formatLitres(fleet.litres)} over ${formatNum(fleet.cycles)} completed cycles`
      : null,
    trucks:
      fleet.vehicles == null
        ? null
        : `${formatNum(fleet.vehiclesPublished)} of ${formatNum(fleet.vehicles)} trucks published`,
  };
}

/** The ECU cross-check: a second number over the same counted cycles. */
export function ecuCrossCheck(kmPerLitre) {
  const ecu = kmPerLitre?.ecu || {};
  const gap = kmPerLitre?.gap || {};
  const uncovered = kmPerLitre?.ecuUncovered || {};
  const ecuKmPerL = ecu.kmPerL ?? null;
  const gapKmPerL = gap.kmPerL ?? null;
  return {
    kmPerL: ecuKmPerL,
    text: kmPerLText(ecuKmPerL),
    reason:
      ecuKmPerL == null
        ? 'No ECU tile fell inside a counted cycle span, so there is no cross-check to report.'
        : null,
    gapText:
      gapKmPerL == null
        ? DASH
        : `${gapKmPerL > 0 ? '+' : ''}${Number(gapKmPerL).toFixed(2)} km/L`,
    gapReason:
      gapKmPerL == null
        ? 'Nothing to compare against: the ECU side has no figure over the counted cycles.'
        : null,
    pctText:
      gap.pctOfEcu == null
        ? DASH
        : `${gap.pctOfEcu > 0 ? '+' : ''}${Number(gap.pctOfEcu).toFixed(1)}% of the ECU figure`,
    over: gap.over || null,
    uncoveredNote: uncovered.note || null,
    uncoveredKm: uncovered.km ?? null,
    uncoveredLitres: uncovered.litres ?? null,
  };
}

/** One card per duty group, with the reason it does or does not rank. */
export function groupCards(kmPerLitre) {
  const groups = Array.isArray(kmPerLitre?.groups) ? kmPerLitre.groups : [];
  return groups.map((g) => ({
    key: String(g?.group ?? ''),
    label: dutyLabel(g?.group, groups),
    kmPerL: g?.kmPerL ?? null,
    text: kmPerLText(g?.kmPerL),
    reason: g?.kmPerL == null ? 'This group has no litres counted in the window.' : null,
    cycles: g?.cycles ?? null,
    km: g?.km ?? null,
    litres: g?.litres ?? null,
    vehicles: g?.vehicles ?? null,
    vehiclesCounted: g?.vehiclesCounted ?? null,
    ranked: g?.ranked !== false,
    excludeNote: g?.excludeNote || null,
    excluded: (Array.isArray(g?.excludedTrucks) ? g.excludedTrucks : []).map((t) => ({
      registrationNumber: t?.registrationNumber || DASH,
      reason: t?.reason || 'Not published: this truck did not clear its group’s evidence gate.',
    })),
  }));
}

/** The per-truck ranking — only trucks that cleared their group's gate. */
export function rankingRows(kmPerLitre) {
  const groups = Array.isArray(kmPerLitre?.groups) ? kmPerLitre.groups : [];
  const ranking = Array.isArray(kmPerLitre?.ranking) ? kmPerLitre.ranking : [];
  return ranking.map((r) => ({
    rank: r?.rank ?? null,
    registrationNumber: r?.registrationNumber || DASH,
    model: r?.model || null,
    duty: dutyLabel(r?.dutyGroup, groups),
    kmPerL: r?.kmPerL ?? null,
    kmPerLText: kmPerLText(r?.kmPerL),
    expectedKmPerL: r?.expectedKmPerL ?? null,
    expectedText: kmPerLText(r?.expectedKmPerL),
    expectedReason:
      r?.expectedKmPerL == null ? 'No expected figure has been worked out for this truck yet.' : null,
    expectedBasis: expectedBasisText(r?.expectedBasis),
    variancePct: r?.variancePct ?? null,
    varianceText: varianceText(r?.variancePct),
    varianceReason:
      r?.variancePct == null ? 'No expected figure to compare it against.' : null,
    cycles: r?.cycles ?? null,
  }));
}

/** The trucks held back, each with the reason it is held. */
export function withheldRows(kmPerLitre) {
  const groups = Array.isArray(kmPerLitre?.groups) ? kmPerLitre.groups : [];
  const withheld = Array.isArray(kmPerLitre?.withheld) ? kmPerLitre.withheld : [];
  return withheld.map((w) => ({
    registrationNumber: w?.registrationNumber || DASH,
    duty: dutyLabel(w?.dutyGroup, groups),
    cycles: w?.cycles ?? null,
    km: w?.km ?? null,
    litres: w?.litres ?? null,
    reason: w?.reason || 'Not published: this truck did not clear its group’s evidence gate.',
  }));
}

/** The learned evidence gate — learned per duty group, never a constant. */
export function learnedGate(kmPerLitre) {
  const learned = kmPerLitre?.learned || {};
  const groups = learned.groups || {};
  const rows = Object.entries(groups).map(([key, gate]) => ({
    key,
    label: dutyLabel(Number(key)),
    minCycles: gate?.minCycles ?? null,
    minKm: gate?.minKm ?? null,
    minLitres: gate?.minLitres ?? null,
    trucks: gate?.trucks ?? null,
    source: gate?.source || 'NONE',
    learned: gate?.minCycles != null,
    text:
      gate?.minCycles == null
        ? 'No evidence bar has been learned for this group yet, so its trucks are not ranked.'
        : `at least ${formatNum(gate.minCycles)} cycles, ${formatKm(gate.minKm)} and ${formatLitres(
            gate.minLitres,
          )}`,
  }));
  return {
    basis: learned.basis || null,
    source: learned.source || 'NONE',
    learnedAt: learned.learnedAt || null,
    rows,
  };
}

/** The learned duty cut — where short-haul ends and long-haul begins. */
export function dutyCut(kmPerLitre) {
  const duty = kmPerLitre?.duty || {};
  return {
    basis: duty.basis || null,
    cutKmPerCycle: duty.cutKmPerCycle ?? null,
    cutText:
      duty.cutKmPerCycle == null
        ? DASH
        : `${formatKm(duty.cutKmPerCycle)} per cycle`,
    cutReason:
      duty.cutKmPerCycle == null
        ? 'No truck has a measured cycle distance yet, so the cut is not known.'
        : null,
    trucksDescribed: duty.trucksDescribed ?? null,
  };
}

/** The window the roll-up actually covered — it is not always the dates asked for. */
export function windowText(kmPerLitre) {
  const win = kmPerLitre?.window || {};
  const from = win.from ? formatInIST(win.from, 'D MMM YYYY') : null;
  const to = win.to ? formatInIST(win.to, 'D MMM YYYY') : null;
  if (!from && !to) return null;
  if (from && to && from === to) return from;
  return `${from || DASH} – ${to || DASH}`;
}
