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

    expect(await screen.findByText('GPS freezes on WB11F0162')).toBeInTheDocument();
    expect(screen.getByText('FleetEdge account stopped sending data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Reconnect account/ })).toHaveAttribute(
      'href',
      '/settings/fleetedge-accounts',
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

    await screen.findByText('GPS freezes on WB11F0162');
    fireEvent.click(screen.getByRole('button', { name: /^Needs you/ }));

    expect(screen.queryByText('GPS freezes on WB11F0162')).not.toBeInTheDocument();
    expect(screen.getByText('FleetEdge account stopped sending data')).toBeInTheDocument();
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
