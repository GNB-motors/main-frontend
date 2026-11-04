import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import SapLossLanes from './SapLossLanes';
import SapService from '../../services/SapService';

vi.mock('../../services/SapService', () => ({
  default: { lossLanes: vi.fn() },
}));

const LOSS_LANES = {
  rows: [
    {
      lane: 'Buxar → Patna',
      routeKey: 'Buxar|Patna',
      trips: 12,
      shortfallKmPerTrip: 18.4,
      shortfallKmTotal: 220,
      litresTotal: 31.2,
      shortfallInrTotal: 2745,
      kmPerLSource: 'THIS_TRUCK',
      inrPerLSource: 'CONFIG_PRICE',
      unpricedTrips: 0,
      unpricedKm: 0,
      noMoneyReason: null,
    },
  ],
  kmSource: 'ROUTE_SAP_VS_SHORTEST_ROAD',
  pricedFrom: { note: 'Each trip is priced on its own truck.' },
};

describe('SapLossLanes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loss-lane rows with the loss and the basis it was priced from', async () => {
    SapService.lossLanes.mockResolvedValue(LOSS_LANES);
    render(<SapLossLanes />);

    expect(await screen.findByText('Buxar → Patna')).toBeInTheDocument();
    expect(screen.getByText('₹2,745')).toBeInTheDocument();
    expect(screen.getByText(/THIS_TRUCK km\/L/)).toBeInTheDocument();
    expect(screen.getByText(/CONFIG_PRICE ₹\/L/)).toBeInTheDocument();
  });

  it('hides the section on 403 — no error, no toast', async () => {
    SapService.lossLanes.mockRejectedValue(
      Object.assign(new Error('Forbidden'), { response: { status: 403 } }),
    );
    const { container } = render(<SapLossLanes />);

    await waitFor(() => expect(SapService.lossLanes).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(container.textContent).not.toContain('Forbidden');
  });
});
