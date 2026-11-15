import { expect, it } from 'vitest';
import {
  mapUnifiedRow,
  drawerFromLiveRow,
  drawerFromReconciliationRow,
  REFUEL_CHIPS,
} from './refuelRows';
import { reconciliationExplanation, fillVerdict } from './fillExplanations';
import { kpisFromSources } from './cycleRows';
import { label } from '../../lib/vocabulary';

it('uses the same corrected figures and comparison evidence in both drawers', () => {
  const evidence = {
    litres: 99,
    rawLitres: 91,
    correction: 'V2_GAIN',
    billVarianceL: -1,
    billToleranceL: 25,
    billFlag: false,
    billComparable: true,
    v1BillVarianceL: -9,
    v1BillFlag: true,
  };
  const live = drawerFromLiveRow(
    mapUnifiedRow({
      id: 'log1',
      verificationStatus: 'VERIFIED',
      slip: { litres: 100 },
      sensor: evidence,
    }),
  );
  const rec = drawerFromReconciliationRow({
    billLitres: 100,
    telemetryLitres: 99,
    rawLitres: 91,
    varianceL: -1,
    correction: 'V2_GAIN',
    billToleranceL: 25,
    billFlag: false,
    billComparable: true,
    v1VarianceL: -9,
    v1Flagged: true,
    status: 'CLEAN',
  });
  expect(live.result).toBe('BILL_MATCHES');
  expect(rec.result).toBe(live.result);
  expect(rec.sensor.litres).toBe(live.sensor.litres);
  expect(rec.sensor.rawLitres).toBe(live.sensor.rawLitres);
  expect(rec.billCheck).toEqual(live.billCheck);
  expect(rec.varianceL).toBe(live.varianceL);
  const tip = reconciliationExplanation({
    billLitres: 100,
    telemetryLitres: 99,
    rawLitres: 91,
    varianceL: -1,
    billToleranceL: 25,
  });
  expect(tip.lines).toContainEqual(['Allowed', '± 25.0 L']);
  expect(tip.lines).toContainEqual(['Corrected sensor fill', '99.0 L']);
});

it('unavailable comparison is never labelled Bill matches in either tab or drawer', () => {
  const live = drawerFromLiveRow(
    mapUnifiedRow({
      verificationStatus: 'UNASSESSED',
      slip: { litres: 100 },
      sensor: { litres: 99, billComparable: false },
    }),
  );
  const rec = drawerFromReconciliationRow({
    status: 'UNAVAILABLE',
    billLitres: 100,
    telemetryLitres: 99,
    billComparable: false,
  });
  expect(live.result).toBe('COMPARISON_UNAVAILABLE');
  expect(rec.result).toBe(live.result);
  expect(label('refuel', live.result)).toBe('Comparison unavailable');
  expect(fillVerdict(rec).headline).toContain('cannot reliably');
  expect(reconciliationExplanation({ billComparable: false }).text).toContain('unavailable');
  expect(reconciliationExplanation({}).lines).toContainEqual(['Allowed', '—']);
});

it('unassessed bill rows remain in fleet bills, spend, All fills and coverage denominator', () => {
  const meta = {
    verified: 2,
    flagged: 1,
    unverified: 1,
    slipOnly: 1,
    unassessed: 2,
    sensorGlitch: 1,
    totalSpendInr: 6000,
  };
  expect(REFUEL_CHIPS.find((c) => c.key === 'all').count(meta)).toBe(7);
  expect(REFUEL_CHIPS.find((c) => c.key === 'unassessed').count(meta)).toBe(2);
  expect(kpisFromSources({ feedMeta: meta })).toMatchObject({
    bills: 6,
    sensorFills: 6,
    matched: 3,
    reconciledPct: 50,
    spendInr: 6000,
  });
});
