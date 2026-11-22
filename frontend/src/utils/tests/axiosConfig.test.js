import apiClient, {
  DEFAULT_TIMEOUT,
  SLOW_TIMEOUT,
  REPORT_TIMEOUT,
  normalisePath,
} from '../axiosConfig.js';

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
    '/api/admin/dashboard-stats',
    '/api/mileage/model-comparison',
    '/api/lemu/warehouse',
    '/api/livetracking/positions',
    '/api/fleet-view/digest',
    '/api/owner-report',
    '/api/intelligence/summary',
    '/api/leaderboards',
    '/api/fuel-integrity',
    '/api/refuel-advisory',
    '/api/performance',
    '/api/sap',
    '/api/place-intelligence',
  ])('widens the budget for the heavy read %s', async (url) => {
    const config = await applyRequest({ url });
    expect(config.timeout).toBe(SLOW_TIMEOUT);
  });

  it('leaves ordinary reads on the default budget', async () => {
    expect((await applyRequest({ url: '/api/employees' })).timeout).toBe(DEFAULT_TIMEOUT);
    expect((await applyRequest({ url: '/api/vehicles' })).timeout).toBe(DEFAULT_TIMEOUT);
  });

  it('gives a report read and an export the long budget', async () => {
    expect((await applyRequest({ url: '/api/reports/trip-ledger' })).timeout).toBe(REPORT_TIMEOUT);
    expect((await applyRequest({ url: '/api/reports/mileage-intervals' })).timeout).toBe(
      REPORT_TIMEOUT,
    );
    expect((await applyRequest({ url: '/api/reports/fuel-cycles/export' })).timeout).toBe(
      REPORT_TIMEOUT,
    );
    // Any export path, wherever it lives.
    expect((await applyRequest({ url: '/api/extension/flagged/export' })).timeout).toBe(
      REPORT_TIMEOUT,
    );
  });

  it('never overrides a timeout the caller set explicitly', async () => {
    // OCR and upload paths choose their own budget and must keep it.
    const slow = await applyRequest({ url: '/api/reports/export', timeout: 180000 });
    expect(slow.timeout).toBe(180000);
    const short = await applyRequest({ url: '/api/admin/dashboard-stats', timeout: 5000 });
    expect(short.timeout).toBe(5000);
  });

  it('tolerates a config with no url', async () => {
    expect((await applyRequest({ url: undefined })).timeout).toBe(DEFAULT_TIMEOUT);
  });

  it('normalises a path before it is matched', () => {
    expect(normalisePath('api/reports/x')).toBe('/api/reports/x');
    expect(normalisePath('/api/reports/x')).toBe('/api/reports/x');
    expect(normalisePath('/api/reports/x?from=1&to=2')).toBe('/api/reports/x');
    expect(normalisePath('/api/reports/x#frag')).toBe('/api/reports/x');
  });

  it('gives the same budget to a path written with or without the leading slash', async () => {
    expect((await applyRequest({ url: 'api/reports/x' })).timeout).toBe(REPORT_TIMEOUT);
    expect((await applyRequest({ url: 'api/intelligence/summary' })).timeout).toBe(SLOW_TIMEOUT);
    expect((await applyRequest({ url: 'api/leaderboards' })).timeout).toBe(SLOW_TIMEOUT);
    // The query must not hide the prefix from the matcher.
    expect((await applyRequest({ url: 'api/performance?vehicle=1' })).timeout).toBe(SLOW_TIMEOUT);
  });
});
