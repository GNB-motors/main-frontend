import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./OwnerAlertsService', () => ({
  OwnerAlertsService: { getAlerts: vi.fn() },
}));

vi.mock('../../utils/session', () => ({
  getOrgId: vi.fn(() => 'org-1'),
  getBranchId: vi.fn(() => 'branch-1'),
}));

import { OwnerAlertsService } from './OwnerAlertsService';
import { ownerAlertsFeed, openAlertsParams } from './ownerAlertsStore';

const feed = {
  records: [{ _id: 'a1' }],
  meta: { counts: { critical: 1, warning: 0 } },
};

describe('ownerAlertsFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ownerAlertsFeed.reset();
  });

  it('asks for the open alerts of the last day', () => {
    expect(openAlertsParams(Date.parse('2026-11-19T12:00:00Z'))).toEqual({
      acknowledged: false,
      from: '2026-11-18T12:00:00.000Z',
      limit: 100,
    });
  });

  it('gives the bell and the list the same read', async () => {
    OwnerAlertsService.getAlerts.mockResolvedValue(feed);

    const [bell, list] = await Promise.all([
      ownerAlertsFeed.load({ now: 1000 }),
      ownerAlertsFeed.load({ now: 1000 }),
    ]);

    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledTimes(1);
    expect(bell).toBe(feed);
    expect(list).toBe(feed);
  });

  it('reads again once the first read has settled', async () => {
    OwnerAlertsService.getAlerts.mockResolvedValue(feed);

    await ownerAlertsFeed.load({ now: 1000 });
    await ownerAlertsFeed.load({ now: 2000 });

    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledTimes(2);
  });

  it('treats another branch as another answer', async () => {
    OwnerAlertsService.getAlerts.mockResolvedValue(feed);

    await Promise.all([
      ownerAlertsFeed.load({ now: 1000 }),
      ownerAlertsFeed.load({ now: 1000, scope: 'org-1|branch-2' }),
    ]);

    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledTimes(2);
  });

  it('reads again when a fresh read is asked for', async () => {
    OwnerAlertsService.getAlerts.mockResolvedValue(feed);

    await Promise.all([
      ownerAlertsFeed.load({ now: 1000 }),
      ownerAlertsFeed.load({ now: 1000, force: true }),
    ]);

    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledTimes(2);
  });

  it('lets the next reader start again after a failed read', async () => {
    OwnerAlertsService.getAlerts.mockRejectedValueOnce(new Error('boom'));

    await expect(ownerAlertsFeed.load({ now: 1000 })).rejects.toThrow('boom');

    OwnerAlertsService.getAlerts.mockResolvedValue(feed);
    await ownerAlertsFeed.load({ now: 2000 });

    expect(OwnerAlertsService.getAlerts).toHaveBeenCalledTimes(2);
  });
});
