import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import apiClient from '../../utils/axiosConfig';
import { SignUpPageService } from '../../pages/SignUp/SignUpPageService';
import { LoginPageService } from '../../pages/Login/LoginPageService';
import { VehicleService } from '../../pages/Profile/VehicleService';
import { MaintenanceService } from '../../pages/Maintenance/MaintenanceService';
import { listAccounts } from '../../pages/Profile/FleetEdgeAccountService';
import { OnboardingService } from '../../pages/Onboarding/OnboardingService';

// These services used bare axios: no timeout, no 401 handling, no tenant
// headers, and no token unless the caller remembered to pass one. They must
// go through apiClient so its interceptors apply.
describe('services go through apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { status: 'success', data: { accounts: [] } } });
    apiClient.post.mockResolvedValue({ data: { status: 'success', data: {} } });
    apiClient.patch.mockResolvedValue({ data: { status: 'success', data: {} } });
  });

  // register-owner is SUPER_ADMIN-only; bare axios sent no token, so it always 401'd.
  it('owner registration carries the signed-in token via apiClient', async () => {
    await SignUpPageService.registerUser({ email: 'o@x.in' });
    expect(apiClient.post).toHaveBeenCalledWith('/api/admin/register-owner', { email: 'o@x.in' });
  });

  it('login opts out of the session-expired redirect', async () => {
    await LoginPageService.loginUser({ email: 'a@b.in', password: 'x' });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/api/auth/login',
      { email: 'a@b.in', password: 'x' },
      { skipAuthRedirect: true },
    );
  });

  it('bulk vehicle create and document upload get budgets beyond the 30s default', async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ registration_no: `WB${i}` }));
    await VehicleService.addBulkVehicles('org1', rows);
    expect(apiClient.post.mock.calls[0][2].timeout).toBe(200000);

    await VehicleService.uploadVehicleDocument('v1', 'RC', [new Blob(['x'])]);
    expect(apiClient.post.mock.calls[1][2].timeout).toBe(120000);
  });

  it('reads used inside useApi forward the abort signal', async () => {
    const { signal } = new AbortController();

    await VehicleService.getFleetDashboard({ search: 'WB25', signal });
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/vehicles/dashboard', {
      params: { search: 'WB25' },
      signal,
    });

    await listAccounts({ signal });
    expect(apiClient.get).toHaveBeenLastCalledWith('/api/fleetedge/accounts', { signal });
  });

  it('maintenance list drops blank filters like the old query builder did', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [] } });
    await MaintenanceService.listRecords({ recordType: 'SERVICE', search: '', page: 2 });
    expect(apiClient.get).toHaveBeenCalledWith('/api/maintenance', {
      params: {
        recordType: 'SERVICE',
        vehicleId: undefined,
        search: undefined,
        page: 2,
        limit: 50,
      },
    });
  });

  it('onboarding updates the org then the profile without a caller-supplied token', async () => {
    await OnboardingService.completeOnboarding(
      { companyName: 'GNB', firstName: 'A', lastName: 'B' },
      'org1',
    );
    expect(apiClient.patch).toHaveBeenNthCalledWith(1, '/api/admin/organizations/org1', {
      companyName: 'GNB',
    });
    expect(apiClient.patch).toHaveBeenNthCalledWith(2, '/api/auth/me', {
      firstName: 'A',
      lastName: 'B',
    });
  });
});
