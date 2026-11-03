/**
 * trackPlayback — the playhead moving along a truck's path.
 *
 * The rule the owner asked for: 1× means one real minute plays in one
 * second. Everything else is a multiple of that, so the speed buttons mean
 * the same thing on every truck and every day.
 *
 * Pure maths, no timers: the hook does the animation, this decides where
 * the playhead is.
 */

/** One real minute plays in one second, at 1×. */
export const MS_PER_TRACK_MINUTE = 60;

/**
 * The speeds the timeline offers, as multiples of 1× (one real minute per
 * second). A full day's drive is hours long, so the fast ends matter: 120×
 * replays two hours of driving every second.
 */
export const PLAYBACK_SPEEDS = [2, 10, 40, 120];

/**
 * The index of the last point at or before the given time.
 * Returns 0 for a time before the path and the last index for one after it.
 */
export function indexAtTime(points, time) {
  const list = Array.isArray(points) ? points : [];
  if (!list.length) return 0;
  const target = new Date(time).getTime();
  let index = 0;
  for (let i = 0; i < list.length; i += 1) {
    if (new Date(list[i].t).getTime() <= target) index = i;
    else break;
  }
  return index;
}

/**
 * The playhead position after `elapsedMs` of playing.
 *
 * `speed` is the multiple: at 1× a real minute of driving takes one
 * second of wall-clock, so the track time that has passed is
 * `elapsedMs / MS_PER_TRACK_MINUTE * speed` minutes.
 */
export function playbackPosition(points, elapsedMs, speed = 1) {
  const list = Array.isArray(points) ? points : [];
  if (!list.length) return null;

  const firstTime = new Date(list[0].t).getTime();
  // 1× means one real minute of driving plays in one second.
  const trackMs = elapsedMs * speed * MS_PER_TRACK_MINUTE;
  const at = new Date(firstTime + trackMs);
  const index = indexAtTime(list, at);

  return {
    index,
    at,
    finished: at.getTime() >= new Date(list[list.length - 1].t).getTime(),
  };
}

/**
 * The time of the point at an index, as a Date.
 */
export function timeAtIndex(points, index) {
  const list = Array.isArray(points) ? points : [];
  if (!list.length) return null;
  const clamped = Math.max(0, Math.min(index, list.length - 1));
  return new Date(list[clamped].t);
}

/**
 * The time of the next event after the playhead.
 * The owner jumps between events, not between raw GPS points, so this
 * compares moments in time. The response's events are not in time order,
 * so the earliest one after the playhead is chosen.
 */
export function nextEventAt(events, currentTime) {
  const list = Array.isArray(events) ? events : [];
  const now = new Date(currentTime).getTime();
  const later = list
    .map((event) => new Date(event.at).getTime())
    .filter((time) => time > now)
    .sort((a, b) => a - b);
  if (!later.length) return null;
  return new Date(later[0]);
}

/** The time of the event before the playhead. */
export function previousEventAt(events, currentTime) {
  const list = Array.isArray(events) ? events : [];
  const now = new Date(currentTime).getTime();
  const earlier = list
    .map((event) => new Date(event.at).getTime())
    .filter((time) => time < now)
    .sort((a, b) => a - b);
  if (!earlier.length) return null;
  return new Date(earlier[earlier.length - 1]);
}

/**
 * The trip log: the stops and the events, in the order they happened.
 * The log is a fact list, not a judgement list.
 */
export function buildTripLog(stops = [], events = []) {
  const rows = [];

  (Array.isArray(stops) ? stops : []).forEach((stop, index) => {
    rows.push({
      key: `stop-${stop.startAt}-${index}`,
      at: stop.startAt,
      kind: 'STOP',
      reason: stop.reason,
      title: stop.place?.name ?? 'Stop',
      text: stop.reasonWhy ?? '',
      durationMin: stop.durationMin ?? null,
      place: stop.place ?? null,
    });
  });

  (Array.isArray(events) ? events : []).forEach((event) => {
    rows.push({
      key: `event-${event.kind}-${event.at}`,
      at: event.at,
      kind: event.kind,
      reason: event.kind,
      title: event.text,
      text: '',
      durationMin: null,
      place: null,
    });
  });

  return rows.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/**
 * The CSV of the whole drive: the points, with the stops and the events as
 * their own rows. It is built in the browser, so it is the same data the
 * owner is looking at.
 */
export function buildTrackCsv(track) {
  const rows = [['time', 'lat', 'lng', 'speed_kmh', 'kind', 'label', 'duration_min']];
  const points = Array.isArray(track?.points) ? track.points : [];

  points.forEach((point) => {
    rows.push([point.t, point.lat, point.lng, point.speedKmh ?? '', 'POINT', '', '']);
  });

  (Array.isArray(track?.stops) ? track.stops : []).forEach((stop) => {
    rows.push([
      stop.startAt,
      stop.place?.lat ?? '',
      stop.place?.lng ?? '',
      '',
      `STOP_${stop.reason}`,
      stop.place?.name ?? '',
      stop.durationMin ?? '',
    ]);
  });

  (Array.isArray(track?.events) ? track.events : []).forEach((event) => {
    rows.push([event.at, event.lat, event.lng, '', `EVENT_${event.kind}`, event.text, '']);
  });

  return rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
