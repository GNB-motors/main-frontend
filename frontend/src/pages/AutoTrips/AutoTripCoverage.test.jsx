import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AutoTripCoverage from './AutoTripCoverage';
import AutoTripService from '../../services/AutoTripService';
import { getUserRole } from '../../utils/session.js';

vi.mock('../../services/AutoTripService', () => ({ default: { coverage: vi.fn() } }));
vi.mock('../../utils/session.js', () => ({ getUserRole: vi.fn() }));

const coverage = {
  trucksMissing: 14,
  missing: Array.from({ length: 14 }, (_, index) => ({
    vehicleId: `vehicle-${index}`,
    registrationNumber: `WB-TRUCK-${index}`,
    reason: index < 8 ? 'NO_CONFIRMED_PICKUP' : 'NO_STOPS',
  })),
  candidatePlaces: [{ orgSiteId: 'plant-1', name: 'Salbani', trucks: 8, stops: 20 }],
};

function open() {
  render(
    <MemoryRouter>
      <AutoTripCoverage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.coverage.mockResolvedValue(coverage);
});

it('keeps details out of the page and opens the full truck list from the badge summary', async () => {
  open();
  const badge = await screen.findByRole('button', { name: '14 trucks without trips' });
  expect(badge).toHaveTextContent('14 trucks without trips');
  expect(screen.queryByText('WB-TRUCK-0')).not.toBeInTheDocument();
  expect(screen.queryByText('Places to confirm as a pickup')).not.toBeInTheDocument();

  fireEvent.mouseEnter(badge);
  fireEvent.mouseMove(badge);
  const reason = await screen.findByText('Pickup place not confirmed');
  expect(reason.closest('li')).toHaveTextContent('8 trucks');
  expect(screen.getByText('No GPS stops recorded').closest('li')).toHaveTextContent('6 trucks');
  fireEvent.click(screen.getByRole('button', { name: 'View all 14 trucks' }));

  const dialog = within(await screen.findByRole('dialog', { name: 'Trucks without trips' }));
  for (const truck of coverage.missing) {
    expect(dialog.getByText(truck.registrationNumber)).toBeInTheDocument();
  }
  expect(dialog.getByRole('link', { name: 'Salbani' })).toHaveAttribute(
    'href',
    '/place-hub?place=site%3Aplant-1',
  );
  fireEvent.click(dialog.getByRole('button', { name: 'Close' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(screen.getByRole('button', { name: '14 trucks without trips' })).toBeInTheDocument();
});

it('opens the truck list with one click on the badge', async () => {
  open();
  const badge = await screen.findByRole('button', { name: '14 trucks without trips' });
  fireEvent.click(badge);
  const dialog = await screen.findByRole('dialog', { name: 'Trucks without trips' });
  expect(within(dialog).getByText('WB-TRUCK-0')).toBeInTheDocument();
});

it('hides the badge when all trucks have trips', async () => {
  AutoTripService.coverage.mockResolvedValue({ trucksMissing: 0, missing: [] });
  open();
  await waitFor(() => expect(AutoTripService.coverage).toHaveBeenCalledOnce());
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('does not request restricted coverage for a viewer', () => {
  getUserRole.mockReturnValue('VIEWER');
  open();
  expect(AutoTripService.coverage).not.toHaveBeenCalled();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
