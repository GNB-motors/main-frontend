import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AutoTripsPage from './AutoTripsPage';
import AutoTripService from '../../services/AutoTripService';
import TripPlanService from '../../services/TripPlanService';

vi.mock('../../services/AutoTripService', () => ({ default: { list: vi.fn() } }));
vi.mock('../../services/TripPlanService', () => ({
  default: { list: vi.fn(), cancel: vi.fn(), unlink: vi.fn(), resumeAutoMatch: vi.fn() },
}));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('./ManualTripDialog', () => ({ default: () => null }));
vi.mock('./TripPlanDialog', () => ({
  default: ({ open, onCreated, onOpenChange }) =>
    open ? (
      <button
        onClick={() => {
          onCreated();
          onOpenChange(false);
        }}
      >
        Finish scheduling
      </button>
    ) : null,
}));
vi.mock('./LinkTripDialog', () => ({ default: () => null }));
function Location() {
  return <output aria-label="Current location">{useLocation().pathname}</output>;
}
function open() {
  render(
    <MemoryRouter initialEntries={['/auto-trips?range=7d']}>
      <AutoTripsPage />
      <Location />
    </MemoryRouter>,
  );
}
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  AutoTripService.list.mockResolvedValue({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    total: 1,
    tabCounts: { OPEN: 1 },
  });
  TripPlanService.list.mockResolvedValue({ items: [], total: 0, tabCounts: { PLANNED: 0 } });
});
it('shows a planned tab with zero and its empty table on the same page', async () => {
  open();
  const tab = await screen.findByRole('tab', { name: 'Planned trips 0' });
  expect(screen.queryByRole('link', { name: 'Planned trips' })).not.toBeInTheDocument();
  fireEvent.click(tab);
  await screen.findByText('No planned trips here');
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/auto-trips');
  expect(tab).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('heading', { name: 'Trips', exact: true })).toBeInTheDocument();
  expect(screen.queryByText('WB-ACTUAL')).not.toBeInTheDocument();
});
it('uses the backend count, page and date filters and returns to detected trips', async () => {
  TripPlanService.list.mockImplementation(async (params) => ({
    items: [
      {
        _id: `p${params.page}`,
        registrationNumber: `WB-PLAN-${params.page}`,
        status: 'PLANNED',
        pickup: { name: 'Planned pickup' },
        drop: { name: 'Planned drop' },
      },
    ],
    total: 126,
    tabCounts: { PLANNED: 126 },
  }));
  open();
  const tab = await screen.findByRole('tab', { name: 'Planned trips 126' });
  fireEvent.click(tab);
  await screen.findByText('WB-PLAN-1');
  await waitFor(() =>
    expect(TripPlanService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'PLANNED', page: 1, limit: 50, from: expect.any(String) }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  fireEvent.click(screen.getByTitle('Next Page'));
  await screen.findByText('WB-PLAN-2');
  expect(TripPlanService.list).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'PLANNED', page: 2, limit: 50 }),
    expect.anything(),
  );
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/auto-trips');
  fireEvent.click(screen.getByRole('tab', { name: 'On the road 1' }));
  await screen.findByText('WB-ACTUAL');
  expect(AutoTripService.list).toHaveBeenLastCalledWith(
    expect.objectContaining({ status: 'OPEN', page: 1, limit: 50 }),
    expect.anything(),
  );
});

it('shows newly scheduled plans in the inline tab instead of navigating away', async () => {
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Schedule trip' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Finish scheduling' }));
  await screen.findByText('No planned trips here');
  expect(screen.getByRole('tab', { name: 'Planned trips 0' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/auto-trips');
});
