import { describe, it, expect } from 'vitest';
import {
  EMPTY_SUMMARY,
  buildLedgerParams,
  parseLedgerResponse,
  parseLedgerSummary,
  getLedgerSplitItems,
  resolveLedgerSplitLabel,
  ledgerTxKey,
  countActiveLedgerFilters,
} from './ledgerDetailLogic';

describe('buildLedgerParams', () => {
  const base = {
    page: 2,
    dateRange: { startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-01-31T23:59:59.999Z' },
    category: '',
    source: '',
    crossFilterId: '',
    isDriver: true,
  };

  it('always carries page, limit and the date range', () => {
    expect(buildLedgerParams(base)).toEqual({
      page: 2,
      limit: 20,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-01-31T23:59:59.999Z',
    });
  });

  it('adds category and source only when set', () => {
    const params = buildLedgerParams({ ...base, category: 'FUEL', source: 'TRIP' });
    expect(params.category).toBe('FUEL');
    expect(params.source).toBe('TRIP');
    expect(buildLedgerParams(base)).not.toHaveProperty('category');
    expect(buildLedgerParams(base)).not.toHaveProperty('source');
  });

  it('maps the cross filter to vehicleId for a driver ledger and driverId for a truck ledger', () => {
    expect(buildLedgerParams({ ...base, crossFilterId: 'v1' }).vehicleId).toBe('v1');
    expect(buildLedgerParams({ ...base, crossFilterId: 'v1' })).not.toHaveProperty('driverId');
    expect(buildLedgerParams({ ...base, isDriver: false, crossFilterId: 'd1' }).driverId).toBe(
      'd1',
    );
    expect(buildLedgerParams({ ...base, isDriver: false, crossFilterId: 'd1' })).not.toHaveProperty(
      'vehicleId',
    );
  });
});

describe('parseLedgerResponse', () => {
  it('normalises a paged results envelope', () => {
    expect(
      parseLedgerResponse({
        results: [{ _id: 't1' }],
        page: 2,
        totalPages: 5,
        totalResults: 97,
      }),
    ).toEqual({
      transactions: [{ _id: 't1' }],
      meta: { page: 2, totalPages: 5, totalResults: 97 },
    });
  });

  it('falls back to items/total field names', () => {
    expect(parseLedgerResponse({ items: [{ _id: 't2' }], total: 1 })).toEqual({
      transactions: [{ _id: 't2' }],
      meta: { page: 1, totalPages: 1, totalResults: 1 },
    });
  });

  it('accepts a bare array payload', () => {
    expect(parseLedgerResponse([{ _id: 't3' }])).toEqual({
      transactions: [{ _id: 't3' }],
      meta: { page: 1, totalPages: 1, totalResults: 1 },
    });
  });

  it('returns empty state for null/undefined', () => {
    expect(parseLedgerResponse(null)).toEqual({
      transactions: [],
      meta: { page: 1, totalPages: 1, totalResults: 0 },
    });
  });
});

describe('parseLedgerSummary', () => {
  it('returns the empty shape when there is no summary', () => {
    expect(parseLedgerSummary(null)).toEqual(EMPTY_SUMMARY);
    expect(parseLedgerSummary(undefined)).toEqual(EMPTY_SUMMARY);
  });

  it('merges the payload over the empty shape', () => {
    expect(parseLedgerSummary({ totalAmount: 10, byCategory: { FUEL: 10 } })).toEqual({
      ...EMPTY_SUMMARY,
      totalAmount: 10,
      byCategory: { FUEL: 10 },
    });
  });
});

describe('getLedgerSplitItems', () => {
  it('prefers the explicit split list', () => {
    expect(getLedgerSplitItems({ split: [{ name: 'A', amount: 5 }] }, true)).toEqual([
      { name: 'A', amount: 5 },
    ]);
  });

  it('falls back to byVehicle for drivers and byDriver for trucks', () => {
    expect(getLedgerSplitItems({ byVehicle: { 'KA-01': 3 } }, true)).toEqual([
      { name: 'KA-01', amount: 3 },
    ]);
    expect(getLedgerSplitItems({ byDriver: { Ravi: 4 } }, false)).toEqual([
      { name: 'Ravi', amount: 4 },
    ]);
  });

  it('sorts map-shaped splits descending by amount', () => {
    expect(getLedgerSplitItems({ split: { A: 1, B: 9, C: 5 } }, true)).toEqual([
      { name: 'B', amount: 9 },
      { name: 'C', amount: 5 },
      { name: 'A', amount: 1 },
    ]);
  });

  it('returns an empty array when nothing is present', () => {
    expect(getLedgerSplitItems({}, true)).toEqual([]);
    expect(getLedgerSplitItems(null, false)).toEqual([]);
  });
});

describe('resolveLedgerSplitLabel', () => {
  const vehicles = [{ _id: 'v1', registrationNumber: 'KA-01-1234' }];
  const drivers = [{ _id: 'd1', firstName: 'Ravi', lastName: 'Kumar' }];

  it('looks the id up in the option list for the current ledger side', () => {
    expect(
      resolveLedgerSplitLabel({ isDriver: true, item: { vehicleId: 'v1' }, vehicles, drivers }),
    ).toBe('KA-01-1234');
    expect(
      resolveLedgerSplitLabel({ isDriver: false, item: { driverId: 'd1' }, vehicles, drivers }),
    ).toBe('Ravi Kumar');
  });

  it('falls back to the split name, then the fallback label', () => {
    expect(
      resolveLedgerSplitLabel({
        isDriver: true,
        item: { name: 'KA-09-9999' },
        vehicles,
        drivers,
        fallback: 'Unknown',
      }),
    ).toBe('KA-09-9999');
    expect(resolveLedgerSplitLabel({ isDriver: true, item: {}, vehicles, drivers })).toBe('-');
  });
});

describe('ledgerTxKey', () => {
  it('combines source and _id', () => {
    expect(ledgerTxKey({ source: 'TRIP', _id: 'abc' })).toBe('TRIP-abc');
  });
});

describe('countActiveLedgerFilters', () => {
  it('counts only set filters', () => {
    expect(countActiveLedgerFilters({ category: '', source: '', crossFilterId: '' })).toBe(0);
    expect(countActiveLedgerFilters({ category: 'FUEL', source: 'TRIP', crossFilterId: '' })).toBe(
      2,
    );
    expect(
      countActiveLedgerFilters({ category: 'FUEL', source: 'TRIP', crossFilterId: 'v1' }),
    ).toBe(3);
  });
});
