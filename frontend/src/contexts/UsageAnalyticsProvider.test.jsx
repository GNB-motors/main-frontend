import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UsageAnalyticsProvider from './UsageAnalyticsProvider';
import { useUsageAnalytics } from './UsageAnalyticsContext';
import { getNavProfile, recordView } from '../services/UsageAnalyticsService';
import { useFeatureFlags } from './FeatureFlagsContext';
vi.mock('../services/UsageAnalyticsService', () => ({
  recordView: vi.fn(),
  getNavProfile: vi.fn(),
}));
vi.mock('./FeatureFlagsContext', () => ({ useFeatureFlags: vi.fn() }));
vi.mock('../utils/session', () => ({ getUserRole: () => 'OWNER' }));
vi.mock('../utils/sideNavUtils.js', () => ({
  computeVisibleNav: () => ({ items: [{ type: 'link', to: '/reports', label: 'Reports' }] }),
}));
const canAccess = () => true;
function Consumer() {
  const { surfaces, ready } = useUsageAnalytics();
  return (
    <p>
      {surfaces.join(',')}:{ready ? 'ready' : 'pending'}
    </p>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  useFeatureFlags.mockReturnValue({ canAccess, ready: true });
  recordView.mockResolvedValue(null);
  getNavProfile.mockResolvedValue({ state: 'INSUFFICIENT', surfaces: [] });
});
it('shares eligible routes and records navigation without interrupting children', async () => {
  render(
    <MemoryRouter initialEntries={['/reports']}>
      <UsageAnalyticsProvider>
        <Consumer />
      </UsageAnalyticsProvider>
    </MemoryRouter>,
  );
  expect(await screen.findByText('/reports:ready')).toBeInTheDocument();
  expect(getNavProfile).toHaveBeenCalledWith({
    surfaces: ['/reports'],
    signal: expect.any(AbortSignal),
  });
  expect(recordView).toHaveBeenCalledWith('/reports');
});
it('leaves the profile unavailable when analytics fails and still renders children', async () => {
  getNavProfile.mockRejectedValue(new Error('Offline'));
  render(
    <MemoryRouter>
      <UsageAnalyticsProvider>
        <Consumer />
      </UsageAnalyticsProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(getNavProfile).toHaveBeenCalled());
  expect(screen.getByText('/reports:pending')).toBeInTheDocument();
});
