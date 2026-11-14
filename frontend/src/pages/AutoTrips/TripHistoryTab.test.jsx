import { it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TripHistoryTab from './TripHistoryTab';
import { fleetViewService } from '../../services/fleetViewService';

vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getTripsHistory: vi.fn() },
}));

it('finds a long visit beyond the first page and sends the full selected IST day', async () => {
  const visit = {
    kind: 'VISIT',
    registrationNumber: 'LONG-VISIT',
    arrivedAt: '2026-11-04T10:00:00Z',
    dwellMin: 200,
  };
  fleetViewService.getTripsHistory
    .mockResolvedValueOnce({
      items: [{ ...visit, registrationNumber: 'SHORT-VISIT', dwellMin: 20 }],
      total: 2,
    })
    .mockResolvedValueOnce({ items: [visit], total: 2 });
  render(
    <MemoryRouter>
      <TripHistoryTab from="2026-11-04" to="2026-11-04" minDwellMin="180" />
    </MemoryRouter>,
  );
  expect(await screen.findByText('LONG-VISIT')).toBeInTheDocument();
  expect(screen.queryByText('SHORT-VISIT')).not.toBeInTheDocument();
  await waitFor(() =>
    expect(fleetViewService.getTripsHistory).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: '2026-11-03T18:30:00.000Z',
        to: '2026-11-04T18:29:59.999Z',
        page: 2,
      }),
    ),
  );
});
