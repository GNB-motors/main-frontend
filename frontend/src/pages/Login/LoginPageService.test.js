import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../../utils/logger', () => ({
  default: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import apiClient from '../../utils/axiosConfig';
import { LoginPageService } from './LoginPageService';

const orgsResponse = (orgs) => ({ data: { status: 'success', data: orgs } });

// Field agents from before org-scoped accounts have no orgId of their own and
// need one from /me/orgs; without it every request fails "X-Org-Id required".
describe('LoginPageService.resolveFieldAgentOrgId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the first membership', async () => {
    apiClient.get.mockResolvedValueOnce(orgsResponse([{ orgId: 'o1' }, { orgId: 'o2' }]));
    expect(await LoginPageService.resolveFieldAgentOrgId(null)).toEqual({
      orgId: 'o1',
      failed: false,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/api/me/orgs');
  });

  it("keeps the account's own org when there are no memberships", async () => {
    apiClient.get.mockResolvedValueOnce(orgsResponse([]));
    expect(await LoginPageService.resolveFieldAgentOrgId('own')).toEqual({
      orgId: 'own',
      failed: false,
    });
  });

  it('reports no org when the account has none and no memberships', async () => {
    apiClient.get.mockResolvedValueOnce(orgsResponse([]));
    expect(await LoginPageService.resolveFieldAgentOrgId(null)).toEqual({
      orgId: null,
      failed: false,
    });
  });

  it('reports a failed lookup instead of carrying on without an org', async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));
    expect(await LoginPageService.resolveFieldAgentOrgId(null)).toEqual({
      orgId: null,
      failed: true,
    });
  });

  it("falls back to the account's own org when the lookup fails", async () => {
    apiClient.get.mockRejectedValueOnce(new Error('Network Error'));
    expect(await LoginPageService.resolveFieldAgentOrgId('own')).toEqual({
      orgId: 'own',
      failed: true,
    });
  });
});
