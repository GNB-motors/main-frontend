import { describe, expect, it } from 'vitest';
import { placeSubtitle, placeTitle } from './siteSummary.js';

const LABEL = 'Unmarked, near Bhadutala (1.0 km), Medinipur, Paschim Medinipur, West Bengal';

describe('placeTitle', () => {
  it('spec 5: a place of unknown type shows the backend label as it is', () => {
    expect(placeTitle({ locality: { label: LABEL } })).toBe(LABEL);
  });

  it('spec 5: a known type comes first and the label keeps its own words', () => {
    expect(
      placeTitle({ status: 'CONFIRMED', siteType: 'FUEL_PUMP', locality: { label: LABEL } }),
    ).toBe('Fuel pump, near Bhadutala (1.0 km), Medinipur, Paschim Medinipur, West Bengal');
  });

  it('spec 5: a real name always wins over the label', () => {
    expect(placeTitle({ name: 'Nimpura', locality: { label: LABEL } })).toBe('Nimpura');
  });

  it('spec 5: without a label the old locality branch still answers', () => {
    expect(
      placeTitle({ status: 'CONFIRMED', siteType: 'FUEL_PUMP', address: { locality: 'Kolaghat' } }),
    ).toBe('Fuel pump, Kolaghat');
    expect(placeTitle({})).toBe('Unnamed stop');
  });
});

describe('placeSubtitle', () => {
  it('spec 5: the backend label comes before the address locality', () => {
    expect(placeSubtitle({ locality: { label: LABEL }, address: { locality: 'Medinipur' } })).toBe(
      LABEL,
    );
  });

  it('spec 5: without a label the address locality still answers', () => {
    expect(placeSubtitle({ address: { locality: 'Medinipur' } })).toBe('Medinipur');
  });
});
