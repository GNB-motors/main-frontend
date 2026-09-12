import { describe, it, expect } from 'vitest';
import { splitLeaderboard, formatMetric } from './leaderboard';

describe('splitLeaderboard', () => {
  const rows = [
    { route: 'Jamshedpur–Ranchi', margin: 4200 },
    { route: 'JSR–Kolkata', margin: -1500 },
    { route: 'JSR–Dhanbad', margin: 900 },
    { route: 'JSR–Bokaro', margin: 12000 },
    { route: 'JSR–Hazaribagh', margin: 0 },
  ];

  it('shows best and worst ends, sorted extreme-first', () => {
    const { best, worst } = splitLeaderboard(rows, 'margin');
    expect(best[0].route).toBe('JSR–Bokaro');
    expect(worst[0].route).toBe('JSR–Kolkata');
    expect(best).toHaveLength(5);
    expect(worst).toHaveLength(5);
  });

  it('keeps 0 as a real value — a zero-margin route ranks, not hidden', () => {
    const { best, worst } = splitLeaderboard(rows, 'margin');
    expect(best.some((r) => r.route === 'JSR–Hazaribagh' && r.margin === 0)).toBe(true);
    expect(worst.some((r) => r.route === 'JSR–Hazaribagh' && r.margin === 0)).toBe(true);
  });

  it('drops rows with absent metrics — absent is not zero', () => {
    const { best, worst } = splitLeaderboard(
      [{ route: 'A', margin: null }, { route: 'B' }, { route: 'C', margin: 100 }],
      'margin',
    );
    expect(best.map((r) => r.route)).toEqual(['C']);
    expect(worst.map((r) => r.route)).toEqual(['C']);
  });

  it('respects the size cap', () => {
    const { best } = splitLeaderboard(rows, 'margin', { size: 2 });
    expect(best).toHaveLength(2);
    expect(best[0].route).toBe('JSR–Bokaro');
    expect(best[1].route).toBe('Jamshedpur–Ranchi');
  });

  it('handles empty and non-array input', () => {
    expect(splitLeaderboard([], 'margin')).toEqual({ best: [], worst: [] });
    expect(splitLeaderboard(null, 'margin')).toEqual({ best: [], worst: [] });
  });

  it('stable on metric ties — original order wins', () => {
    const tied = [
      { route: 'first', margin: 100 },
      { route: 'second', margin: 100 },
    ];
    const { best } = splitLeaderboard(tied, 'margin');
    expect(best.map((r) => r.route)).toEqual(['first', 'second']);
  });
});

describe('formatMetric', () => {
  it('formats currency in Indian grouping', () => {
    expect(formatMetric(482350, 'currency')).toContain('4,82,350');
  });
  it('formats percent and number', () => {
    expect(formatMetric(42.345, 'percent')).toBe('42.3%');
    expect(formatMetric(1234.5, 'number')).toBe('1,234.5');
  });
  it('maps non-finite to the absent marker', () => {
    expect(formatMetric(null, 'currency')).toBe('—');
    expect(formatMetric(undefined, 'number')).toBe('—');
  });
});
