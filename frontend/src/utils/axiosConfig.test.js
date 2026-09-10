import apiClient, { DEFAULT_TIMEOUT, SLOW_TIMEOUT } from './axiosConfig.js';

/** Run the request interceptors over a config the way axios would. */
const applyRequest = async (config) => {
  let out = { headers: {}, timeout: DEFAULT_TIMEOUT, ...config };
  for (const handler of apiClient.interceptors.request.handlers) {
    if (handler?.fulfilled) out = await handler.fulfilled(out);
  }
  return out;
};

describe('axiosConfig — request budget', () => {
  it('defaults to 30s, not the old 10s that aborted healthy responses', () => {
    expect(DEFAULT_TIMEOUT).toBe(30000);
    expect(apiClient.defaults.timeout).toBe(DEFAULT_TIMEOUT);
  });

  it.each([
    '/api/reports/trip-ledger',
    '/api/dashboard/overview',
    '/api/mileage/model-comparison',
    '/api/fuel-spend/summary',
    '/api/lemu/warehouse',
    '/api/livetracking/positions',
  ])('widens the budget for the heavy read %s', async (url) => {
    const config = await applyRequest({ url });
    expect(config.timeout).toBe(SLOW_TIMEOUT);
  });

  it('leaves ordinary reads on the default budget', async () => {
    expect((await applyRequest({ url: '/api/employees' })).timeout).toBe(DEFAULT_TIMEOUT);
    expect((await applyRequest({ url: '/api/vehicles' })).timeout).toBe(DEFAULT_TIMEOUT);
  });

  it('never overrides a timeout the caller set explicitly', async () => {
    // OCR and upload paths choose their own budget and must keep it.
    const slow = await applyRequest({ url: '/api/reports/export', timeout: 180000 });
    expect(slow.timeout).toBe(180000);
    const short = await applyRequest({ url: '/api/dashboard/overview', timeout: 5000 });
    expect(short.timeout).toBe(5000);
  });

  it('tolerates a config with no url', async () => {
    expect((await applyRequest({ url: undefined })).timeout).toBe(DEFAULT_TIMEOUT);
  });
});
