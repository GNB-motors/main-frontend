import { describe, it, expect } from 'vitest';
import {
  getTripStatusColor,
  formatTripDate,
  formatTripCurrency,
  normalizeTripMileage,
  computeTripFinancials,
} from './tripDetail';

describe('getTripStatusColor', () => {
  it('maps known statuses', () => {
    expect(getTripStatusColor('SUBMITTED')).toBe('#4caf50');
    expect(getTripStatusColor('ONGOING')).toBe('#ff9800');
    expect(getTripStatusColor('PLANNED')).toBe('#2196f3');
  });

  it('falls back to grey for unknown/missing statuses', () => {
    expect(getTripStatusColor('WIDGETIZED')).toBe('#757575');
    expect(getTripStatusColor(undefined)).toBe('#757575');
    expect(getTripStatusColor(null)).toBe('#757575');
  });
});

describe('formatTripDate', () => {
  it('returns dash for empty input', () => {
    expect(formatTripDate(null)).toBe('-');
    expect(formatTripDate('')).toBe('-');
    expect(formatTripDate(undefined)).toBe('-');
  });

  it('formats a date with time', () => {
    const out = formatTripDate('2026-08-15T10:30:00Z');
    expect(out).toContain('2026');
    expect(out).toContain('August');
    expect(out).toContain('15');
  });
});

describe('formatTripCurrency', () => {
  it('returns dash for null/undefined but not for 0', () => {
    expect(formatTripCurrency(null)).toBe('-');
    expect(formatTripCurrency(undefined)).toBe('-');
    expect(formatTripCurrency(0)).not.toBe('-');
  });

  it('formats INR with the en-IN locale', () => {
    const out = formatTripCurrency(123456.789);
    expect(out).toContain('₹');
    expect(out).toContain('1,23,456');
  });
});

describe('normalizeTripMileage', () => {
  it('prefers journeyId.mileage over top-level mileage', () => {
    const trip = {
      journeyId: { mileage: { startOdometer: 100, totalFuelUsedL: 40 } },
      mileage: { startOdometer: 999, endOdometer: 500 },
    };
    const m = normalizeTripMileage(trip);
    expect(m.startOdometer).toBe(100);
    expect(m.endOdometer).toBe(500); // falls back to top-level
    expect(m.fuelLitres).toBe(40);
  });

  it('maps legacy top-level field names', () => {
    const m = normalizeTripMileage({ mileage: { distanceKm: 120, totalFuelUsedL: 10 } });
    expect(m.totalDistanceKm).toBe(120);
    expect(m.fuelLitres).toBe(10);
  });

  it('returns all-undefined for a trip with no mileage data', () => {
    expect(normalizeTripMileage({})).toEqual({
      startOdometer: undefined,
      endOdometer: undefined,
      totalDistanceKm: undefined,
      fuelLitres: undefined,
      fuelMileageKmPerL: undefined,
    });
    expect(normalizeTripMileage(null)).toEqual(normalizeTripMileage({}));
  });
});

describe('computeTripFinancials', () => {
  it('prefers journeyFinancials when present', () => {
    const trip = {
      journeyFinancials: { totalRevenue: 1000, totalExpenses: 400, netProfit: 600, totalTrips: 2 },
      weightSlipTrips: [{ revenue: { actualAmountReceived: 5 } }],
    };
    expect(computeTripFinancials(trip)).toEqual({
      totalRevenue: 1000,
      totalExpense: 400,
      netProfit: 600,
      totalTrips: 2,
    });
  });

  it('computes netProfit from revenue minus expense when journeyFinancials lacks it', () => {
    const trip = {
      journeyFinancials: { totalRevenue: 500, totalExpenses: 200, totalTrips: 1 },
    };
    expect(computeTripFinancials(trip).netProfit).toBe(300);
  });

  it('falls back to weightSlipTrips roll-up', () => {
    const trip = {
      weightSlipTrips: [
        {
          revenue: { actualAmountReceived: 1000 },
          expenses: {
            materialCost: 100,
            toll: 50,
            driverCost: 30,
            driverTripExpense: 20,
            royalty: 10,
            allocatedFuelCost: 40,
          },
        },
        {
          revenue: { actualAmountReceived: 500 },
          expenses: { materialCost: 200 },
        },
      ],
    };
    const f = computeTripFinancials(trip);
    expect(f.totalRevenue).toBe(1500);
    expect(f.totalExpense).toBe(450);
    expect(f.netProfit).toBe(1050);
    expect(f.totalTrips).toBe(2);
  });

  it('defaults to zeros for an empty trip', () => {
    expect(computeTripFinancials({})).toEqual({
      totalRevenue: 0,
      totalExpense: 0,
      netProfit: 0,
      totalTrips: 0,
    });
  });
});
