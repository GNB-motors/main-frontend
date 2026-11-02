import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AccountLinkBanner from './AccountLinkBanner';

const renderBanner = (account) =>
  render(
    <MemoryRouter>
      <AccountLinkBanner account={account} />
    </MemoryRouter>,
  );

describe('AccountLinkBanner', () => {
  it('says which account is disconnected and how many trucks are quiet', () => {
    renderBanner({
      accountId: 'acc-1',
      accountName: 'GNB Buxar Fleet',
      state: 'NEEDS_RELINK',
      lastDataAt: null,
      trucks: 4,
      action: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
    });

    expect(screen.getByText('GNB Buxar Fleet')).toBeInTheDocument();
    expect(screen.getByText(/account disconnected/)).toBeInTheDocument();
    expect(screen.getByText(/4 trucks have no live data/)).toBeInTheDocument();
  });

  it('carries the one button that fixes it', () => {
    renderBanner({
      accountId: 'acc-1',
      accountName: 'GNB Buxar Fleet',
      state: 'NEEDS_RELINK',
      lastDataAt: null,
      trucks: 4,
      action: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
    });

    const link = screen.getByRole('link', { name: 'Reconnect' });
    expect(link.getAttribute('href')).toBe('/settings/fleetedge-accounts');
  });

  it('says the link expires soon for an expiring account', () => {
    renderBanner({
      accountId: 'acc-2',
      accountName: 'GNB Patna Fleet',
      state: 'EXPIRING',
      lastDataAt: null,
      trucks: 0,
      action: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
    });

    expect(screen.getByText(/link expires soon/)).toBeInTheDocument();
  });

  it('says nothing for a healthy account', () => {
    const { container } = renderBanner({
      accountId: 'acc-3',
      accountName: 'GNB Healthy Fleet',
      state: 'HEALTHY',
      lastDataAt: null,
      trucks: 12,
      action: null,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('never says siphon or theft', () => {
    renderBanner({
      accountId: 'acc-1',
      accountName: 'GNB Buxar Fleet',
      state: 'NEEDS_RELINK',
      lastDataAt: null,
      trucks: 4,
      action: { label: 'Reconnect', to: '/settings/fleetedge-accounts' },
    });

    expect(document.body.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });
});
