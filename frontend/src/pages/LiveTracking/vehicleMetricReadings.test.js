import { describe, expect, it } from 'vitest';
import vehicleMetricReadings from './vehicleMetricReadings.js';

describe('Track metric readings', () => {
  it('prefers live readings and preserves valid zero values', () => {
    expect(
      vehicleMetricReadings(
        { fuel: 0, fuelUnit: 'litres', defLevel: 0, defUnit: 'percent', odo: 0 },
        { primaryFuelLevel: 80, defLevel: 50, canOdo: 999 },
      ),
    ).toMatchObject({ fuel: '0 L', def: '0%', odometer: '0 km' });
  });
  it('uses the reported health units for DEF and fuel fallback', () => {
    expect(
      vehicleMetricReadings(
        {},
        {
          primaryFuelLevel: 32,
          fuelLevelUnit: 'percent',
          defLevel: 70,
          defLevelUnit: 'percent',
          canOdo: 123456,
          isStale: true,
        },
      ),
    ).toMatchObject({
      fuel: '32%',
      def: '70%',
      odometer: '1,23,456 km',
    });
  });
  it('does not invent readings or litres when units are unverified', () => {
    expect(vehicleMetricReadings({ fuel: 32, fuelUnit: 'unverified' })).toMatchObject({
      fuel: '32',
      def: '—',
      odometer: '—',
    });
    expect(
      vehicleMetricReadings({ fuel: NaN, defLevel: 150, defUnit: 'percent', odo: ' ' }),
    ).toMatchObject({ fuel: '—', def: '—', odometer: '—' });
  });
});
