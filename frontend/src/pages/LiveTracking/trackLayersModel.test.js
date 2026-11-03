import { describe, it, expect } from 'vitest';
import trackFixture from '../../test/fixtures/redesign/track.json';
import {
  EVENT_MARKERS,
  STOP_MARKERS,
  bearingBetween,
  buildTrackLayers,
  detourMarkers,
  gapCaption,
  landmarkMarkers,
  otherEventMarkers,
  overspeedMarkers,
  pathBounds,
  pathSegments,
  playheadAt,
  stopMarkers,
} from './trackLayersModel';

const track = trackFixture;

describe('pathSegments', () => {
  it('draws a laden run solid and 5 wide', () => {
    const segments = pathSegments(track);
    const laden = segments.find((s) => s.kind === 'LADEN');
    expect(laden.color).toBe('var(--rd-leg-loaded)');
    expect(laden.width).toBe(5);
    expect(laden.dash).toBeNull();
  });

  it('draws an empty run dashed 6/6 and 4 wide', () => {
    const segments = pathSegments(track);
    const empty = segments.find((s) => s.kind === 'EMPTY');
    expect(empty.color).toBe('var(--rd-leg-empty)');
    expect(empty.width).toBe(4);
    expect(empty.dash).toEqual([6, 6]);
  });

  it('draws a gap thin, dashed and half transparent, with a caption', () => {
    const segments = pathSegments(track);
    const gap = segments.find((s) => s.kind === 'GAP');
    expect(gap.width).toBe(2);
    expect(gap.dash).toEqual([2, 8]);
    expect(gap.opacity).toBe(0.5);
    expect(gap.caption).toMatch(/No signal/);
  });

  it('never draws an overspeed as a path', () => {
    const segments = pathSegments(track);
    expect(segments.some((s) => s.kind === 'OVERSPEED')).toBe(false);
  });
});

describe('gapCaption', () => {
  it('writes hours and minutes', () => {
    expect(
      gapCaption({ fromT: '2026-11-01T18:00:00Z', toT: '2026-11-01T19:10:00Z' }),
    ).toBe('No signal 1 h 10 min');
  });

  it('writes whole hours', () => {
    expect(
      gapCaption({ fromT: '2026-11-01T18:00:00Z', toT: '2026-11-01T19:00:00Z' }),
    ).toBe('No signal 1 h');
  });
});

describe('overspeedMarkers', () => {
  it('is a marker, never a line', () => {
    const markers = overspeedMarkers(track);
    expect(markers).toHaveLength(1);
    expect(markers[0].shape).toBe('circle');
    expect(markers[0].path).toBeUndefined();
  });

  it('is orange, not red', () => {
    const markers = overspeedMarkers(track);
    expect(markers[0].color).toBe('var(--rd-overspeed)');
    expect(markers[0].color).not.toBe('var(--rd-detour)');
    expect(markers[0].color).not.toContain('red');
  });

  it('carries the text the owner reads on hover', () => {
    expect(overspeedMarkers(track)[0].title).toMatch(/Over 60 km\/h/);
  });
});

describe('detourMarkers', () => {
  it('is a red diamond in normal Track mode', () => {
    const markers = detourMarkers(track);
    expect(markers[0].shape).toBe('diamond');
    expect(markers[0].color).toBe('var(--rd-detour)');
  });

  it('is a marker, never a line', () => {
    expect(detourMarkers(track)[0].path).toBeUndefined();
  });
});

describe('otherEventMarkers', () => {
  it('carries the fill, drop and gap events', () => {
    const markers = otherEventMarkers(track);
    expect(markers.map((m) => m.kind).sort()).toEqual(['FUEL_DROP', 'GPS_GAP']);
  });
});

describe('stopMarkers', () => {
  it('gives every stop the icon and colour of its reason', () => {
    const markers = stopMarkers(track);
    expect(markers).toHaveLength(3);
    expect(markers[0].icon).toBe(STOP_MARKERS.LOADING.icon);
    expect(markers[0].color).toBe(STOP_MARKERS.LOADING.color);
    expect(markers[1].icon).toBe(STOP_MARKERS.REST.icon);
    expect(markers[2].icon).toBe(STOP_MARKERS.UNEXPLAINED.icon);
  });

  it('keeps the reason and why the stop was worked out', () => {
    const markers = stopMarkers(track);
    expect(markers[1].reason).toBe('REST');
    expect(markers[1].reasonWhy).toMatch(/dhaba/);
  });
});

describe('landmarkMarkers', () => {
  it('shows the name only at zoom 13', () => {
    expect(landmarkMarkers(track, 12)[0].label).toBeNull();
    expect(landmarkMarkers(track, 13)[0].label).toBe('Mohania Dhaba');
  });

  it('is a small grey pin', () => {
    const marker = landmarkMarkers(track, 13)[0];
    expect(marker.size).toBe(12);
    expect(marker.color).toBe('var(--rd-ink-3)');
  });
});

describe('buildTrackLayers', () => {
  it('never produces an overspeed polyline', () => {
    const layers = buildTrackLayers(track, { zoom: 13 });
    const overspeedPaths = layers.segments.filter((s) => s.kind === 'OVERSPEED');
    expect(overspeedPaths).toHaveLength(0);
    expect(layers.overspeed.every((m) => m.shape === 'circle')).toBe(true);
  });

  it('produces every layer the map needs', () => {
    const layers = buildTrackLayers(track, { zoom: 13 });
    expect(Object.keys(layers).sort()).toEqual([
      'detours',
      'events',
      'landmarks',
      'overspeed',
      'segments',
      'stops',
    ]);
  });
});

describe('playheadAt', () => {
  it('finds the point at a moment in time', () => {
    const head = playheadAt(track.points, '2026-11-01T13:30:00Z');
    expect(head.lat).toBeCloseTo(25.5001);
    expect(head.lng).toBeCloseTo(83.9612);
  });

  it('gives a heading from the neighbouring points', () => {
    const head = playheadAt(track.points, '2026-11-01T13:30:00Z');
    expect(typeof head.headingDeg).toBe('number');
    expect(head.headingDeg).toBeGreaterThanOrEqual(0);
    expect(head.headingDeg).toBeLessThan(360);
  });

  it('is null when there are no points', () => {
    expect(playheadAt([], '2026-11-01T13:30:00Z')).toBeNull();
  });
});

describe('bearingBetween', () => {
  it('reads due north', () => {
    expect(
      bearingBetween({ lat: 25, lng: 84 }, { lat: 26, lng: 84 }),
    ).toBeCloseTo(0, 1);
  });
});

describe('pathBounds', () => {
  it('covers every point', () => {
    const bounds = pathBounds(track.points);
    expect(bounds.minLat).toBeCloseTo(22.6116);
    expect(bounds.maxLat).toBeCloseTo(25.5647);
  });

  it('is null when there is no path', () => {
    expect(pathBounds([])).toBeNull();
  });
});

describe('EVENT_MARKERS', () => {
  it('keeps overspeed orange', () => {
    expect(EVENT_MARKERS.OVERSPEED.color).toBe('var(--rd-overspeed)');
  });
});
