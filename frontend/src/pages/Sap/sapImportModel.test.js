import { describe, it, expect } from 'vitest';
import {
  initialChoice,
  initialChoices,
  choiceValid,
  entriesToApply,
  proposalsIn,
} from './sapImportModel';

const ready = {
  ref: 'OCL -> TARAKESHWAR',
  sapValues: [280, 560],
  from: { siteId: 'p' },
  to: { siteId: 't' },
  ready: true,
};
const unplaced = {
  ref: 'OCL -> NOWHERE',
  sapValues: [150],
  from: { siteId: 'p' },
  to: { siteId: null },
  ready: false,
};

describe('sap import model', () => {
  it('a ready lane is included with its first value as one way; an unplaced one is not', () => {
    expect(initialChoice(ready)).toEqual({
      include: true,
      fromSiteId: 'p',
      toSiteId: 't',
      sapKm: 280,
      basis: 'ONE_WAY',
    });
    expect(initialChoice(unplaced).include).toBe(false);
  });

  it('a route already holding the same SAP is not proposed again', () => {
    expect(initialChoice({ ...ready, existing: { sapKm: 280, basis: 'ONE_WAY' } }).include).toBe(
      false,
    );
    expect(initialChoice({ ...ready, existing: { sapKm: 300 } }).include).toBe(true);
  });

  it('only included, valid choices are applied, with the sheet row as the reference', () => {
    const choices = initialChoices([ready, unplaced]);
    choices[unplaced.ref] = { ...choices[unplaced.ref], include: true }; // still no drop place
    expect(entriesToApply([ready, unplaced], choices)).toEqual([
      { fromSiteId: 'p', toSiteId: 't', sapKm: 280, basis: 'ONE_WAY', importRef: ready.ref },
    ]);
    choices[unplaced.ref] = { ...choices[unplaced.ref], toSiteId: 'n' };
    expect(entriesToApply([ready, unplaced], choices)).toHaveLength(2);
  });

  it('a choice needs two different places and a SAP km in range', () => {
    expect(choiceValid({ fromSiteId: 'a', toSiteId: 'a', sapKm: 10 })).toBe(false);
    expect(choiceValid({ fromSiteId: 'a', toSiteId: 'b', sapKm: 0 })).toBe(false);
    expect(choiceValid({ fromSiteId: 'a', toSiteId: 'b', sapKm: 3001 })).toBe(false);
    expect(choiceValid({ fromSiteId: 'a', toSiteId: 'b', sapKm: 280 })).toBe(true);
  });

  it('views: ready, needing places, selected', () => {
    const choices = initialChoices([ready, unplaced]);
    expect(proposalsIn('ready', [ready, unplaced], choices)).toEqual([ready]);
    expect(proposalsIn('places', [ready, unplaced], choices)).toEqual([unplaced]);
    expect(proposalsIn('selected', [ready, unplaced], choices)).toEqual([ready]);
    expect(proposalsIn('all', [ready, unplaced], choices)).toHaveLength(2);
  });
});
