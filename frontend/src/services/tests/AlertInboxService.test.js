import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../../utils/axiosConfig';
import { getInbox, acknowledgeItem } from '../AlertInboxService';
vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), put: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('passes status and cancellation to the existing inbox endpoint', async () => {
  const signal = new AbortController().signal;
  const data = { items: [], openCount: 0 };
  apiClient.get.mockResolvedValue({ data: { data } });
  await expect(getInbox({ status: 'ALL', signal })).resolves.toEqual(data);
  expect(apiClient.get).toHaveBeenCalledWith('/api/alert-inbox', {
    params: { status: 'ALL' },
    signal,
  });
});
it('does not turn a malformed response into a false empty inbox', async () => {
  apiClient.get.mockResolvedValue({ data: {} });
  await expect(getInbox()).rejects.toThrow('Could not read the inbox response');
});
it('uses the acknowledgement endpoint without mutating a source module', async () => {
  apiClient.put.mockResolvedValue({ data: { data: { id: '123', status: 'ACKNOWLEDGED' } } });
  await expect(acknowledgeItem('123')).resolves.toMatchObject({ status: 'ACKNOWLEDGED' });
  expect(apiClient.put).toHaveBeenCalledWith('/api/alert-inbox/123/ack');
});
