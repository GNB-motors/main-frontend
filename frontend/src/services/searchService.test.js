import { describe, it, expect } from 'vitest';
import { normaliseResults, TYPE_ORDER } from './searchService';

describe('normaliseResults', () => {
  it('groups results by type order: vehicles first, routes last', () => {
    const out = normaliseResults([
      { type: 'ROUTE', id: 'r1', label: 'Jamshedpur–Ranchi', sub: '', url: '/routes' },
      { type: 'TRIP', id: 't1', label: 'JSR → RNC', sub: 'IN_TRANSIT', url: '/trip-management/trip/t1' },
      { type: 'VEHICLE', id: 'v1', label: 'WB25W1040', sub: 'Tata Signa', url: '/vehicles/WB25W1040' },
      { type: 'DRIVER', id: 'd1', label: 'Ramesh Yadav', sub: '9876543210', url: '/drivers' },
    ]);
    expect(out.map((r) => r.type)).toEqual(['VEHICLE', 'DRIVER', 'TRIP', 'ROUTE']);
  });

  it('keeps stable order within a type group', () => {
    const out = normaliseResults([
      { type: 'VEHICLE', id: 'v2', label: 'JH01AB1234', sub: '', url: '/vehicles/JH01AB1234' },
      { type: 'VEHICLE', id: 'v1', label: 'WB25W1040', sub: '', url: '/vehicles/WB25W1040' },
    ]);
    expect(out.map((r) => r.id)).toEqual(['v2', 'v1']);
  });

  it('drops malformed entries — missing label, bad url, unknown type', () => {
    const out = normaliseResults([
      { type: 'VEHICLE', id: 'v1', label: '', sub: '', url: '/vehicles/x' },
      { type: 'VEHICLE', id: 'v2', label: 'WB25W1040', sub: '', url: 'vehicles/y' },
      { type: 'PARTY', id: 'p1', label: 'Acme', sub: '', url: '/erp/parties' },
      { type: 'VEHICLE', id: 'v3', label: 'JH01AB1234', sub: '', url: '/vehicles/z' },
      null,
      undefined,
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('v3');
  });

  it('caps the result count', () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      type: 'VEHICLE', id: `v${i}`, label: `REG${i}`, sub: '', url: `/vehicles/REG${i}`,
    }));
    expect(normaliseResults(many)).toHaveLength(40);
  });

  it('returns empty for non-array input', () => {
    expect(normaliseResults(null)).toEqual([]);
    expect(normaliseResults(undefined)).toEqual([]);
    expect(normaliseResults('WB25')).toEqual([]);
  });

  it('exposes the documented type order', () => {
    expect(TYPE_ORDER).toEqual(['VEHICLE', 'DRIVER', 'TRIP', 'ROUTE']);
  });
});
