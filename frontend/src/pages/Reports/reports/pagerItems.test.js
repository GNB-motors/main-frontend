import { describe, it, expect } from 'vitest';
import { pageItems } from './pagerItems';

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(3, 2)).toEqual([1, 2, 3]);
  });

  it('collapses gaps around the current page', () => {
    expect(pageItems(10, 5)).toEqual([1, '...', 4, 5, 6, '...', 10]);
    expect(pageItems(10, 1)).toEqual([1, 2, '...', 10]);
  });
});
