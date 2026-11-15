import { describe, it, expect } from 'vitest';
import { humanDate, humanDateTime } from './mileageDates';

/**
 * The hub used to print the raw ISO string on every row. People read dates
 * like "4 Nov, 03:51" — and only get the year when it is not this year.
 */

const NOW = new Date('2026-11-04T10:00:00Z'); // 15:30 IST, 4 Nov 2026
const THIS_YEAR = '2026-11-03T22:21:00.000Z'; // 04 Nov 2026, 03:51 IST
const LAST_YEAR = '2025-11-03T22:21:00.000Z'; // 04 Nov 2025, 03:51 IST

describe('dates for people', () => {
  it('leaves the year out when the date is in this year', () => {
    expect(humanDate(THIS_YEAR, NOW)).toBe('4 Nov');
    expect(humanDateTime(THIS_YEAR, NOW)).toBe('4 Nov, 03:51');
  });

  it('keeps the year when the date is in another year', () => {
    expect(humanDate(LAST_YEAR, NOW)).toBe('4 Nov 2025');
    expect(humanDateTime(LAST_YEAR, NOW)).toBe('4 Nov 2025, 03:51');
  });

  it('reads the clock in IST, not in UTC', () => {
    // 22:21 UTC is already the next day in India.
    expect(humanDate('2026-11-03T20:00:00.000Z', NOW)).toBe('4 Nov');
    expect(humanDateTime('2026-11-03T20:00:00.000Z', NOW)).toBe('4 Nov, 01:30');
  });

  it('says nothing at all rather than "Invalid Date"', () => {
    expect(humanDate(null, NOW)).toBeNull();
    expect(humanDate('', NOW)).toBeNull();
    expect(humanDate('not-a-date', NOW)).toBeNull();
    expect(humanDateTime(null, NOW)).toBeNull();
    expect(humanDateTime('not-a-date', NOW)).toBeNull();
  });
});
