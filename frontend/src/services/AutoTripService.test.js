import { describe, it, expect, vi, beforeEach } from 'vitest';

const get = vi.hoisted(() => vi.fn());
vi.mock('../utils/axiosConfig', () => ({ default: { get } }));

const { default: AutoTripService } = await import('./AutoTripService');

const listBody = (extra = {}) => ({ items: [], total: 0, page: 1, limit: 20, ...extra });

describe('AutoTripService.list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps the counts sent inside the list', async () => {
    const counts = { tabs: { OPEN: 2 }, today: 1, planned: 3 };
    get.mockResolvedValue({ status: 200, data: { status: 'success', data: listBody({ counts }) } });

    const body = await AutoTripService.list({ page: 1 });

    expect(body.counts).toEqual(counts);
    expect(get).toHaveBeenCalledWith('/api/auto-trips', {
      params: { page: 1 },
      signal: undefined,
    });
  });

  it('surfaces the counts sent beside the list', async () => {
    const counts = { tabs: { OPEN: 2 }, today: 1, planned: 3 };
    get.mockResolvedValue({ status: 200, data: { status: 'success', data: listBody(), counts } });

    const body = await AutoTripService.list();

    expect(body.counts).toEqual(counts);
  });

  it('surfaces the tab counts sent beside the list', async () => {
    get.mockResolvedValue({
      status: 200,
      data: { status: 'success', data: listBody(), tabCounts: { OPEN: 5 } },
    });

    const body = await AutoTripService.list();

    expect(body.tabCounts).toEqual({ OPEN: 5 });
  });
});
