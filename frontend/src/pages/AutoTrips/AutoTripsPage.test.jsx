import { beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
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
it('badges a trip row the server flagged as a suspicious unload', async () => {
  AutoTripService.list.mockResolvedValue({
    items: [
      {
        _id: 't1',
        registrationNumber: 'WB-SUSPICIOUS',
        status: 'OPEN',
        flags: ['SUSPICIOUS_UNLOAD'],
        drop: { lat: 25.5647, lng: 83.9754, source: 'INFERRED_TURNAROUND' },
      },
    ],
    total: 1,
    tabCounts: { OPEN: 1 },
  });
  open();
  const badge = await screen.findByText('Suspicious unload');
  expect(badge).toBeInTheDocument();
  // The badge says where to look, never what happened.
  expect(badge.getAttribute('title')).toMatch(/a person should look/i);
  expect(badge.getAttribute('title')).not.toMatch(/theft|stolen|steal|siphon|thief/i);
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
    if (params.status === 'DELIVERED' && params.limit === 100)
      return { items: [], total: 0, tabCounts };
    return { items, total: items.length, tabCounts };
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
  expect(screen.getByText('20% of trips')).toBeInTheDocument();
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

it('keeps confirmed trips under Delivered and uses the same combined filter for its list and sample', async () => {
  const tabCounts = { COMPLETE: 40, CONFIRMED: 60, DISMISSED: 0, OPEN: 0, NEEDS_REVIEW: 0 };
  AutoTripService.list.mockImplementation(async (params) => ({
    items:
      params.status === 'DELIVERED'
        ? [
            { _id: 'c1', registrationNumber: 'WB-DELIVERED', status: 'COMPLETE' },
            { _id: 'c2', registrationNumber: 'WB-CONFIRMED', status: 'CONFIRMED' },
          ]
        : [],
    total: 100,
    tabCounts,
  }));
  open('/auto-trips?range=7d');
  const tile = await screen.findByRole('tab', { name: 'Delivered 100' });
  expect(screen.getByRole('tab', { name: 'Trips 100' })).toBeInTheDocument();
  expect(screen.getByText('100% of trips')).toBeInTheDocument();
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'DELIVERED', limit: 100 }),
    expect.anything(),
  );
  fireEvent.click(tile);
  expect(await screen.findByText('WB-CONFIRMED')).toBeInTheDocument();
  expect(screen.getByText('WB-DELIVERED')).toBeInTheDocument();
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'DELIVERED', page: 1, limit: 50 }),
    expect.anything(),
  );
});

it('uses actual trips for percentages and keeps rejected detections only in the explicit tab', async () => {
  const tabCounts = { COMPLETE: 40, CONFIRMED: 20, DISMISSED: 20, OPEN: 20, NEEDS_REVIEW: 0 };
  AutoTripService.list.mockImplementation(async (params) => ({
    items:
      params.limit === 100
        ? []
        : params.status === 'DISMISSED'
          ? [{ _id: 'r1', registrationNumber: 'WB-REJECTED', status: 'DISMISSED' }]
          : [{ _id: 'a1', registrationNumber: 'WB-ACTUAL', status: 'COMPLETE' }],
    total: params.status === 'DISMISSED' ? 20 : 80,
    tabCounts,
  }));
  open();
  expect(await screen.findByRole('tab', { name: 'Trips 80' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Delivered 60' })).toBeInTheDocument();
  expect(screen.getByText('75% of trips')).toBeInTheDocument();
  expect(screen.queryByText('WB-REJECTED')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: /More/ }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Rejected 20' }));
  expect(await screen.findByText('WB-REJECTED')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Trips 80' })).toBeInTheDocument();
  expect(screen.getByText('75% of trips')).toBeInTheDocument();
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'DISMISSED', limit: 50 }),
    expect.anything(),
  );
});

it('does not fall back to the rejected list total when every detection was rejected', async () => {
  AutoTripService.list.mockResolvedValue({
    items: [{ _id: 'r1', registrationNumber: 'WB-REJECTED', status: 'DISMISSED' }],
    total: 20,
    tabCounts: { DISMISSED: 20, COMPLETE: 0, CONFIRMED: 0, OPEN: 0, NEEDS_REVIEW: 0 },
  });
  open('/auto-trips?range=7d&status=DISMISSED');
  expect(await screen.findByText('WB-REJECTED')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Trips 0' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Delivered 0' })).toBeInTheDocument();
  expect(screen.getByText('0 left a plant today')).toBeInTheDocument();
  expect(screen.queryByRole('tab', { name: 'Trips 20' })).not.toBeInTheDocument();
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

it('scopes place questions to the selected IST period and truck, hiding the previous queue while loading', async () => {
  const vehicleId = '507f1f77bcf86cd799439011';
  let finish;
  AutoTripService.list.mockImplementation(async (params) => ({
    items: [],
    total: 0,
    tabCounts: { NEEDS_REVIEW: params.from ? 3 : 120 },
  }));
  getPlaceQuestions.mockResolvedValueOnce({
    items: [{ id: 'old', tripsAffected: 90 }],
    total: 14,
    tripsAffected: 90,
  });
  function PickPeriod() {
    const navigate = useNavigate();
    return (
      <button
        onClick={() =>
          navigate(`/auto-trips?range=custom&from=2026-11-01&to=2026-11-07&vehicleId=${vehicleId}`)
        }
      >
        Pick period
      </button>
    );
  }
  render(
    <MemoryRouter initialEntries={[`/auto-trips?vehicleId=${vehicleId}`]}>
      <AutoTripsPage />
      <PickPeriod />
    </MemoryRouter>,
  );
  expect(await screen.findByText('90 trips')).toBeInTheDocument();
  const oldSignal = getPlaceQuestions.mock.calls[0][0].signal;
  getPlaceQuestions.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Pick period' }));
  await waitFor(() =>
    expect(getPlaceQuestions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        from: '2026-10-31T18:30:00.000Z',
        to: '2026-11-07T18:29:59.999Z',
        vehicleId,
        limit: 200,
      }),
    ),
  );
  expect(oldSignal.aborted).toBe(true);
  expect(screen.queryByText('90 trips')).not.toBeInTheDocument();
  await act(async () =>
    finish({ items: [{ id: 'current', tripsAffected: 3 }], total: 1, tripsAffected: 3 }),
  );
  expect(
    await screen.findByRole('heading', { name: '3 trips need your answer' }),
  ).toBeInTheDocument();
  expect(screen.getByText('3 trips')).toBeInTheDocument();
  expect(screen.queryByText('14 places')).not.toBeInTheDocument();
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
