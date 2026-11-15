import { describe, expect, test, vi } from 'vitest';

vi.mock('../pages/OwnerAlerts/OwnerAlertsService', () => ({
  OwnerAlertsService: { getAlerts: vi.fn() },
}));

import { OwnerAlertsService } from '../pages/OwnerAlerts/OwnerAlertsService';
import { loadOpenAlerts } from './useLiveAlerts';

describe('loadOpenAlerts', () => {
  test('seeds the badges with the open alerts of the last 24 h', async () => {
    OwnerAlertsService.getAlerts.mockResolvedValueOnce({ records: [{ id: 'a1' }] });
    const now = Date.parse('2026-11-04T10:00:00Z');
    expect(await loadOpenAlerts(undefined, now)).toEqual([{ id: 'a1' }]);
    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledWith(
      { acknowledged: false, from: '2026-11-03T10:00:00.000Z', limit: 100 },
      undefined,
    );
  });

  test('a refused feed starts empty instead of failing the page', async () => {
    OwnerAlertsService.getAlerts.mockRejectedValueOnce({ status: 403 });
    expect(await loadOpenAlerts()).toEqual([]);
  });
});
