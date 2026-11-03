import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { getAlerts } = vi.hoisted(() => ({ getAlerts: vi.fn() }));

vi.mock('../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ canAccess: () => true }),
}));
vi.mock('../lib/liveStream', () => ({
  getLiveStream: () => ({ subscribe: () => () => {} }),
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
});
