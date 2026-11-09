import { describe, expect, it } from 'vitest';
import { fleetAttribution, fleetTruckTotal } from './measuredAttribution';

const vehicles = (count) => Array.from({ length: count }, (_, i) => ({ registrationNumber: `T${i}` }));

describe('fleetTruckTotal', () => {
  it('counts the vehicles the response carries', () => {
    expect(fleetTruckTotal({ vehicles: vehicles(51) })).toBe(51);
  });

  it('is null when the response carries no vehicle list', () => {
    expect(fleetTruckTotal({})).toBeNull();
    expect(fleetTruckTotal(null)).toBeNull();
    expect(fleetTruckTotal({ vehicles: null })).toBeNull();
    expect(fleetTruckTotal({ vehicles: 'nope' })).toBeNull();
  });
});

describe('fleetAttribution', () => {
  // OLD response: no attribution fields, so the page says nothing extra.
  it('says nothing for the old backend', () => {
    expect(fleetAttribution({ totalKm: 420 }, { vehicles: vehicles(51) })).toEqual({
      trucks: null,
      note: null,
      partial: false,
    });
  });

  // NEW response: the figure covers only the trucks it was measured on.
  it('says how many trucks the figure covers', () => {
    expect(
      fleetAttribution({ trucksAttributed: 42, kmPartial: true }, { vehicles: vehicles(51) }),
    ).toEqual({ trucks: 42, note: 'over 42 of 51 trucks', partial: true });
  });

  it('falls back to the attributed count when the fleet size is unknown', () => {
    expect(fleetAttribution({ trucksAttributed: 42 })).toEqual({
      trucks: 42,
      note: 'over 42 trucks',
      partial: false,
    });
  });

  it('never claims more trucks than the fleet has', () => {
    expect(fleetAttribution({ trucksAttributed: 42 }, { vehicles: vehicles(7) }).note).toBe(
      'over 42 trucks',
    );
  });
});
