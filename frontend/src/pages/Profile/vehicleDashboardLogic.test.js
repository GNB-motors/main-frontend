import { describe, it, expect } from 'vitest';
import {
  daysUntil,
  bucketFor,
  computeVehicleDashboardKpis,
  DOC_COLS,
} from './vehicleDashboardLogic';

const NOW = new Date('2026-03-15T00:00:00.000Z');

describe('daysUntil', () => {
  it('returns null for a missing or invalid date', () => {
    expect(daysUntil(null, NOW)).toBeNull();
    expect(daysUntil(undefined, NOW)).toBeNull();
    expect(daysUntil('not-a-date', NOW)).toBeNull();
  });

  it('is positive for a future date and negative for a past one', () => {
    expect(daysUntil('2026-03-25', NOW)).toBe(10);
    expect(daysUntil('2026-03-05', NOW)).toBe(-10);
  });

  it('is zero for today', () => {
    expect(daysUntil('2026-03-15', NOW)).toBe(0);
  });
});

describe('bucketFor', () => {
  it('is "missing" when the document was never uploaded', () => {
    expect(bucketFor(undefined, NOW)).toBe('missing');
    expect(bucketFor({ uploaded: false }, NOW)).toBe('missing');
  });

  it('is "missing" when uploaded but expiry is not yet known (OCR pending)', () => {
    expect(bucketFor({ uploaded: true, expiryDate: null }, NOW)).toBe('missing');
  });

  it('is "expired" once past the expiry date', () => {
    expect(bucketFor({ uploaded: true, expiryDate: '2026-03-01' }, NOW)).toBe('expired');
  });

  it('is "critical" under 15 days out, "warning" between 15 and 30, "healthy" beyond', () => {
    expect(bucketFor({ uploaded: true, expiryDate: '2026-03-20' }, NOW)).toBe('critical'); // 5d
    expect(bucketFor({ uploaded: true, expiryDate: '2026-03-30' }, NOW)).toBe('warning'); // 15d
    expect(bucketFor({ uploaded: true, expiryDate: '2026-05-01' }, NOW)).toBe('healthy'); // 47d
  });
});

describe('computeVehicleDashboardKpis', () => {
  it('returns all zeros for an empty fleet', () => {
    expect(computeVehicleDashboardKpis([], NOW)).toEqual({
      total: 0,
      expired: 0,
      critical: 0,
      warning: 0,
      healthy: 0,
      missing: 0,
      totalDocSlots: 0,
    });
  });

  it('counts one doc slot per vehicle per document type', () => {
    const rows = [{ documents: {} }, { documents: {} }];
    expect(computeVehicleDashboardKpis(rows, NOW).totalDocSlots).toBe(
      rows.length * DOC_COLS.length,
    );
  });

  it('buckets each document slot across the fleet', () => {
    const rows = [
      { documents: { RC: { uploaded: true, expiryDate: '2026-05-01' } } }, // healthy
      { documents: { RC: { uploaded: true, expiryDate: '2026-03-01' } } }, // expired
    ];
    const kpis = computeVehicleDashboardKpis(rows, NOW);
    expect(kpis.total).toBe(2);
    expect(kpis.healthy).toBe(1);
    expect(kpis.expired).toBe(1);
    // every other doc slot across both rows (4 columns × 2 rows) has no entry at all → missing
    expect(kpis.missing).toBe(rows.length * (DOC_COLS.length - 1));
  });
});
