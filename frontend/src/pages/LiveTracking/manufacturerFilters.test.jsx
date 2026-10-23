import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFleetVehicles from './useFleetVehicles.js';
import { normalizeManufacturer, toggleManufacturer } from './manufacturerFilters.js';

const rawPositions = ['T1', 'A1', 'V1', 'U1'].map((registrationNumber) => ({
  registrationNumber,
  latitude: 25,
  longitude: 84,
  speed: 20,
}));
const vehiclesMeta = {
  T1: { manufacturer: 'TATA MOTORS', model: '5555' },
  A1: { manufacturer: 'Ashok Leyland' },
  V1: { manufacturer: 'Volvo' },
};
function useFleet(overrides = {}) {
  return useFleetVehicles({
    rawPositions,
    vehiclesMeta,
    filter: 'all',
    searchQuery: '',
    selectedId: null,
    ...overrides,
  });
}

describe('manufacturer fleet scope', () => {
  it('includes future and unclassified makes in All and exposes metadata-only choices', () => {
    const { result } = renderHook(() =>
      useFleet({ vehiclesMeta: { ...vehiclesMeta, X: { manufacturer: 'Eicher' } } }),
    );
    expect(result.current.filteredVehicles).toHaveLength(4);
    expect(result.current.manufacturers).toEqual(['Tata', 'Ashok Leyland', 'Volvo', 'Eicher']);
  });
  it('keeps counts, map, search and selected vehicle within the manufacturer scope', () => {
    const { result } = renderHook(() =>
      useFleet({ selectedManufacturers: ['Tata'], selectedId: 'live-A1', searchQuery: '5555' }),
    );
    expect(result.current.counts.all).toBe(1);
    expect(result.current.filteredVehicles.map((v) => v.plate)).toEqual(['T1']);
    expect(result.current.mapVehicles.map((v) => v.plate)).toEqual(['T1']);
    expect(result.current.selectedVehicle).toBeNull();
  });
  it('supports unclassified records and resets the final toggle to All', () => {
    const { result } = renderHook(() => useFleet({ selectedManufacturers: ['Unclassified'] }));
    expect(result.current.filteredVehicles.map((v) => v.plate)).toEqual(['U1']);
    expect(toggleManufacturer(['Tata'], 'Tata')).toEqual([]);
    expect(normalizeManufacturer(' ashok-leyland ')).toBe('Ashok Leyland');
  });
});
