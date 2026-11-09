import { describe, expect, it } from 'vitest';
import { missingReasons, sortAdvisories } from './refuelAdvisoryModel';
import { pumpRow, sortPumps, normalisePumpLedger } from './pumpHonestyModel';

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

it('builds the pump card and tab totals from the same Fuel Integrity ledger', () => {
  const ledger = normalisePumpLedger({
    window: { from: '2026-10-01', to: '2026-10-31' },
    pumps: [
      {
        pump: 'HP-1',
        fills: 4,
        claimedLitres: 400,
        actualLitres: 352,
        shortfallLitres: 48,
        shortfallPct: 12,
        estimatedLossInr: 4320,
      },
      {
        pump: 'HP-2',
        fills: 2,
        claimedLitres: 200,
        actualLitres: 198,
        shortfallLitres: 2,
        shortfallPct: 1,
        estimatedLossInr: 180,
      },
    ],
  });
  expect(ledger.summary).toMatchObject({
    totalPumpsEvaluated: 2,
    totalAuditedFills: 6,
    totalShortLitres: 50,
    totalRupeeLoss: 4500,
    chronicPumpsCount: 1,
  });
  expect(pumpRow(ledger.pumps[0])).toMatchObject({
    name: 'HP-1',
    fills: 4,
    billedL: 400,
    measuredL: 352,
    shortfallL: 48,
    variancePct: 12,
    rupeeLoss: 4320,
    status: 'CHRONIC_SHORTAGE',
  });
  expect(ledger.pumps[1].status).toBe('INSUFFICIENT_DATA');
});
