import { describe, expect, it } from 'vitest';
import { distanceCoverage } from './overviewDistance';

const vehicles = (count) => Array.from({ length: count }, (_, i) => ({ registrationNumber: `T${i}` }));

describe('distanceCoverage', () => {
  // OLD response: a plain distance, no attribution to say.
  it('keeps the old distance alone', () => {
    expect(distanceCoverage({ fleet: { totalKm: 420 }, vehicles: vehicles(51) })).toEqual({
      distanceKm: 420,
      trucks: null,
      note: null,
      partial: false,
    });
  });

  // NEW response: the distance covers only the trucks it was measured on.
  it('says how many trucks the distance covers', () => {
    expect(
      distanceCoverage({
        fleet: { totalKm: 420, trucksAttributed: 42, kmPartial: true },
        vehicles: vehicles(51),
      }),
    ).toEqual({ distanceKm: 420, trucks: 42, note: 'over 42 of 51 trucks', partial: true });
  });

  it('keeps an unknown distance unknown', () => {
    expect(distanceCoverage({ fleet: { totalKm: null } }).distanceKm).toBeNull();
    expect(distanceCoverage(null).distanceKm).toBeNull();
  });
});
