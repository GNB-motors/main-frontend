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

  it('says the name is not recorded instead of inventing one (audit DC-23)', () => {
    const { result } = renderHook(() =>
      useSelectedDriver(vehicle, {}, { WB01AB1234: { _id: 'a2', driverId: 'd2' } }),
    );
    expect(result.current.name).toBe('Name not recorded');
  });

  it('prefers the driver of record on the position row, and reports two drivers as unclear', () => {
    const withDriver = {
      ...vehicle,
      driver: {
        state: 'ASSIGNED',
        name: 'Asha Devi',
        phone: '+919111111111',
        since: '2026-10-01T00:00:00Z',
      },
    };
    const { result } = renderHook(() =>
      useSelectedDriver(withDriver, {}, { WB01AB1234: assignment }),
    );
    expect(result.current).toMatchObject({ name: 'Asha Devi', phone: '+919111111111' });
    const unclear = renderHook(() =>
      useSelectedDriver({ ...vehicle, driver: { state: 'UNCLEAR' } }, {}, {}),
    );
    expect(unclear.result.current).toMatchObject({ unclear: true });
    const none = renderHook(() =>
      useSelectedDriver({ ...vehicle, driver: { state: 'NONE' } }, {}, { WB01AB1234: assignment }),
    );
    expect(none.result.current).toBeNull();
  });
});
