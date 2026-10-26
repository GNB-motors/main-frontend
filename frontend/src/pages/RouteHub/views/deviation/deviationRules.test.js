import { describe, it, expect } from 'vitest';
import {
  costBasisLabel,
  dayRange,
  groupByTrip,
  legLabel,
  matchesSearch,
  runWindow,
  tripLabel,
} from './deviationRules';

const at = (h, m = 0) => new Date(2026, 9, 14, h, m).toISOString();

const ev = (id, tripId, startH, overrides = {}) => ({
  _id: id,
  registrationNumber: 'WB25R9540',
  status: 'OPEN',
  startedAt: at(startH),
  endedAt: at(startH, 30),
  extraKmEstimate: 4,
  estimatedExtraCostInr: 200,
  trip: tripId
    ? { autoTripId: tripId, leg: 'LADEN', pickupName: 'Plant A', dropName: 'Durgapur Site' }
    : null,
  ...overrides,
});

describe('tripLabel / legLabel', () => {
  it('names the trip by its places', () => {
    expect(tripLabel({ pickupName: 'Plant A', dropName: 'Durgapur Site' })).toBe(
      'Plant A → Durgapur Site',
    );
    expect(tripLabel({ pickupName: 'Plant A', dropName: 'X', extraDropCount: 2 })).toBe(
      'Plant A → X (+2 drops)',
    );
  });

  it('is honest about a missing drop', () => {
    expect(tripLabel({ pickupName: 'Plant A', tripOpen: true })).toBe(
      'Plant A → still on the road',
    );
    expect(tripLabel({ pickupName: null, dropName: null })).toBe('Unnamed pickup → drop not named');
    expect(tripLabel(null)).toBeNull();
  });

  it('says which part of the trip it was', () => {
    expect(legLabel({ leg: 'LADEN' })).toBe('Loaded');
    expect(legLabel({ leg: 'RETURN' })).toBe('Empty, driving back');
    expect(legLabel(null)).toBe('Outside any trip');
  });
});

describe('groupByTrip', () => {
  it('puts every detour of one trip together, in time order, with totals', () => {
    const rows = [
      ev('e2', 't1', 15),
      ev('e3', null, 9),
      ev('e1', 't1', 11, { status: 'REVIEWED' }),
      ev('e4', 't2', 8),
    ];
    const groups = groupByTrip(rows);
    expect(groups.map((g) => g.key)).toEqual(['t1', 'event:e3', 't2']);
    expect(groups[0].events.map((e) => e._id)).toEqual(['e1', 'e2']);
    expect(groups[0]).toMatchObject({ extraKm: 8, costInr: 400, open: 1 });
    expect(groups[1].autoTripId).toBeNull();
  });
});

describe('matchesSearch', () => {
  const d = ev('e1', 't1', 10, { corridorLabel: 'Plant A → Durgapur Site' });
  it('matches the plate however it is typed, and the trip places', () => {
    expect(matchesSearch(d, 'wb 25 r9540')).toBe(true);
    expect(matchesSearch(d, 'durgapur')).toBe(true);
    expect(matchesSearch(d, 'kolkata')).toBe(false);
    expect(matchesSearch(d, '')).toBe(true);
  });
});

describe('runWindow', () => {
  it('shows when the truck was off the usual route', () => {
    expect(runWindow(ev('e1', 't1', 14, { durationMin: 30 }))).toBe('14:00–14:30 · 30 min');
    expect(runWindow({ startedAt: at(9, 5) })).toBe('09:05');
    expect(runWindow({})).toBeNull();
  });
});

describe('costBasisLabel', () => {
  it('says when the trip’s own cost per km priced it', () => {
    expect(costBasisLabel({ costBasis: 'TRIP', costPerKmInr: 34.6 })).toBe("at this trip's ₹35/km");
    // The feed has no rate on the row: it still says whose rate priced it.
    expect(costBasisLabel({ costBasis: 'TRIP' })).toBe("at this trip's own cost per km");
    expect(costBasisLabel({ costBasis: 'CONFIG', trip: null })).toBe('at the standard rate');
    expect(costBasisLabel({})).toBe('at the standard rate');
  });
});

describe('dayRange', () => {
  it('covers whole local days', () => {
    const { from, to } = dayRange('2026-10-01', '2026-10-02');
    expect(new Date(from)).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    expect(new Date(to)).toEqual(new Date(2026, 9, 2, 23, 59, 59, 999));
    expect(dayRange('', '')).toEqual({ from: undefined, to: undefined });
  });
});
