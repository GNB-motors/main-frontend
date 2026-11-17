import { describe, it, expect } from 'vitest';
import trendModel from './trendModel';

const numbers = {
  trips: 11,
  km: 1240,
  tripsPrev7Avg: 26.6,
  tripsSameWeekdayAvg: 53.8,
  tripsVsPrev7Pct: -58.6,
  kmPrev7Avg: 2100.4,
  kmSameWeekdayAvg: 2300,
  kmVsPrev7Pct: 12.3,
  kmAveragesPartial: true,
  daysWithData: 22,
};
const valueOf = (rows, key) => rows.find((r) => r.key === key);

describe('trendModel', () => {
  it('reads as label → value rows, with the change once the day is over', () => {
    const { known, unknown, partial, basis, pendingNote } = trendModel(numbers, {
      day: '2026-11-18',
    });
    expect(known.map((r) => [r.label, r.value])).toEqual([
      ['Trips started', '11'],
      ['Usual (last 7 days)', '27 a day'],
      ['Usual on Wednesdays', '54'],
      ['Trips vs last 7 days', '−59%'],
      ['Km', '1,240 km'],
      ['Usual km (last 7 days)', '2,100 km a day'],
      ['Usual km on Wednesdays', '2,300 km'],
      ['Km vs last 7 days', '+12%'],
    ]);
    expect(valueOf(known, 'tripsChange').tone).toBe('down');
    expect(valueOf(known, 'kmChange').tone).toBe('up');
    expect(unknown).toEqual([]);
    expect(partial).toBe(true);
    expect(pendingNote).toBeNull();
    expect(basis).toBe('Trips on 22 of the last 28 days');
  });

  it('holds the change back while the day is still running, and says so once', () => {
    const { known, pendingNote } = trendModel(numbers, { day: '2026-11-18', pending: true });
    expect(valueOf(known, 'trips').label).toBe('Trips started so far');
    expect(valueOf(known, 'tripsChange')).toBeUndefined();
    expect(pendingNote).toMatch(/once the day is over/);
  });

  it('groups unknowns into one line instead of printing 0', () => {
    const { known, unknown } = trendModel(
      { trips: 0, tripsPrev7Avg: 26.6, tripsSameWeekdayAvg: 53.8 },
      { day: '2026-11-18', pending: true },
    );
    expect(valueOf(known, 'trips').value).toBe('0');
    expect(unknown).toEqual(['Km so far', 'Usual km (last 7 days)', 'Usual km on Wednesdays']);
  });

  it('does not print a day count the look-back cannot hold', () => {
    expect(trendModel({ daysWithData: 58 }, { day: '2026-11-18' }).basis).toBeNull();
  });
});
