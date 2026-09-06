import { describe, it, expect } from 'vitest';
import { getInitials, getDateLabel } from './overviewFormat';

describe('getInitials', () => {
  it('uses first + last word initials for multi-word names', () => {
    expect(getInitials('Ravi Kumar Singh')).toBe('RS');
  });

  it('uppercases the first two letters of a single-word name', () => {
    expect(getInitials('amit')).toBe('AM');
  });

  it('falls back to a question mark for empty names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('getDateLabel', () => {
  it('formats a date as short month + day in en-IN', () => {
    expect(getDateLabel('2026-08-15T00:00:00Z')).toBe(
      new Date('2026-08-15T00:00:00Z').toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
    );
  });

  it('returns an empty string when there is no date', () => {
    expect(getDateLabel(null)).toBe('');
    expect(getDateLabel('')).toBe('');
  });
});
