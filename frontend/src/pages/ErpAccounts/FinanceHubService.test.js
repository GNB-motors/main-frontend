import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '../../errors/ApiError';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../../utils/axiosConfig', () => ({
  default: { get },
}));

import FinanceHubApi from './FinanceHubService';

describe('FinanceHubService error metadata', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('keeps the status, request id and body when a request fails', async () => {
    get.mockRejectedValueOnce({
      message: 'Request failed with status code 404',
      response: {
        status: 404,
        headers: { 'x-request-id': 'req-7' },
        data: { message: 'finance module not enabled' },
      },
    });

    await expect(FinanceHubApi.getSummary()).rejects.toMatchObject({
      status: 404,
      requestId: 'req-7',
    });
  });

  it('throws a typed ApiError so the UI can map it to plain words', async () => {
    get.mockRejectedValueOnce({
      message: 'boom',
      response: { status: 500, headers: {}, data: {} },
    });

    await expect(FinanceHubApi.listAccounts()).rejects.toBeInstanceOf(ApiError);
  });

  it('keeps the cancellation code so aborted requests stay ignored', async () => {
    get.mockRejectedValueOnce({
      message: 'canceled',
      code: 'ERR_CANCELED',
      response: undefined,
    });

    await expect(FinanceHubApi.getAgeing()).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });
});
