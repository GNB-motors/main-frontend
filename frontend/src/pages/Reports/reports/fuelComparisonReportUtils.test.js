import { describe, it, expect } from 'vitest';
import {
  toIST,
  formatIST,
  formatRelativeIST,
  formatDateRange,
  formatVariance,
  mapComparisonRowForExport,
  buildFuelComparisonCsv,
} from './fuelComparisonReportUtils';

describe('fuelComparisonReportUtils', () => {
  describe('date formatters (Asia/Kolkata)', () => {
    it('toIST handles null/undefined and returns dayjs in IST', () => {
      expect(toIST(null)).toBeNull();
      expect(toIST(undefined)).toBeNull();
      const d = toIST('2026-09-06T12:00:00Z');
      expect(d.format('HH:mm')).toBe('17:30');
    });

    it('formatIST returns formatted IST string', () => {
      expect(formatIST(null)).toBe('—');
      expect(formatIST('2026-09-06T12:00:00Z')).toBe('06 Sep 2026, 05:30 PM IST');
    });

    it('formatRelativeIST returns relative time string', () => {
      expect(formatRelativeIST(null)).toBeNull();
      expect(typeof formatRelativeIST('2026-09-06T12:00:00Z')).toBe('string');
    });

    it('formatDateRange formats from and to dates', () => {
      expect(formatDateRange(null, null)).toBe('— → —');
      expect(formatDateRange('2026-09-01T00:00:00Z', '2026-09-05T00:00:00Z')).toBe(
        '01 Sep 26 → 05 Sep 26',
      );
    });
  });

  describe('formatVariance', () => {
    it('formats positive and negative variances with sign and percentage', () => {
      expect(formatVariance(null, null)).toBe('—');
      expect(formatVariance(15.5, 12.3)).toBe('+15.50 L (+12.3%)');
      expect(formatVariance(-5.2, -4.1)).toBe('-5.20 L (-4.1%)');
      expect(formatVariance(0, 0)).toBe('0.00 L (0.0%)');
    });
  });

  describe('export helpers', () => {
    const mockRecord = {
      _id: 'rec-1',
      vehicleId: { registrationNumber: 'KA01AB1234' },
      driverId: { firstName: 'Ramesh', lastName: 'Kumar' },
      billFuelConsumed: 120.5,
      fleetEdgeFuelConsumed: 100.0,
      variance: 20.5,
      variancePercent: 20.5,
      isFlagged: true,
      fromDate: '2026-09-01T00:00:00Z',
      toDate: '2026-09-05T00:00:00Z',
    };

    it('mapComparisonRowForExport produces flat row data', () => {
      const row = mapComparisonRowForExport(mockRecord);
      expect(row).toEqual({
        vehicleNo: 'KA01AB1234',
        driver: 'Ramesh Kumar',
        billFuel: '120.50',
        fleetEdgeFuel: '100.00',
        variance: '20.50',
        variancePercent: '20.50',
        status: 'Flagged',
        fromDate: '01/09/2026',
        toDate: '05/09/2026',
      });
    });

    it('buildFuelComparisonCsv creates valid quoted CSV output', () => {
      const csv = buildFuelComparisonCsv([mockRecord]);
      expect(csv).toContain('"Vehicle No.","Driver"');
      expect(csv).toContain(
        '"KA01AB1234","Ramesh Kumar","120.50","100.00","20.50","20.50","Flagged"',
      );
    });
  });
});
