import { describe, it, expect } from 'vitest';
import { sumLine, unknownKmNote } from './leaderboardsModel';

describe('sumLine', () => {
  it('names both sides of the board', () => {
    expect(sumLine({ numerator: 'fuelKm', denominator: 'litres' })).toBe('Σ fuelKm ÷ Σ litres');
  });

  it('writes a dash for a side the server did not name', () => {
    expect(sumLine({ numerator: null, denominator: 'litres' })).toBe('Σ — ÷ Σ litres');
    expect(sumLine({ numerator: 'fuelKm', denominator: null })).toBe('Σ fuelKm ÷ Σ —');
  });

  it('says nothing when the board names neither side', () => {
    expect(sumLine({})).toBeNull();
    expect(sumLine(null)).toBeNull();
  });
});

describe('unknownKmNote', () => {
  it('counts the trips the server could not measure', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 7 })).toBe('7 trips not measured.');
  });

  it('says one trip not measured', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 1 })).toBe('1 trip not measured.');
  });

  it('says nothing when the server counted none, or did not count at all', () => {
    expect(unknownKmNote({ tripsWithUnknownKm: 0 })).toBeNull();
    expect(unknownKmNote({})).toBeNull();
    expect(unknownKmNote(null)).toBeNull();
  });
});
