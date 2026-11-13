import { describe, expect, it } from 'vitest';
import { missingKeyFields } from './keyFields';

const completeDraft = {
  vehicleId: 'v1',
  litres: 120,
  amount: 10740,
  time: { value: '2026-11-10T13:10:00.000Z' },
  truck: { status: 'EXACT', vehicleId: 'v1' },
};

describe('missingKeyFields', () => {
  it('returns nothing when all key fields are certain', () => {
    expect(missingKeyFields(completeDraft)).toEqual([]);
  });

  it('treats a suggested truck as missing until a person picks one', () => {
    const draft = {
      ...completeDraft,
      vehicleId: null,
      truck: { status: 'AMBIGUOUS', vehicleId: 'v2', candidates: [] },
    };
    expect(missingKeyFields(draft)).toEqual([{ key: 'TRUCK', label: 'Truck' }]);
    expect(
      missingKeyFields(draft, { vehicleId: 'v2', truckPicked: true, litres: 120, amount: 10740 }),
    ).toEqual([]);
  });

  it('does not require a fleet truck for a market truck', () => {
    const draft = {
      ...completeDraft,
      market: true,
      vehicleId: null,
      truck: { status: 'MARKET' },
    };
    expect(missingKeyFields(draft)).toEqual([]);
  });

  it('uses the current editor values and lists every missing field', () => {
    const draft = {
      ...completeDraft,
      litres: null,
      amount: null,
      time: {},
      truck: { status: 'AMBIGUOUS' },
    };
    expect(
      missingKeyFields(draft, { vehicleId: 'v9', truckPicked: true, litres: '', amount: 0 }),
    ).toEqual([
      { key: 'LITRES', label: 'Litres' },
      { key: 'AMOUNT', label: 'Amount' },
      { key: 'FILL_TIME', label: 'Fill time' },
    ]);
  });

  it('treats a truck choice that the person cleared as missing', () => {
    expect(
      missingKeyFields(completeDraft, {
        vehicleId: '',
        truckPlate: '',
        truckPicked: true,
      }),
    ).toEqual([{ key: 'TRUCK', label: 'Truck' }]);
  });

  it('accepts a time set by a person', () => {
    const draft = { ...completeDraft, time: {} };
    expect(
      missingKeyFields(draft, {
        time: { action: 'set', at: '2026-11-10T13:10:00.000Z' },
      }),
    ).toEqual([]);
  });
});
