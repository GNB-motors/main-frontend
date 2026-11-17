import { describe, expect, it } from 'vitest';
import { journeyPlaces, journeyRoutes } from './vehicleJourneyModel';

describe('vehicle journey', () => {
  it('keeps historical visits separate from nearby landmarks and retains stop times', () => {
    const rows = journeyPlaces({
      stops: [
        {
          startAt: '2026-11-01T00:00:00Z',
          endAt: '2026-11-01T01:00:00Z',
          durationMin: 60,
          place: { name: 'Plant', lat: 22, lng: 88 },
        },
        { startAt: '2026-11-01T02:00:00Z', place: null },
      ],
      landmarks: [
        { id: 'pump', name: 'Pump', lat: 23, lng: 89, distanceFromPathM: 120 },
        { name: 'No position' },
      ],
    });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      title: 'Plant',
      at: '2026-11-01T00:00:00Z',
      endAt: '2026-11-01T01:00:00Z',
      durationMin: 60,
    });
    expect(rows[1].title).toBe('Recorded stop');
    expect(rows[2]).toMatchObject({ title: 'Pump', description: '120 m from the recorded path' });
    expect(rows[2].at).toBeUndefined();
  });
  it('never turns GPS gaps into recorded routes or includes points outside the section', () => {
    const rows = journeyRoutes({
      segments: [
        { kind: 'LADEN', fromT: '2026-11-01T00:00:00Z', toT: '2026-11-01T01:00:00Z', km: 40 },
        { kind: 'GAP', fromT: '2026-11-01T01:00:00Z', toT: '2026-11-01T02:00:00Z' },
      ],
      points: [
        { t: '2026-11-01T00:15:00Z', lat: 22, lng: 88 },
        { t: '2026-11-01T03:00:00Z', lat: 24, lng: 89 },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: 'Loaded running', durationMin: 60, km: 40 });
    expect(rows[0].path).toHaveLength(1);
  });
  it('keeps empty journeys empty', () => {
    expect(journeyPlaces(null)).toEqual([]);
    expect(journeyRoutes(null)).toEqual([]);
  });
});
