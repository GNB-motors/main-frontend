import { describe, it, expect } from 'vitest';
import {
  decodeRoutes,
  filterRoutes,
  drawableRoutes,
  routeWidth,
  routeColor,
  routeFitPoints,
  linkArc,
} from './routes.js';
import { encodePolyline6 } from '../../../lib/polyline6.js';
const points = [
  { lat: 23, lng: 86 },
  { lat: 24, lng: 87 },
];
const make = (id, over = {}) => ({
  _id: id,
  fromSiteId: 'a',
  toSiteId: 'b',
  pairKey: 'a|b',
  traversals: 10,
  title: `Plant → Town ${id}`,
  inPlant: false,
  path: { source: 'DRIVEN' },
  segments: [points],
  stats: { km: { p50: 160 }, minutes: { p50: 60, p90: 90 } },
  ...over,
});
describe('routes map model', () => {
  it('merges only matching reverse roads and keeps directional rows', () => {
    const legs = [
      make('1', { sameRoadAsReverse: true }),
      make('2', { sameRoadAsReverse: true, fromSiteId: 'b', toSiteId: 'a', traversals: 20 }),
    ];
    const lines = drawableRoutes(legs);
    expect(lines).toHaveLength(1);
    expect(lines[0].runs).toBe(30);
    expect(lines[0].legs).toHaveLength(2);
    expect(drawableRoutes([legs[0], { ...legs[1], sameRoadAsReverse: false }])).toHaveLength(2);
  });
  it('uses bounded square-root widths and the five colour bins', () => {
    expect(routeWidth(100, 100)).toBe(8);
    expect(routeWidth(0, 0)).toBe(2);
    expect(routeWidth(25, 100)).toBe(5);
    expect([3, 6, 12, 24, 25].map((n) => routeColor(n, false))).toEqual([
      '#6da7ec',
      '#3987e5',
      '#256abf',
      '#184f95',
      '#0d366b',
    ]);
    expect(routeColor(25, true)).toBe('#b7d3f6');
  });
  it('excludes in-plant legs from every chip except its own', () => {
    const legs = [
      make('1', { latestRunMinutes: 100 }),
      make('2', { inPlant: true, latestRunMinutes: 100 }),
    ];
    for (const chip of ['all', 'busy', 'long', 'slow'])
      expect(filterRoutes(legs, { chip }).map((l) => l._id)).toEqual(['1']);
    expect(filterRoutes(legs, { chip: 'plant' }).map((l) => l._id)).toEqual(['2']);
    expect(routeFitPoints(legs)).toEqual(points);
  });
  it('searches names, filters spider mode and sorts absent values last', () => {
    const legs = [
      make('1', { fuelCostP50: null }),
      make('2', { title: 'Mine → Yard', fuelCostP50: 100 }),
      make('3', { fromSiteId: 'c', toSiteId: 'd' }),
    ];
    expect(filterRoutes(legs, { query: 'MINE' }).map((l) => l._id)).toEqual(['2']);
    expect(filterRoutes(legs, { siteId: 'a' })).toHaveLength(2);
    expect(filterRoutes(legs, { sort: 'fuel' })[0]._id).toBe('2');
  });
  it('decodes polyline6 segments independently and builds opposite fallback arcs', () => {
    const data = {
      sites: [
        { _id: 'a', name: 'Plant', ...points[0] },
        { _id: 'b', name: 'Town', ...points[1] },
      ],
      legs: [
        make('1', {
          path: {
            source: 'DRIVEN',
            overviewSegments: [encodePolyline6(points), encodePolyline6([...points].reverse())],
          },
        }),
      ],
    };
    const result = decodeRoutes(data);
    expect(result.legs[0].segments).toEqual([points, [...points].reverse()]);
    expect(result.legs[0].title).toBe('Plant → Town');
    const forward = linkArc(points[0], points[1]);
    const reverse = linkArc(points[1], points[0]);
    expect(forward[0]).toEqual(points[0]);
    expect(forward[12]).not.toEqual(reverse[12]);
  });
});
