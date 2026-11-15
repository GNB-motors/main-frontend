import { describe, expect, it } from 'vitest';
import { needsReviewLabel, parseTripKey, supersededTripsHref } from './tripLineage';

describe('trip lineage', () => {
  it('has no lineage to show on an old trip', () => {
    expect(needsReviewLabel({ status: 'COMPLETE' })).toBeNull();
    expect(supersededTripsHref({ status: 'COMPLETE' })).toBeNull();
  });

  it('reads the time out of both real key formats', () => {
    expect(parseTripKey('v2|WB11F4262|2026-11-08T04:00:00.000Z')).toEqual({
      time: '2026-11-08T04:00:00.000Z',
    });
    expect(parseTripKey('WB11F4262|2026-11-08T04:00:00.000Z')).toEqual({
      time: '2026-11-08T04:00:00.000Z',
    });
    expect(parseTripKey('nonsense')).toBeNull();
    expect(parseTripKey(null)).toBeNull();
  });

  it('links to the truck’s trips around the time of the newer trip', () => {
    const href = supersededTripsHref({
      status: 'SUPERSEDED',
      vehicleId: 'veh-1',
      supersededBy: 'v2|WB11F4262|2026-11-08T04:00:00.000Z',
    });
    expect(href).toContain('vehicleId=veh-1');
    expect(href).toContain('range=custom');
    expect(href).toContain('from=2026-11-07');
    expect(href).toContain('to=2026-11-09');
    // The key is not an id, so it never goes into the url.
    expect(href).not.toContain('%7C');
  });

  it('takes the truck from the trip, as an id object too', () => {
    const href = supersededTripsHref({
      status: 'SUPERSEDED',
      vehicleId: { _id: 'veh-2' },
      pickup: { at: '2026-11-04T04:00:00.000Z' },
      supersededBy: null,
    });
    expect(href).toContain('vehicleId=veh-2');
    expect(href).toContain('from=2026-11-03');
    expect(href).toContain('to=2026-11-05');
  });

  it('still links when the server could not point at a newer trip', () => {
    const href = supersededTripsHref({
      status: 'SUPERSEDED',
      vehicleId: 'veh-3',
      pickup: { at: '2026-11-04T04:00:00.000Z' },
      supersededBy: null,
    });
    expect(href).toContain('vehicleId=veh-3');
    expect(href).toContain('from=2026-11-03');
  });

  it('looks around the pickup time when the trip has no key', () => {
    const href = supersededTripsHref({
      status: 'SUPERSEDED',
      vehicleId: 'veh-5',
      pickup: { arrivedAt: '2026-11-04T04:00:00.000Z' },
      supersededBy: null,
    });
    expect(href).toContain('vehicleId=veh-5');
    expect(href).toContain('from=2026-11-03');
  });

  it('has no link without a truck or without a time', () => {
    expect(
      supersededTripsHref({ status: 'SUPERSEDED', pickup: { at: '2026-11-04T04:00:00.000Z' } }),
    ).toBeNull();
    expect(supersededTripsHref({ status: 'SUPERSEDED', vehicleId: 'veh-4' })).toBeNull();
  });

  it('names the lineage reason', () => {
    expect(needsReviewLabel({ needsReview: 'LINEAGE_SPLIT' })).toBe('Split from another trip');
    expect(needsReviewLabel({ needsReview: 'LINEAGE_MERGE' })).toBe('Merged with another trip');
    expect(needsReviewLabel({ needsReview: 'LINEAGE_ORPHAN' })).toBe('Left without a trip chain');
    expect(needsReviewLabel({ needsReview: 'SOMETHING_NEW' })).toBe('SOMETHING_NEW');
  });
});
