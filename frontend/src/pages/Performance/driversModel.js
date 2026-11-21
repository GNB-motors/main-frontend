export const DRIVER_METRICS = [
  { key: 'dnaScore', label: 'DNA score', decimals: 0 },
  { key: 'harshPer100Km', label: 'Harsh events', decimals: 1 },
  { key: 'idlePct', label: 'Idle share', decimals: 1 },
  { key: 'paceFactor', label: 'Road pace', pace: true },
];

/** "WB11S6362 · WB23D1180", or the words for a driver with no truck. */
export const driverTrucks = (driver) =>
  (driver?.vehicles ?? []).filter(Boolean).join(' · ') || 'No truck assigned in this window';

/** The 0–100 parts of a DNA score. */
export const DNA_SCORES = [
  { key: 'idleScore', label: 'Idling' },
  { key: 'speedingScore', label: 'Speeding' },
  { key: 'overRevScore', label: 'Over-revving' },
];

/** The measured facts behind those parts. */
export const DNA_FACTS = [
  { key: 'idleExcessMinutes', label: 'Excess idling', decimals: 0 },
  { key: 'idleRupees', label: 'Cost of that idling', decimals: 0 },
  { key: 'speedingRate', label: 'Time over the limit', decimals: 1 },
  { key: 'overRevRate', label: 'Time over-revving', decimals: 1 },
];

const GRADE_TONE = { A: 'ok', B: 'info', C: 'warn', D: 'bad' };

/** The pill tone of a DNA grade; no tone for a grade we do not know. */
export const gradeTone = (grade) => GRADE_TONE[String(grade || '').toUpperCase()] || null;
