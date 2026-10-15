import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FleetLinkIndicator from './FleetLinkIndicator';
import FleetLinkContext from '../contexts/fleetLinkContext';

const renderWith = (value) =>
  render(
    <FleetLinkContext.Provider value={{ openPanel: vi.fn(), ...value }}>
      <FleetLinkIndicator />
    </FleetLinkContext.Provider>,
  );

const summary = (extra) => ({ needsRelink: 0, expiring: 0, affectedVehicles: 0, ...extra });

describe('FleetLinkIndicator', () => {
  it('is always shown to a role that can re-link, even before data arrives', () => {
    renderWith({ enabled: true, data: null });
    expect(screen.getByRole('button', { name: 'FleetEdge connection' })).toBeInTheDocument();
  });

  it('stays visible when every account is connected', () => {
    renderWith({
      enabled: true,
      data: {
        severity: 'none',
        summary: summary(),
        accounts: [{ accountId: 'a', state: 'HEALTHY' }],
      },
    });
    expect(
      screen.getByRole('button', { name: 'FleetEdge: all accounts connected' }),
    ).toBeInTheDocument();
  });

  it('shows the number of disconnected accounts and opens the panel', () => {
    const openPanel = vi.fn();
    renderWith({
      enabled: true,
      openPanel,
      data: {
        severity: 'critical',
        summary: summary({ needsRelink: 2 }),
        accounts: [],
      },
    });
    const button = screen.getByRole('button', { name: 'FleetEdge: 2 accounts need reconnecting' });
    expect(button).toHaveTextContent('2');
    fireEvent.click(button);
    expect(openPanel).toHaveBeenCalledTimes(1);
  });

  it('renders nothing for a role that cannot re-link', () => {
    const { container } = renderWith({ enabled: false, data: null });
    expect(container).toBeEmptyDOMElement();
  });
});
