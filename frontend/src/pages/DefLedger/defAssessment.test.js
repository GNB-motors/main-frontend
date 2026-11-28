import { expect, it } from 'vitest';
import { isDefVerified } from './defLedgerFormat';

const measured = {
  claimsTracked: true,
  flagCount: 0,
  status: 'COMPLIANT',
  coverageFrom: '2026-11-20T00:00:00Z',
  coverageTo: '2026-11-27T00:00:00Z',
  freshness: { status: 'RECENT', asOf: '2026-11-27T00:00:00Z' },
};
it('verifies only an assessed, current measurement', () => {
  expect(isDefVerified(measured)).toBe(true);
  for (const status of [
    'NO_DATA',
    'NOT_ASSESSED',
    'NOT_REPORTED',
    'HELD_BACK',
    'FLAGGED',
    'DEFICIT',
  ]) {
    expect(isDefVerified({ ...measured, status })).toBe(false);
  }
  expect(
    isDefVerified({ ...measured, freshness: { status: 'STALE', asOf: measured.coverageTo } }),
  ).toBe(false);
  expect(isDefVerified({ ...measured, coverageFrom: null })).toBe(false);
});
