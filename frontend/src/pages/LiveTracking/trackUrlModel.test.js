import { describe, it, expect } from 'vitest';
import {
  buildTrackUrl,
  endOfIstDay,
  fromIso,
  isLongRange,
  parseTrackParams,
  rangePresets,
  resolveRange,
  startOfIstDay,
  toIso,
} from './trackUrlModel';

const NOW = new Date('2026-11-03T04:00:00Z'); // 09:30 IST

describe('toIso', () => {
  it('writes the IST wall-clock time with the offset', () => {
    expect(toIso(new Date('2026-11-01T13:00:00Z'))).toBe('2026-11-01T18:30:00+05:30');
  });

  it('is null for nothing', () => {
    expect(toIso(null)).toBeNull();
  });
});

describe('fromIso', () => {
  it('reads an IST string back to the same moment', () => {
    const value = fromIso('2026-11-01T18:30:00+05:30');
    expect(value.toISOString()).toBe('2026-11-01T13:00:00.000Z');
  });

  it('is null for rubbish', () => {
    expect(fromIso('not a date')).toBeNull();
    expect(fromIso(null)).toBeNull();
  });
});

describe('startOfIstDay / endOfIstDay', () => {
  it('finds the IST midnight of the day', () => {
    const start = startOfIstDay(new Date('2026-11-03T04:00:00Z'));
    expect(toIso(start)).toBe('2026-11-03T00:00:00+05:30');
  });

  it('ends the IST day a minute before the next one', () => {
    const end = endOfIstDay(new Date('2026-11-03T04:00:00Z'));
    expect(toIso(end)).toBe('2026-11-03T23:59:00+05:30');
  });
});

describe('resolveRange', () => {
  it('defaults to the last 24 hours', () => {
    const range = resolveRange({ now: NOW });
    expect(range.isDefault).toBe(true);
    expect(range.to.getTime()).toBe(NOW.getTime());
    expect(range.from.getTime()).toBe(NOW.getTime() - 24 * 3600 * 1000);
  });

  it('keeps a range the owner asked for', () => {
    const range = resolveRange({
      from: '2026-11-01T18:30:00+05:30',
      to: '2026-11-01T20:15:00+05:30',
      now: NOW,
    });
    expect(toIso(range.from)).toBe('2026-11-01T18:30:00+05:30');
    expect(toIso(range.to)).toBe('2026-11-01T20:15:00+05:30');
    expect(range.isDefault).toBe(false);
  });

  it('corrects a range that ends before it starts', () => {
    const range = resolveRange({
      from: '2026-11-01T20:15:00+05:30',
      to: '2026-11-01T18:30:00+05:30',
      now: NOW,
    });
    expect(range.to.getTime()).toBeGreaterThan(range.from.getTime());
    expect(range.corrected).toBe(true);
  });

  it('completes a range that has only a start', () => {
    const range = resolveRange({ from: '2026-11-01T18:30:00+05:30', now: NOW });
    expect(range.to.getTime()).toBeGreaterThan(range.from.getTime());
  });
});

describe('parseTrackParams', () => {
  it('reads the truck, the range and the playhead', () => {
    const params = new URLSearchParams(
      'v=WB11J7062&from=2026-11-01T18%3A30%3A00%2B05%3A30&to=2026-11-01T20%3A15%3A00%2B05%3A30&at=2026-11-01T18%3A50%3A12%2B05%3A30',
    );
    const state = parseTrackParams(params, { now: NOW });
    expect(state.reg).toBe('WB11J7062');
    expect(toIso(state.from)).toBe('2026-11-01T18:30:00+05:30');
    expect(toIso(state.to)).toBe('2026-11-01T20:15:00+05:30');
    expect(toIso(state.at)).toBe('2026-11-01T18:50:12+05:30');
  });

  it('has no truck when the URL names none', () => {
    const state = parseTrackParams(new URLSearchParams(''), { now: NOW });
    expect(state.reg).toBeNull();
    expect(state.isDefaultRange).toBe(true);
  });

  it('puts the playhead at the end of the range when the URL does not say', () => {
    const state = parseTrackParams(
      new URLSearchParams('v=WB11J7062&from=2026-11-01T18%3A30%3A00%2B05%3A30&to=2026-11-01T20%3A15%3A00%2B05%3A30'),
      { now: NOW },
    );
    expect(toIso(state.at)).toBe('2026-11-01T20:15:00+05:30');
  });
});

describe('buildTrackUrl', () => {
  it('writes the whole state', () => {
    const url = buildTrackUrl({
      reg: 'WB11J7062',
      from: new Date('2026-11-01T13:00:00Z'),
      to: new Date('2026-11-01T14:45:00Z'),
      at: new Date('2026-11-01T13:20:12Z'),
    });
    expect(url).toContain('/live-tracking?');
    expect(url).toContain('v=WB11J7062');
    expect(url).toContain('from=2026-11-01T18%3A30%3A00%2B05%3A30');
    expect(url).toContain('at=2026-11-01T18%3A50%3A12%2B05%3A30');
  });

  it('round-trips through parseTrackParams', () => {
    const url = buildTrackUrl({
      reg: 'WB11J7062',
      from: new Date('2026-11-01T13:00:00Z'),
      to: new Date('2026-11-01T14:45:00Z'),
    });
    const state = parseTrackParams(new URLSearchParams(url.split('?')[1]), { now: NOW });
    expect(state.reg).toBe('WB11J7062');
    expect(toIso(state.from)).toBe('2026-11-01T18:30:00+05:30');
  });
});

describe('rangePresets', () => {
  it('offers the four ranges that always exist', () => {
    const presets = rangePresets({ now: NOW });
    expect(presets.map((p) => p.label)).toEqual(['Last 24 h', 'Today', 'Yesterday', 'Last 7 days']);
  });

  it('offers This trip only when there is a trip', () => {
    const presets = rangePresets({ now: NOW, trip: { from: '2026-11-01T13:00:00Z', to: '2026-11-01T14:00:00Z' } });
    expect(presets.map((p) => p.label)).toContain('This trip');
  });
});

describe('isLongRange', () => {
  it('is false for a normal day', () => {
    expect(isLongRange({ from: '2026-11-01T13:00:00Z', to: '2026-11-01T14:00:00Z' })).toBe(false);
  });

  it('is true for more than 31 days', () => {
    expect(isLongRange({ from: '2026-01-01T00:00:00Z', to: '2026-11-01T00:00:00Z' })).toBe(true);
  });
});
