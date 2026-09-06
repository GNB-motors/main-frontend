import { describe, it, expect } from 'vitest';
import {
  formatAdBlueCurrency,
  mapAdBlueLogResponse,
  generateAdBluePageNumbers,
} from './adBlueTrackingLogic';

describe('formatAdBlueCurrency', () => {
  it('returns a dash for a missing or non-numeric value', () => {
    expect(formatAdBlueCurrency(null)).toBe('-');
    expect(formatAdBlueCurrency(undefined)).toBe('-');
    expect(formatAdBlueCurrency('abc')).toBe('-');
  });

  it('formats a number as INR with exactly 2 decimal places', () => {
    expect(formatAdBlueCurrency(1500)).toBe('₹1,500.00');
    expect(formatAdBlueCurrency(1500.5)).toBe('₹1,500.50');
  });
});

describe('mapAdBlueLogResponse', () => {
  it('returns an empty array for no rows', () => {
    expect(mapAdBlueLogResponse(undefined)).toEqual([]);
    expect(mapAdBlueLogResponse([])).toEqual([]);
  });

  it('maps a full row, deriving date/time from filledAt', () => {
    const [row] = mapAdBlueLogResponse([
      {
        _id: 'log1',
        filledAt: '2026-03-05T10:00:00.000Z',
        vehicleId: { registrationNumber: 'JH02BX1429', vehicleType: 'Truck' },
        driverId: { firstName: 'Ravi', lastName: 'Kumar' },
        place: 'Ranchi',
        litres: 40,
        amount: 1200,
        documentId: { _id: 'doc1' },
      },
    ]);
    expect(row.id).toBe('log1');
    expect(row.vehicleNo).toBe('JH02BX1429');
    expect(row.vehicleModel).toBe('Truck');
    expect(row.driverName).toBe('Ravi Kumar');
    expect(row.place).toBe('Ranchi');
    expect(row.litres).toBe(40);
    expect(row.amount).toBe(1200);
    expect(row.documentId).toBe('doc1');
    expect(row.date).not.toBeNull();
    expect(row.time).not.toBeNull();
  });

  it('defaults missing fields to "-" or null', () => {
    const [row] = mapAdBlueLogResponse([{ _id: 'log2' }]);
    expect(row.vehicleNo).toBe('-');
    expect(row.vehicleModel).toBe('-');
    expect(row.driverName).toBe('-');
    expect(row.place).toBe('-');
    expect(row.date).toBeNull();
    expect(row.documentId).toBeNull();
  });
});

describe('generateAdBluePageNumbers', () => {
  it('lists every page when there are 5 or fewer', () => {
    expect(generateAdBluePageNumbers(5, 3)).toEqual([1, 2, 3, 4, 5]);
    expect(generateAdBluePageNumbers(1, 1)).toEqual([1]);
  });

  it('windows around the current page with ellipses once there are more than 5', () => {
    expect(generateAdBluePageNumbers(10, 5)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });

  it('has no leading ellipsis near the start', () => {
    expect(generateAdBluePageNumbers(10, 2)).toEqual([1, 2, 3, '...', 10]);
  });

  it('has no trailing ellipsis near the end', () => {
    expect(generateAdBluePageNumbers(10, 9)).toEqual([1, '...', 8, 9, 10]);
  });
});
