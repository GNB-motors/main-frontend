import { describe, it, expect } from 'vitest';
import {
  normalizeDriver,
  normalizeVehicleOption,
  filterAndSortDrivers,
  countActiveDrivers,
  isCrossBranchMove,
  countActiveFilters,
  generatePageNumbers,
} from './driverList';

describe('normalizeDriver', () => {
  it('normalizes snake_case API fields and builds a name', () => {
    const d = normalizeDriver({
      _id: 'd1',
      first_name: 'Asha',
      last_name: 'Singh',
      mobile_number: '987',
      email_address: 'a@b.c',
    });
    expect(d.id).toBe('d1');
    expect(d.firstName).toBe('Asha');
    expect(d.lastName).toBe('Singh');
    expect(d.name).toBe('Asha Singh');
    expect(d.mobileNumber).toBe('987');
    expect(d.email).toBe('a@b.c');
  });

  it('prefers an explicit name and camelCase fields', () => {
    const d = normalizeDriver({ id: 'd2', firstName: 'Ram', lastName: 'Dev', name: 'Ram Dev Ji' });
    expect(d.id).toBe('d2');
    expect(d.name).toBe('Ram Dev Ji');
  });

  it('falls back to mobile for contact', () => {
    expect(normalizeDriver({ mobile: '123' }).mobileNumber).toBe('123');
  });

  it('shows membershipStatus only for FIELD_AGENT', () => {
    expect(
      normalizeDriver({ role: 'FIELD_AGENT', membershipStatus: 'INVITED', status: 'ACTIVE' })
        .status,
    ).toBe('INVITED');
    expect(normalizeDriver({ role: 'FIELD_AGENT', status: 'ACTIVE' }).status).toBe('ACTIVE');
    expect(
      normalizeDriver({ role: 'DRIVER', membershipStatus: 'INVITED', status: 'ACTIVE' }).status,
    ).toBe('ACTIVE');
  });
});

describe('normalizeVehicleOption', () => {
  it('maps camelCase vehicle fields', () => {
    const v = normalizeVehicleOption({
      _id: 'v1',
      registrationNumber: 'KA-01',
      vehicleType: 'TRUCK',
      chassisNumber: 'C1',
    });
    expect(v).toEqual({
      id: 'v1',
      registration_no: 'KA-01',
      vehicle_type: 'TRUCK',
      chassis_number: 'C1',
    });
  });
});

describe('filterAndSortDrivers', () => {
  const drivers = [
    { id: '1', vehicle_registration_no: 'KA-01', branchStatus: 'DEACTIVATED' },
    { id: '2', vehicle_registration_no: null, branchStatus: 'ACTIVE' },
    { id: '3', vehicle_registration_no: 'MH-02' },
  ];

  it('returns everyone (active first) with no filter', () => {
    const result = filterAndSortDrivers(drivers, '');
    expect(result.map((d) => d.id)).toEqual(['2', '3', '1']);
  });

  it('filters assigned / unassigned', () => {
    // deactivated sinks to the bottom even within the filtered set
    expect(filterAndSortDrivers(drivers, 'assigned').map((d) => d.id)).toEqual(['3', '1']);
    expect(filterAndSortDrivers(drivers, 'unassigned').map((d) => d.id)).toEqual(['2']);
  });

  it('does not mutate the input array', () => {
    const input = [drivers[0], drivers[1]];
    filterAndSortDrivers(input, '');
    expect(input.map((d) => d.id)).toEqual(['1', '2']);
  });
});

describe('countActiveDrivers', () => {
  it('excludes deactivated', () => {
    expect(
      countActiveDrivers([{ branchStatus: 'ACTIVE' }, { branchStatus: 'DEACTIVATED' }, {}]),
    ).toBe(2);
  });
});

describe('isCrossBranchMove', () => {
  it('is true when current branch differs from active branch', () => {
    expect(isCrossBranchMove({ currentBranchId: 'b1' }, 'b2')).toBe(true);
    expect(isCrossBranchMove({ currentBranchId: 'b1' }, 'b1')).toBe(false);
  });

  it('is false when either side is missing', () => {
    expect(isCrossBranchMove({}, 'b1')).toBe(false);
    expect(isCrossBranchMove({ currentBranchId: 'b1' }, null)).toBe(false);
    expect(isCrossBranchMove(null, 'b1')).toBe(false);
  });

  it('compares loosely (string coercion)', () => {
    expect(isCrossBranchMove({ currentBranchId: 7 }, '7')).toBe(false);
  });
});

describe('countActiveFilters', () => {
  it('counts non-empty filter values', () => {
    expect(countActiveFilters({ role: '', vehicleAssignment: 'assigned' })).toBe(1);
    expect(countActiveFilters({ role: 'DRIVER', vehicleAssignment: '' })).toBe(1);
    expect(countActiveFilters({ role: '', vehicleAssignment: '' })).toBe(0);
    expect(countActiveFilters(null)).toBe(0);
  });
});

describe('generatePageNumbers', () => {
  it('shows all pages when 5 or fewer', () => {
    expect(generatePageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(generatePageNumbers(4, 1)).toEqual([1]);
  });

  it('collapses the middle with ellipses', () => {
    expect(generatePageNumbers(1, 10)).toEqual([1, 2, '...', 10]);
    expect(generatePageNumbers(10, 10)).toEqual([1, '...', 9, 10]);
    expect(generatePageNumbers(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  });
});
