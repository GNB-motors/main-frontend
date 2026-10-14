import { groupBreaks } from '../intelligence/model/siteLists.js';
import { isNum } from './placeGeometry.js';

/** Last week's unexplained stops, one entry per place (its site, else a ~100 m cell), worst first. */
export function stopGroupsOf(breaks = []) {
  return groupBreaks(breaks)
    .filter((g) => isNum(g.lat) && isNum(g.lng))
    .map((g) => ({ ...g, id: `stop:${g.key}` }));
}

export function stopTotals(groups = []) {
  const trucks = new Set();
  let stops = 0;
  let minutes = 0;
  for (const g of groups) {
    stops += g.stops.length;
    minutes += g.minutes;
    g.trucks.forEach((t) => trucks.add(t));
  }
  return { places: groups.length, stops, minutes, trucks: trucks.size };
}
