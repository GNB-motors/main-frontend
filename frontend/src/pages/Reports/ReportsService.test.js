import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
import apiClient from '../../utils/axiosConfig';
import { ReportsService } from './ReportsService';

beforeEach(() => vi.resetAllMocks());
describe('custom report execution', () => {
  it.each(['vehicle_compliance', 'driver_summary', 'trips_mileage', 'fuel_transactions'])(
    'surfaces query failures for %s without substituting another report',
    async (dataset) => {
      const body = { message: 'Report query unavailable' };
      apiClient.post.mockRejectedValueOnce({
        response: { status: 503, data: body, headers: { 'x-request-id': 'report-123' } },
      });
      await expect(ReportsService.executeCustomReport({ dataset })).rejects.toMatchObject({
        name: 'ApiError',
        status: 503,
        requestId: 'report-123',
        body,
      });
      expect(apiClient.get).not.toHaveBeenCalled();
    },
  );
  it('returns the successful server report unchanged and forwards cancellation', async () => {
    const config = { dataset: 'vehicle_compliance' };
    const result = { data: [{ rcStatus: 'EXPIRED' }], meta: { total: 1 } };
    const { signal } = new AbortController();
    apiClient.post.mockResolvedValueOnce({ data: result });
    expect(await ReportsService.executeCustomReport(config, signal)).toBe(result);
    expect(apiClient.post).toHaveBeenCalledWith('/api/reports/custom/query', config, { signal });
    const error = { code: 'ERR_CANCELED' };
    apiClient.post.mockRejectedValueOnce(error);
    await expect(ReportsService.executeCustomReport(config, signal)).rejects.toBe(error);
  });
});
