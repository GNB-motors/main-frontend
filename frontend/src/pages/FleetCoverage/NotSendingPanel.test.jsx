import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import NotSendingPanel from './NotSendingPanel.jsx';

const ASOF = '2026-11-20T00:00:00Z';

const SIGNAL = {
  asOf: ASOF,
  counts: {
    STOPPED: 2,
    DEVICE_DEAD: 1,
    NEVER_SENT: 1,
    ACCOUNT_LINK_LOST: 3,
    SUBSCRIPTION_EXPIRED: 1,
    NO_DEVICE: 1,
    SPARSE: 1,
    MARKET: 15,
    LIVE: 42,
  },
  rows: [
    {
      vehicleId: 'v1',
      registrationNumber: 'KA01AB1234',
      reason: 'STOPPED',
      lastFixAt: '2026-11-17T00:00:00Z',
      stoppedSince: '2026-11-17T00:00:00Z',
      fixesPerDay7d: 0,
      orgP10: 40,
      account: { provider: 'FleetEdge', id: 'acc-1', name: 'BD FleetEdge' },
    },
    {
      vehicleId: 'v2',
      registrationNumber: 'MH02CD5678',
      reason: 'DEVICE_DEAD',
      lastFixAt: '2025-01-05T00:00:00Z',
      fixesPerDay7d: null,
      orgP10: 40,
      account: null,
    },
    {
      vehicleId: 'v3',
      registrationNumber: 'DL03EF9012',
      reason: 'NEVER_SENT',
      lastFixAt: null,
      fixesPerDay7d: null,
      orgP10: null,
      account: null,
    },
    {
      vehicleId: 'v4',
      registrationNumber: 'TN04GH1234',
      reason: 'ACCOUNT_LINK_LOST',
      lastFixAt: '2026-11-19T00:00:00Z',
      fixesPerDay7d: 12,
      orgP10: 40,
      account: { provider: 'FleetEdge', id: 'acc-2', name: 'BD FleetEdge' },
    },
    {
      vehicleId: 'v5',
      registrationNumber: 'KL05IJ5678',
      reason: 'SUBSCRIPTION_EXPIRED',
      lastFixAt: '2026-11-19T00:00:00Z',
      fixesPerDay7d: 3,
      orgP10: 40,
      account: { provider: 'iALERT', id: 'acc-3', name: 'BD iALERT' },
    },
    {
      vehicleId: 'v6',
      registrationNumber: 'GA06KL9012',
      reason: 'NO_DEVICE',
      lastFixAt: null,
      fixesPerDay7d: null,
      orgP10: null,
      account: null,
    },
    {
      vehicleId: 'v7',
      registrationNumber: 'GJ07MN3456',
      reason: 'SPARSE',
      lastFixAt: '2026-11-19T00:00:00Z',
      fixesPerDay7d: 12,
      orgP10: null,
      account: { provider: 'FleetEdge', id: 'acc-1', name: 'BD FleetEdge' },
    },
    {
      vehicleId: null,
      registrationNumber: 'PB08OP7890',
      reason: 'MARKET',
      lastFixAt: null,
      fixesPerDay7d: null,
      orgP10: null,
      account: null,
      registerCycles: 12,
      registerLastAt: '2026-11-01T00:00:00Z',
    },
  ],
};

/** The chip for a reason: its label plus its count (chips live in the header). */
const chipText = (label) => {
  const header = screen.getByText('Trucks not sending').closest('div');
  return within(header).getByText(label).parentElement.textContent;
};

describe('NotSendingPanel', () => {
  it('renders a group for every reason that has trucks', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    [
      'Stopped (1)',
      'Device dead (1)',
      'Never sent (1)',
      'Account link lost (1)',
      'Subscription expired (1)',
      'No device (1)',
      'Sparse (1)',
      'Market truck (1)',
    ].forEach((heading) => {
      expect(screen.getByText(heading)).toBeInTheDocument();
    });

    expect(screen.getByText('KA01AB1234')).toBeInTheDocument();
    expect(screen.getByText('PB08OP7890')).toBeInTheDocument();
  });

  it('counts every reason, and gives LIVE a count but no table', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    expect(chipText('Stopped')).toBe('Stopped2');
    expect(chipText('Market truck')).toBe('Market truck15');
    expect(chipText('Live')).toBe('Live42');
    expect(screen.queryByText(/^Live \(/)).not.toBeInTheDocument();
  });

  it('says what to do for each reason', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    expect(screen.getByText(/Relink the account\./)).toBeInTheDocument();
    expect(screen.getByText(/Renew the subscription\./)).toBeInTheDocument();
    expect(screen.getAllByText(/Fit or check the device\./)).toHaveLength(2);
    expect(screen.getAllByText(/Ask FleetEdge/)).toHaveLength(2);
  });

  it('renders unknown values as a dash, never as 0', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    // Never sent: no last fix, no rate, no account — three dashes.
    const neverSent = screen.getByText('DL03EF9012').closest('tr');
    expect(within(neverSent).getAllByText('—')).toHaveLength(3);

    // Sparse: the rate is known, the org's own normal is not.
    const sparse = screen.getByText('GJ07MN3456').closest('tr');
    expect(within(sparse).getByText('12/day vs normal —')).toBeInTheDocument();

    // A real zero is a zero, not a dash.
    const stopped = screen.getByText('KA01AB1234').closest('tr');
    expect(within(stopped).getByText('0/day vs normal 40/day')).toBeInTheDocument();
  });

  it('shows the last fix as a date and how long ago it was', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    const stopped = screen.getByText('KA01AB1234').closest('tr');
    expect(within(stopped).getByText(/17 Nov 2026 · 3 days ago/)).toBeInTheDocument();
  });

  it('says a market truck needs no action', () => {
    render(<NotSendingPanel signal={SIGNAL} />);

    expect(screen.getByText(/no action/i)).toBeInTheDocument();
  });

  it('renders an empty state when every truck is sending', () => {
    render(<NotSendingPanel signal={{ asOf: ASOF, counts: { LIVE: 12 }, rows: [] }} />);

    expect(screen.getByText('Every truck is sending')).toBeInTheDocument();
    expect(screen.queryByText(/Market truck \(/)).not.toBeInTheDocument();
  });

  it('renders nothing before the payload arrives', () => {
    const { container } = render(<NotSendingPanel signal={null} />);

    expect(container.firstChild).toBeNull();
  });
});
