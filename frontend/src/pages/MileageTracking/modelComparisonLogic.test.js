import { describe, it, expect } from 'vitest';
import {
  getVariancePercent,
  getPerformanceStatus,
  getPerformanceColor,
  buildVehicleChartData,
  defaultVehicleSelection,
  countAtRisk,
} from './modelComparisonLogic';

describe('getVariancePercent', () => {
  it('is 0 when there is no model average to compare against', () => {
    expect(getVariancePercent(10, 0)).toBe(0);
    expect(getVariancePercent(10, null)).toBe(0);
  });

  it('is negative when the vehicle underperforms the model average', () => {
    expect(getVariancePercent(9, 10)).toBe(-10);
  });

  it('is positive when the vehicle beats the model average', () => {
    expect(getVariancePercent(11, 10)).toBe(10);
  });
});

describe('getPerformanceStatus', () => {
  it('is Healthy at or above -5%', () => {
    expect(getPerformanceStatus(0)).toBe('Healthy');
    expect(getPerformanceStatus(-5)).toBe('Healthy');
  });

  it('is Watch between -5% and -10%', () => {
    expect(getPerformanceStatus(-7)).toBe('Watch');
    expect(getPerformanceStatus(-10)).toBe('Watch');
  });

  it('is Poor below -10%', () => {
    expect(getPerformanceStatus(-11)).toBe('Poor');
  });
});

describe('getPerformanceColor', () => {
  it('maps each status to its color and falls back for an unknown one', () => {
    expect(getPerformanceColor('Healthy')).toBe('#10B981');
    expect(getPerformanceColor('Poor')).toBe('#EF4444');
    expect(getPerformanceColor('???')).toBe('#6B7280');
  });
});

describe('buildVehicleChartData', () => {
  it('returns an empty array when there is no model data', () => {
    expect(buildVehicleChartData(null)).toEqual([]);
  });

  it('tags each vehicle with variance/status/color and sorts by mileage descending', () => {
    const modelData = {
      avgMileage: 10,
      vehicles: [
        { vehicleNumber: 'A', avgMileage: 8 }, // -20% → Poor
        { vehicleNumber: 'B', avgMileage: 11 }, // +10% → Healthy
      ],
    };
    const result = buildVehicleChartData(modelData);
    expect(result.map((v) => v.vehicleNumber)).toEqual(['B', 'A']);
    expect(result[0].status).toBe('Healthy');
    expect(result[1].status).toBe('Poor');
  });
});

describe('defaultVehicleSelection', () => {
  it('takes the top 3 and bottom 3 with no duplicates when they overlap', () => {
    // Already sorted descending, as the caller guarantees. Top 3 = A,B,C;
    // bottom 3 = B,C,D — B and C overlap and must not appear twice.
    const data = ['A', 'B', 'C', 'D'].map((n) => ({ vehicleNumber: n }));
    expect(defaultVehicleSelection(data)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('dedupes fully when there are 3 or fewer vehicles total', () => {
    const data = ['A', 'B'].map((n) => ({ vehicleNumber: n }));
    expect(defaultVehicleSelection(data)).toEqual(['A', 'B']);
  });
});

describe('countAtRisk', () => {
  it('counts vehicles more than 5% below the model average', () => {
    const vehicles = [{ avgMileage: 8 }, { avgMileage: 9.6 }, { avgMileage: 11 }];
    expect(countAtRisk(vehicles, 10)).toBe(1);
  });

  it('is 0 for a missing vehicle list', () => {
    expect(countAtRisk(undefined, 10)).toBe(0);
  });
});
