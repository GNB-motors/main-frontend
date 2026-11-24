/**
 * The Trend card in the page's own shape (label → value rows, unknowns in one
 * foot line): the day's trips and km, what is usual — the 7 days before it
 * and the same weekday over the last 4 weeks — and, once the day is over,
 * the change.
 *
 * Unknowns stay unknown, never 0. A count the server cannot have produced
 * (more days with trips than days looked back) is not printed.
 */
const LOOKBACK_DAYS = 28;
const int = (v) => Math.round(Number(v)).toLocaleString('en-IN');
const num = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Number(v));

function weekdayPlural(day) {
  const name = new Date(`${day}T12:00:00+05:30`).toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });
  return `${name}s`;
}

function pct(value) {
  const rounded = Math.round(value);
  if (rounded === 0) return { value: 'Same', tone: null };
  return {
    value: `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`,
    tone: rounded > 0 ? 'up' : 'down',
  };
}

export default function trendModel(numbers = {}, { day, pending = false } = {}) {
  const weekdays = weekdayPlural(day);
  const rows = [
    {
      key: 'trips',
      label: pending ? 'Trips started so far' : 'Trips started',
      raw: num(numbers.trips),
      text: int,
    },
    {
      key: 'tripsUsual',
      label: 'Usual (last 7 days)',
      raw: num(numbers.tripsPrev7Avg),
      text: (v) => `${int(v)} a day`,
    },
    {
      key: 'tripsWeekday',
      label: `Usual on ${weekdays}`,
      raw: num(numbers.tripsSameWeekdayAvg),
      text: int,
    },
    !pending && {
      key: 'tripsChange',
      label: 'Trips vs last 7 days',
      raw: num(numbers.trips) === 0 ? null : num(numbers.tripsVsPrev7Pct),
      change: true,
    },
    {
      key: 'km',
      label: pending ? 'Km so far' : 'Km',
      raw: num(numbers.km),
      text: (v) => `${int(v)} km`,
    },
    {
      key: 'kmUsual',
      label: 'Usual km (last 7 days)',
      raw: num(numbers.kmPrev7Avg),
      text: (v) => `${int(v)} km a day`,
    },
    {
      key: 'kmWeekday',
      label: `Usual km on ${weekdays}`,
      raw: num(numbers.kmSameWeekdayAvg),
      text: (v) => `${int(v)} km`,
    },
    !pending && {
      key: 'kmChange',
      label: 'Km vs last 7 days',
      raw: num(numbers.kmVsPrev7Pct),
      change: true,
    },
  ].filter(Boolean);

  const known = rows
    .filter((r) => r.raw != null)
    .map((r) =>
      r.change
        ? { key: r.key, label: r.label, ...pct(r.raw) }
        : { key: r.key, label: r.label, value: r.text(r.raw), tone: null },
    );
  const unknown = rows.filter((r) => r.raw == null).map((r) => r.label);
  const days = num(numbers.daysWithData);

  return {
    known,
    comparisons: [
      {
        title: 'Trips',
        today: num(numbers.trips),
        week: num(numbers.tripsPrev7Avg),
        weekday: num(numbers.tripsSameWeekdayAvg),
        unit: 'trips',
      },
      {
        title: 'Loaded distance',
        today: num(numbers.km),
        week: num(numbers.kmPrev7Avg),
        weekday: num(numbers.kmSameWeekdayAvg),
        unit: 'km',
      },
    ],
    weekdayLabel: `Usual on ${weekdays}`,
    unknown,
    partial: Boolean(numbers.kmAveragesPartial),
    pendingNote: pending ? 'The change vs last 7 days shows once the day is over.' : null,
    basis:
      days != null && days <= LOOKBACK_DAYS
        ? `Trips on ${days} of the last ${LOOKBACK_DAYS} days`
        : null,
  };
}
