/**
 * What the trip's fuel summary says — pure.
 *
 * A litre the server did not measure stays unknown: a dash, never a zero. The
 * words here never name a crime; they say what a person should check.
 */
import { formatInIST } from '../../utils/dateUtils';
import { isMeasured } from '../../utils/measured';

/** What the loss line means, for the little "i" beside it. */
export const FUEL_LOSS_TIP =
  'Fuel that left the tank while the engine was not burning it. It may have been taken out of the tank: check the events.';

const LEG_LABEL = { approach: 'Approach', laden: 'Loaded', return: 'Return' };

/** "12.4 L" — a measured figure; an unmeasured one stays unknown. */
export function fmtLitres(value) {
  if (!isMeasured(value)) return '—';
  const n = Number(value);
  return `${n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

/** "26 Nov, 14:05" — when an event was seen, in IST. */
export function fmtIstMinute(value) {
  return formatInIST(value, 'D MMM, HH:mm') ?? '—';
}

/** The litres the trip burnt, and the legs that were measured. */
export function fuelBurntView(summary) {
  const legs = summary?.burntByLeg || {};
  return {
    burnt: isMeasured(summary?.burntL) ? Number(summary.burntL) : null,
    partial: summary?.partial === true,
    legs: Object.keys(legs)
      .filter((key) => isMeasured(legs[key]))
      .map((key) => ({ label: LEG_LABEL[key] || key, litres: Number(legs[key]) })),
  };
}

/**
 * The unexplained loss: how much left the tank, and when it was seen.
 *
 * Zero is not "no loss": with drain alerts as the only coverage it means no
 * alert was raised, and the line says exactly that.
 */
export function fuelLossView(loss) {
  const events = (loss?.events || []).map((event) => ({
    at: event?.at ?? null,
    litres: isMeasured(event?.litres) ? Number(event.litres) : null,
    tank: event?.tank ?? null,
  }));
  const partial = loss?.partial === true || events.some((event) => event.litres == null);
  if (!loss || !isMeasured(loss.totalL)) return { text: '—', events, partial: false };
  const totalL = Number(loss.totalL);
  const litres = fmtLitres(totalL);
  if (events.length) {
    // The alerts themselves are the story: what was seen, and when.
    return {
      text: `${litres} in ${events.length} event${events.length === 1 ? '' : 's'}`,
      events,
      partial,
    };
  }
  if (totalL === 0) {
    return {
      text: loss.coverage === 'DRAIN_ALERTS_ONLY' ? 'No drain alert in this trip' : 'None seen',
      events,
      partial,
    };
  }
  return {
    text: litres,
    events,
    partial,
  };
}
