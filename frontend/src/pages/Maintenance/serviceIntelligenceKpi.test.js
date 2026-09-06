import { describe, it, expect } from 'vitest';
import { computeServiceKpi } from './serviceIntelligenceKpi';

describe('computeServiceKpi', () => {
  it('returns zeros for an empty set', () => {
    expect(computeServiceKpi([])).toEqual({ total: 0, totalAmount: 0, last30: 0 });
  });

  it('sums the amount across all rows, treating a missing amount as 0', () => {
    const rows = [
      { amount: 1000, date: '2026-03-01' },
      { amount: null, date: '2026-03-01' },
      { amount: 500, date: '2026-03-01' },
    ];
    expect(computeServiceKpi(rows, new Date('2026-03-01')).totalAmount).toBe(1500);
  });

  it('counts every row toward total regardless of date', () => {
    const rows = [{ date: '2020-01-01' }, { date: '2026-03-01' }];
    expect(computeServiceKpi(rows, new Date('2026-03-01')).total).toBe(2);
  });

  it('counts only rows dated within the last 30 days of `now`', () => {
    const now = new Date('2026-03-31');
    const rows = [
      { date: '2026-03-30' }, // 1 day ago — inside the window
      { date: '2026-03-01' }, // 30 days ago — on the boundary, inside
      { date: '2026-02-28' }, // 31 days ago — outside the window
    ];
    expect(computeServiceKpi(rows, now).last30).toBe(2);
  });
});
