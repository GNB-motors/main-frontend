import { describe, expect, it } from 'vitest';
import { istWindow, openIdlesInWindow } from './idlingWindow';

describe('istWindow', () => {
  it('covers whole IST days for date-only values', () => {
    expect(istWindow('2026-11-18', '2026-11-24')).toEqual({
      from: '2026-11-18T00:00:00.000+05:30',
      to: '2026-11-24T23:59:59.999+05:30',
    });
  });

  it('keeps a full instant and defaults to the last 7 days', () => {
    const now = Date.parse('2026-11-25T00:00:00.000Z');
    expect(istWindow('', '', now)).toEqual({ from: '2026-11-18T00:00:00.000Z', to: undefined });
    expect(istWindow('2026-11-20T10:00:00.000Z', undefined).from).toBe('2026-11-20T10:00:00.000Z');
  });
});

describe('openIdlesInWindow', () => {
  const window = istWindow('2026-11-23', '2026-11-23');

  it('keeps running idles that started on the selected IST day', () => {
    const rows = [
      // 23 Nov, 02:00 IST: inside, though it is still 22 Nov in UTC.
      { _id: 'a', startAt: '2026-11-22T20:30:00.000Z', endAt: null },
      // 24 Nov, 01:00 IST: after the window.
      { _id: 'b', startAt: '2026-11-23T19:30:00.000Z', endAt: null },
      { _id: 'c', startAt: '2026-11-23T05:00:00.000Z', endAt: '2026-11-23T06:00:00.000Z' },
      { _id: 'd', startAt: null, endAt: null },
    ];
    expect(openIdlesInWindow(rows, window).map((r) => r._id)).toEqual(['a']);
  });
});
