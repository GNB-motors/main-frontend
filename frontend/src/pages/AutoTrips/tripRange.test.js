import { describe, it, expect } from 'vitest';
import {
  ALL_TIME,
  rangeLabel,
  rangeToParams,
  readRange,
  shiftYmd,
  writeRange,
  ymdOf,
} from './tripRange';

// 10 Oct 2026, 02:00 IST — still 9 Oct in UTC, so a UTC-day bug shows up here.
const NOW = new Date('2026-10-09T20:30:00Z');

describe('rangeToParams', () => {
  it('starts every preset at IST midnight and leaves the end open', () => {
    expect(rangeToParams({ range: 'today' }, NOW)).toEqual({
      from: '2026-10-09T18:30:00.000Z',
    });
    expect(rangeToParams({ range: '7d' }, NOW)).toEqual({ from: '2026-10-03T18:30:00.000Z' });
    expect(rangeToParams({ range: '30d' }, NOW)).toEqual({ from: '2026-09-10T18:30:00.000Z' });
    expect(rangeToParams({ range: '3m' }, NOW)).toEqual({ from: '2026-07-09T18:30:00.000Z' });
  });

  it('a custom range covers both whole IST days', () => {
    expect(rangeToParams({ range: 'custom', from: '2026-10-01', to: '2026-10-05' }, NOW)).toEqual({
      from: '2026-09-30T18:30:00.000Z',
      to: '2026-10-05T18:29:59.999Z',
    });
  });

  it('All time sends nothing', () => {
    expect(rangeToParams(ALL_TIME, NOW)).toEqual({});
  });
});

describe('shiftYmd', () => {
  it('clamps a month shift to the shorter month', () => {
    expect(shiftYmd('2026-05-31', { months: -3 })).toBe('2026-02-28');
    expect(shiftYmd('2026-01-15', { months: -3 })).toBe('2025-10-15');
  });

  it('crosses month and year edges by days', () => {
    expect(shiftYmd('2026-01-03', { days: -6 })).toBe('2025-12-28');
  });
});

describe('readRange / writeRange', () => {
  it('round-trips through the URL and keeps other params', () => {
    const custom = { range: 'custom', from: '2026-10-01', to: '2026-10-05' };
    const url = writeRange(new URLSearchParams('new=manual'), custom);
    expect(url.get('new')).toBe('manual');
    expect(readRange(url)).toEqual(custom);
    expect(readRange(writeRange(url, { range: '7d' }))).toEqual({ range: '7d' });
  });

  it('All time is the bare URL', () => {
    const url = writeRange(new URLSearchParams('range=7d'), ALL_TIME);
    expect(url.toString()).toBe('');
  });

  it('reads anything malformed as All time', () => {
    expect(readRange(new URLSearchParams('range=bogus'))).toEqual(ALL_TIME);
    expect(readRange(new URLSearchParams('range=custom&from=2026-10-05&to=2026-10-01'))).toEqual(
      ALL_TIME,
    );
    expect(readRange(new URLSearchParams('range=custom&from=yesterday&to=2026-10-01'))).toEqual(
      ALL_TIME,
    );
  });
});

describe('rangeLabel', () => {
  it('names presets and custom ranges', () => {
    expect(rangeLabel({ range: '30d' }, NOW)).toBe('Last 30 days');
    expect(rangeLabel({ range: 'custom', from: '2026-10-03', to: '2026-10-09' }, NOW)).toBe(
      '3 Oct – 9 Oct',
    );
    expect(rangeLabel({ range: 'custom', from: '2026-10-03', to: '2026-10-03' }, NOW)).toBe(
      '3 Oct 2026',
    );
    expect(rangeLabel({ range: 'custom', from: '2025-12-28', to: '2026-01-04' }, NOW)).toBe(
      '28 Dec 2025 – 4 Jan 2026',
    );
  });
});

describe('ymdOf', () => {
  it('keeps the calendar day the person picked', () => {
    expect(ymdOf(new Date(2026, 9, 1))).toBe('2026-10-01');
  });
});
