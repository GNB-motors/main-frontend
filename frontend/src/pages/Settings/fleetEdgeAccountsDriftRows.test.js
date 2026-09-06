import { describe, it, expect } from 'vitest';
import { flattenDriftRows, filterDriftRows, searchDriftRows } from './fleetEdgeAccountsDriftRows';

const apiRows = [
  {
    _id: 'd1',
    vehicleId: { registrationNumber: 'KA-01-AB-1234' },
    fromAccount: { friendlyName: 'Mumbai Fleet' },
    toAccount: { externalAccountId: 'ext-7' },
    createdAt: '2026-08-01T10:00:00.000Z',
  },
  {
    _id: 'd2',
    vehicleId: { fleetEdgeRegistration: 'MH-02-XY-9876' },
    fromAccount: { externalAccountId: 'ext-3' },
    toAccount: { friendlyName: 'Delhi Fleet' },
    createdAt: '2026-08-02T10:00:00.000Z',
  },
];

describe('flattenDriftRows', () => {
  it('maps nested API fields to flat table labels', () => {
    const [first, second] = flattenDriftRows(apiRows);
    expect(first.vehicleReg).toBe('KA-01-AB-1234');
    expect(first.fromLabel).toBe('Mumbai Fleet');
    expect(first.toLabel).toBe('ext-7');
    expect(first.detectedAt).toBe('2026-08-01T10:00:00.000Z');
    expect(second.vehicleReg).toBe('MH-02-XY-9876');
    expect(second.fromLabel).toBe('ext-3');
    expect(second.toLabel).toBe('Delhi Fleet');
  });

  it('falls back to empty strings when nested fields are missing', () => {
    const [row] = flattenDriftRows([{ _id: 'd3' }]);
    expect(row.vehicleReg).toBe('');
    expect(row.fromLabel).toBe('');
    expect(row.toLabel).toBe('');
    expect(row.detectedAt).toBeUndefined();
  });

  it('keeps the original record fields on the flattened row', () => {
    const [row] = flattenDriftRows(apiRows);
    expect(row._id).toBe('d1');
    expect(row.vehicleId.registrationNumber).toBe('KA-01-AB-1234');
  });
});

describe('filterDriftRows', () => {
  const flat = flattenDriftRows(apiRows);

  it('returns all rows for a blank query', () => {
    expect(filterDriftRows(flat, '   ')).toHaveLength(2);
    expect(filterDriftRows(flat, '')).toHaveLength(2);
  });

  it('matches vehicle registration case-insensitively', () => {
    const result = filterDriftRows(flat, 'ka-01');
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('d1');
  });

  it('matches both from and to account labels', () => {
    expect(filterDriftRows(flat, 'mumbai')[0]._id).toBe('d1');
    expect(filterDriftRows(flat, 'delhi fleet')[0]._id).toBe('d2');
    expect(filterDriftRows(flat, 'EXT-7')[0]._id).toBe('d1');
  });

  it('returns nothing when nothing matches', () => {
    expect(filterDriftRows(flat, 'no-such-vehicle')).toHaveLength(0);
  });
});

describe('searchDriftRows', () => {
  it('flattens then filters in one call', () => {
    const result = searchDriftRows(apiRows, 'mh-02');
    expect(result).toHaveLength(1);
    expect(result[0]._id).toBe('d2');
  });

  it('returns every flattened row for an empty query', () => {
    expect(searchDriftRows(apiRows, '')).toHaveLength(2);
  });
});
