import { describe, it, expect } from 'vitest';
import { encodePolyline6 } from '../../lib/polyline6';
import { toLayers } from '../../lib/roadTrail';
import { overspeedStretches, replayParams, replayWindow } from './overspeedReplay';

const T0 = Date.UTC(2026, 9, 9, 13, 0);
const A = { lat: 22.0, lng: 88.0 };
const B = { lat: 22.009, lng: 88.0 };
const C = { lat: 22.018, lng: 88.0 };
const min = (m) => T0 + m * 60e3;

const road = toLayers({
  mode: 'MATCHED',
  segments: [{ kind: 'MATCHED', t0: min(0), t1: min(10), geom: encodePolyline6([A, B, C]) }],
});
const fixes = [0, 5, 10, 30, 40].map((m, i) => ({ at: new Date(min(m)), ll: [22 + i * 0.01, 88.1] }));
const ev = (s, e, peak = 72) => ({
  startAt: new Date(min(s)).toISOString(),
  endAt: new Date(min(e)).toISOString(),
  maxSpeedKmh: peak,
});

describe('overspeedStretches', () => {
  it('draws each overspeed event along the road the truck drove', () => {
    const [s] = overspeedStretches({ roadLayers: road, fixes }, [ev(5, 10)]);
    expect(s.onRoad).toBe(true);
    expect(s.paths).toHaveLength(1);
    expect(s.paths[0][0][0]).toBeCloseTo(B.lat, 6);
    expect(s.paths[0][s.paths[0].length - 1][0]).toBeCloseTo(C.lat, 6);
    expect(s.event.maxSpeedKmh).toBe(72);
  });

  it('falls back to the GPS fixes of the stretch where there is no road', () => {
    const [s] = overspeedStretches({ roadLayers: road, fixes }, [ev(30, 40)]);
    expect(s.onRoad).toBe(false);
    expect(s.paths).toEqual([[fixes[3].ll, fixes[4].ll]]);
  });

  it('leaves out an event with nothing to draw', () => {
    expect(overspeedStretches({ roadLayers: [], fixes }, [ev(41, 50)])).toEqual([]);
  });
});

describe('replay deep link', () => {
  it('opens the replay around the event, at its start, with the audit limits', () => {
    const p = replayParams({ vehicleId: 'v1', event: ev(5, 10), limitKmh: 65, durMin: 4 });
    expect(p.tab).toBe('replay');
    expect(p.v).toBe('v1');
    expect(p.at).toBe(new Date(min(5)).toISOString());
    expect(new Date(p.from).getTime()).toBe(min(5) - 3600e3);
    expect(new Date(p.to).getTime()).toBe(min(10) + 3600e3);
    expect(p).toMatchObject({ limit: '65', dur: '4' });
  });

  it('reads the window back, or null when the link has none', () => {
    const p = new URLSearchParams(replayParams({ vehicleId: 'v1', event: ev(5, 10), limitKmh: 65, durMin: 4 }));
    const w = replayWindow(p);
    expect(w.from.getTime()).toBe(min(5) - 3600e3);
    expect(w.at.getTime()).toBe(min(5));
    expect(w).toMatchObject({ limitKmh: 65, durMin: 4 });
    expect(replayWindow(new URLSearchParams('tab=replay'))).toBeNull();
  });
});
