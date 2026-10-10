import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn() } }));

import apiClient from '../../utils/axiosConfig';
import RoadService from '../RoadService';

describe('RoadService (plan P4.8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RoadService._resetStatus();
  });

  it('engine off: no trail request is made, the page keeps its raw trail', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { enabled: false } } });
    expect(await RoadService.getRoadTrailIfEnabled('WB1', { from: 'a', to: 'b' })).toBeNull();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('engine on: fetches the trail; status is asked once per session', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: { data: { enabled: true, reachable: true } } })
      .mockResolvedValue({ data: { data: { mode: 'MATCHED', segments: [] } } });
    expect(await RoadService.getRoadTrailIfEnabled('WB 1', { from: 'a', to: 'b' })).toEqual({
      mode: 'MATCHED',
      segments: [],
    });
    await RoadService.getRoadTrailIfEnabled('WB 1', { from: 'a', to: 'b' });
    const urls = apiClient.get.mock.calls.map((c) => c[0]);
    expect(urls.filter((u) => u === '/api/road/engine-status')).toHaveLength(1);
    expect(urls).toContain('/api/road/trail/WB%201');
  });

  it('any failure gives null, never an exception', async () => {
    apiClient.get.mockRejectedValue(new Error('network'));
    expect(await RoadService.getRoadTrailIfEnabled('WB1')).toBeNull();
  });
});
