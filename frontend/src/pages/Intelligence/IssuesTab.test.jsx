import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getIssues: vi.fn() },
}));

import IntelligenceService from './IntelligenceService';
import IssuesTab from './IssuesTab';

const issues = {
  items: [
    {
      id: 'iss-81',
      kind: 'ACCOUNT_DISCONNECTED',
      severity: 'act',
      accountName: 'GNB Buxar Fleet',
      title: 'FleetEdge account stopped sending data',
      detail: 'No report from 4 trucks on this account since 1 Nov, 9:00 am.',
      advice: 'Re-link the account so live data comes back.',
      firstSeenAt: '2026-11-01T09:00:00Z',
      lastSeenAt: '2026-11-02T18:30:00Z',
      occurrences: 1,
      evidence: [],
      action: { kind: 'RECONNECT', label: 'Reconnect account', to: '/settings/fleetedge-accounts' },
    },
    {
      id: 'iss-77',
      kind: 'GPS_FROZEN',
      severity: 'watch',
      registrationNumber: 'WB11F0162',
      title: 'GPS freezes on WB11F0162',
      detail: 'The position stopped changing for 24 minutes while the truck was moving on NH19.',
      advice: 'Check the GPS antenna cable.',
      firstSeenAt: '2026-10-28T05:00:00Z',
      lastSeenAt: '2026-11-01T09:30:00Z',
      occurrences: 3,
      evidence: [],
      action: null,
    },
  ],
  total: 2,
  counts: { good: 0, info: 0, watch: 1, act: 1 },
};

describe('IssuesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the open issues with their advice', async () => {
    IntelligenceService.getIssues.mockResolvedValue(issues);

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'GPS freezes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Account stopped sending data' })).toBeInTheDocument();
    expect(screen.getByText('WB11F0162')).toBeInTheDocument();
    expect(screen.getByText('GNB Buxar Fleet')).toBeInTheDocument();
    expect(screen.getByText('Check the GPS antenna cable.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reconnect account/ })).toHaveAttribute(
      'href',
      '/settings/fleetedge-accounts',
    );
  });

  it('puts what needs the owner first', async () => {
    IntelligenceService.getIssues.mockResolvedValue(issues);
    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: 'GPS freezes' });
    const headings = screen.getAllByRole('heading').map((h) => h.textContent);
    expect(headings).toEqual(['Account stopped sending data', 'GPS freezes']);
  });

  it('groups the trucks of one kind under one card with the advice said once', async () => {
    const silent = (id, reg, days) => ({
      id,
      kind: 'NO_DATA',
      severity: 'act',
      registrationNumber: reg,
      title: `No data from ${reg}`,
      detail: `No reading for ${days} days, while the telematics account feeding this truck is healthy.`,
      advice: 'Check that the tracker has power and the SIM is active.',
      firstSeenAt: '2026-10-28T05:00:00Z',
      lastSeenAt: '2026-11-03T23:40:00Z',
      occurrences: 1,
      evidence: [],
      action: { kind: 'CALL_DEALER', label: 'Check the tracker’s power and SIM', to: null },
    });
    IntelligenceService.getIssues.mockResolvedValue({
      items: [silent('a', 'WB11G1562', 4), silent('b', 'WB11M2162', 27), silent('c', 'WB11E9762', 13)],
      total: 3,
      counts: { act: 3, watch: 0, good: 0, info: 0 },
    });
    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'No data' })).toBeInTheDocument();
    expect(screen.getByText('3 trucks')).toBeInTheDocument();
    expect(screen.getByText('silent for 4–27 days')).toBeInTheDocument();
    expect(screen.getAllByText('Check that the tracker has power and the SIM is active.')).toHaveLength(1);
    expect(screen.getByText('27 days')).toBeInTheDocument();
    expect(screen.getByText('Last checked')).toBeInTheDocument();
  });

  it('opens a row to its own detail and evidence', async () => {
    IntelligenceService.getIssues.mockResolvedValue({
      ...issues,
      items: [
        {
          ...issues.items[1],
          evidence: [
            {
              at: '2026-10-28T13:43:56Z',
              text: 'Frozen 152 min, speed up to 38 km/h',
              link: { label: 'Open', to: '/live-tracking?v=WB11F0162' },
            },
          ],
        },
      ],
    });
    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    const row = await screen.findByRole('button', { name: /WB11F0162: show details/ });
    expect(screen.queryByText('Frozen 152 min, speed up to 38 km/h')).not.toBeInTheDocument();
    fireEvent.click(row);
    expect(screen.getByText('Frozen 152 min, speed up to 38 km/h')).toBeInTheDocument();
    expect(
      screen.getByText('The position stopped changing for 24 minutes while the truck was moving on NH19.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Open on the map/ })).toHaveAttribute(
      'href',
      '/live-tracking?v=WB11F0162',
    );
  });

  it('counts every chip', async () => {
    IntelligenceService.getIssues.mockResolvedValue(issues);

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    const all = await screen.findByRole('button', { name: /^All/ });
    expect(all).toHaveTextContent('All2');
    expect(screen.getByRole('button', { name: /^Needs you/ })).toHaveTextContent('Needs you1');
  });

  it('filters the list by the chip that was picked', async () => {
    IntelligenceService.getIssues.mockResolvedValue(issues);

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await screen.findByText('WB11F0162');
    fireEvent.click(screen.getByRole('button', { name: /^Needs you/ }));

    expect(screen.queryByText('WB11F0162')).not.toBeInTheDocument();
    expect(screen.getByText('GNB Buxar Fleet')).toBeInTheDocument();
  });

  it('says everything is fine when there is nothing wrong', async () => {
    IntelligenceService.getIssues.mockResolvedValue({
      items: [],
      total: 0,
      counts: { act: 0, watch: 0 },
    });

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/No open issues returned for this selection/),
    ).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getIssues.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/is being built/)).toBeInTheDocument());
  });

  it('shows the reason the backend is holding the list back', async () => {
    IntelligenceService.getIssues.mockResolvedValue({
      held: true,
      why: { text: 'Issues are being rebuilt.', basis: 'From 1 Oct' },
    });

    render(
      <MemoryRouter>
        <IssuesTab from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Issues are being rebuilt.')).toBeInTheDocument();
  });
});
