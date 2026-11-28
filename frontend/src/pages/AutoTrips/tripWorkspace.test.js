import { describe, it, expect } from 'vitest';
import { tripListHref, tripDetailHref } from './tripWorkspace';

describe('trip list navigation', () => {
  it('keeps server page and filters in the trip link', () => {
    const query = new URLSearchParams('range=today&page=3&status=COMPLETE&play=1');
    expect(tripDetailHref('t1', query)).toBe('/auto-trips/t1?range=today&page=3&status=COMPLETE');
    expect(tripListHref(query)).toBe('/auto-trips?range=today&page=3&status=COMPLETE');
  });
  it('preserves list search and sort and returns to an originating report', () => {
    const params = new URLSearchParams('search=WB01&sortBy=totalDistance&order=desc');
    expect(tripDetailHref('trip', params)).toContain('search=WB01&sortBy=totalDistance&order=desc');
    expect(tripListHref(new URLSearchParams({ returnTo: '/route-hub?tab=profitability' }))).toBe(
      '/route-hub?tab=profitability',
    );
    expect(tripListHref(new URLSearchParams({ returnTo: '//outside.example' }))).toMatch(
      /^\/auto-trips/,
    );
  });
});
