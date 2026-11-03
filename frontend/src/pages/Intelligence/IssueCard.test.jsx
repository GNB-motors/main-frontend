import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IssueCard from './IssueCard';

const issue = {
  id: 'iss-77',
  kind: 'GPS_FROZEN',
  severity: 'watch',
  registrationNumber: 'WB11F0162',
  accountName: null,
  title: 'GPS freezes on WB11F0162',
  detail: 'The position stopped changing for 24 minutes while the truck was moving on NH19.',
  advice: 'Check the GPS antenna cable; if it continues, the dealer can replace the module.',
  firstSeenAt: '2026-10-28T05:00:00Z',
  lastSeenAt: '2026-11-01T09:30:00Z',
  occurrences: 3,
  evidence: [
    {
      at: '2026-11-01T09:30:00Z',
      text: 'Position unchanged for 24 min on NH19',
      link: { label: 'Watch it', to: '/live-tracking?v=WB11F0162' },
    },
  ],
  action: null,
};

describe('IssueCard', () => {
  it('says what happened and what to do', () => {
    render(
      <MemoryRouter>
        <IssueCard issue={issue} />
      </MemoryRouter>,
    );

    expect(screen.getByText('GPS freezes on WB11F0162')).toBeInTheDocument();
    expect(screen.getByText(/The position stopped changing/)).toBeInTheDocument();
    expect(screen.getByText(/Check the GPS antenna cable/)).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
  });

  it('opens the evidence when the owner asks for it', async () => {
    render(
      <MemoryRouter>
        <IssueCard issue={issue} />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: 'Evidence (1)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Position unchanged for 24 min on NH19')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Watch it/ })).toHaveAttribute(
      'href',
      '/live-tracking?v=WB11F0162',
    );
  });

  it('sends the owner to the re-link screen when an account stopped sending', () => {
    render(
      <MemoryRouter>
        <IssueCard
          issue={{
            ...issue,
            severity: 'act',
            kind: 'ACCOUNT_DISCONNECTED',
            action: { kind: 'RECONNECT', label: 'Reconnect account', to: '/settings/fleetedge-accounts' },
          }}
          pinned
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Reconnect account/ })).toHaveAttribute(
      'href',
      '/settings/fleetedge-accounts',
    );
    expect(screen.getByText('Needs you')).toBeInTheDocument();
  });

  it('makes a call to the dealer a telephone link', () => {
    render(
      <MemoryRouter>
        <IssueCard
          issue={{
            ...issue,
            action: { kind: 'CALL_DEALER', label: 'Call dealer', to: 'tel:+911234567890' },
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Call dealer/ })).toHaveAttribute(
      'href',
      'tel:+911234567890',
    );
  });

  it('does not invent a phone number when there is none', () => {
    render(
      <MemoryRouter>
        <IssueCard issue={issue} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: /Call dealer/ })).not.toBeInTheDocument();
  });
});
