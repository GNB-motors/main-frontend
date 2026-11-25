import { expect, it } from 'vitest';
import { isStale, summarizeAdvisories } from './refuelAdvisoryModel';

const now = Date.parse('2026-11-25T12:00:00Z');
const rows = [
  {
    registrationNumber: 'A',
    status: 'CRITICAL',
    currentFuelL: 20,
    tankCapacityL: 400,
    estimatedRangeKm: 70,
    litresToFull: 380,
    estimatedFillCostInr: 34000,
    lastReadingAt: '2026-11-25T11:00:00Z',
  },
  {
    registrationNumber: 'B',
    status: 'REFUEL_SOON',
    currentFuelL: 80,
    tankCapacityL: null,
    estimatedRangeKm: 280,
    litresToFull: null,
    estimatedFillCostInr: null,
    lastReadingAt: '2026-11-24T10:00:00Z',
  },
  {
    registrationNumber: 'C',
    status: 'OK',
    currentFuelL: 300,
    tankCapacityL: 400,
    estimatedRangeKm: null,
    litresToFull: 100,
    estimatedFillCostInr: 9000,
    lastReadingAt: '2026-11-25T09:00:00Z',
  },
];

it('adds up only the trucks that have each value and says how many did', () => {
  const summary = summarizeAdvisories(rows, { staleReadingHours: 12 }, now);
  expect(summary.counts).toEqual({ CRITICAL: 1, REFUEL_SOON: 1, OK: 1 });
  expect(summary.onBoard).toEqual({ value: 400, trucks: 3 });
  expect(summary.pctFull).toBe(40);
  expect(summary.tankTrucks).toBe(2);
  expect(summary.atRisk).toEqual({
    trucks: 2,
    litres: { value: 380, trucks: 1 },
    cost: { value: 34000, trucks: 1 },
  });
  expect(summary.fleet.cost).toEqual({ value: 43000, trucks: 2 });
  expect(summary.medianRangeKm).toBe(175);
  expect(summary.shortest.registrationNumber).toBe('A');
  expect(summary.stale).toBe(1);
  expect(summary.newestReadingAt).toBe('2026-11-25T11:00:00.000Z');
});

it('leaves totals unknown instead of zero when no truck has the value', () => {
  const summary = summarizeAdvisories([{ status: 'OK' }], {}, now);
  expect(summary.onBoard.value).toBeNull();
  expect(summary.pctFull).toBeNull();
  expect(summary.medianRangeKm).toBeNull();
  expect(summary.stale).toBeNull();
});

it('treats a reading without a time as stale only when a limit is known', () => {
  expect(isStale({}, 12, now)).toBe(true);
  expect(isStale({}, null, now)).toBe(false);
});
