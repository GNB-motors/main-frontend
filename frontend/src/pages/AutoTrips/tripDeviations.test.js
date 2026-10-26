import { describe, it, expect } from 'vitest';
import { deviationHref, deviationWindow, detourSegments } from './tripDeviations';

const T = (d, h, m = 0) => new Date(Date.UTC(2026, 9, d, h, m));
const DAY = 24 * 3600 * 1000;

describe('deviationWindow', () => {
  it('opens before the pickup (the empty run) and closes a day after the last drop', () => {
    const w = deviationWindow({
      pickup: { arrivedAt: T(10, 8) },
      drop: { arrivedAt: T(10, 18) },
      extraDrops: [{ arrivedAt: T(11, 2) }],
    });
    expect(new Date(w.from)).toEqual(new Date(T(10, 8).getTime() - 20 * DAY));
    expect(new Date(w.to)).toEqual(new Date(T(11, 2).getTime() + DAY));
  });

  it('a trip on the road runs to now, never past the API’s range cap', () => {
    const now = T(20, 0).getTime();
    const w = deviationWindow({ pickup: { arrivedAt: T(19, 0) }, drop: {} }, now);
    expect(new Date(w.to).getTime()).toBe(now + DAY);
    const old = deviationWindow(
      { pickup: { arrivedAt: T(1, 0) }, drop: {} },
      T(1, 0).getTime() + 400 * DAY,
    );
    expect(new Date(old.to) - new Date(old.from)).toBe(90 * DAY);
  });

  it('nothing to ask for without a pickup time', () => {
    expect(deviationWindow({ pickup: {} })).toBeNull();
  });
});

describe('detourSegments', () => {
  const fix = (h, m, lat) => ({
    eventDateTime: T(10, h, m).toISOString(),
    latitude: lat,
    longitude: 88,
  });
  const track = [fix(9, 0, 1), fix(9, 10, 2), fix(9, 20, 3), fix(9, 30, 4), fix(9, 40, 5)];

  it('cuts each detour from where it left to where it came back', () => {
    const segs = detourSegments(track, [
      {
        _id: 'd1',
        startedAt: T(10, 9, 15),
        endedAt: T(10, 9, 25),
        geometry: { exitPoint: { at: T(10, 9, 10) }, rejoinPoint: { at: T(10, 9, 30) } },
      },
    ]);
    expect(segs).toEqual([
      {
        id: 'd1',
        path: [
          { lat: 2, lng: 88 },
          { lat: 3, lng: 88 },
          { lat: 4, lng: 88 },
        ],
      },
    ]);
  });

  it('falls back to the run’s own window and skips a detour with under two fixes', () => {
    const segs = detourSegments(track, [
      { _id: 'd2', startedAt: T(10, 9, 0), endedAt: T(10, 9, 10) },
      { _id: 'd3', startedAt: T(10, 9, 35), endedAt: T(10, 9, 36) },
    ]);
    expect(segs.map((s) => s.id)).toEqual(['d2']);
  });
});

describe('deviationHref', () => {
  it('opens Route Hub on this deviation', () => {
    expect(deviationHref('abc')).toBe('/route-hub?tab=deviation&d=abc');
  });
});
