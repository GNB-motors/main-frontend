import { it, expect } from 'vitest';
import { uniqueSuggestions, reviewRows } from './sapReviewModel';
it('shows each candidate place once, retaining its strongest match', () => {
  expect(
    uniqueSuggestions(
      [
        { orgSiteId: 'a', score: 0.5 },
        { orgSiteId: 'b', score: 0.8 },
        { orgSiteId: 'a', score: 0.9 },
      ],
      'PLANT',
    ),
  ).toEqual([
    { orgSiteId: 'a', score: 0.9 },
    { orgSiteId: 'b', score: 0.8 },
  ]);
  expect(
    uniqueSuggestions(
      [
        { label: 'Town', score: 0.2 },
        { label: 'Town', score: 0.8 },
      ],
      'DROP',
    ),
  ).toEqual([{ label: 'Town', score: 0.8 }]);
});
it('filters the complete review list before pagination, including linked labels', () => {
  const drops = Array.from({ length: 40 }, (_, i) => ({
    orgSiteId: String(i),
    name: `Drop ${i}`,
    label: i === 39 ? 'Calcutta' : null,
    matched: i === 39,
  }));
  expect(reviewRows({ drops }, 'DROP', '', 'pending')).toHaveLength(39);
  expect(reviewRows({ drops }, 'DROP', ' calcutta ', 'all')).toEqual([drops[39]]);
  expect(
    reviewRows({ plants: [{ label: 'Plant', sites: [{ name: 'Site' }] }] }, 'PLANT', '', 'pending'),
  ).toEqual([]);
});
