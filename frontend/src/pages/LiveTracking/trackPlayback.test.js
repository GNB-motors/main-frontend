import { describe, it, expect } from 'vitest';
import trackFixture from '../../test/fixtures/redesign/track.json';
import {
  MS_PER_TRACK_MINUTE,
  buildTrackCsv,
  buildTripLog,
  indexAtTime,
  nextEventAt,
  playbackPosition,
  previousEventAt,
  timeAtIndex,
  gapMinutes,
} from './trackPlayback';

const points = trackFixture.points;
const events = trackFixture.events;

it('retains API gap durations without an explicit durationMin, including merged logs', () => {
  const gaps = [
    {
      kind: 'GPS_GAP',
      at: '2026-11-01T13:00:00Z',
      endAt: '2026-11-01T14:03:30Z',
      text: 'No GPS for 64 min',
    },
    {
      kind: 'GPS_GAP',
      at: '2026-11-01T14:03:30Z',
      endAt: '2026-11-01T15:06:30Z',
      text: 'No GPS for 63 min',
    },
  ];
  expect(gapMinutes({ ...gaps[0], durationMin: null })).toBe(63.5);
  expect(buildTripLog([], gaps)[0]).toMatchObject({
    durationMin: 126.5,
    gapCount: 2,
    gapEndAt: '2026-11-01T15:06:30.000Z',
  });
  expect(gapMinutes({ durationMin: null, text: 'No GPS for 63 min' })).toBe(63);
  expect(gapMinutes({ durationMin: 0, text: 'No GPS for 63 min' })).toBe(0);
});

describe('indexAtTime', () => {
  it('finds the last point at or before the time', () => {
    expect(indexAtTime(points, '2026-11-01T13:30:00Z')).toBe(1);
  });

  it('is the first point for a time before the path', () => {
    expect(indexAtTime(points, '2026-01-01T00:00:00Z')).toBe(0);
  });

  it('is the last point for a time after the path', () => {
    expect(indexAtTime(points, '2030-01-01T00:00:00Z')).toBe(points.length - 1);
  });

  it('is 0 when there are no points', () => {
    expect(indexAtTime([], '2026-11-01T13:30:00Z')).toBe(0);
  });
});

describe('playbackPosition', () => {
  it('plays one real minute in one second at 1x', () => {
    const position = playbackPosition(points, 1000, 1);
    expect(position.at.getTime()).toBe(new Date(points[0].t).getTime() + 60000);
  });

  it('plays twice as fast at 2x', () => {
    const position = playbackPosition(points, 1000, 2);
    expect(position.at.getTime()).toBe(new Date(points[0].t).getTime() + 120000);
  });

  it('says when the drive is over', () => {
    const position = playbackPosition(points, 1000 * 60 * 60, 8);
    expect(position.finished).toBe(true);
  });

  it('is null when there are no points', () => {
    expect(playbackPosition([], 1000, 1)).toBeNull();
  });

  it('uses one minute of track time per second', () => {
    expect(MS_PER_TRACK_MINUTE).toBe(60);
  });
});

describe('timeAtIndex', () => {
  it('gives the time of a point', () => {
    expect(timeAtIndex(points, 2).toISOString()).toBe(new Date(points[2].t).toISOString());
  });

  it('clamps an index past the end', () => {
    expect(timeAtIndex(points, 99)).toEqual(new Date(points[points.length - 1].t));
  });
});

describe('nextEventAt / previousEventAt', () => {
  it('finds the next event after the playhead, in time order', () => {
    // The fixture's events are not in time order, so the test names the times.
    expect(nextEventAt(events, '2026-11-01T14:02:00Z').toISOString()).toBe(
      '2026-11-01T15:50:00.000Z',
    );
  });

  it('finds the event before the playhead', () => {
    expect(previousEventAt(events, '2026-11-01T16:50:00Z').toISOString()).toBe(
      '2026-11-01T15:50:00.000Z',
    );
  });

  it('is null when there is no event before or after', () => {
    expect(nextEventAt(events, '2026-11-01T20:00:00Z')).toBeNull();
    expect(previousEventAt(events, '2026-11-01T12:00:00Z')).toBeNull();
  });
});

describe('buildTripLog', () => {
  it('lists the stops and the events in the order they happened', () => {
    const log = buildTripLog(trackFixture.stops, trackFixture.events);
    const times = log.map((row) => new Date(row.at).getTime());
    const sorted = [...times].sort((a, b) => a - b);
    expect(times).toEqual(sorted);
  });

  it('includes the stops and the events', () => {
    const log = buildTripLog(trackFixture.stops, trackFixture.events);
    expect(log.filter((row) => row.kind === 'STOP')).toHaveLength(3);
    expect(log.filter((row) => row.kind !== 'STOP')).toHaveLength(4);
  });

  // Nine “no GPS” rows in a row are one thing that happened (the truck went
  // dark), not nine.
  it('merges consecutive no-GPS entries into one row', () => {
    const log = buildTripLog(
      [],
      [
        { kind: 'GPS_GAP', at: '2026-11-01T13:00:00Z', text: 'No GPS for 5 min', durationMin: 5 },
        { kind: 'GPS_GAP', at: '2026-11-01T13:06:00Z', text: 'No GPS for 5 min', durationMin: 5 },
        { kind: 'GPS_GAP', at: '2026-11-01T13:12:00Z', text: 'No GPS for 5 min', durationMin: 5 },
      ],
    );
    expect(log).toHaveLength(1);
    expect(log[0].kind).toBe('GPS_GAP');
    expect(log[0].gapCount).toBe(3);
    expect(log[0].durationMin).toBe(15);
    expect(log[0].title).toContain('3 gaps');
  });

  it('keeps gaps apart when a stop sits between them', () => {
    const log = buildTripLog(
      [
        {
          startAt: '2026-11-01T13:05:00Z',
          place: { name: 'Mohania' },
          durationMin: 10,
          reason: 'REST',
        },
      ],
      [
        { kind: 'GPS_GAP', at: '2026-11-01T13:00:00Z', text: 'No GPS for 4 min', durationMin: 4 },
        { kind: 'GPS_GAP', at: '2026-11-01T13:20:00Z', text: 'No GPS for 6 min', durationMin: 6 },
      ],
    );
    expect(log.map((row) => row.kind)).toEqual(['GPS_GAP', 'STOP', 'GPS_GAP']);
    expect(log.filter((row) => row.kind === 'GPS_GAP').every((row) => row.gapCount === 1)).toBe(
      true,
    );
  });
});

describe('buildTrackCsv', () => {
  it('writes a header row', () => {
    const csv = buildTrackCsv(trackFixture);
    expect(csv.split('\n')[0]).toBe('"time","lat","lng","speed_kmh","kind","label","duration_min"');
  });

  it('writes every point, stop and event', () => {
    const rows = buildTrackCsv(trackFixture).split('\n');
    // 9 points + 3 stops + 4 events + the header
    expect(rows).toHaveLength(17);
  });

  it('quotes a cell that contains a comma', () => {
    const csv = buildTrackCsv({
      points: [],
      stops: [
        {
          startAt: '2026-11-01T13:00:00Z',
          place: { name: 'Mohania, Dhaba', lat: 1, lng: 2 },
          durationMin: 40,
          reason: 'REST',
        },
      ],
      events: [],
    });
    expect(csv).toContain('"Mohania, Dhaba"');
  });
});
