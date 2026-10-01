import { describe, it, expect } from 'vitest';
import { cycleNote, excludedCycleHint, exportFilterMeta } from './fleetReportUtils';

describe('cycleNote', () => {
  it('says what a km/L figure is based on', () => {
    expect(cycleNote(1, 0)).toBe('1 cycle');
    expect(cycleNote(3, 1)).toBe('3 cycles · 1 excluded');
    expect(cycleNote(0, 2)).toBe('0 cycles · 2 excluded');
    expect(cycleNote(0, 0)).toBe('No completed cycle');
  });
});

describe('excludedCycleHint', () => {
  it('names the band when the API sends it', () => {
    expect(excludedCycleHint({ min: 0.8, max: 8 })).toContain('(0.8–8 km/L)');
    expect(excludedCycleHint(null)).not.toContain('(');
  });
});

describe('exportFilterMeta', () => {
  it('lists only the filters in use', () => {
    expect(exportFilterMeta({})).toEqual([]);
    expect(exportFilterMeta({ from: '2026-09-01', entityLabel: 'WB11G0662' })).toEqual([
      { label: 'Period', value: '2026-09-01 → …' },
      { label: 'Filter', value: 'WB11G0662' },
    ]);
  });
});
