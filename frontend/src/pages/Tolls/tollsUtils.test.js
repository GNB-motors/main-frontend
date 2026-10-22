import { describe, it, expect } from 'vitest';
import {
  summaryTiles,
  filterVehicles,
  formatGap,
  formatPct,
  vehicleRows,
  exportCsvText,
  currentMonth,
} from './tollsUtils.js';

const REPORT = {
  month: '2026-10',
  summary: {
    crossings: 12,
    vehicles: 2,
    spendInr: 1350,
    returnCrossings: 4,
    savingsInr: 600,
    missedReturnInr: 150,
    anomalyCount: 1,
  },
  vehicles: [
    {
      vehicleId: 'v1',
      registrationNumber: 'WB26TL0001',
      crossings: 8,
      onward: 4,
      returnCrossings: 4,
      returnRatio: 0.5,
      spendInr: 900,
      savingsInr: 600,
      noFareCrossings: 0,
      repeatsInsideWindow: 3,
      repeatsOutsideWindow: 0,
      possibleOverpay: false,
      plazaBreakdown: [
        { plazaId: 'p1', name: 'Dumur', code: 'NH44-D', highway: 'NH44', crossings: 5, onward: 2, ret: 3, spend: 600, savings: 450 },
        { plazaId: 'p2', name: 'Bolgora', code: 'NH2-B', highway: 'NH2', crossings: 3, onward: 2, ret: 1, spend: 300, savings: 150 },
      ],
    },
    {
      vehicleId: 'v2',
      registrationNumber: 'WB26TL0002',
      crossings: 4,
      onward: 4,
      returnCrossings: 0,
      returnRatio: 0,
      spendInr: 450,
      savingsInr: 0,
      noFareCrossings: 1,
      repeatsInsideWindow: 0,
      repeatsOutsideWindow: 1,
      possibleOverpay: true,
      plazaBreakdown: [
        { plazaId: 'p1', name: 'Dumur', code: 'NH44-D', highway: 'NH44', crossings: 4, onward: 4, ret: 0, spend: 450, savings: 0 },
      ],
    },
  ],
  anomalies: [],
};

describe('tollsUtils', () => {
  it('builds the four summary tiles and marks missed returns amber', () => {
    const tiles = summaryTiles(REPORT.summary);
    expect(tiles.map((t) => t.key)).toEqual(['spend', 'crossings', 'savings', 'missed']);
    expect(tiles[0]).toMatchObject({ label: 'Month spend', suffix: '₹' });
    expect(tiles[1]).toMatchObject({ label: 'Crossings', value: 12 });
    expect(tiles[3]).toMatchObject({ tone: 'amber' });
    expect(tiles[3].hint).toMatch(/1 crossing\(s\) billed onward/);
  });

  it('treats a clean month as the neutral tone, not a warning', () => {
    const tiles = summaryTiles({ ...REPORT.summary, anomalyCount: 0, missedReturnInr: 0 });
    expect(tiles[3].tone).toBe('slate');
    expect(tiles[3].hint).toMatch(/Every return/);
  });

  it('survives a summary with nothing in it', () => {
    expect(summaryTiles(undefined).every((t) => t.value !== undefined)).toBe(true);
  });

  it('filters by registration and by the two review populations', () => {
    const all = vehicleRows(REPORT.vehicles);
    expect(all).toHaveLength(2);
    expect(all[0].plazaSummary).toBe('Dumur ×5, Bolgora ×3');

    expect(filterVehicles(all, { search: 'tl0001' }).map((v) => v.vehicleId)).toEqual(['v1']);
    expect(filterVehicles(all, { search: 'TL0001' }).map((v) => v.vehicleId)).toEqual(['v1']);
    expect(filterVehicles(all, { search: 'nope' })).toHaveLength(0);

    expect(filterVehicles(all, { flag: 'savers' }).map((v) => v.vehicleId)).toEqual(['v1']);
    expect(filterVehicles(all, { flag: 'overpay' }).map((v) => v.vehicleId)).toEqual(['v2']);
    expect(filterVehicles(all, { flag: 'all' })).toHaveLength(2);
  });

  it('formats a gap in the units an operator reads', () => {
    expect(formatGap(4)).toBe('4h');
    expect(formatGap(6)).toBe('6h');
    expect(formatGap(6.5)).toBe('6h 30m');
    expect(formatGap(0.5)).toBe('30m');
    expect(formatGap(26)).toBe('1d 2h');
    expect(formatGap(null)).toBe('—');
  });

  it('formats the return share as a percentage', () => {
    expect(formatPct(0.5)).toBe('50%');
    expect(formatPct(0)).toBe('0%');
    expect(formatPct(null)).toBe('—');
  });

  it('exports one CSV row per vehicle x plaza', () => {
    const csv = exportCsvText(REPORT);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toMatch(/^MONTH,VEHICLE,PLAZA/);
    expect(lines).toHaveLength(4); // header + 3 vehicle×plaza pairs
    expect(lines[1]).toContain('WB26TL0001');
    expect(lines[1]).toContain('600'); // savings for Dumur
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('defaults the month picker to the current calendar month', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/);
  });
});