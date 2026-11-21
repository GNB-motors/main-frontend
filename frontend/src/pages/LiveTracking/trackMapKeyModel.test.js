import { describe, expect, it } from 'vitest';
import { keyAreaPurposes, keyPlaceTypes, keyRouteSources } from './trackMapKeyModel';

describe('keyPlaceTypes', () => {
  it('lists drawn place types, most common first, unknown kept', () => {
    const places = [{ type: 'PLANT' }, { type: 'CUSTOMER' }, { type: 'CUSTOMER' }, {}];
    expect(keyPlaceTypes(places)).toEqual(['CUSTOMER', 'PLANT', 'UNKNOWN']);
  });
  it('caps the list and is empty with nothing drawn', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ type: `T${String(i).padStart(2, '0')}` }));
    expect(keyPlaceTypes(many)).toHaveLength(8);
    expect(keyPlaceTypes()).toEqual([]);
  });
});

describe('keyRouteSources', () => {
  it('returns only the line styles on the map, in a fixed order', () => {
    expect(keyRouteSources([{ source: 'NONE' }, { source: 'DRIVEN' }, {}])).toEqual([
      'DRIVEN',
      'NONE',
    ]);
    expect(keyRouteSources([])).toEqual([]);
  });
});

describe('keyAreaPurposes', () => {
  it('matches polygon shading, prioritises risk, and excludes pin-only places', () => {
    expect(
      keyAreaPurposes([
        { type: 'FUEL_PUMP', purpose: 'pump' },
        { polygon: [{}], purpose: 'general' },
        { polygonParts: [[[]]], purpose: 'pump' },
        { coreParts: [[[]]], purpose: 'pump', risk: true },
      ]),
    ).toEqual(['theft', 'pump', 'general']);
    expect(keyAreaPurposes([])).toEqual([]);
  });
});
