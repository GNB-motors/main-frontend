import { describe, expect, it } from 'vitest';
import trailDateWindow from './trailDateWindow.js';

const now = new Date('2026-11-02T08:00:00Z');

describe('trail calendar windows in IST', () => {
  it('uses IST midnight to now for Today', () => {
    expect(trailDateWindow.resolve({ period: 'today' }, now)).toEqual({
      from: '2026-11-01T18:30:00.000Z',
      to: '2026-11-02T08:00:00.000Z',
    });
  });
  it('uses all of Yesterday, including month boundaries', () => {
    expect(
      trailDateWindow.resolve({ period: 'yesterday' }, new Date('2026-11-01T08:00:00Z')),
    ).toEqual({
      from: '2026-10-30T18:30:00.000Z',
      to: '2026-10-31T18:29:59.999Z',
    });
  });
  it('handles the IST date changing before the UTC date', () => {
    expect(trailDateWindow.today(new Date('2026-11-01T19:00:00Z'))).toBe('2026-11-02');
  });
  it('includes the entire start and end dates of a custom range', () => {
    expect(
      trailDateWindow.resolve(
        { period: 'custom', startDate: '2026-10-20', endDate: '2026-10-22' },
        now,
      ),
    ).toEqual({
      from: '2026-10-19T18:30:00.000Z',
      to: '2026-10-22T18:29:59.999Z',
    });
    expect(
      trailDateWindow.label(
        { period: 'custom', startDate: '2026-10-20', endDate: '2026-10-22' },
        now,
      ),
    ).toBe('20 Oct 2026 – 22 Oct 2026');
  });
  it('supports a single day and caps a range ending today at now', () => {
    expect(
      trailDateWindow.resolve(
        { period: 'custom', startDate: '2026-11-02', endDate: '2026-11-02' },
        now,
      ),
    ).toEqual({
      from: '2026-11-01T18:30:00.000Z',
      to: now.toISOString(),
    });
  });
  it.each([
    ['2026-11-02', '2026-11-01', 'End date'],
    ['2026-11-02', '2026-11-03', 'earlier'],
    ['2026-02-30', '2026-03-01', 'valid'],
    ['2026-10-20', '', 'valid'],
    ['2026-10-20', '2026-10-28', '8 days'],
  ])('rejects invalid range %s to %s', (startDate, endDate, message) => {
    expect(() => trailDateWindow.resolve({ period: 'custom', startDate, endDate }, now)).toThrow(
      message,
    );
  });
  it('allows eight inclusive calendar days across a month boundary', () => {
    expect(
      trailDateWindow.resolve(
        { period: 'custom', startDate: '2026-10-26', endDate: '2026-11-02' },
        now,
      ).from,
    ).toBe('2026-10-25T18:30:00.000Z');
  });
});
