import { describe, it, expect } from 'vitest';
import {
  hasRowErrors,
  filterRowsByStatus,
  summarizeRowErrors,
  VEHICLE_DEDUPE_KEY,
} from './bulkUploadVehiclesFlow';

const rows = [
  { registration_no: 'KA01AB1234' },
  { registration_no: 'KA01AB9999' },
  { registration_no: 'KA02CD5555' },
];
const rowErrors = [{}, { registration_no: 'Duplicate' }, {}];

describe('hasRowErrors', () => {
  it('treats null, undefined and empty objects as valid', () => {
    expect(hasRowErrors(null)).toBe(false);
    expect(hasRowErrors(undefined)).toBe(false);
    expect(hasRowErrors({})).toBe(false);
  });

  it('treats a non-empty object as errors present', () => {
    expect(hasRowErrors({ model: 'Required' })).toBe(true);
  });
});

describe('filterRowsByStatus', () => {
  it('returns everything for "all"', () => {
    expect(filterRowsByStatus(rows, rowErrors, 'all')).toHaveLength(3);
  });

  it('returns only rows with errors for "error"', () => {
    const filtered = filterRowsByStatus(rows, rowErrors, 'error');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].registration_no).toBe('KA01AB9999');
  });

  it('returns only rows without errors for "valid"', () => {
    const filtered = filterRowsByStatus(rows, rowErrors, 'valid');
    expect(filtered).toHaveLength(2);
    expect(filtered.map((r) => r.registration_no)).toEqual(['KA01AB1234', 'KA02CD5555']);
  });
});

describe('summarizeRowErrors', () => {
  it('counts errors and valids from a parallel error array', () => {
    expect(summarizeRowErrors(rowErrors)).toEqual({ errorCount: 1, validCount: 2 });
  });

  it('handles an empty upload', () => {
    expect(summarizeRowErrors([])).toEqual({ errorCount: 0, validCount: 0 });
  });
});

describe('VEHICLE_DEDUPE_KEY', () => {
  it('dedupes on registration number', () => {
    expect(VEHICLE_DEDUPE_KEY).toBe('registration_no');
  });
});
