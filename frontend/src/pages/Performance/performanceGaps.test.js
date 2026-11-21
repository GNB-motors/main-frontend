import { describe, it, expect } from 'vitest';
import { columnGaps, columnMedian, hiddenLine, reasonLine, subjectless } from './performanceGaps';

const measured = (value, unit = '%') => ({
  value,
  unit,
  source: 'measured',
  uncertainty: null,
  reason: null,
});
const gated = (minutes) => ({
  value: null,
  unit: '%',
  source: 'not_comparable',
  uncertainty: null,
  reason: `cadence P90 ${minutes} min > 90 s`,
});
const noIdle = {
  value: null,
  unit: '%',
  source: 'insufficient_data',
  uncertainty: null,
  reason: 'the truck does not report idle time',
};

const COLUMNS = [
  { key: 'idlePct', label: 'Idle share', cell: (r) => r.idlePct },
  { key: 'topGearPct', label: 'Top-gear share', cell: (r) => r.topGearPct },
  { key: 'overRevPct', label: 'Over-rev share', cell: (r) => r.overRevPct },
];

const ROWS = [
  { idlePct: measured(10), topGearPct: gated(63), overRevPct: gated(63) },
  { idlePct: measured(12), topGearPct: gated(45), overRevPct: gated(45) },
  { idlePct: noIdle, topGearPct: gated(50), overRevPct: gated(50) },
];

describe('columnGaps', () => {
  it('hides a column no row can fill and explains it once for every column it applies to', () => {
    const { hidden, notes } = columnGaps(ROWS, COLUMNS);

    expect([...hidden]).toEqual(['topGearPct', 'overRevPct']);
    expect(notes).toEqual([
      {
        labels: ['Top-gear share', 'Over-rev share'],
        reason: 'Readings arrive up to 45–63 min apart; this needs one at least every 90 s.',
      },
    ]);
    expect(hiddenLine(notes[0])).toBe(
      'Top-gear share and over-rev share are not shown: readings arrive up to 45–63 min apart; this needs one at least every 90 s.',
    );
  });

  it('says nothing about a column some rows can fill', () => {
    const { hidden, notes } = columnGaps(ROWS, COLUMNS);

    expect(hidden.has('idlePct')).toBe(false);
    expect(notes.some((note) => note.labels.includes('Idle share'))).toBe(false);
  });

  it('says nothing when every number is there', () => {
    const rows = [{ idlePct: measured(1), topGearPct: measured(2), overRevPct: measured(3) }];
    expect(columnGaps(rows, COLUMNS).notes).toEqual([]);
  });

  it('hides nothing for an empty list', () => {
    expect(columnGaps([], COLUMNS).hidden.size).toBe(0);
  });
});

describe('subjectless', () => {
  it('drops the one row the server wrote its reason about', () => {
    expect(subjectless('This driver has no push telemetry in this window.')).toBe(
      'no push telemetry in this window.',
    );
    expect(subjectless('The truck reported no fuel or distance in this window.')).toBe(
      'no fuel or distance reported in this window.',
    );
    expect(subjectless('The truck does not report idle time.')).toBe('idle time is not reported.');
    expect(subjectless('Not enough driving in the last 28 days.')).toBe(
      'not enough driving in the last 28 days.',
    );
  });

  it('starts a line of the empty state with a capital', () => {
    expect(
      reasonLine({
        labels: ['Harsh events'],
        reason: 'This driver has no push telemetry in this window.',
      }),
    ).toEqual({ labels: 'Harsh events', reason: 'No push telemetry in this window.' });
  });
});

describe('columnMedian', () => {
  it('takes the median of the numbers there are, never counting a gap as zero', () => {
    expect(columnMedian(ROWS, (r) => r.idlePct)).toEqual({ median: 11, known: 2 });
  });

  it('has no median when no row has a number', () => {
    expect(columnMedian(ROWS, (r) => r.topGearPct)).toEqual({ median: null, known: 0 });
  });
});
