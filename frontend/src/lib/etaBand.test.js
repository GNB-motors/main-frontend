import { describe, it, expect } from 'vitest';
import { formatBand, confidenceText, distributionText, delayVsUsual } from './etaBand';

const NOW = new Date('2026-09-06T08:00:00+05:30'); // Sunday

describe('formatBand', () => {
  it('renders a same-day band with day and time range', () => {
    expect(formatBand(30, 35, NOW)).toBe('Arriving Mon ~2PM–7PM');
  });

  it('renders a cross-day band with both dates', () => {
    const out = formatBand(40, 60, NOW);
    expect(out).toContain('–');
    expect(out).toContain('Arriving');
  });

  it('returns null for absent or non-finite input — never a bare guess', () => {
    expect(formatBand(null, 5, NOW)).toBeNull();
    expect(formatBand(undefined, undefined, NOW)).toBeNull();
    expect(formatBand('abc', 5, NOW)).toBeNull();
  });
});

describe('confidenceText', () => {
  it('states the sample-size basis', () => {
    expect(confidenceText(23)).toBe('Based on 23 past trips on this corridor.');
    expect(confidenceText(5)).toBe('Based on 5 past trips on this corridor.');
  });

  it('flags rough estimates under 5 samples', () => {
    expect(confidenceText(3)).toBe('Rough estimate — first few trips on this route.');
    expect(confidenceText(4)).toContain('Rough estimate');
    expect(confidenceText(5)).toContain('Based on 5');
  });

  it('returns null for zero or absent samples', () => {
    expect(confidenceText(0)).toBeNull();
    expect(confidenceText(null)).toBeNull();
  });
});

describe('distributionText', () => {
  it('shows the usual band and the worst case', () => {
    expect(distributionText({ p25: 36.4, p75: 41.2, max: 58 })).toBe('Usually 36–41 h, worst 58 h.');
  });

  it('omits worst when absent', () => {
    expect(distributionText({ p25: 36, p75: 41 })).toBe('Usually 36–41 h.');
  });

  it('returns null without a band', () => {
    expect(distributionText(null)).toBeNull();
    expect(distributionText({})).toBeNull();
  });
});

describe('delayVsUsual', () => {
  it('surfaces delay against the prediction', () => {
    expect(delayVsUsual(45, 38.5)).toBe('Running ~7 h behind its usual pace.');
    expect(delayVsUsual(30, 38.5)).toBe('Running ~8 h ahead of its usual pace.');
    expect(delayVsUsual(38.4, 38.5)).toBe('Running at its usual pace.');
  });

  it('returns null for unusable inputs', () => {
    expect(delayVsUsual(null, 10)).toBeNull();
    expect(delayVsUsual(10, 0)).toBeNull();
  });
});
