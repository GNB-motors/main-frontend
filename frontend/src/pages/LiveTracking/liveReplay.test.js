import { describe, it, expect } from 'vitest';
import liveReplay from './liveReplay.js';
import buildTrip from '../RouteHub/views/replay/buildTrip.js';
import sampleAt from '../RouteHub/views/replay/sampleAt.js';

const point = (minute, longitude = 88 + minute / 100, flags = {}) => ({
  latitude: 22,
  longitude,
  eventDateTime: new Date(Date.UTC(2026, 10, 2, 10, minute)).toISOString(),
  ...flags,
});

describe('replay frame preparation and sampling', () => {
  it('requires two distinct timestamps and clamps scrubbing to the endpoints', () => {
    expect(liveReplay.sample(liveReplay.build(), 0)).toBeNull();
    expect(liveReplay.sample(liveReplay.build([point(0), point(0)]), 0)).toBeNull();
    const model = liveReplay.build([point(0), point(1)]);
    expect(liveReplay.sample(model, -1).position.lng).toBe(88);
    expect(liveReplay.sample(model, 2).position.lng).toBe(88.01);
  });
  it.each([{ break: true }, { gap: true }, { gapType: 'stationary' }, { sparse: true }])(
    'matches Route Hub interpolation across sparse or flagged legs: %j',
    (flags) => {
      const points = [point(0), point(1), point(59, 89, flags), point(60, 89.01)];
      const model = liveReplay.build(points);
      const halfway = liveReplay.sample(model, 0.5);
      const hub = sampleAt(buildTrip(points, [], []), 0.5);
      expect(halfway.position).toEqual({ lat: hub.ll[0], lng: hub.ll[1] });
      expect(halfway.paths).toHaveLength(1);
      expect(halfway.paths[0].path.at(-1)).toEqual(halfway.position);
      const after = liveReplay.sample(model, 59.5 / 60);
      expect(after.position.lng).toBeCloseTo(89.005);
      expect(after.paths).toHaveLength(1);
      expect(after.paths[0].key).toBe(halfway.paths[0].key);
      expect(model.segments).toHaveLength(2);
    },
  );
});
