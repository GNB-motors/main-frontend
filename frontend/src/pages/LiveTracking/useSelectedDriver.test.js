import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSelectedDriver from './useSelectedDriver';

const vehicle = { plate: 'WB 01 AB 1234' };

// The assignment list populates driverId with firstName/lastName/mobileNumber
// (driverVehicleAssignment.service.js) and dates the assignment with an ISO string.
const assignment = {
  _id: 'a1',
  driverId: { _id: 'd1', firstName: 'Ravi', lastName: 'Kumar', mobileNumber: '9000000000' },
  startDate: '2026-09-30T19:00:00.000Z',
};

describe('useSelectedDriver', () => {
  it('shows the populated driver name, phone and the IST start date', () => {
    const { result } = renderHook(() => useSelectedDriver(vehicle, {}, { WB01AB1234: assignment }));
    expect(result.current).toEqual({
      name: 'Ravi Kumar',
      phone: '9000000000',
      since: '1 Oct 2026',
    });
  });

  it('leaves "since" out when the assignment has no usable start date', () => {
    const { result } = renderHook(() =>
      useSelectedDriver(vehicle, {}, { WB01AB1234: { ...assignment, startDate: 'not a date' } }),
    );
    expect(result.current.since).toBeNull();
  });

  it('falls back to the generic label when the driver was not populated', () => {
    const { result } = renderHook(() =>
      useSelectedDriver(vehicle, {}, { WB01AB1234: { _id: 'a2', driverId: 'd2' } }),
    );
    expect(result.current.name).toBe('Primary Driver');
  });
});
