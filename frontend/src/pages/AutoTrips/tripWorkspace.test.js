import { describe, it, expect } from 'vitest';
import { tripListHref, tripDetailHref } from './tripWorkspace';

describe('trip list navigation', () => {
  it('keeps server page and filters in the trip link', () => {
    const query = new URLSearchParams('range=today&page=3&status=COMPLETE&play=1');
    expect(tripDetailHref('t1', query)).toBe('/auto-trips/t1?range=today&page=3&status=COMPLETE');
    expect(tripListHref(query)).toBe('/auto-trips?range=today&page=3&status=COMPLETE');
  });
});
