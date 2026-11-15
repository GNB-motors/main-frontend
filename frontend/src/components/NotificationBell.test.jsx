import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

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
import { toast } from 'react-toastify';
vi.mock('react-toastify', () => ({ toast: { info: vi.fn() } }));
function Location() {
  return <output aria-label="Current location">{useLocation().pathname}</output>;
}

function renderBell() {
  return render(
    <MemoryRouter>
      <NotificationBell />
      <Location />
    </MemoryRouter>,
  );
}

describe('NotificationBell (F13)', () => {
  beforeEach(() => {
    getAlerts.mockReset();
    branch.id = null;
    subscribe.mockClear();
    toast.info.mockClear();
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

it('opens the grouped inbox and removes the misleading refuel-to-mileage shortcut', async () => {
  getAlerts.mockResolvedValue({ records: [], meta: { counts: { critical: 0 } } });
  renderBell();
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
  expect(await screen.findByRole('button', { name: /Alert inbox/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Refuel Alerts/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Alert inbox/ }));
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/alert-inbox');
});

it('only notifies about new unreviewed critical alerts, never informational or historical replays', async () => {
  getAlerts.mockResolvedValue({ records: [], meta: { counts: { critical: 0 } } });
  renderBell();
  await waitFor(() => expect(subscribe).toHaveBeenCalled());
  const receive = subscribe.mock.calls.at(-1)[1];
  const old = new Date(Date.now() - 86400000).toISOString();
  const fresh = new Date(Date.now() + 1000).toISOString();
  act(() =>
    receive([
      { id: 'refuel', type: 'FLEETEDGE_ALERT_REFUEL', severity: 'INFO', at: fresh },
      { id: 'replay', type: 'THEFT_CORROBORATED', severity: 'CRITICAL', at: old },
      {
        id: 'seen',
        type: 'THEFT_CORROBORATED',
        severity: 'CRITICAL',
        acknowledged: true,
        at: fresh,
      },
    ]),
  );
  expect(toast.info).not.toHaveBeenCalled();
  const alert = {
    id: 'new',
    type: 'THEFT_CORROBORATED',
    severity: 'CRITICAL',
    acknowledged: false,
    vehicleNumber: 'WB11G1262',
    at: fresh,
  };
  act(() => receive([alert]));
  expect(toast.info).toHaveBeenCalledTimes(1);
  expect(toast.info.mock.calls[0][0]).toContain('WB11G1262');
  expect(screen.getByText('1')).toBeInTheDocument();
  act(() => receive([alert]));
  expect(toast.info).toHaveBeenCalledTimes(1);
});
