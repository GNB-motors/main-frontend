import {
  formatDateIST,
  formatDateLongIST,
  formatDateTimeIST,
  formatDateTimeLongIST,
  toISTDateString,
  toISTTimeString,
  formatInIST,
  istDayString,
  shiftDay,
  weekdayOf,
  istWallClockToISO,
  istDayStartISO,
  istDayEndISO,
  daysBetween,
} from '../dateUtils.js';

// 2024-01-15T10:30:00.000Z is 16:00 IST on the same calendar day.
// All expected strings below were verified against V8's en-IN/en-CA/en-GB ICU data.
const T = '2024-01-15T10:30:00.000Z';

describe('dateUtils.js — UTC → IST display formatting', () => {
  it('formatDateIST renders "15 Jan 2024"', () => {
    expect(formatDateIST(T)).toBe('15 Jan 2024');
  });

  it('formatDateLongIST renders "15 January 2024"', () => {
    expect(formatDateLongIST(T)).toBe('15 January 2024');
  });

  it('formatDateTimeIST renders date + 12-hour IST time', () => {
    expect(formatDateTimeIST(T)).toBe('15 Jan 2024, 04:00 pm');
  });

  it('formatDateTimeLongIST renders long month with time', () => {
    expect(formatDateTimeLongIST(T)).toBe('15 January 2024 at 04:00 pm');
  });

  it('toISTDateString extracts the IST calendar date', () => {
    expect(toISTDateString(T)).toBe('2024-01-15');
  });

  it('toISTTimeString extracts the IST wall-clock time', () => {
    expect(toISTTimeString(T)).toBe('16:00:00');
  });

  it('rolls the IST date forward after 18:30 UTC', () => {
    expect(toISTDateString('2024-01-15T18:30:00.000Z')).toBe('2024-01-16');
    expect(formatDateIST('2024-01-15T18:30:00.000Z')).toBe('16 Jan 2024');
  });

  it('handles IST midnight correctly (00:00:00, not 24:00:00)', () => {
    expect(toISTTimeString('2024-01-15T18:30:00.000Z')).toBe('00:00:00');
  });

  describe('edge cases', () => {
    it('empty input', () => {
      expect(formatDateIST('')).toBe('-');
      expect(formatDateLongIST(null)).toBe('-');
      expect(formatDateTimeIST(undefined)).toBe('-');
      expect(formatDateTimeLongIST('')).toBe('-');
      expect(toISTDateString('')).toBeNull();
      expect(toISTTimeString(null)).toBeNull();
    });

    it('unparseable input returns the input for display fns, null for extractors', () => {
      expect(formatDateIST('not-a-date')).toBe('not-a-date');
      expect(formatDateTimeIST('nope')).toBe('nope');
      expect(toISTDateString('nope')).toBeNull();
      expect(toISTTimeString('nope')).toBeNull();
    });
  });
});

// These replaced dayjs (utc + timezone plugins). Before the switch they were
// cross-checked against dayjs on 330k random instants/days with 0 mismatches;
// the cases below pin the outputs the app's screens rely on.
describe('IST pattern formatting and day arithmetic', () => {
  // 2026-10-08T21:05:09Z is 02:35:09 IST on 9 Oct — a different calendar day.
  const LATE = '2026-10-08T21:05:09Z';

  it('formats every pattern the app uses, in IST', () => {
    expect(formatInIST(LATE, 'DD MMM YYYY, hh:mm A [IST]')).toBe('09 Oct 2026, 02:35 AM IST');
    expect(formatInIST(LATE, 'h:mmA, DD MMM YYYY')).toBe('2:35AM, 09 Oct 2026');
    expect(formatInIST(LATE, 'DD MMM YY')).toBe('09 Oct 26');
    expect(formatInIST(LATE, 'HH:mm')).toBe('02:35');
    expect(formatInIST(LATE, 'DD MMM YY, hh:mm A')).toBe('09 Oct 26, 02:35 AM');
    expect(formatInIST(LATE, 'D MMM YYYY, h:mm a')).toBe('9 Oct 2026, 2:35 am');
    expect(formatInIST(LATE, 'D MMM, h:mm a')).toBe('9 Oct, 2:35 am');
    expect(formatInIST(LATE, 'YYYY-MM-DD HH:mm')).toBe('2026-10-09 02:35');
    expect(formatInIST(LATE, 'YYYY-MM-DDTHH:mm')).toBe('2026-10-09T02:35');
    expect(formatInIST('2026-10-08T07:00:00Z', 'h:mm A')).toBe('12:30 PM');
    expect(formatInIST('2026-10-07T18:30:00Z', 'hh:mm a')).toBe('12:00 am');
  });

  it('returns null for missing or invalid input', () => {
    expect(formatInIST(null, 'DD MMM')).toBeNull();
    expect(formatInIST('', 'DD MMM')).toBeNull();
    expect(formatInIST('not a date', 'DD MMM')).toBeNull();
  });

  it('istDayString reads the IST calendar date, not UTC', () => {
    expect(istDayString(LATE)).toBe('2026-10-09');
    expect(istDayString(new Date('2026-10-08T18:29:59.999Z'))).toBe('2026-10-08');
    expect(istDayString(new Date('2026-10-08T18:30:00.000Z'))).toBe('2026-10-09');
  });

  it('shiftDay does calendar arithmetic across months, years and leap days', () => {
    expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDay('2024-03-01', -1)).toBe('2024-02-29');
    expect(shiftDay('2025-12-31', 1)).toBe('2026-01-01');
    expect(shiftDay('2026-10-08', -29)).toBe('2026-09-09');
  });

  it('weekdayOf counts from Sunday = 0', () => {
    expect(weekdayOf('2026-10-11')).toBe(0);
    expect(weekdayOf('2026-10-12')).toBe(1);
  });

  it('turns IST wall-clock input into UTC ISO', () => {
    expect(istWallClockToISO('2026-10-08T14:30')).toBe('2026-10-08T09:00:00.000Z');
    expect(istWallClockToISO('2026-10-08T00:15:30')).toBe('2026-10-07T18:45:30.000Z');
    expect(istWallClockToISO('2026-10-08')).toBe('2026-10-07T18:30:00.000Z');
    expect(istWallClockToISO('08/10/2026')).toBeNull();
  });

  it('gives the first and last instant of an IST day', () => {
    expect(istDayStartISO('2026-10-08')).toBe('2026-10-07T18:30:00.000Z');
    expect(istDayEndISO('2026-10-08')).toBe('2026-10-08T18:29:59.999Z');
    expect(istDayStartISO('')).toBeNull();
    expect(istDayEndISO('2026-10-08T10:00')).toBeNull();
  });

  it('daysBetween truncates toward zero like a whole-day diff', () => {
    expect(daysBetween('2026-10-01T00:00:00Z', '2026-10-08T00:00:00Z')).toBe(7);
    expect(daysBetween('2026-10-01T00:00:00Z', '2026-10-08T23:59:00Z')).toBe(7);
    expect(daysBetween('2026-10-08T00:00:00Z', '2026-10-01T12:00:00Z')).toBe(-6);
  });
});
