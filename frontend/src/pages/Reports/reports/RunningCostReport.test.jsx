import { describe, it, expect } from 'vitest';
import { EXPORT_COLUMNS } from './RunningCostReport';

const cell = (header, row) => EXPORT_COLUMNS.find(([name]) => name === header)[1](row);

describe('running cost export columns', () => {
  it('writes "not costed" for a row with no fuel or wear cost', () => {
    expect(cell('Fuel (Rs)', { fuelInr: null })).toBe('not costed');
    expect(cell('Wear (Rs)', { wearInr: null })).toBe('not costed');
  });

  it('leaves a number a number', () => {
    expect(cell('Fuel (Rs)', { fuelInr: 480 })).toBe(480);
    expect(cell('Wear (Rs)', { wearInr: 120 })).toBe(120);
  });
});
