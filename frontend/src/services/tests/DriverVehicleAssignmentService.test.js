import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiClient from '../../utils/axiosConfig';
import DriverVehicleAssignmentService from '../DriverVehicleAssignmentService';

const populated = {
  _id: 'a1',
  driverId: { _id: 'd1', firstName: 'Ravi', lastName: null, mobileNumber: '9000000000' },
  vehicleId: { _id: 'v1', registrationNumber: 'WB01AB1234', model: null },
  startDate: '2026-10-01T00:00:00.000Z',
  endDate: null,
  status: 'ACTIVE',
};

describe('DriverVehicleAssignmentService.getAssignments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes the params and the abort signal through', async () => {
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: [] } });
    const { signal } = new AbortController();
    await DriverVehicleAssignmentService.getAssignments({ vehicleId: 'v1' }, { signal });
    expect(apiClient.get).toHaveBeenCalledWith('/api/driver-vehicle-assignments', {
      params: { vehicleId: 'v1' },
      signal,
    });
  });

  it('returns populated and bare-id rows alike', async () => {
    const bare = { _id: 'a2', driverId: 'd2', vehicleId: 'v2', status: 'ENDED' };
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: [populated, bare] } });
    const rows = await DriverVehicleAssignmentService.getAssignments();
    expect(rows).toEqual([populated, bare]);
  });
});
