import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatDate,
  toStartOfDayIso,
  toEndOfDayIso,
  buildFilterParams,
  extractVehicleOptions,
  extractDriverOptions,
} from './mileageIntervalReportUtils';

describe('mileageIntervalReportUtils', () => {
  describe('formatNumber', () => {
    it('formats numbers using en-IN locale', () => {
      expect(formatNumber(12500)).toBe('12,500');
      expect(formatNumber(12500.55, 1)).toBe('12,500.6');
      expect(formatNumber(null)).toBe('—');
      expect(formatNumber(undefined)).toBe('—');
      expect(formatNumber('abc')).toBe('—');
    });
  });

  describe('formatCurrency', () => {
    it('formats Indian rupee currency', () => {
      expect(formatCurrency(25000)).toBe('₹25,000');
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('formatDate (Asia/Kolkata)', () => {
    it('formats UTC timestamp in IST', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('2026-09-06T12:00:00Z')).toBe('06 Sep 2026');
    });
  });

  describe('ISO day boundaries', () => {
    it('toStartOfDayIso produces start-of-day ISO', () => {
      expect(toStartOfDayIso('')).toBeUndefined();
      expect(toStartOfDayIso(null)).toBeUndefined();
      const start = toStartOfDayIso('2026-09-06');
      expect(start).toContain('2026-09-06');
    });

    it('toEndOfDayIso produces end-of-day ISO', () => {
      expect(toEndOfDayIso('')).toBeUndefined();
      expect(toEndOfDayIso(null)).toBeUndefined();
      const end = toEndOfDayIso('2026-09-06');
      expect(end).toContain('2026-09-06');
    });
  });

  describe('buildFilterParams', () => {
    it('builds query params omitting "all" and empty values', () => {
      const params = buildFilterParams({
        startDate: '2026-09-01',
        endDate: '2026-09-05',
        vehicleId: 'veh-123',
        driverId: 'all',
      });
      expect(params.startDate).toContain('2026-09-01');
      expect(params.endDate).toContain('2026-09-05');
      expect(params.vehicleId).toBe('veh-123');
      expect(params.driverId).toBeUndefined();
    });
  });

  describe('options extractors', () => {
    it('extractVehicleOptions handles array responses and extracts id + label', () => {
      const vehicles = [
        { _id: 'v1', registrationNumber: 'KA01AB1234' },
        { id: 'v2', vehicleNumber: 'MH02CD5678' },
        { id: undefined },
      ];
      const opts = extractVehicleOptions(vehicles);
      expect(opts).toEqual([
        { id: 'v1', label: 'KA01AB1234' },
        { id: 'v2', label: 'MH02CD5678' },
      ]);
    });

    it('extractDriverOptions filters for DRIVER role and formats name', () => {
      const employees = [
        { _id: 'd1', firstName: 'Raj', lastName: 'Kumar', role: 'DRIVER' },
        { _id: 'd2', firstName: 'Amit', role: 'MANAGER' },
        { _id: 'd3', firstName: 'Vikram', lastName: 'Singh' },
      ];
      const opts = extractDriverOptions(employees);
      expect(opts).toEqual([
        { id: 'd1', label: 'Raj Kumar' },
        { id: 'd3', label: 'Vikram Singh' },
      ]);
    });
  });
});
