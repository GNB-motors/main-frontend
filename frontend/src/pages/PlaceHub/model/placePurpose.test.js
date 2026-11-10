import { describe, it, expect } from 'vitest';
import { purposeOf, purposeColor, PURPOSE_COLOR } from './placePurpose.js';
import { RISK_COLOR } from '../placeHubStyle.js';

describe('purposeOf', () => {
  it('a theft beats a fuel pump', () => {
    expect(purposeOf({ siteType: 'FUEL_PUMP', risk: { theftIncidents: 2 } })).toBe('theft');
    expect(purposeOf({ facility: { siteType: 'FUEL_PUMP' }, risk: { theftIncidents: 1 } })).toBe(
      'theft',
    );
  });

  it('a fuel pump is a pump, filed under the facility or the site', () => {
    expect(purposeOf({ siteType: 'FUEL_PUMP' })).toBe('pump');
    expect(purposeOf({ facility: { siteType: 'FUEL_PUMP' }, siteType: 'LOADING' })).toBe('pump');
  });

  it('an unknown type is general, never a pump', () => {
    expect(purposeOf({})).toBe('general');
    expect(purposeOf({ siteType: 'LOADING' })).toBe('general');
    expect(purposeOf({ siteType: 'UNKNOWN' })).toBe('general');
    expect(purposeOf({ siteType: 'FUEL_PUMP', risk: { theftIncidents: 0 } })).toBe('pump');
    expect(purposeOf({ siteType: 'fuel_pump' })).toBe('general');
  });

  it('colours: theft is the risk colour, pump blue, other yellow', () => {
    expect(PURPOSE_COLOR.theft).toBe(RISK_COLOR);
    expect(PURPOSE_COLOR.pump).toBe('#2563eb');
    expect(PURPOSE_COLOR.general).toBe('#eab308');
    expect(purposeColor('nonsense')).toBe(PURPOSE_COLOR.general);
  });
});
