import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '@/utils/axiosConfig';
import Assignments from '@/services/DriverVehicleAssignmentService';
import IntelligenceService from '../Intelligence/IntelligenceService';
import Service from './DriverProfileService';
vi.mock('@/utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
vi.mock('@/services/DriverVehicleAssignmentService', () => ({
  default: { getAssignmentPage: vi.fn() },
}));
vi.mock('../Intelligence/IntelligenceService', () => ({ default: { getInstances: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('finds an employee beyond the first scoped page', async () => {
  apiClient.get
    .mockResolvedValueOnce({ data: { data: [{ _id: 'd2' }], meta: { totalPages: 2 } } })
    .mockResolvedValueOnce({
      data: { data: [{ _id: 'd1', firstName: 'Ramesh' }], meta: { totalPages: 2 } },
    });
  expect(await Service.employee('d1')).toMatchObject({ firstName: 'Ramesh' });
  expect(apiClient.get).toHaveBeenLastCalledWith(
    '/api/employees',
    expect.objectContaining({ params: { page: 2, limit: 1000 } }),
  );
});
it('follows every trip page and filters driver ids even when the server ignores them', async () => {
  apiClient.get
    .mockResolvedValueOnce({
      data: { data: [{ _id: 't2', driverId: 'd2' }], pagination: { totalPages: 2 } },
    })
    .mockResolvedValueOnce({
      data: { data: [{ _id: 't1', driverId: { _id: 'd1' } }], pagination: { totalPages: 2 } },
    });
  expect(await Service.trips('d1', { from: '2026-11-01', to: '2026-11-07' })).toEqual([
    { _id: 't1', driverId: { _id: 'd1' } },
  ]);
  expect(apiClient.get).toHaveBeenLastCalledWith(
    '/api/trips',
    expect.objectContaining({
      params: expect.objectContaining({ page: 2, endDate: '2026-11-07T23:59:59.999+05:30' }),
    }),
  );
});
it('keeps a failed weekly read unknown and retains measured zero', async () => {
  IntelligenceService.getInstances.mockImplementation(({ kind }) =>
    kind === 'idle'
      ? Promise.reject(new Error('Offline'))
      : Promise.resolve({ summary: { count: 0 } }),
  );
  const [week] = await Service.weeklyEvents('d1', [{ from: '2026-11-01', to: '2026-11-07' }]);
  expect(week).toMatchObject({ idleHours: null, overspeed: 0, unavailable: true });
  expect(IntelligenceService.getInstances).toHaveBeenCalledWith(
    expect.objectContaining({ driver: 'd1', from: '2026-11-01', to: '2026-11-07' }),
  );
});
it('does not present failed document reads as an empty document list', async () => {
  apiClient.get.mockRejectedValue(new Error('Offline'));
  await expect(Service.documents('d1')).rejects.toBeDefined();
});
it('loads historical assignment pages and excludes other drivers', async () => {
  Assignments.getAssignmentPage
    .mockResolvedValueOnce({ results: [{ _id: 'x', driverId: 'd2' }], meta: { totalPages: 2 } })
    .mockResolvedValueOnce({
      results: [{ _id: 'y', driverId: 'd1', startDate: '2026-11-01' }],
      meta: { totalPages: 2 },
    });
  expect(await Service.assignments('d1')).toEqual([
    { _id: 'y', driverId: 'd1', startDate: '2026-11-01' },
  ]);
});
