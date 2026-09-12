import { describe, it, expect } from 'vitest';
import { getInitials, ROLE_LABELS, formatRole } from './driverPresenters';

describe('getInitials', () => {
  it('returns question mark for empty names', () => {
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
    expect(getInitials('')).toBe('?');
  });

  it('takes first two letters of a single name', () => {
    expect(getInitials('Asha')).toBe('AS');
  });

  it('takes first letters of first and last name', () => {
    expect(getInitials('Asha Singh')).toBe('AS');
    expect(getInitials('ram dev')).toBe('RD');
  });
});

describe('formatRole', () => {
  it('prefers the superadmin flag', () => {
    expect(formatRole('DRIVER', true)).toBe('Super Admin');
  });

  it('maps known roles to labels', () => {
    expect(formatRole('FIELD_AGENT')).toBe(ROLE_LABELS.FIELD_AGENT);
    expect(formatRole('KAM')).toBe('Key Account Manager');
  });

  it('falls back to the raw role, then Employee', () => {
    expect(formatRole('WIZARD')).toBe('WIZARD');
    expect(formatRole('')).toBe('Employee');
    expect(formatRole(null)).toBe('Employee');
  });
});
