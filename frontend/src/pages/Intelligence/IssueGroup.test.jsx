import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IssueGroup from './IssueGroup';
import { groupIssuesByKind } from './intelligenceModel';

const issue = {
  id: 'iss-77',
  kind: 'GPS_FROZEN',
  severity: 'watch',
  registrationNumber: 'WB11F0162',
  accountName: null,
  title: 'GPS freezes on WB11F0162',
  detail:
    'The position stayed within 5 metres of one spot 3 times across 2 day(s), while the truck reported up to 38 km/h.',
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

function renderGroup(items) {
  const [group] = groupIssuesByKind(items);
  return render(
    <MemoryRouter>
      <IssueGroup group={group} />
    </MemoryRouter>,
  );
}

describe('IssueGroup', () => {
  it('says what the group is, how many trucks, its tone and what to do', () => {
    renderGroup([issue]);

    expect(screen.getByRole('heading', { name: 'GPS freezes' })).toBeInTheDocument();
    expect(screen.getByText('1 truck')).toBeInTheDocument();
    expect(screen.getByText('Watch')).toBeInTheDocument();
    expect(screen.getByText(/Check the GPS antenna cable/)).toBeInTheDocument();
    // The kind's own numbers, read from the issue.
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('38 km/h')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'What we saw' })).toBeInTheDocument();
    expect(screen.getByTitle(issue.detail)).toBeInTheDocument();
  });

  it('opens the evidence when the owner asks for it', () => {
    renderGroup([issue]);

    const toggle = screen.getByRole('button', { name: /WB11F0162: show details/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /WB11F0162: hide details/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Position unchanged for 24 min on NH19')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Open on the map/ })).toHaveAttribute(
      'href',
      '/live-tracking?v=WB11F0162',
    );
  });

  it('sends the owner to the re-link screen when an account stopped sending', () => {
    renderGroup([
      {
        ...issue,
        severity: 'act',
        kind: 'ACCOUNT_DISCONNECTED',
        registrationNumber: null,
        accountName: 'GNB Buxar Fleet',
        action: { kind: 'RECONNECT', label: 'Reconnect account', to: '/settings/fleetedge-accounts' },
      },
    ]);

    expect(screen.getByRole('link', { name: /Reconnect account/ })).toHaveAttribute(
      'href',
      '/settings/fleetedge-accounts',
    );
    expect(screen.getByText('Needs you')).toBeInTheDocument();
    expect(screen.getByText('GNB Buxar Fleet')).toBeInTheDocument();
  });

  it('makes a call to the dealer a telephone link', () => {
    renderGroup([
      { ...issue, action: { kind: 'CALL_DEALER', label: 'Call dealer', to: 'tel:+911234567890' } },
    ]);

    expect(screen.getByRole('link', { name: /Call dealer/ })).toHaveAttribute(
      'href',
      'tel:+911234567890',
    );
  });

  it('does not invent a phone number when there is none, and says the step instead', () => {
    renderGroup([
      { ...issue, action: { kind: 'CALL_DEALER', label: 'Check the tracker’s power and SIM', to: null } },
    ]);

    expect(screen.queryByRole('link', { name: /Check the tracker/ })).not.toBeInTheDocument();
    expect(screen.getByText('Check the tracker’s power and SIM.')).toBeInTheDocument();
  });

  it('keeps each truck’s own advice when the trucks of a kind were told different things', () => {
    renderGroup([
      issue,
      { ...issue, id: 'iss-78', registrationNumber: 'WB11F0262', advice: 'Replace the antenna.' },
    ]);

    expect(screen.queryByText(/What to do/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /WB11F0262: show details/ }));
    expect(screen.getByText('Replace the antenna.')).toBeInTheDocument();
  });

  it('shows the first rows and the rest one click away', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      ...issue,
      id: `iss-${i}`,
      registrationNumber: `WB11F0${i}62`,
    }));
    renderGroup(many);

    expect(screen.getAllByRole('button', { name: /show details/ })).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: /Show all 6/ }));
    expect(screen.getAllByRole('button', { name: /show details/ })).toHaveLength(6);
  });
});
