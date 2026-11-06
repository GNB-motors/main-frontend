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
const { getPlaceQuestions } = vi.hoisted(() => ({ getPlaceQuestions: vi.fn() }));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getPlaceQuestions, answerPlaceQuestion: vi.fn(), getTripsHistory: vi.fn() },
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
function open(entry = '/auto-trips?range=7d') {
  render(
    <MemoryRouter initialEntries={[entry]}>
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
  getPlaceQuestions.mockResolvedValue({ items: [], total: 0 });
});
it('shows a planned tab with zero and its empty table on the same page', async () => {
  // "Planned trips" lives in the More menu; with a zero count it is only
  // visible once it is the active tab.
  open('/auto-trips?range=7d&status=PLANNED');
  const tab = await screen.findByRole('tab', { name: 'Planned trips' });
  expect(screen.queryByRole('link', { name: 'Planned trips' })).not.toBeInTheDocument();
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
  fireEvent.click(await screen.findByRole('tab', { name: /More/ }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Planned trips 126' }));
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
  expect(screen.getByRole('tab', { name: 'Planned trips' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/auto-trips');
});

const waiting = (n, flags) =>
  Array.from({ length: n }, (_, i) => ({
    _id: `w-${flags[0]}-${i}`,
    registrationNumber: `WB-W${i}`,
    status: 'NEEDS_REVIEW',
    flags,
    drop: { source: flags[0] === 'DROP_UNKNOWN' ? 'UNKNOWN' : 'INFERRED_TURNAROUND' },
  }));

function listByStatus({ waitingItems = [], items, tabCounts }) {
  AutoTripService.list.mockImplementation(async (params) => {
    if (params.status === 'NEEDS_REVIEW' && params.limit === 100) {
      return { items: waitingItems, total: tabCounts.NEEDS_REVIEW, tabCounts };
    }
    if (params.view === 'DELIVERED' && params.limit === 100)
      return { items: [], total: 0, tabCounts };
    return {
      items,
      total: items.length,
      tabCounts,
      summary: {
        movements:
          (tabCounts.COMPLETE || 0) +
          (tabCounts.NEEDS_REVIEW || 0) +
          (tabCounts.OPEN || 0) +
          (tabCounts.CONFIRMED || 0),
        delivered: tabCounts.COMPLETE || 0,
        open: tabCounts.OPEN || 0,
        needsReview: tabCounts.NEEDS_REVIEW || 0,
        repositioned: 0,
      },
    };
  });
}

it('puts the period in KPI tiles that are also the status filter', async () => {
  listByStatus({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    tabCounts: {
      COMPLETE: 585,
      NEEDS_REVIEW: 2237,
      OPEN: 113,
      CONFIRMED: 0,
      DISMISSED: 0,
      reposition: 0,
    },
  });
  open();
  const tile = await screen.findByRole('tab', { name: 'Needs your answer 2,237' });
  expect(screen.getByRole('tab', { name: 'Trips 2,935' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Delivered 585' })).toBeInTheDocument();
  expect(screen.getByText('20% of movements · loaded deliveries only')).toBeInTheDocument();
  // Too few delivered trips for a typical run: unknown, with the reason.
  expect(await screen.findByText(/Needs 5 delivered trips/)).toBeInTheDocument();
  fireEvent.click(tile);
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'NEEDS_REVIEW', page: 1, limit: 50 }),
      expect.anything(),
    ),
  );
  expect(screen.getByRole('tab', { name: 'Needs your answer 2,237' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

it('explains the waiting trips once and offers the bulk answer', async () => {
  listByStatus({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    waitingItems: [...waiting(9, ['DROP_UNKNOWN']), ...waiting(1, ['DROP_INFERRED'])],
    tabCounts: { COMPLETE: 5, NEEDS_REVIEW: 120, OPEN: 1 },
  });
  getPlaceQuestions.mockResolvedValue({
    items: [
      { id: 'q1', tripsAffected: 8 },
      { id: 'q2', tripsAffected: 4 },
    ],
    total: 2,
  });
  open();
  expect(
    await screen.findByRole('heading', { name: '120 trips need your answer' }),
  ).toBeInTheDocument();
  expect(await screen.findByText('Drop not found')).toBeInTheDocument();
  expect(
    screen.getByText('Split measured on the latest 10 waiting trips in this period.'),
  ).toBeInTheDocument();
  expect(
    await screen.findByText(/For the other 108, open the trip and mark its drop/),
  ).toBeInTheDocument();
  expect(getPlaceQuestions).toHaveBeenCalledWith(expect.objectContaining({ limit: 200 }));
  fireEvent.click(screen.getByRole('button', { name: 'Answer place questions' }));
  expect(await screen.findByRole('tab', { name: /Place questions/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

it('draws one dense row per trip and leaves out a column nobody has yet', async () => {
  listByStatus({
    items: [
      {
        _id: 't9',
        registrationNumber: 'WB11F5362',
        status: 'OPEN',
        pickup: { name: 'AMBUJA DHULAGOR', departedAt: '2026-11-03T22:10:46.000Z' },
        drop: { source: 'UNKNOWN' },
        driver: null,
        km: { approach: 141, laden: null },
      },
    ],
    tabCounts: { OPEN: 1 },
  });
  open();
  const route = await screen.findByTitle('AMBUJA DHULAGOR → on the way');
  expect(route).toHaveTextContent('Ambuja Dhulagor');
  expect(screen.queryByText(/View trip/)).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Loaded km' })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: 'Driver' })).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Loaded km is measured when a truck reaches its drop; no driver is linked to these trips.',
    ),
  ).toBeInTheDocument();
  fireEvent.click(route);
  expect(screen.getByLabelText('Current location')).toHaveTextContent('/auto-trips/t9');
});

it('shows loaded delivery summary and uses the identical delivery view for list and sample', async () => {
  AutoTripService.list.mockImplementation(async (params) => ({
    items:
      params.limit === 50
        ? [
            {
              _id: 'loaded',
              registrationNumber: 'LOADED-ONLY',
              status: 'CONFIRMED',
              leg: 'LADEN',
              drop: { orgSiteId: 'drop', name: 'Dealer' },
            },
          ]
        : [],
    total: params.view === 'DELIVERED' ? 7 : 12,
    tabCounts: { COMPLETE: 9, CONFIRMED: 1, OPEN: 1, NEEDS_REVIEW: 1, reposition: 3 },
    summary: { movements: 12, delivered: 7, repositioned: 3, open: 1, needsReview: 1 },
  }));
  open('/auto-trips?range=7d&vehicleId=truck&dropSiteId=drop&search=Dealer');
  fireEvent.click(await screen.findByRole('tab', { name: 'Delivered 7' }));
  await waitFor(() => {
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        view: 'DELIVERED',
        limit: 50,
        vehicleId: 'truck',
        dropSiteId: 'drop',
        search: 'Dealer',
      }),
      expect.anything(),
    );
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({
        view: 'DELIVERED',
        limit: 100,
        vehicleId: 'truck',
        dropSiteId: 'drop',
        search: 'Dealer',
      }),
      expect.anything(),
    );
  });
  const deliveredCalls = AutoTripService.list.mock.calls.filter(
    ([params]) => params.view === 'DELIVERED',
  );
  expect(deliveredCalls.every(([params]) => params.status == null && params.leg == null)).toBe(
    true,
  );
  expect(screen.getByRole('tab', { name: 'Trips 12' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Delivered 9' })).not.toBeInTheDocument();
});

it('keeps missing summary unknown rather than calling all complete movements deliveries', async () => {
  AutoTripService.list.mockResolvedValue({
    items: [],
    total: 10,
    tabCounts: { COMPLETE: 10, reposition: 4 },
  });
  open();
  await screen.findByText('Delivery count unavailable');
  expect(screen.getByRole('tab', { name: 'Delivered —' })).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Delivered 10' })).not.toBeInTheDocument();
});
