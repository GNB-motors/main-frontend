import { describe, it, expect } from 'vitest';
import {
  REPOSITION_INFO,
  isPlantToPlant,
  legBarSegments,
  legBarSentence,
  legKilometres,
  legTone,
  legWord,
} from './tripLegModel';

describe('legWord', () => {
  it('names each leg', () => {
    expect(legWord('LADEN')).toBe('Loaded run');
    expect(legWord('RETURN')).toBe('Empty run');
    expect(legWord('REPOSITION')).toBe('Plant to plant');
  });

  it('is null for a leg we do not know', () => {
    expect(legWord('SOMETHING')).toBeNull();
    expect(legWord(null)).toBeNull();
  });
});

describe('legTone', () => {
  it('makes plant-to-plant quiet, not an error', () => {
    expect(legTone('REPOSITION')).toBe('info');
    expect(legTone('REPOSITION')).not.toBe('act');
  });
});

describe('isPlantToPlant', () => {
  it('knows a plant-to-plant trip', () => {
    expect(isPlantToPlant({ leg: 'REPOSITION' })).toBe(true);
    expect(isPlantToPlant({ leg: 'LADEN' })).toBe(false);
  });
});

describe('legKilometres', () => {
  it('lists the legs that have distance', () => {
    const legs = legKilometres({ km: { laden: 412, return: 88, reposition: 0 } });
    expect(legs.map((leg) => leg.kind)).toEqual(['LADEN', 'RETURN']);
  });

  it('uses the deadhead when the trip recorded no return', () => {
    const legs = legKilometres({ km: { laden: 412, approach: 30 } });
    expect(legs.map((leg) => leg.kind)).toEqual(['LADEN', 'RETURN']);
    expect(legs[1].km).toBe(30);
  });

  it('drops a leg with no distance', () => {
    expect(legKilometres({ km: { laden: 0, return: 0 } })).toEqual([]);
  });
});

describe('legBarSegments', () => {
  it('sizes each slice by its share', () => {
    const segments = legBarSegments({ km: { laden: 300, return: 100 } });
    expect(segments[0].percent).toBe(75);
    expect(segments[1].percent).toBe(25);
  });

  it('adds up to a whole bar', () => {
    const segments = legBarSegments({ km: { laden: 300, return: 100, reposition: 100 } });
    expect(segments.reduce((sum, s) => sum + s.percent, 0)).toBeCloseTo(100);
  });

  it('is empty when there is no distance', () => {
    expect(legBarSegments({ km: {} })).toEqual([]);
  });
});

describe('legBarSentence', () => {
  it('says the distance of each leg', () => {
    expect(legBarSentence({ km: { laden: 412, return: 88 } })).toBe(
      '412 km loaded run · 88 km empty run',
    );
  });

  it('says so when there is no distance', () => {
    expect(legBarSentence({ km: {} })).toBe('No distance recorded for this trip.');
  });
});

describe('REPOSITION_INFO', () => {
  it('explains that plant-to-plant is normal', () => {
    expect(REPOSITION_INFO).toMatch(/This is normal/);
    expect(REPOSITION_INFO).not.toMatch(/error|problem|check/i);
  });
});

it('labels the v4 RETURN allocation as plant-to-plant once for a reposition movement', () => {
  const legs = legKilometres({ leg: 'REPOSITION', km: { approach: 10, return: 90 } });
  expect(legs).toEqual([
    { kind: 'RETURN', km: 10 },
    { kind: 'REPOSITION', km: 90 },
  ]);
  expect(legs.reduce((sum, leg) => sum + leg.km, 0)).toBe(100);
});
