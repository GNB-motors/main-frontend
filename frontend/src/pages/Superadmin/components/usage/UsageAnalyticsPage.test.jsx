import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UsageAnalyticsPage from './UsageAnalyticsPage';
import { getOrgUsageSummary, listOrganizations } from '../../../../services/UsageAnalyticsService';

vi.mock('../../../../services/UsageAnalyticsService', () => ({
  getOrgUsageSummary: vi.fn(),
  listOrganizations: vi.fn(),
  getNavProfile: vi.fn(),
  getUsageSummary: vi.fn(),
  recordView: vi.fn(),
}));

const ORGS = [
  { _id: 'org1', name: 'BD Roadlines' },
  { _id: 'org2', name: 'GNB Transport' },
];

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
  ],
  daily: [
    { day: '2026-10-20', views: 10 },
    { day: '2026-10-21', views: 30 },
  ],
};

function mount(initialEntries = ['/superadmin/app-usage']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <UsageAnalyticsPage />
    </MemoryRouter>,
  );
}

async function pickOrg(name = 'BD Roadlines') {
  await screen.findByRole('option', { name });
  fireEvent.change(screen.getByRole('combobox', { name: 'Organization' }), {
    target: { value: 'org1' },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  listOrganizations.mockResolvedValue(ORGS);
  getOrgUsageSummary.mockResolvedValue(payload);
});

describe('App Usage (superadmin)', () => {
  it('asks for an organization before reading any usage', async () => {
    mount();
    expect(await screen.findByText('No organization selected')).toBeInTheDocument();
    expect(getOrgUsageSummary).not.toHaveBeenCalled();
  });

  it('loads the chosen org summary and renders screens without linking into them', async () => {
    mount();
    await pickOrg();
    expect(getOrgUsageSummary).toHaveBeenCalledWith('org1', { signal: expect.any(AbortSignal) });
    expect(await screen.findByText('Reports')).toBeInTheDocument();
    // superadmin cannot open client screens from here: labels, no links
    expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument();
    expect(screen.getByText(/Data through 2026-10-21/)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName(/Daily page opens/);
    expect(screen.getByText('BD Roadlines')).toBeInTheDocument();
  });

  it('searches and filters screen activity and exposes role counts', async () => {
    mount();
    await pickOrg();
    await screen.findByText('Reports');
    fireEvent.change(screen.getByRole('textbox', { name: 'Search screens' }), {
      target: { value: 'reports' },
    });
    expect(screen.queryByText('Live Tracking')).not.toBeInTheDocument();
    expect(screen.getByText('OWNER: 3 opens')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Usage category' }), {
      target: { value: 'NEVER_OPENED' },
    });
    expect(screen.getByText('No matching screens')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('Live Tracking')).toBeInTheDocument();
  });

  it('recovers from failure with Retry', async () => {
    getOrgUsageSummary.mockRejectedValueOnce(new Error('Network unavailable'));
    mount();
    await pickOrg();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await screen.findByText('Reports');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps incomplete history separate from an API failure', async () => {
    getOrgUsageSummary.mockResolvedValue({
      state: 'INSUFFICIENT',
      window: {},
      learned: {},
      surfaces: [],
      daily: [],
    });
    mount();
    await pickOrg();
    await screen.findByText('Collecting history', { selector: 'strong' });
    expect(screen.getByText('No screen history yet')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('aborts the read when the page unmounts', async () => {
    getOrgUsageSummary.mockReturnValue(new Promise(() => {}));
    const view = mount();
    await pickOrg();
    await waitFor(() => expect(getOrgUsageSummary).toHaveBeenCalled());
    const signal = getOrgUsageSummary.mock.calls[0][1].signal;
    view.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('reads the org from the URL so a shared link reopens it', async () => {
    mount(['/superadmin/app-usage?org=org2']);
    await waitFor(() =>
      expect(getOrgUsageSummary).toHaveBeenCalledWith('org2', { signal: expect.any(AbortSignal) }),
    );
  });
});
