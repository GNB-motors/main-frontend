/**
 * trackUrlModel — Track mode is driven by the URL.
 *
 * Every link in the product must be able to open one truck's history on a
 * given range: the Track button in the vehicle panel, the digest, an
 * issue's "see the 6 times", a detour. If the state lived in React only,
 * half of those links could not exist.
 *
 * The URL is:
 *   /live-tracking?v=WB11J7062&from=…&to=…&at=…
 *
 * `from` and `to` carry the IST offset, so the range reads the same in the
 * URL as it does on the clock in Bengal.
 */

/** The offset the product works in. */
const IST_OFFSET = '+05:30';

/** How long the default range is. */
export const DEFAULT_RANGE_HOURS = 24;

/** A range longer than this is drawn simplified, and the owner is told. */
export const LONG_RANGE_DAYS = 31;

/** The minutes in one day. */
const DAY_MIN = 24 * 60;

/**
 * A Date as an IST ISO string: "2026-11-01T18:30:00+05:30".
 * The wall-clock time is the one the owner reads.
 */
export function toIso(date) {
  if (!date) return null;
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  const shifted = new Date(value.getTime() + (330 + value.getTimezoneOffset()) * 60000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}` +
    `T${pad(shifted.getHours())}:${pad(shifted.getMinutes())}:${pad(shifted.getSeconds())}${IST_OFFSET}`
  );
}

/**
 * An IST ISO string as a Date.
 * A string with no offset is read as IST, because that is the only
 * timezone the product speaks.
 */
export function fromIso(text) {
  if (!text) return null;
  const value = new Date(text);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

/** The start of the IST day that contains the date. */
export function startOfIstDay(date) {
  const value = new Date(date);
  const shifted = new Date(value.getTime() + (330 + value.getTimezoneOffset()) * 60000);
  const midnight = new Date(
    shifted.getFullYear(),
    shifted.getMonth(),
    shifted.getDate(),
    0,
    0,
    0,
    0,
  );
  return new Date(midnight.getTime() - (330 + midnight.getTimezoneOffset()) * 60000);
}

/** The end of the IST day that contains the date — the last minute of it. */
export function endOfIstDay(date) {
  const start = startOfIstDay(date);
  return new Date(start.getTime() + (DAY_MIN - 1) * 60000);
}

/**
 * The range the owner asked for, or the default one.
 * A range that ends before it starts is corrected: an owner who picks two
 * dates in the wrong order gets a sensible range, not an error.
 */
export function resolveRange({ from, to, now = new Date() } = {}) {
  const start = fromIso(from);
  const end = fromIso(to);

  if (!start && !end) {
    return {
      from: new Date(now.getTime() - DEFAULT_RANGE_HOURS * 3600 * 1000),
      to: now,
      isDefault: true,
    };
  }
  if (start && !end) {
    return {
      from: start,
      to: new Date(start.getTime() + DEFAULT_RANGE_HOURS * 3600 * 1000),
      isDefault: false,
    };
  }
  if (!start && end) {
    return {
      from: new Date(end.getTime() - DEFAULT_RANGE_HOURS * 3600 * 1000),
      to: end,
      isDefault: false,
    };
  }
  if (end.getTime() <= start.getTime()) {
    return {
      from: start,
      to: new Date(start.getTime() + DEFAULT_RANGE_HOURS * 3600 * 1000),
      isDefault: false,
      corrected: true,
    };
  }
  return { from: start, to: end, isDefault: false };
}

/**
 * The whole Track mode state from a URL's search params.
 * `reg` is the truck; `at` is the playhead.
 */
export function parseTrackParams(searchParams, { now = new Date() } = {}) {
  const get = (key) => {
    if (!searchParams) return null;
    if (typeof searchParams.get === 'function') return searchParams.get(key);
    return searchParams[key] ?? null;
  };

  const reg = get('v');
  const range = resolveRange({ from: get('from'), to: get('to'), now });
  const at = fromIso(get('at'));

  return {
    reg: reg || null,
    from: range.from,
    to: range.to,
    // The playhead starts at the beginning of the range, so pressing play
    // runs the drive forward from the start instead of jumping there.
    at: at || range.from,
    isDefaultRange: range.isDefault,
    correctedRange: Boolean(range.corrected),
  };
}

/**
 * The URL for a Track mode state.
 * `replace` is the caller's business; this only builds the string.
 */
export function buildTrackUrl({ reg, from, to, at } = {}) {
  const params = new URLSearchParams();
  if (reg) params.set('v', reg);
  const fromIsoText = toIso(from);
  const toIsoText = toIso(to);
  if (fromIsoText) params.set('from', fromIsoText);
  if (toIsoText) params.set('to', toIsoText);
  const atIsoText = toIso(at);
  if (atIsoText) params.set('at', atIsoText);
  return `/live-tracking?${params.toString()}`;
}

/**
 * The presets the range picker offers.
 * Each one is a pair of dates, computed from the truck's own last trip when
 * there is one.
 */
export function rangePresets({ now = new Date(), trip = null } = {}) {
  const presets = [
    {
      id: 'last24h',
      label: 'Last 24 h',
      from: new Date(now.getTime() - DEFAULT_RANGE_HOURS * 3600 * 1000),
      to: now,
    },
    { id: 'today', label: 'Today', from: startOfIstDay(now), to: now },
    {
      id: 'yesterday',
      label: 'Yesterday',
      from: startOfIstDay(new Date(now.getTime() - DAY_MIN * 60000)),
      to: endOfIstDay(new Date(now.getTime() - DAY_MIN * 60000)),
    },
    {
      id: 'last7d',
      label: 'Last 7 days',
      from: new Date(now.getTime() - 7 * DAY_MIN * 60000),
      to: now,
    },
  ];

  // "This trip" only exists when there is a trip to show.
  if (trip?.from) {
    presets.push({
      id: 'thistrip',
      label: 'This trip',
      from: new Date(trip.from),
      to: trip.to ? new Date(trip.to) : now,
    });
  }
  return presets;
}

/**
 * True when the range is long enough that the path will be simplified.
 * The owner is told, rather than being left to wonder why the line looks
 * coarse.
 */
export function isLongRange({ from, to } = {}) {
  if (!from || !to) return false;
  const days = (new Date(to).getTime() - new Date(from).getTime()) / (DAY_MIN * 60000);
  return days > LONG_RANGE_DAYS;
}
