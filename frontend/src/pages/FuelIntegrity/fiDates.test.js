import { describe, it, expect } from 'vitest';
import { formatIST, formatRelativeIST, mapsLink } from './fiDates';

describe('formatIST', () => {
  it('renders an em-dash for missing input', () => {
    expect(formatIST(null)).toBe('—');
  });

  it('formats the IST wall-clock with zone label', () => {
    expect(formatIST('2026-08-15T00:00:00Z')).toBe('15 Aug 2026, 05:30 AM IST');
  });
});

describe('formatRelativeIST', () => {
  it('returns null when there is no timestamp', () => {
    expect(formatRelativeIST(null)).toBeNull();
  });

  it('returns a relative string for a timestamp', () => {
    const out = formatRelativeIST('2020-01-01T00:00:00Z');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

describe('mapsLink', () => {
  it('builds a Google Maps query URL', () => {
    expect(mapsLink(22.57, 88.36)).toBe('https://www.google.com/maps?q=22.57,88.36');
  });
});
