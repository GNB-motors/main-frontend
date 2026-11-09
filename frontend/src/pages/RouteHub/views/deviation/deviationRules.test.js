import { describe, it, expect } from 'vitest';
import {
  costBasisLabel,
  costKnown,
  extraKnown,
  enrichmentReason,
  dayRange,
  deviationGroupSubtitle,
  deviationGroupTitle,
  groupByTrip,
  groupSummaryText,
  groupTotals,
  legLabel,
  matchesSearch,
  notMeasuredNote,
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
    expect(legLabel(null)).toBe('Unscheduled Run');
  });

  it('creates informative titles and subtitles for unscheduled runs', () => {
    const unlinkedWithExtra = {
      trip: null,
      extraKm: 19,
      events: [{ startedAt: at(16, 23), endedAt: at(16, 38), extraKmEstimate: 19 }],
    };
    expect(deviationGroupTitle(unlinkedWithExtra)).toBe('Unscheduled Transit · +19.0 km');
    expect(deviationGroupSubtitle(unlinkedWithExtra)).toContain('No active ERP trip');

    const withCorridor = {
      trip: null,
      events: [{ corridorLabel: 'NH19 Route Corridor', startedAt: at(10) }],
    };
    expect(deviationGroupTitle(withCorridor)).toBe('NH19 Route Corridor');
    expect(deviationGroupSubtitle(withCorridor)).toContain('Corridor deviation');

    // a road-engine detour (#150): km off the usual road, never a farthest-off figure
    const roadEngine = { trip: null, events: [{ offRouteKm: 6.4, startedAt: at(9) }] };
    expect(deviationGroupTitle(roadEngine)).toBe('Unscheduled Detour · 6.4 km off the usual road');
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

  it('excludes unavailable estimates and road-engine distances from group distance and cost totals', () => {
    const groups = groupByTrip([
      ev('measured', 't1', 8),
      ev('unavailable', 't1', 9, {
        enrichment: { status: 'UNAVAILABLE', message: 'GPS track missing' },
      }),
      ev('off-route', 't1', 10, { source: 'ROAD_ENGINE', offRouteKm: 12 }),
    ]);
    expect(groups[0]).toMatchObject({ extraKm: 4, costInr: 200 });
    expect(extraKnown(groups[0].events[1])).toBe(false);
    expect(costKnown(groups[0].events[2])).toBe(false);
    expect(enrichmentReason(groups[0].events[1])).toBe('GPS track missing');
    expect(enrichmentReason(groups[0].events[2])).toContain(
      'Extra distance and cost are not calculated',
    );
  });
});

describe('group totals: an unmeasured detour is never a zero', () => {
  it('adds up only the detours that were measured', () => {
    const groups = groupByTrip([
      ev('e1', 't1', 9),
      ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
      ev('e3', 't1', 13),
    ]);
    const g = groups[0];
    expect(g.extraKm).toBe(8);
    expect(g.costInr).toBe(400);
    expect(g.totals.extraUnknown).toBe(1);
    expect(g.totals.costUnknown).toBe(1);
  });

  it('has no distance and no cost when nothing in the group was measured', () => {
    const groups = groupByTrip([
      ev('e1', 't1', 9, { extraKmEstimate: null, estimatedExtraCostInr: null }),
      ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
    ]);
    const g = groups[0];
    expect(g.extraKm).toBeNull();
    expect(g.costInr).toBeNull();
    expect(g.totals.extraUnknown).toBe(2);
    expect(g.totals.costUnknown).toBe(2);
  });

  it('treats a field the old backend never sent as not measured', () => {
    const rows = [
      { _id: 'e1', registrationNumber: 'WB25R9540', startedAt: at(9), trip: { autoTripId: 't1' } },
    ];
    const g = groupByTrip(rows)[0];
    expect(g.extraKm).toBeNull();
    expect(g.costInr).toBeNull();
    expect(g.totals.extraUnknown).toBe(1);
    expect(g.totals.costUnknown).toBe(1);
  });

  it('keeps a measured zero a zero', () => {
    const groups = groupByTrip([
      ev('e1', 't1', 9, { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 }),
    ]);
    const g = groups[0];
    expect(g.extraKm).toBe(0);
    expect(g.costInr).toBe(0);
  });

  it('leaves out a detour with no usual road to compare against', () => {
    const groups = groupByTrip([
      ev('e1', 't1', 9, { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 5 }),
    ]);
    const g = groups[0];
    expect(g.extraKm).toBeNull();
    expect(g.costInr).toBeNull();
    expect(g.totals.extraUnknown).toBe(1);
  });
});

describe('notMeasuredNote', () => {
  it('says how many of how many detours were not measured', () => {
    expect(notMeasuredNote(2, 5)).toBe('2 of 5 detours not measured');
    expect(notMeasuredNote(1, 3)).toBe('1 of 3 detours not measured');
  });

  it('says nothing when every detour was measured', () => {
    expect(notMeasuredNote(0, 5)).toBeNull();
    expect(notMeasuredNote(2, 0)).toBeNull();
  });

  it('says one detour in the singular', () => {
    expect(notMeasuredNote(1, 1)).toBe('1 of 1 detour not measured');
  });
});

describe('groupSummaryText', () => {
  it('shows the known sum and how many detours were not measured', () => {
    const g = {
      events: [
        ev('e1', 't1', 9),
        ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
        ev('e3', 't1', 13),
        ev('e4', 't1', 15, { extraKmEstimate: null, estimatedExtraCostInr: null }),
        ev('e5', 't1', 17),
      ],
    };
    const text = groupSummaryText(g);
    expect(text).toContain('5 detours');
    expect(text).toContain('+12.0 km');
    expect(text).toContain('2 of 5 detours not measured');
    expect(text).toContain('₹600');
  });

  it('shows a dash, never 0 km or ₹0, when nothing in the group was measured', () => {
    const g = {
      events: [
        ev('e1', 't1', 9, { extraKmEstimate: null, estimatedExtraCostInr: null }),
        ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
      ],
    };
    const text = groupSummaryText(g);
    expect(text).toContain('—');
    expect(text).toContain('2 of 2 detours not measured');
    expect(text).not.toContain('₹0');
    expect(text).not.toContain('0 km');
  });

  it('keeps a measured zero a zero', () => {
    const g = {
      events: [ev('e1', 't1', 9, { extraKmEstimate: 0, estimatedExtraCostInr: 0, maxOffKm: 0.4 })],
    };
    const text = groupSummaryText(g);
    expect(text).toContain('+0.0 km');
    expect(text).toContain('₹0');
  });

  it('says one detour in the singular', () => {
    const g = {
      events: [ev('e1', 't1', 9, { extraKmEstimate: null, estimatedExtraCostInr: null })],
    };
    const text = groupSummaryText(g);
    expect(text).toContain('1 detour ·');
    expect(text).toContain('1 of 1 detour not measured');
    expect(text).not.toContain('1 detours');
  });
});

describe('groupTotals', () => {
  it('counts what it left out', () => {
    const totals = groupTotals([
      ev('e1', 't1', 9),
      ev('e2', 't1', 11, { extraKmEstimate: null, estimatedExtraCostInr: null }),
    ]);
    expect(totals).toMatchObject({
      extraKm: 4,
      costInr: 200,
      extraKnown: 1,
      extraUnknown: 1,
      costKnown: 1,
      costUnknown: 1,
      total: 2,
    });
  });

  it('is empty for an empty group', () => {
    expect(groupTotals([])).toMatchObject({
      extraKm: null,
      costInr: null,
      extraUnknown: 0,
      costUnknown: 0,
      total: 0,
    });
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
