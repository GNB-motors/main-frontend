import { describe, it, expect } from 'vitest';
import { apartText, samePlaceSentence } from './duplicatePairModel';

describe('samePlaceSentence', () => {
  it('says the two names and how far apart they are', () => {
    expect(
      samePlaceSentence({
        a: { name: 'DANKUNI SAIDING' },
        b: { name: 'Dankuni Siding' },
        distanceM: 20,
      }),
    ).toBe('These look like the same place: DANKUNI SAIDING and Dankuni Siding, 20 m apart.');
  });

  it('says it does not know the distance rather than guessing', () => {
    expect(
      samePlaceSentence({ a: { name: 'A' }, b: { name: 'B' }, distanceM: null }),
    ).toBe('These look like the same place: A and B, we do not know how far apart they are.');
  });

  it('copes with a place that has no name', () => {
    expect(samePlaceSentence({ a: {}, b: { name: 'B' }, distanceM: 5 })).toContain(
      'Unnamed place',
    );
  });

  it('is null without a pair', () => {
    expect(samePlaceSentence(null)).toBeNull();
  });
});

describe('apartText', () => {
  it('writes metres', () => {
    expect(apartText(20)).toBe('20 m');
  });

  it('writes kilometres', () => {
    expect(apartText(1500)).toBe('1.5 km');
  });

  it('is an em dash for an unknown distance', () => {
    expect(apartText(null)).toBe('—');
  });
});
