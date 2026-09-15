import { describe, it, expect } from 'vitest';
import { trailWindowForTrip } from './tripReportTrailWindow';

const T0 = '2026-09-01T06:00:00.000Z';
const T1 = '2026-09-03T18:00:00.000Z';

describe('trailWindowForTrip', () => {
  it('returns null for non-object or dateless trips', () => {
    expect(trailWindowForTrip(null)).toBeNull();
    expect(trailWindowForTrip(undefined)).toBeNull();
    expect(trailWindowForTrip('x')).toBeNull();
    expect(trailWindowForTrip({})).toBeNull();
    expect(trailWindowForTrip({ dispatchedAt: 'not-a-date' })).toBeNull();
  });

  it('pads dispatch and close by two hours each side', () => {
    const w = trailWindowForTrip({ dispatchedAt: T0, tripClosedAt: T1 });
    expect(w.fromIso).toBe('2026-09-01T04:00:00.000Z');
    expect(w.toIso).toBe('2026-09-03T20:00:00.000Z');
  });

  it('swaps inverted bounds instead of producing a negative window', () => {
    const w = trailWindowForTrip({ dispatchedAt: T1, tripClosedAt: T0 });
    expect(w.fromIso).toBe('2026-09-01T04:00:00.000Z');
    expect(w.toIso).toBe('2026-09-03T20:00:00.000Z');
  });

  it('honours candidate priority (dispatchedAt beats createdAt and startDate)', () => {
    const w = trailWindowForTrip({
      createdAt: '2026-08-01T00:00:00.000Z',
      dispatchedAt: T0,
      startDate: '2026-08-02T00:00:00.000Z',
      deliveredAt: T1,
    });
    expect(w.fromIso).toBe('2026-09-01T04:00:00.000Z');
    expect(w.toIso).toBe('2026-09-03T20:00:00.000Z');
  });

  it('uses ±12h around a single datable bound', () => {
    const onlyFrom = trailWindowForTrip({ dispatchedAt: T0 });
    expect(onlyFrom.fromIso).toBe('2026-08-31T18:00:00.000Z');
    expect(onlyFrom.toIso).toBe('2026-09-01T18:00:00.000Z');

    const onlyTo = trailWindowForTrip({ deliveredAt: T1 });
    expect(onlyTo.fromIso).toBe('2026-09-03T06:00:00.000Z');
    expect(onlyTo.toIso).toBe('2026-09-04T06:00:00.000Z');
  });

  it('skips invalid candidate values and falls through the list', () => {
    const w = trailWindowForTrip({ dispatchedAt: '', startDate: T0 });
    expect(w.fromIso).toBe('2026-08-31T18:00:00.000Z');
  });
});
