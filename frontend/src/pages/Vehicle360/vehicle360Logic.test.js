import { describe, it, expect } from 'vitest';
import { riskLamp, hasDefLedgerData, fuelUnit, defUnit } from './vehicle360Logic';

describe('riskLamp', () => {
  it('maps OVERDUE/DUE_SOON to their lamp classes and anything else to ok', () => {
    expect(riskLamp('OVERDUE')).toBe('lamp--critical');
    expect(riskLamp('DUE_SOON')).toBe('lamp--caution');
    expect(riskLamp('FINE')).toBe('lamp--ok');
    expect(riskLamp(undefined)).toBe('lamp--ok');
  });
});

describe('hasDefLedgerData', () => {
  it('is false for a missing balance', () => {
    expect(hasDefLedgerData(null)).toBe(false);
    expect(hasDefLedgerData(undefined)).toBe(false);
  });

  it('is false for an all-zero balance with no flags', () => {
    expect(hasDefLedgerData({ claimedAdblueL: 0, telemetryDefL: 0, expectedBalanceL: 0 })).toBe(
      false,
    );
  });

  it('is true when any figure is non-zero', () => {
    expect(hasDefLedgerData({ claimedAdblueL: 5, telemetryDefL: 0, expectedBalanceL: 0 })).toBe(
      true,
    );
  });

  it('is true when there are flags even if every figure is zero', () => {
    expect(
      hasDefLedgerData({ claimedAdblueL: 0, telemetryDefL: 0, expectedBalanceL: 0, flagCount: 2 }),
    ).toBe(true);
    expect(hasDefLedgerData({ flags: ['MISMATCH'] })).toBe(true);
  });
});

describe('fuelUnit / defUnit', () => {
  it('pass through "litres" only when the backend says so, else "unverified"', () => {
    expect(fuelUnit({ fuelLevelUnit: 'litres' })).toBe('litres');
    expect(fuelUnit({ fuelLevelUnit: 'percent' })).toBe('unverified');
    expect(fuelUnit(undefined)).toBe('unverified');
    expect(defUnit({ defLevelUnit: 'litres' })).toBe('litres');
    expect(defUnit(undefined)).toBe('unverified');
  });
});
