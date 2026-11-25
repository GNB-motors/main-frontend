import { expect, it } from 'vitest';
import { bandLabel, summarizeProfiles } from './optimalSpeedModel';

const rows = [
  {
    registrationNumber: 'A',
    optimalMinKmh: 40,
    optimalMaxKmh: 50,
    optimalEfficiencyKmpl: 4,
    avgSpeedKmh: 42,
    pctDistanceInOptimalBand: 40,
    potentialSavingsL: 50,
    potentialSavingsInr: 4500,
    sampleWindows: 20,
    bands: [
      { minKmh: 30, maxKmh: 40, efficiencyKmpl: 2, distanceKm: 600 },
      { minKmh: 40, maxKmh: 50, efficiencyKmpl: 4, distanceKm: 400 },
    ],
  },
  {
    registrationNumber: 'B',
    optimalMinKmh: 40,
    optimalMaxKmh: 50,
    optimalEfficiencyKmpl: 5,
    avgSpeedKmh: 48,
    pctDistanceInOptimalBand: 100,
    potentialSavingsL: 0,
    potentialSavingsInr: null,
    sampleWindows: 10,
    bands: [{ minKmh: 40, maxKmh: 50, efficiencyKmpl: 5, distanceKm: 500 }],
  },
];

it('works out the fleet figures from each truck’s speed bands', () => {
  const summary = summarizeProfiles(rows);
  expect(summary.savingsInr).toEqual({ value: 4500, trucks: 1 });
  expect(summary.distanceKm).toBe(1500);
  expect(summary.pctInBand).toBe(60);
  // 1500 km on 300 + 100 + 100 L; at each truck's best km/L: 250 + 100 L.
  expect(summary.fleetKmpl).toBe(3);
  expect(summary.bestKmpl).toBeCloseTo(1500 / 350);
  expect(summary.commonBand).toBe('40–50 km/h');
  expect(summary.commonBandTrucks).toBe(2);
  expect(summary.avgSpeedKmh).toBe(45);
  expect(summary.mostlyOutside).toBe(1);
  expect(summary.top.registrationNumber).toBe('A');
  expect(summary.windows).toBe(30);
});

it('keeps unknown fleet figures unknown', () => {
  const summary = summarizeProfiles([{ registrationNumber: 'C' }]);
  expect(summary.pctInBand).toBeNull();
  expect(summary.fleetKmpl).toBeNull();
  expect(summary.commonBand).toBeNull();
  expect(summary.top).toBeNull();
});

it('names an open top band with a plus', () => {
  expect(bandLabel(70, 999)).toBe('70+ km/h');
  expect(bandLabel(null, 50)).toBeNull();
});
