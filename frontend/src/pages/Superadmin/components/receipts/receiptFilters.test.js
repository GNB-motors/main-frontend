import { describe, it, expect } from 'vitest';
import {
  refuelTimeOf,
  filterByDatePreset,
  datePresetRange,
  filterDraftsLocally,
} from './receiptFilters';

describe('refuelTimeOf', () => {
  it('uses the time the photo gave', () => {
    expect(refuelTimeOf({ time: { value: '2026-11-10T04:00:00.000Z' } })).toBe(
      '2026-11-10T04:00:00.000Z'
    );
  });

  it('falls back to the time on the bill', () => {
    expect(refuelTimeOf({ billDatetime: '2026-11-09T04:00:00.000Z' })).toBe(
      '2026-11-09T04:00:00.000Z'
    );
  });

  it('never uses the time the message arrived', () => {
    expect(refuelTimeOf({ createdAt: '2026-11-12T04:00:00.000Z' })).toBeNull();
  });
});

describe('filterByDatePreset', () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0).toISOString();
  const longAgo = new Date(now.getTime() - 40 * 86400000).toISOString();

  it('keeps everything when no preset is chosen', () => {
    const items = [{ createdAt: longAgo }];
    expect(filterByDatePreset(items, 'ALL')).toHaveLength(1);
    expect(filterByDatePreset(items, null)).toHaveLength(1);
  });

  it('keeps only the drafts filled today', () => {
    const items = [{ time: { value: today } }, { time: { value: longAgo } }];
    expect(filterByDatePreset(items, 'TODAY')).toHaveLength(1);
  });

  it('drops a draft whose only date is when the message arrived', () => {
    expect(filterByDatePreset([{ createdAt: today }], 'TODAY')).toHaveLength(0);
  });

  it('keeps a draft placed by the time on its bill', () => {
    expect(filterByDatePreset([{ billDatetime: today }], 'TODAY')).toHaveLength(1);
  });
});

describe('datePresetRange', () => {
  it('leaves the range open for every date', () => {
    expect(datePresetRange('ALL')).toEqual({});
  });

  it('gives a from and a to for yesterday', () => {
    const range = datePresetRange('YESTERDAY', new Date('2026-11-12T10:00:00.000Z'));
    expect(range.from).toBeTruthy();
    expect(range.to).toBeTruthy();
    expect(new Date(range.to).getTime()).toBeGreaterThan(new Date(range.from).getTime());
  });
});

describe('filterDraftsLocally', () => {
  const early = { id: 1, time: { value: '2026-01-01T04:00:00.000Z' }, stationName: 'Old Pump' };
  const late = { id: 2, time: { value: '2026-06-01T04:00:00.000Z' }, stationName: 'New Pump' };

  it('sorts by the fill time', () => {
    const sorted = filterDraftsLocally([early, late], { sortDirection: 'desc' });
    expect(sorted.map((d) => d.id)).toEqual([2, 1]);
    const asc = filterDraftsLocally([late, early], { sortDirection: 'asc' });
    expect(asc.map((d) => d.id)).toEqual([1, 2]);
  });

  it('finds a draft by the station on the bill', () => {
    const found = filterDraftsLocally([early, late], { query: 'new pump' });
    expect(found.map((d) => d.id)).toEqual([2]);
  });

  it('keeps the drafts whose odometer is missing', () => {
    const withOdo = { id: 3, odometerReading: 1000 };
    const withoutOdo = { id: 4 };
    const found = filterDraftsLocally([withOdo, withoutOdo], { odoFilter: 'MISSING' });
    expect(found.map((d) => d.id)).toEqual([4]);
  });
});
