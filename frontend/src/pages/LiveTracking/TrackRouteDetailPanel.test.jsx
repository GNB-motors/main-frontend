import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TrackRouteDetailPanel from './TrackRouteDetailPanel.jsx';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService.js', () => ({
  default: { getLeg: vi.fn(), getDeliveryLeg: vi.fn() },
}));
const leg = {
  _id: 'learned-leg',
  title: 'Plant → Depot',
  traversals: 8,
  stats: { km: { p50: 20 }, minutes: { p50: 45 } },
};

describe('learned route detail', () => {
  it('loads the learned-leg API and renders recent runs in the sidebar', async () => {
    PlaceIntelligenceService.getLeg.mockResolvedValue({
      ...leg,
      path: { source: 'DRIVEN', km: 20 },
      traversals: [
        { registrationNumber: 'WB11TEST', departedAt: '2026-11-05T10:00:00Z', km: 21, minutes: 46 },
      ],
    });
    const close = vi.fn();
    render(<TrackRouteDetailPanel docked id={leg._id} leg={leg} onClose={close} />);
    expect(await screen.findByText('WB11TEST')).toBeInTheDocument();
    expect(PlaceIntelligenceService.getLeg).toHaveBeenCalledWith('learned-leg', {
      signal: expect.any(AbortSignal),
    });
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('20 km mapped road distance')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveClass('lt-route-detail');
    fireEvent.click(screen.getByRole('button', { name: 'All routes' }));
    expect(close).toHaveBeenCalled();
  });
  it('keeps the route summary and permits retry when detail fails', async () => {
    PlaceIntelligenceService.getLeg
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ...leg, traversals: [] });
    render(<TrackRouteDetailPanel docked id={leg._id} leg={leg} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load route details');
    expect(screen.getByRole('heading', { name: 'Plant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Depot' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry route details' }));
    expect(await screen.findByText('No recent runs recorded.')).toBeInTheDocument();
  });
});

it('loads a delivery ID through the delivery API and links its trips and SAP workspace', async () => {
  vi.clearAllMocks();
  PlaceIntelligenceService.getDeliveryLeg.mockResolvedValue({
    _id: 'delivery1',
    fromName: 'Factory',
    toName: 'Customer',
    n: 12,
    km: { p50: 123 },
    sap: { sapKm: 120, basis: 'ONE_WAY' },
    samples: [{ autoTripId: 'trip1', registrationNumber: 'WBTEST', km: 123 }],
  });
  render(
    <MemoryRouter>
      <TrackRouteDetailPanel
        docked
        showSap
        kind="delivery"
        id="delivery1"
        leg={{ ...leg, _id: 'delivery1', n: 12, title: 'Factory → Customer' }}
      />
    </MemoryRouter>,
  );
  expect(await screen.findByRole('link', { name: 'WBTEST' })).toHaveAttribute(
    'href',
    '/auto-trips/trip1',
  );
  expect(PlaceIntelligenceService.getDeliveryLeg).toHaveBeenCalledWith('delivery1', {
    signal: expect.any(AbortSignal),
  });
  expect(PlaceIntelligenceService.getLeg).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Open delivery route & SAP' })).toHaveAttribute(
    'href',
    '/place-hub?tab=routes&routeView=deliveries&delivery=delivery1',
  );
  expect(screen.getByText('120 km · one way')).toBeInTheDocument();
});
