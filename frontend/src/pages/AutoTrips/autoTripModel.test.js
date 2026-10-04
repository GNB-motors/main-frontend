import { describe, it, expect } from 'vitest';
import {
  routeMapPoints,
  isCurrentDrop,
  canMarkPlace,
  stopLabel,
  answerPlaceHref,
} from './autoTripModel';

const pickup = { lat: 22.5, lng: 88.2, name: 'AMBUJA' };
const drop = { lat: 21.9, lng: 87.5, arrivedAt: '2026-09-20T13:00:00Z' };

describe('routeMapPoints', () => {
  it('draws pickup → stops in order and keeps the drop out of the plain dots', () => {
    const pts = routeMapPoints({
      pickup,
      drop,
      routeStops: [
        { _id: 'a', lat: 22.2, lng: 87.9 },
        { _id: 'b', lat: 21.9, lng: 87.5 }, // the drop itself
      ],
    });
    expect(pts.path).toHaveLength(3);
    expect(pts.stops.map((s) => s.id)).toEqual(['a']);
    expect(pts.all).toHaveLength(4); // path + D
  });

  it('labels further drops D2, D3 with stable ids', () => {
    const pts = routeMapPoints({
      pickup,
      drop,
      extraDrops: [{ lat: 21.8, lng: 87.7, arrivedAt: '2026-09-20T15:00:00Z' }],
    });
    expect(pts.extras[0]).toMatchObject({ label: 'D2', id: 'drop-2026-09-20T15:00:00Z' });
  });

  it('copes with a trip that has nothing mapped yet', () => {
    expect(routeMapPoints({}).all).toEqual([]);
  });
});

describe('stop helpers', () => {
  it('isCurrentDrop matches on arrival time', () => {
    expect(isCurrentDrop({ startAt: '2026-09-20T13:00:00.000Z' }, { drop })).toBe(true);
    expect(isCurrentDrop({ startAt: '2026-09-20T12:00:00Z' }, { drop })).toBe(false);
  });

  it('canMarkPlace: unconfirmed or non-drop places yes; drop places and yards no', () => {
    const at = (place) => ({ orgSiteId: 'p1', place });
    expect(canMarkPlace(at({ status: 'PROPOSED', siteType: 'UNKNOWN' }))).toBe(true);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'UNKNOWN' }))).toBe(true);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'UNLOADING' }))).toBe(false);
    expect(canMarkPlace(at({ status: 'CONFIRMED', siteType: 'WAREHOUSE' }))).toBe(false);
    expect(canMarkPlace({ orgSiteId: null })).toBe(false);
  });

  it('stopLabel prefers the place name, then what the truck was doing', () => {
    expect(stopLabel({ place: { name: 'EGRA' } })).toBe('EGRA');
    expect(stopLabel({ place: { status: 'PROPOSED' } })).toBe('Unconfirmed place');
    expect(stopLabel({ purpose: { top: 'FUEL' } })).toBe('fuel');
  });

  it('answerPlaceHref only for a guessed drop at a known place', () => {
    expect(answerPlaceHref({ drop: { orgSiteId: 's1', source: 'INFERRED_TURNAROUND' } })).toBe(
      '/places?place=s1',
    );
    expect(answerPlaceHref({ drop: { orgSiteId: 's1', source: 'LABELLED_PLACE' } })).toBeNull();
    expect(answerPlaceHref({ drop: { source: 'INFERRED_TURNAROUND' } })).toBeNull();
  });
});
