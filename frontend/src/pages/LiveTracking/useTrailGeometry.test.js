import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useTrailGeometry from './useTrailGeometry.js';

const start = Date.parse('2026-11-02T10:00:00Z');
const points = [
  { latitude: 22, longitude: 88, eventDateTime: new Date(start).toISOString() },
  { latitude: 22, longitude: 88.01, eventDateTime: new Date(start + 60000).toISOString() },
  { latitude: 22, longitude: 88.02, eventDateTime: new Date(start + 3600000).toISOString() },
];
function geometry(raw = points, roadTrail = null, t = 0.5) {
  const pts = raw.map((p) => [p.latitude, p.longitude]);
  return renderHook(() =>
    useTrailGeometry({
      selectedVehicle: null,
      trailPoints: pts,
      rawTrailPoints: raw,
      roadTrail,
      replayState: { on: true, pts, t },
    }),
  ).result.current;
}

describe('Track replay geometry', () => {
  it('interpolates by recorded time instead of point index', () => {
    const frame = geometry();
    expect(frame.replayCurrentPos.lng).toBeCloseTo(88.0149152542, 8);
    expect(frame.replayCurrentTs).toBe('2026-11-02T10:30:00.000Z');
  });
  it('uses the matched road for both the marker and travelled geometry', () => {
    const road = {
      mode: 'MATCHED',
      distance: { roadM: 3000 },
      segments: [
        {
          kind: 'MATCHED',
          t0: start,
          t1: start + 3600000,
          points: [
            { lat: 22, lng: 88 },
            { lat: 22.01, lng: 88.01 },
            { lat: 22, lng: 88.02 },
          ],
        },
      ],
    };
    const frame = geometry(points, road);
    expect(frame.replayCurrentPos.lat).toBeCloseTo(22.01);
    expect(frame.replayRoadLayers.at(-1).path.at(-1)).toEqual(frame.replayCurrentPos);
    expect(frame.trailKm).toBe(3);
  });
  it('moves continuously like Route Hub while keeping trail gap metadata', () => {
    const raw = points.map((p, i) => ({ ...p, gap: i === 2, gapType: i === 2 ? 'moving' : null }));
    const frame = geometry(raw);
    expect(frame.replayCurrentPos.lng).toBeCloseTo(88.0149152542, 8);
    expect(frame.replayRunPaths).toHaveLength(1);
    expect(frame.replayRunPaths[0].path.at(-1)).toEqual(frame.replayCurrentPos);
    expect(frame.trailSegments).toHaveLength(2);
    expect(geometry(raw, null, 1).replayCurrentPos.lng).toBe(88.02);
  });
  it('sorts fixes and ignores invalid coordinates and timestamps', () => {
    const raw = [
      points[2],
      { ...points[0], latitude: 999 },
      points[0],
      { ...points[1], eventDateTime: 'invalid' },
      points[1],
    ];
    expect(geometry(raw).replayCurrentPos.lng).toBeCloseTo(88.0149152542, 8);
  });
});
