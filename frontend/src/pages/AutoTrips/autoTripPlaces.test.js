import { describe, expect, it } from 'vitest';
import { stopLabel } from './autoTripPlaces';

const LABEL = 'Unmarked, near Bhadutala (1.0 km), Medinipur, Paschim Medinipur, West Bengal';

describe('stopLabel', () => {
  it('spec 4: a stop whose place has only a backend label shows the label', () => {
    expect(stopLabel({ place: { label: LABEL, status: 'PROPOSED' } })).toBe(LABEL);
  });

  it('spec 4: a named place still wins over the label', () => {
    expect(stopLabel({ place: { name: 'Nimpura', label: LABEL } })).toBe('Nimpura');
  });

  it('spec 4: a place with neither name nor label keeps the old wording', () => {
    expect(stopLabel({ place: { status: 'CONFIRMED', siteType: 'FUEL_PUMP' } })).toBe('FUEL_PUMP');
    expect(stopLabel({ place: { status: 'PROPOSED' } })).toBe('Unconfirmed place');
    expect(stopLabel({})).toBe('Unknown place');
  });
});
