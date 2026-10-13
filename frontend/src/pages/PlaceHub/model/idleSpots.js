import { isNum, toNum } from './placeGeometry.js';

export function liveIdleTotals(live = []) {
  const excess = live.filter((e) => e.legitimacy === 'excess');
  return {
    count: live.length,
    excessCount: excess.length,
    rupees: live.reduce((s, e) => s + (Number(e.rupees) || 0), 0),
    excessRupees: excess.reduce((s, e) => s + (Number(e.rupees) || 0), 0),
  };
}

/** About 250 m — close enough that two idles are "the same spot". */
const IDLE_CELL_DEG = 0.0025;

/**
 * Closed idle events grouped into spots on a ~250 m grid, worst first by the
 * money burned outside any known place. A spot full of excess idling is the
 * one a manager should either fix or declare as a place.
 */
export function clusterIdleEvents(events = [], { cellDeg = IDLE_CELL_DEG } = {}) {
  const cells = new Map();
  for (const e of events) {
    const lat = toNum(e.lat);
    const lng = toNum(e.lng);
    if (!isNum(lat) || !isNum(lng)) continue;
    const key = `${Math.round(lat / cellDeg)}:${Math.round(lng / cellDeg)}`;
    let c = cells.get(key);
    if (!c) {
      c = { key, latSum: 0, lngSum: 0, events: 0, minutes: 0, rupees: 0, excessRupees: 0 };
      c.trucks = new Set();
      c.zoneNames = new Set();
      c.lastAt = null;
      cells.set(key, c);
    }
    const rupees = Number(e.rupees) || 0;
    c.latSum += lat;
    c.lngSum += lng;
    c.events += 1;
    c.minutes += Number(e.durationMin) || 0;
    c.rupees += rupees;
    if (e.legitimacy === 'excess') c.excessRupees += rupees;
    if (e.registrationNumber) c.trucks.add(e.registrationNumber);
    if (e.zoneName) c.zoneNames.add(e.zoneName);
    const at = e.endAt || e.startAt;
    if (at && (!c.lastAt || at > c.lastAt)) c.lastAt = at;
  }
  return [...cells.values()]
    .map((c) => ({
      id: `idle:${c.key}`,
      lat: c.latSum / c.events,
      lng: c.lngSum / c.events,
      events: c.events,
      hours: c.minutes / 60,
      rupees: c.rupees,
      excessRupees: c.excessRupees,
      excessShare: c.rupees > 0 ? c.excessRupees / c.rupees : 0,
      trucks: [...c.trucks].sort(),
      zoneNames: [...c.zoneNames],
      lastAt: c.lastAt,
    }))
    .sort((a, b) => b.excessRupees - a.excessRupees || b.rupees - a.rupees);
}

export function idleHistoryTotals(events = []) {
  return events.reduce(
    (t, e) => {
      const rupees = Number(e.rupees) || 0;
      t.events += 1;
      t.hours += (Number(e.durationMin) || 0) / 60;
      t.rupees += rupees;
      if (e.legitimacy === 'excess') t.excessRupees += rupees;
      return t;
    },
    { events: 0, hours: 0, rupees: 0, excessRupees: 0 },
  );
}
