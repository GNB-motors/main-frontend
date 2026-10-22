import { vi, it, expect, beforeEach } from 'vitest';
import { ReportsService } from '../../pages/Reports/ReportsService';
import apiClient from '../../utils/axiosConfig';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('loads every SAP page and the comparison settings', async () => {
  apiClient.get.mockImplementation(async (url, config) => ({
    data: {
      data: url.endsWith('/settings')
        ? { tolerancePct: 15, multiValuePolicy: 'MIN' }
        : { rows: [{ id: `lane${config.params.page}` }], total: 2, totals: { over: 1 } },
    },
  }));
  const report = await ReportsService.getLaneKm();
  expect(report.rows).toHaveLength(2);
  expect(report.rows[1]).toMatchObject({ id: 'lane2', tolerancePct: 15, multiValuePolicy: 'MIN' });
  expect(apiClient.get).toHaveBeenCalledWith(
    '/api/sap/lanes',
    expect.objectContaining({ params: { page: 2, limit: 100 } }),
  );
});
it('falls back only when the new API returns 404, preserving other failures', async () => {
  apiClient.get.mockImplementation(async (url) => {
    if (url.includes('/sap/')) throw { status: 404 };
    return { data: { data: { rows: [{ fromLabel: 'OLD' }] } } };
  });
  expect(await ReportsService.getLaneKm()).toMatchObject({
    legacy: true,
    rows: [{ fromLabel: 'OLD' }],
  });
  apiClient.get.mockClear();
  apiClient.get.mockRejectedValue({ response: { status: 500 } });
  await expect(ReportsService.getLaneKm()).rejects.toMatchObject({ status: 500 });
  expect(apiClient.get.mock.calls.some(([url]) => url.includes('reports/lanes'))).toBe(false);
});
it('uses the existing read endpoint for roles without SAP API access', async () => {
  apiClient.get.mockResolvedValue({ data: { rows: [] } });
  await ReportsService.getLaneKm({ preferSap: false });
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  expect(apiClient.get.mock.calls[0][0]).toBe('api/reports/lanes');
});
