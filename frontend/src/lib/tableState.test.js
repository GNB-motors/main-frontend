import { describe, it, expect } from 'vitest';
import {
  nextSort,
  activeFilterCount,
  footerSummary,
  readDensity,
  writeDensity,
  visibleColumns,
  DENSITY_KEY,
} from './tableState';

describe('nextSort', () => {
  it('cycles asc → desc → none → asc', () => {
    expect(nextSort(null)).toBe('asc');
    expect(nextSort('asc')).toBe('desc');
    expect(nextSort('desc')).toBeNull();
  });

  it('treats unknown values as none', () => {
    expect(nextSort('sideways')).toBe('asc');
  });
});

describe('activeFilterCount', () => {
  const defaults = { page: 1, limit: 25, q: '', state: [] };

  it('counts nothing on a pristine list', () => {
    expect(activeFilterCount(defaults, defaults)).toBe(0);
  });

  it('ignores pagination', () => {
    expect(activeFilterCount({ ...defaults, page: 4 }, defaults)).toBe(0);
  });

  it('ignores whitespace-only search', () => {
    expect(activeFilterCount({ ...defaults, q: '   ' }, defaults)).toBe(0);
  });

  it('counts a real search and a multi-select as one filter each', () => {
    expect(activeFilterCount({ ...defaults, q: 'WB25', state: ['ACTIVE', 'PARKED'] }, defaults)).toBe(2);
  });

  it('does not count a multi-select equal to its default', () => {
    expect(activeFilterCount({ ...defaults, state: [] }, defaults)).toBe(0);
  });

  it('counts params with no default entry', () => {
    expect(activeFilterCount({ from: '2026-09-01' }, defaults)).toBe(1);
  });

  it('handles null/undefined params', () => {
    expect(activeFilterCount(null, defaults)).toBe(0);
    expect(activeFilterCount(undefined, defaults)).toBe(0);
  });

  it('ignores null/empty values', () => {
    expect(activeFilterCount({ to: null, zone: '', tags: [] }, defaults)).toBe(0);
  });
});

describe('footerSummary', () => {
  it('names the total', () => {
    expect(footerSummary({ showing: 24, total: 151 })).toBe('Showing 24 of 151');
  });

  it('names active filters with correct plural', () => {
    expect(footerSummary({ showing: 5, total: 151, activeFilters: 1 })).toBe('Showing 5 of 151 · 1 filter active');
    expect(footerSummary({ showing: 5, total: 151, activeFilters: 2 })).toBe('Showing 5 of 151 · 2 filters active');
  });

  it('omits the filter clause when zero', () => {
    expect(footerSummary({ showing: 0, total: 0, activeFilters: 0 })).toBe('Showing 0 of 0');
  });

  it('handles missing args', () => {
    expect(footerSummary()).toBe('Showing 0 of 0');
  });
});

describe('density persistence', () => {
  it('round-trips a valid density', () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    expect(writeDensity(storage, 'compact')).toBe(true);
    expect(readDensity(storage)).toBe('compact');
  });

  it('defaults to comfortable on absent or corrupt storage', () => {
    expect(readDensity(null)).toBe('comfortable');
    expect(readDensity({ getItem: () => 'gigantic' })).toBe('comfortable');
  });

  it('never throws when storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(readDensity(blocked)).toBe('comfortable');
    expect(writeDensity(blocked, 'compact')).toBe(false);
  });

  it('rejects unknown densities', () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    expect(writeDensity(storage, 'huge')).toBe(false);
    expect(store.has(DENSITY_KEY)).toBe(false);
  });
});

describe('visibleColumns', () => {
  const cols = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];

  it('returns all columns when nothing is hidden', () => {
    expect(visibleColumns(cols, null)).toEqual(cols);
    expect(visibleColumns(cols, new Set())).toEqual(cols);
  });

  it('filters hidden keys preserving order', () => {
    expect(visibleColumns(cols, new Set(['b']))).toEqual([{ key: 'a' }, { key: 'c' }]);
  });

  it('handles empty columns', () => {
    expect(visibleColumns([], new Set(['a']))).toEqual([]);
  });
});
