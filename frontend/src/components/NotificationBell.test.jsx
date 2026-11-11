import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getAlerts, branch, subscribe } = vi.hoisted(() => ({
  getAlerts: vi.fn(),
  branch: { id: null },
  subscribe: vi.fn(() => () => {}),
}));
vi.mock('../contexts/BranchContext', () => ({ useActiveBranch: () => ({ branchId: branch.id }) }));

vi.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ canAccess: () => true }),
}));
vi.mock('../lib/liveStream', () => ({
  getLiveStream: () => ({ subscribe }),
}));
vi.mock('../pages/OwnerAlerts/OwnerAlertsService.js', async (importOriginal) => {
  const actual = await importOriginal();
  actual.OwnerAlertsService.getAlerts = getAlerts;
  return actual;
});

import NotificationBell from './NotificationBell';

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>,
  );
}

describe('NotificationBell (F13)', () => {
  beforeEach(() => {
    getAlerts.mockReset();
    branch.id = null;
    subscribe.mockClear();
  });

  it('counts open critical alerts only, from the server count, with no "99+"', async () => {
    getAlerts.mockResolvedValue({
      records: [],
      total: 0,
      unacknowledgedCount: 451,
      meta: { counts: { critical: 124, warning: 327 } },
    });
    renderBell();
    expect(await screen.findByText('124')).toBeInTheDocument();
    expect(screen.queryByText('99+')).not.toBeInTheDocument();
    expect(getAlerts.mock.calls[0][0]).toMatchObject({ severity: 'critical', acknowledged: false });
  });

  it('shows no number while the server cannot tell critical apart', async () => {
    getAlerts.mockImplementation(async () => {
      throw Object.assign(new Error('Bad request'), { status: 400 });
    });
    renderBell();
    await waitFor(() => expect(getAlerts).toHaveBeenCalled());
    expect(screen.queryByText('451')).not.toBeInTheDocument();
    expect(screen.queryByText('99+')).not.toBeInTheDocument();
  });

  it('resubscribes on location change and ignores a late enterprise unread response', async () => {
    let finishEnterprise;
    getAlerts.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishEnterprise = resolve;
        }),
    );
    getAlerts.mockResolvedValue({ records: [], total: 0, meta: { counts: { critical: 0 } } });
    const view = renderBell();
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1));
    branch.id = 'chennai';
    view.rerender(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(2));
    finishEnterprise({ records: [], total: 0, meta: { counts: { critical: 124 } } });
    await waitFor(() => expect(getAlerts).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('124')).not.toBeInTheDocument();
  });
});
