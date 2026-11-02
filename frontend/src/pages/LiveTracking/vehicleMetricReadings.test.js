import { describe, expect, it } from 'vitest';
import vehicleMetricReadings from './vehicleMetricReadings.js';

describe('Track metric readings', () => {
  it('prefers live fuel/DEF, keeps valid zeros, and reads the CAN odometer first (DC-20)', () => {
    expect(
      vehicleMetricReadings(
        { fuel: 0, fuelUnit: 'litres', defLevel: 0, defUnit: 'percent', odo: 0 },
        { primaryFuelLevel: 80, defLevel: 50, canOdo: 999 },
      ),
    ).toMatchObject({ fuel: '0 L', def: '0%', odometer: '999 km', odometerSource: 'CAN' });
    expect(vehicleMetricReadings({ odo: 0 }, null)).toMatchObject({
      odometer: '0 km',
      odometerSource: 'LIVE',
    });
  });
  it('labels a Vehicle Health fallback older than 6 h (DC-15)', () => {
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
      fuel: '32% · old reading',
      def: '70% · old reading',
      odometer: '1,23,456 km · old reading',
    });
  });
  it('says the unit is unknown instead of inventing litres (DC-18)', () => {
    expect(vehicleMetricReadings({ fuel: 32, fuelUnit: 'unverified' })).toMatchObject({
      fuel: '32 (unit unknown)',
      def: '—',
      odometer: '—',
    });
    expect(
      vehicleMetricReadings({ fuel: NaN, defLevel: 150, defUnit: 'percent', odo: ' ' }),
    ).toMatchObject({ fuel: '—', def: '—', odometer: '—' });
  });
});
