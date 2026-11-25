import { describe, expect, it } from 'vitest';
import { timelineRows } from './timelineModel';

const LABEL = 'Unmarked, near Bhadutala (1.0 km), Medinipur, Paschim Medinipur, West Bengal';

const stop = (place) => ({
  _id: 's1',
  startAt: '2026-11-02T20:00:00Z',
  place,
});

describe('timelineRows — the place of a stop', () => {
  it('spec 3: a stop whose place has only a backend label shows the label', () => {
    const rows = timelineRows({ routeStops: [stop({ label: LABEL, status: 'PROPOSED' })] });
    expect(rows.map((r) => r.place)).toEqual([LABEL]);
  });

  it('spec 3: a named place still wins over the label', () => {
    const rows = timelineRows({ routeStops: [stop({ name: 'Nimpura', label: LABEL })] });
    expect(rows.map((r) => r.place)).toEqual(['Nimpura']);
  });

  it('spec 3: a place with neither name nor label keeps the old wording', () => {
    const rows = timelineRows({ routeStops: [stop({ status: 'PROPOSED' })] });
    expect(rows.map((r) => r.place)).toEqual(['Unconfirmed place']);
  });
});
