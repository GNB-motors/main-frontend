import { describe, it, expect } from 'vitest';
import {
  REPOSITION_INFO,
  isPlantToPlant,
  legBarSegments,
  legBarSentence,
  legKilometres,
  legTone,
  legWord,
  unattributedKm,
  unknownDriveText,
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

  it('keeps the approach separate when the trip recorded no return', () => {
    const legs = legKilometres({ km: { laden: 412, approach: 30 } });
    expect(legs.map((leg) => leg.kind)).toEqual(['APPROACH', 'LADEN']);
    expect(legs[0].km).toBe(30);
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

describe('distance the server could not attribute', () => {
  it('keeps the unattributed km out of the bar', () => {
    const trip = { km: { laden: 117, unattributed: 38 } };
    expect(unattributedKm(trip)).toBe(38);
    expect(legKilometres(trip).map((leg) => leg.km)).toEqual([117]);
    expect(legBarSegments(trip).map((segment) => segment.km)).toEqual([117]);
  });

  it('says nothing when there is no unattributed distance', () => {
    expect(unattributedKm({ km: { laden: 117 } })).toBeNull();
    expect(unattributedKm({ km: { unattributed: 0 } })).toBeNull();
    expect(unattributedKm({})).toBeNull();
  });

  it('says why a drive had no load label', () => {
    expect(unknownDriveText({ unknownDriveReason: 'DROP_UNKNOWN' })).toBe(
      'Drop not found, so this drive has no load label',
    );
    expect(unknownDriveText({})).toBeNull();
  });
});

it('retains approach and return distances in the same bar', () => {
  const segments = legBarSegments({ km: { approach: 50, laden: 300, return: 150 } });
  expect(segments.map(({ kind, km, percent }) => ({ kind, km, percent }))).toEqual([
    { kind: 'APPROACH', km: 50, percent: 10 },
    { kind: 'LADEN', km: 300, percent: 60 },
    { kind: 'RETURN', km: 150, percent: 30 },
  ]);
});
