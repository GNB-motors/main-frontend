import { describe, it, expect } from 'vitest';
import {
  formatTripReportDate,
  formatTripReportCurrency,
  normalizeTripReportData,
} from './tripReportDetailFormat';

describe('formatTripReportDate', () => {
  it('returns a dash for a missing date', () => {
    expect(formatTripReportDate(null)).toBe('-');
    expect(formatTripReportDate(undefined)).toBe('-');
  });

  it('returns the raw string for an unparsable date', () => {
    expect(formatTripReportDate('not-a-date')).toBe('not-a-date');
  });

  it('formats a valid date as "DD Mon YYYY"', () => {
    expect(formatTripReportDate('2026-03-05T10:00:00.000Z')).toBe('05 Mar 2026');
  });
});

describe('formatTripReportCurrency', () => {
  it('returns a dash for a non-number', () => {
    expect(formatTripReportCurrency(null)).toBe('-');
    expect(formatTripReportCurrency(undefined)).toBe('-');
    expect(formatTripReportCurrency('1000')).toBe('-');
  });

  it('formats a number with the rupee symbol', () => {
    expect(formatTripReportCurrency(45000)).toBe('₹45,000');
  });
});

describe('normalizeTripReportData', () => {
  it('prefers the TripLedger shape when both are present', () => {
    const trip = {
      driver: { fullName: 'Ravi Kumar' },
      driverName: 'Fallback Name',
      vehicle: { registrationNumber: 'JH02BX1429', vehicleType: 'Truck' },
      vehicleRegNo: 'FALLBACK',
      route: {
        name: 'Ranchi Loop',
        sourceLocation: { city: 'Ranchi' },
        destLocation: { city: 'Patna' },
        distanceKm: 300,
      },
    };
    const result = normalizeTripReportData(trip);
    expect(result.driverName).toBe('Ravi Kumar');
    expect(result.vehicleReg).toBe('JH02BX1429');
    expect(result.vehicleType).toBe('Truck');
    expect(result.routeName).toBe('Ranchi Loop');
    expect(result.startLoc).toBe('Ranchi');
    expect(result.endLoc).toBe('Patna');
    expect(result.distanceKm).toBe(300);
  });

  it('falls back to the flat TripReport shape when TripLedger fields are absent', () => {
    const trip = {
      driverName: 'Suresh Yadav',
      vehicleRegNo: 'JH02BX4980',
      route: 'Dhanbad Express',
      startLocation: 'Dhanbad',
      endLocation: 'Kolkata',
      distanceKm: 250,
    };
    const result = normalizeTripReportData(trip);
    expect(result.driverName).toBe('Suresh Yadav');
    expect(result.vehicleReg).toBe('JH02BX4980');
    expect(result.routeName).toBe('Dhanbad Express');
    expect(result.startLoc).toBe('Dhanbad');
    expect(result.endLoc).toBe('Kolkata');
  });

  it('defaults every field to "-" (or undefined for numerics) on an empty trip', () => {
    const result = normalizeTripReportData({});
    expect(result.driverName).toBe('-');
    expect(result.vehicleReg).toBe('-');
    expect(result.routeName).toBe('-');
    expect(result.startLoc).toBe('-');
    expect(result.endLoc).toBe('-');
    expect(result.distanceKm).toBeUndefined();
    expect(result.revenue).toBeUndefined();
  });

  it('reads financial and weight fields from performance/weights', () => {
    const trip = {
      performance: { totalRevenue: 1000, totalExpense: 400, netProfit: 600, profitMargin: 60 },
      weights: { grossWeight: 5000, tareWeight: 2000, netWeight: 3000 },
    };
    const result = normalizeTripReportData(trip);
    expect(result.revenue).toBe(1000);
    expect(result.expense).toBe(400);
    expect(result.profit).toBe(600);
    expect(result.profitMargin).toBe(60);
    expect(result.grossWeight).toBe(5000);
    expect(result.tareWeight).toBe(2000);
    expect(result.netWeight).toBe(3000);
  });
});
