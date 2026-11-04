import { describe, expect, it } from 'vitest';
import { missingReasons, sortAdvisories } from './refuelAdvisoryModel';
import { pumpRow, sortPumps } from './pumpHonestyModel';

describe('refuel advisory model', () => {
  it('puts critical vehicles first and emptier tanks before fuller ones', () => {
    const rows = sortAdvisories([
      { registrationNumber: 'B', status: 'OK', pctFull: 80 },
      { registrationNumber: 'A', status: 'CRITICAL', pctFull: 10 },
      { registrationNumber: 'C', status: 'REFUEL_SOON', pctFull: 25 },
      { registrationNumber: 'D', status: 'REFUEL_SOON', pctFull: 15 },
    ]);
    expect(rows.map((r) => r.registrationNumber)).toEqual(['A', 'D', 'C', 'B']);
  });

  it('explains a missing number instead of leaving a bare dash', () => {
    expect(missingReasons({ pctFull: null })).toContain('no tank reading yet');
    expect(
      missingReasons({
        pctFull: 40,
        currentFuelL: 160,
        avgEfficiencyKmpl: null,
        tankCapacityL: 400,
        litresToFull: 240,
      }),
    ).toEqual(['no efficiency history yet']);
    expect(
      missingReasons({
        pctFull: 40,
        currentFuelL: 80,
        avgEfficiencyKmpl: 3,
        estimatedRangeKm: 120,
        tankCapacityL: 200,
        litresToFull: 60,
      }),
    ).toEqual([]);
  });
});

describe('pump honesty model', () => {
  it('reads either field name the pump call used', () => {
    const row = pumpRow({
      pumpName: 'HP-1',
      totalBilledL: 100,
      totalMeasuredLitres: 92,
      shortfallL: 8,
      variancePercent: 8,
      rupeeImpact: 720,
      honestyStatus: 'CHRONIC_SHORTAGE',
    });
    expect(row.name).toBe('HP-1');
    expect(row.measuredL).toBe(92);
    expect(row.shortfallL).toBe(8);
    expect(row.status).toBe('CHRONIC_SHORTAGE');
  });

  it('sorts the biggest shortfall first', () => {
    const rows = sortPumps([
      { pumpName: 'A', shortfallL: 1 },
      { pumpName: 'B', shortfallL: 9 },
    ]);
    expect(rows[0].pumpName).toBe('B');
  });
});
