import { describe, expect, it } from 'vitest';
import { encodePolyline6 } from '../../lib/polyline6.js';
import { trackRouteModel } from './useTrackRoutes.js';

describe('Track routes', () => {
  it('draws only matched non-plant lanes and counts missing geometry', () => {
    const encoded = encodePolyline6([{ lat: 22, lng: 88 }, { lat: 23, lng: 87 }]);
    const leg = (id, source, extra = {}) => ({
      _id: id, fromSiteId: 'a', toSiteId: 'b', traversals: 2,
      path: { source, overviewSegments: source === 'NONE' ? [] : [encoded] }, ...extra,
    });
    const result = trackRouteModel({
      sites: [{ _id: 'a', lat: 22, lng: 88 }, { _id: 'b', lat: 23, lng: 87 }],
      legs: [leg('a', 'DRIVEN'), leg('b', 'ENGINE'), leg('c', 'NONE'), leg('d', 'DRIVEN', { inPlant: true })],
    });
    expect(result.lines.map((line) => line.id)).toEqual(['a', 'b']);
    expect(result.unmatchedCount).toBe(1);
  });
});
