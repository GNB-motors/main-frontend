import { describe, it, expect } from 'vitest';
import {
  toDatetimeLocal,
  fromDatetimeLocal,
  formatCurrency,
  mapRawLog,
  formatLogTimestamp,
  TAB_TO_FUEL_TYPE,
  FILTER_CHIPS,
} from './refuelLogsReportUtils';

describe('refuelLogsReportUtils', () => {
  describe('datetime converters', () => {
    it('toDatetimeLocal converts ISO string to input datetime-local format', () => {
      expect(toDatetimeLocal('')).toBe('');
      expect(toDatetimeLocal(null)).toBe('');
      expect(toDatetimeLocal('invalid-date')).toBe('');
      const dt = toDatetimeLocal('2026-09-06T12:30:00.000Z');
      expect(dt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    });

    it('fromDatetimeLocal converts local string to ISO or null', () => {
      expect(fromDatetimeLocal('')).toBeNull();
      expect(fromDatetimeLocal(null)).toBeNull();
      expect(fromDatetimeLocal('invalid-date')).toBeNull();
      const iso = fromDatetimeLocal('2026-09-06T12:30');
      expect(iso).toContain('2026-09-06');
    });
  });

  describe('formatCurrency', () => {
    it('formats numbers into Indian rupee format or dash', () => {
      expect(formatCurrency(undefined)).toBe('-');
      expect(formatCurrency(null)).toBe('-');
      expect(formatCurrency('abc')).toBe('-');
      expect(formatCurrency(1500)).toBe('₹1,500.00');
      expect(formatCurrency(98.5)).toBe('₹98.50');
    });
  });

  describe('mapRawLog', () => {
    it('maps backend fuel log object into presentation row', () => {
      const raw = {
        _id: 'log-123',
        refuelTime: '2026-09-06T10:00:00Z',
        vehicleId: {
          _id: 'veh-1',
          registrationNumber: 'KA01AB1234',
          vehicleType: 'TRUCK',
        },
        driverId: {
          firstName: 'Suresh',
          lastName: 'Prasad',
        },
        location: 'Bangalore IOCL',
        fuelType: 'DIESEL',
        litres: 50.5,
        rate: 94.2,
        totalAmount: 4757.1,
        odometerReading: 12450,
        fillingType: 'FULL_TANK',
      };

      const mapped = mapRawLog(raw);
      expect(mapped.id).toBe('log-123');
      expect(mapped.vehicleNo).toBe('KA01AB1234');
      expect(mapped.vehicleModel).toBe('TRUCK');
      expect(mapped.driverName).toBe('Suresh Prasad');
      expect(mapped.fuelType).toBe('diesel');
      expect(mapped.quantity).toBe(50.5);
      expect(mapped.unitPrice).toBe(94.2);
      expect(mapped.notes).toBe('Full Tank');
      expect(mapped.rawLitres).toBe(50.5);
    });

    it('handles driver from tripId fallback if direct driver is absent', () => {
      const raw = {
        _id: 'log-456',
        tripId: {
          driverId: { firstName: 'Ramesh' },
        },
      };
      const mapped = mapRawLog(raw);
      expect(mapped.driverName).toBe('Ramesh');
    });
  });

  describe('formatLogTimestamp', () => {
    it('formats combined date and time', () => {
      const formatted = formatLogTimestamp('2026-09-06', '12:00:00');
      expect(formatted).toBeTruthy();
    });
  });

  describe('constants', () => {
    it('TAB_TO_FUEL_TYPE maps tab IDs to API fuel types', () => {
      expect(TAB_TO_FUEL_TYPE.all).toBeUndefined();
      expect(TAB_TO_FUEL_TYPE.diesel).toBe('DIESEL');
      expect(TAB_TO_FUEL_TYPE.adblue).toBe('ADBLUE');
    });

    it('FILTER_CHIPS has all, diesel, adblue', () => {
      expect(FILTER_CHIPS).toHaveLength(3);
    });
  });
});
