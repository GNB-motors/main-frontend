import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UsageAnalyticsPage from './UsageAnalyticsPage';
import { UsageAnalyticsContext } from '../../contexts/UsageAnalyticsContext';
import { getUsageSummary } from '../../services/UsageAnalyticsService';
vi.mock('../../services/UsageAnalyticsService', () => ({ getUsageSummary: vi.fn() }));
const catalog = [
  { type: 'link', to: '/reports', label: 'Reports' },
  { type: 'link', to: '/live-tracking', label: 'Live Tracking' },
];
const surfaces = catalog.map((item) => item.to);
const updateProfile = vi.fn();
const payload = {
  state: 'LEARNED',
  computedAt: '2026-10-22T02:00:00Z',
  window: { from: '2026-10-20', to: '2026-10-21' },
  learned: { totalViews: 40, userDays: 3, engagementFloor: 20 },
  surfaces: [
    {
      surfaceKey: '/reports',
      disposition: 'BELOW_ORG_FLOOR',
      evidence: { views: 3, activeDays: 2, followOn: 1, viewsByRole: { OWNER: 3 } },
    },
    {
      surfaceKey: '/live-tracking',
      disposition: 'AT_OR_ABOVE_FLOOR',
      evidence: { views: 37, activeDays: 2 },
    },
    { surfaceKey: '/old-screen', disposition: 'NEVER_OPENED', evidence: {} },
  ],
  daily: [
    { day: '2026-10-20', views: 10 },
    { day: '2026-10-21', views: 30 },
  ],
};
function mount() {
  return render(
    <MemoryRouter>
      <UsageAnalyticsContext.Provider value={{ catalog, surfaces, updateProfile }}>
        <UsageAnalyticsPage />
      </UsageAnalyticsContext.Provider>
    </MemoryRouter>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  getUsageSummary.mockResolvedValue(payload);
});
describe('App Usage', () => {
  it('shares the eligible catalog with the sidebar and renders screen links and the data horizon', async () => {
    mount();
    expect(await screen.findByRole('link', { name: 'Reports' })).toHaveAttribute(
      'href',
      '/reports',
    );
    expect(getUsageSummary).toHaveBeenCalledWith({ surfaces, signal: expect.any(AbortSignal) });
    expect(updateProfile).toHaveBeenCalledWith(payload);
    expect(screen.getByText(/Data through 2026-10-21/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Old Screen/ })).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Daily page opens/);
  });
  it('searches and filters screen activity and exposes role counts', async () => {
    mount();
    await screen.findByRole('link', { name: 'Reports' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Search screens' }), {
      target: { value: 'reports' },
    });
    expect(screen.queryByRole('link', { name: 'Live Tracking' })).not.toBeInTheDocument();
    expect(screen.getByText('OWNER: 3 opens')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Usage category' }), {
      target: { value: 'NEVER_OPENED' },
    });
    expect(screen.getByText('No matching screens')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('link', { name: 'Live Tracking' })).toBeInTheDocument();
  });
  it('recovers from failure with Retry', async () => {
    getUsageSummary.mockRejectedValueOnce(new Error('Network unavailable'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByRole('link', { name: 'Reports' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('keeps incomplete history separate from an API failure', async () => {
    getUsageSummary.mockResolvedValue({
      state: 'INSUFFICIENT',
      window: {},
      learned: {},
      surfaces: [],
      daily: [],
    });
    mount();
    await screen.findByText('Collecting history', { selector: 'strong' });
    expect(screen.getByText('No screen history yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('aborts the read when the page unmounts', async () => {
    getUsageSummary.mockReturnValue(new Promise(() => {}));
    const view = mount();
    await waitFor(() => expect(getUsageSummary).toHaveBeenCalled());
    const signal = getUsageSummary.mock.calls[0][0].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });
});
