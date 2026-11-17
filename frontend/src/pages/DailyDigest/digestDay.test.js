import { describe, it, expect } from 'vitest';
import digestDay from './digestDay';

const NOW = new Date('2026-11-18T06:00:00+05:30');

describe('digestDay', () => {
  it('names the day card by what the day really is', () => {
    expect(digestDay.workTitle('2026-11-18', NOW)).toBe('Today so far');
    // Never "yesterday": the date says it plainly.
    expect(digestDay.workTitle('2026-11-17', NOW)).toBe('Work on 17 Nov');
    expect(digestDay.workTitle('2026-11-10', NOW)).toBe('Work on 10 Nov');
  });

  it('marks live parts only on a past day', () => {
    expect(digestDay.notFor('2026-11-18', NOW)).toBeNull();
    expect(digestDay.notFor('2026-11-10', NOW)).toBe('not for 10 Nov');
  });

  it('knows today and yesterday in IST', () => {
    const lateNight = new Date('2026-11-18T00:30:00+05:30'); // still 17 Nov in UTC
    expect(digestDay.isToday('2026-11-18', lateNight)).toBe(true);
    expect(digestDay.isYesterday('2026-11-17', lateNight)).toBe(true);
  });
});
