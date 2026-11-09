import { describe, expect, it } from 'vitest';
import { fuelBasis, legCosts, partialFlags, runKmOf, runningCostParts } from './tripMeasureModel';

// OLD: every leg costed, no basis from the server.
const oldTrip = {
  km: { laden: 117, approach: 2, return: 18.37 },
  totalCostInr: 3837,
  roleEconomics: {
    approach: { fuelInr: 67, wearInr: 6 },
    laden: { fuelInr: 3358, wearInr: 351 },
    return: { fuelInr: 0, wearInr: 55 },
  },
};

// NEW: the server measured only some of the legs and said so.
const partialTrip = {
  km: { laden: null, approach: null, return: null },
  totalCostInr: null,
  kmPartial: true,
  fuelPartial: true,
  roleEconomics: {
    approach: { fuelInr: null, wearInr: null },
    laden: { fuelInr: 3358, wearInr: 351, fuelBasis: 'PARTIAL' },
    return: { fuelInr: null, wearInr: null },
  },
};

describe('what a trip measured', () => {
  it('reads the loaded run as it always did', () => {
    expect(runKmOf(oldTrip)).toBe(117);
    expect(runKmOf({ km: { ladenOdo: 120, laden: 117 } })).toBe(120);
  });

  it('never turns an unmeasured run into zero', () => {
    expect(runKmOf(partialTrip)).toBeNull();
    expect(runKmOf({})).toBeNull();
  });

  it('sums only the legs that were costed', () => {
    const { fuel, wear } = legCosts(oldTrip);
    expect(fuel.sum).toBe(3425);
    expect(wear.sum).toBe(412);
    expect(fuel.unknown).toBe(0);
  });

  it('counts the legs it left out', () => {
    const { fuel } = legCosts(partialTrip);
    expect(fuel.sum).toBe(3358);
    expect(fuel.known).toBe(1);
    expect(fuel.unknown).toBe(2);
    expect(fuel.total).toBe(3);
  });

  it('reads the fuel basis', () => {
    expect(fuelBasis(oldTrip)).toBeNull();
    expect(fuelBasis(partialTrip)).toBe('PARTIAL');
    expect(fuelBasis({ roleEconomics: { laden: { fuelBasis: 'UNKNOWN' } } })).toBe('UNKNOWN');
  });

  it('keeps the old running cost note', () => {
    expect(runningCostParts(oldTrip)).toEqual({ fuel: '₹3,425', wear: '₹412' });
  });

  it('says what was only partly measured', () => {
    expect(runningCostParts(partialTrip)).toEqual({
      fuel: '₹3,358 · 1 of 3 legs costed · partial',
      wear: '₹351 · 1 of 3 legs costed',
    });
  });

  it('says a leg that was not measured is not measured, not free', () => {
    expect(
      runningCostParts({
        totalCostInr: null,
        roleEconomics: { laden: { fuelInr: null, wearInr: null, fuelBasis: 'UNKNOWN' } },
      }),
    ).toEqual({ fuel: 'not measured', wear: 'not measured' });
  });

  it('says nothing when the trip has not been costed at all', () => {
    expect(runningCostParts({ roleEconomics: {} })).toBeNull();
  });

  it('reads the partial flags', () => {
    expect(partialFlags(oldTrip)).toEqual({ km: false, fuel: false });
    expect(partialFlags(partialTrip)).toEqual({ km: true, fuel: true });
  });
});

describe('legs that do not exist', () => {
  it('does not count a null leg as an uncosted leg', () => {
    const trip = {
      totalCostInr: 3837,
      roleEconomics: {
        approach: null,
        laden: { fuelInr: 3358, wearInr: 351 },
        return: { fuelInr: null, wearInr: 55 },
      },
    };
    expect(legCosts(trip).legs).toBe(2);
    expect(legCosts(trip).fuel.total).toBe(2);
    expect(runningCostParts(trip)).toEqual({
      fuel: '₹3,358 · 1 of 2 legs costed',
      wear: '₹406',
    });
  });

  it('keeps a trip whose legs are all null unpriced', () => {
    const trip = { totalCostInr: null, roleEconomics: { approach: null, laden: null } };
    expect(legCosts(trip).legs).toBe(0);
    expect(runningCostParts(trip)).toBeNull();
  });
});
