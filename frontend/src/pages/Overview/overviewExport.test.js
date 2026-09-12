import { describe, it, expect } from 'vitest';
import { buildOverviewExportRows } from './overviewExport';

const baseInput = {
  selectedDays: 7,
  health: { score: 82, grade: 'B' },
  vehicles: { total: 12, active: 9 },
  drivers: { total: 15 },
  trips: { total: 340 },
  kilometers: { total: 42000 },
  money: {
    money: {
      fuelCostInr: 1000,
      defCostInr: 200,
      idlingWasteInr: 30,
      detourWasteInr: 40,
      theftLossInr: 50,
      billFraudSuspectInr: 60,
    },
    totalWasteInr: 180,
  },
  utilization: { fleet: { emptyKmPct: 12.5 } },
  downtime: { totalExposureInr: 900 },
};

const rowValue = (rows, label) => rows.find((r) => r[0] === label)?.[1];

describe('buildOverviewExportRows', () => {
  it('starts with the header row and the date-range label', () => {
    const rows = buildOverviewExportRows(baseInput);
    expect(rows[0]).toEqual(['Metric', 'Value']);
    expect(rowValue(rows, 'Date range')).toBe('Last 7 days');
  });

  it('flattens the owner-value money feed into cost and waste rows', () => {
    const rows = buildOverviewExportRows(baseInput);
    expect(rowValue(rows, 'Fuel cost (₹)')).toBe(1000);
    expect(rowValue(rows, 'DEF cost (₹)')).toBe(200);
    expect(rowValue(rows, 'Idling waste (₹)')).toBe(30);
    expect(rowValue(rows, 'Detour waste (₹)')).toBe(40);
    expect(rowValue(rows, 'Theft loss (₹)')).toBe(50);
    expect(rowValue(rows, 'Bill fraud suspect (₹)')).toBe(60);
    expect(rowValue(rows, 'Recoverable waste (₹)')).toBe(180);
  });

  it('copies health, fleet, utilization and downtime figures', () => {
    const rows = buildOverviewExportRows(baseInput);
    expect(rowValue(rows, 'Fleet health score')).toBe(82);
    expect(rowValue(rows, 'Fleet health grade')).toBe('B');
    expect(rowValue(rows, 'Total vehicles')).toBe(12);
    expect(rowValue(rows, 'Active vehicles')).toBe(9);
    expect(rowValue(rows, 'Total drivers')).toBe(15);
    expect(rowValue(rows, 'Total trips')).toBe(340);
    expect(rowValue(rows, 'Distance (km)')).toBe(42000);
    expect(rowValue(rows, 'Empty running (%)')).toBe(12.5);
    expect(rowValue(rows, 'Downtime exposure (₹)')).toBe(900);
  });

  it('defaults numeric cells to 0 and missing health/utilization to an em dash', () => {
    const rows = buildOverviewExportRows({ selectedDays: 30 });
    expect(rowValue(rows, 'Date range')).toBe('Last 30 days');
    expect(rowValue(rows, 'Fleet health score')).toBe('—');
    expect(rowValue(rows, 'Fleet health grade')).toBe('—');
    expect(rowValue(rows, 'Total vehicles')).toBe(0);
    expect(rowValue(rows, 'Fuel cost (₹)')).toBe(0);
    expect(rowValue(rows, 'Empty running (%)')).toBe('—');
    expect(rowValue(rows, 'Downtime exposure (₹)')).toBe(0);
  });

  it('keeps a zero health score instead of falling back to the dash', () => {
    const rows = buildOverviewExportRows({ ...baseInput, health: { score: 0, grade: 'F' } });
    expect(rowValue(rows, 'Fleet health score')).toBe(0);
  });
});
