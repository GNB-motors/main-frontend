import { describe, it, expect } from 'vitest';
import { COST_KEYS, costCell, runningCostTotals } from './runningCostTotals';

describe('runningCostTotals', () => {
  it('adds up the costed rows', () => {
    const { totals, unknown } = runningCostTotals([
      { totalCostInr: 480, businessCostInr: 300, nonBusinessCostInr: 100, deviationCostInr: 80 },
      { totalCostInr: 240, businessCostInr: 200, nonBusinessCostInr: 40, deviationCostInr: 0 },
    ]);
    expect(totals.totalCostInr).toBe(720);
    expect(totals.businessCostInr).toBe(500);
    expect(unknown.totalCostInr).toBe(0);
  });

  it('leaves a row that was not costed out of the sum and counts it', () => {
    const { totals, unknown } = runningCostTotals([{ totalCostInr: 480 }, { totalCostInr: null }]);
    expect(totals.totalCostInr).toBe(480);
    expect(unknown.totalCostInr).toBe(1);
  });

  it('has no total at all when no row was costed', () => {
    const { totals } = runningCostTotals([{ totalCostInr: null }, { totalCostInr: null }]);
    expect(totals.totalCostInr).toBeNull();
  });

  it('counts a real zero as a costed row', () => {
    const { totals, unknown } = runningCostTotals([{ totalCostInr: 0 }]);
    expect(totals.totalCostInr).toBe(0);
    expect(unknown.totalCostInr).toBe(0);
  });

  it('knows every cost column of the report', () => {
    expect(COST_KEYS).toContain('totalCostInr');
    expect(COST_KEYS).toContain('deviationCostInr');
  });
});

describe('costCell', () => {
  it('writes "not costed" for a row without a cost', () => {
    expect(costCell(null)).toBe('not costed');
    expect(costCell(undefined)).toBe('not costed');
  });

  it('leaves a number a number', () => {
    expect(costCell(480)).toBe(480);
    expect(costCell(0)).toBe(0);
  });
});
