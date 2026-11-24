import { describe, expect, it } from 'vitest';
import { resolveTabCounts } from './tripCounts';

describe('resolveTabCounts', () => {
  it('keeps counts unknown when the list and samples did not answer', () => {
    const counts = resolveTabCounts();
    for (const key of ['all', 'delivered', 'open', 'review', 'reposition'])
      expect(counts[key]).toBeNull();
    expect(resolveTabCounts({ deliveredTotal: null, waitingTotal: null }).delivered).toBeNull();
    expect(resolveTabCounts({ deliveredTotal: 0, waitingTotal: 0 }).review).toBe(0);
  });
  it('uses the counts the list answered with', () => {
    const counts = resolveTabCounts({
      listCounts: { OPEN: 10, COMPLETE: 20, CONFIRMED: 5, NEEDS_REVIEW: 3, reposition: 2 },
    });
    expect(counts.all).toBe(38);
    expect(counts.delivered).toBe(25);
    expect(counts.open).toBe(10);
    expect(counts.review).toBe(3);
    // The plant-to-plant runs are counted with the others.
    expect(counts.reposition).toBe(2);
    expect(counts.tab('CONFIRMED')).toBe(5);
  });

  it('takes the counts of the other reads when the list answered without any', () => {
    const counts = resolveTabCounts({ listCounts: null, deliveredTotal: 42, waitingTotal: 7 });
    expect(counts.delivered).toBe(42);
    expect(counts.review).toBe(7);
    // Nobody answered these: they are unknown, not a zero.
    expect(counts.all).toBeNull();
    expect(counts.open).toBeNull();
    expect(counts.reposition).toBeNull();
    expect(counts.tab('DISMISSED')).toBeNull();
  });

  it('prefers the waiting read counts over the list ones', () => {
    const counts = resolveTabCounts({
      listCounts: { OPEN: 1, NEEDS_REVIEW: 0 },
      waitingCounts: { NEEDS_REVIEW: 9 },
      waitingTotal: 9,
    });
    expect(counts.review).toBe(9);
  });
});
