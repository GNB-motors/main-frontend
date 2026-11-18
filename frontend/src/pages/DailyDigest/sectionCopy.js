import { formatIst } from '../../utils/redesign/format';

/**
 * The plain words for each owner-report section, written for a fleet owner.
 *
 * - `about`: what the section shows, in one line (the ⓘ).
 * - `empty`: one short sentence when there is nothing for the day.
 *
 * The server's method notes ("detector version", "outage-spanning visits",
 * source model names) are for engineers: they are not printed on the page.
 */
const COPY = {
  fleetNow: {
    about: 'Where your trucks are right now, from their live GPS.',
    empty: () => 'No truck has sent its location yet.',
  },
  yesterdaysWork: {
    about: 'Trips that left a pickup on this day, and the distance driven loaded and empty.',
    empty: (pending) =>
      pending ? 'No trip has left a pickup yet today.' : 'No trip left a pickup on this day.',
  },
  moneyOut: {
    about: 'Diesel bills and other expenses recorded for this day.',
    empty: () => 'No diesel bills or expenses were recorded for this day.',
  },
  moneyIn: {
    about: 'Freight billed for this day.',
    empty: () => 'Freight billing is not connected yet.',
  },
  people: {
    about: 'Driver and crew duty for this day.',
    empty: () => 'Crew duty is not tracked yet.',
  },
  exceptions: {
    about:
      'Events on the selected day, and alerts, bills and documents still needing attention now.',
    empty: () => 'Nothing needed attention on this day.',
  },
  trend: {
    about:
      'This day compared with the 7 days before it and the same weekday over the last 4 weeks.',
    empty: () => 'Not enough trip history to compare yet.',
  },
  dataHealth: {
    about: 'Whether your trucks and vendor accounts are sending data.',
    empty: () => 'No trucks are registered yet.',
  },
};

function about(section) {
  return COPY[section?.id]?.about || null;
}

function empty(section, { pending = false } = {}) {
  const copy = COPY[section?.id];
  return copy ? copy.empty(pending) : 'Nothing was recorded for this day.';
}

/** "Updated 17 Nov, 3:36 am" from the freshest source the section read, or null. */
function updated(section) {
  const times = (section?.footer?.sources || section?.sources || [])
    .map((s) => (s?.freshAsOf ? new Date(s.freshAsOf).getTime() : NaN))
    .filter(Number.isFinite);
  if (!times.length) return null;
  return `Updated ${formatIst(new Date(Math.max(...times)), { withDate: true })}`;
}

const sectionCopy = { about, empty, updated };

export default sectionCopy;
