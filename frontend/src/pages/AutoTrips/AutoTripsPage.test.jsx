import { beforeEach, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import AutoTripsPage from './AutoTripsPage';
import AutoTripService from '../../services/AutoTripService';
import TripPlanService from '../../services/TripPlanService';
import { resetWithCountsSupport } from './tripCounts';

vi.mock('../../services/AutoTripService', () => ({
  default: { list: vi.fn(), coverage: vi.fn() },
}));
vi.mock('../../services/TripPlanService', () => ({
  default: { list: vi.fn(), cancel: vi.fn(), unlink: vi.fn(), resumeAutoMatch: vi.fn() },
}));
const { getPlaceQuestions, answerPlaceQuestion, getUserRole, getVehicleList } = vi.hoisted(() => ({
  getPlaceQuestions: vi.fn(),
  answerPlaceQuestion: vi.fn(),
  getUserRole: vi.fn(),
  getVehicleList: vi.fn(),
}));
vi.mock('../../services/vehicleListService', () => ({ getVehicleList }));
vi.mock('../../utils/session', async (importOriginal) => ({
  ...(await importOriginal()),
  getUserRole,
}));
vi.mock('../../services/fleetViewService', () => ({
  fleetViewService: { getPlaceQuestions, answerPlaceQuestion, getTripsHistory: vi.fn() },
}));
vi.mock('../../components/ui/confirmContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('../../hooks/useKnownEtas', () => ({ useKnownEtas: () => new Map() }));
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
  const location = useLocation();
  return (
    <output aria-label="Current location">
      {location.pathname}
      {location.search}
    </output>
  );
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
  resetWithCountsSupport();
  getUserRole.mockReturnValue('VIEWER');
  AutoTripService.coverage.mockResolvedValue({ trucksMissing: 0 });
  AutoTripService.list.mockResolvedValue({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    total: 1,
    tabCounts: { OPEN: 1 },
  });
  TripPlanService.list.mockResolvedValue({ items: [], total: 0, tabCounts: { PLANNED: 0 } });
  getPlaceQuestions.mockResolvedValue({ items: [], total: 0 });
  getVehicleList.mockResolvedValue([]);
});
it('sends the typed search to the server and starts again from page 1', async () => {
  open('/auto-trips?page=3');
  await screen.findByText('WB-ACTUAL');
  fireEvent.change(screen.getByLabelText('Search trips by truck, driver or place'), {
    target: { value: ' wb11f4362 ' },
  });
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'wb11f4362', page: 1, limit: 50 }),
      expect.anything(),
    ),
  );
  expect(screen.getByLabelText('Current location')).toHaveTextContent(
    '/auto-trips?search=wb11f4362',
  );
});

it('asks the backend for the counts with the list and reads the tab counts from there', async () => {
  AutoTripService.list.mockImplementation(async () => ({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    total: 1,
    tabCounts: { OPEN: 3, COMPLETE: 2, NEEDS_REVIEW: 0, total: 5 },
  }));
  open();
  expect(await screen.findByText('WB-ACTUAL')).toBeInTheDocument();
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ withCounts: 1 }),
    expect.anything(),
  );
  // Every trips read asks for the counts: one aggregate per read, not one
  // count query per status.
  const reads = AutoTripService.list.mock.calls;
  expect(reads.length).toBeGreaterThan(1);
  expect(reads.every(([p]) => p.withCounts === 1)).toBe(true);
});

it('falls back to the plain read when the backend does not know the flag', async () => {
  AutoTripService.list.mockImplementation(async (params) => {
    if (params.withCounts) {
      const err = new Error('"withCounts" is not allowed');
      err.status = 400;
      throw err;
    }
    return {
      items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
      total: 1,
      tabCounts: { OPEN: 1, total: 1 },
    };
  });
  open();
  expect(await screen.findByText('WB-ACTUAL')).toBeInTheDocument();
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ withCounts: 1 }),
    expect.anything(),
  );
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.not.objectContaining({ withCounts: 1 }),
    expect.anything(),
  );
  // The old count reads are back: the today count is read on its own again.
  await waitFor(() =>
    expect(AutoTripService.list.mock.calls.filter(([p]) => p.limit === 1).length).toBeGreaterThan(
      0,
    ),
  );
});

it('keeps the old count reads when the backend sends no counts', async () => {
  AutoTripService.list.mockImplementation(async (params) => ({
    items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
    total: 1,
    // The list answers without tabCounts; the count reads still carry them.
    ...(params.limit === 1 ? { tabCounts: { OPEN: 4, total: 4 } } : {}),
  }));
  open();
  expect(await screen.findByText('WB-ACTUAL')).toBeInTheDocument();
  expect(await screen.findByText('4 left a plant today')).toBeInTheDocument();
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
  // One line: the status and a "+1"; the tooltip (and the label) names the check.
  const badge = await screen.findByRole('button', { name: /Suspicious unload/ });
  expect(screen.getByRole('link', { name: 'Trip approvals' })).toHaveAttribute(
    'href',
    '/approvals?type=trips',
  );
  expect(badge).toHaveTextContent('+1');
  expect(badge).toHaveTextContent('On the road');
  // The badge says where to look, never what happened.
  const label = badge.getAttribute('aria-label');
  expect(label).toMatch(/a person should look/i);
  expect(label).not.toMatch(/theft|stolen|steal|siphon|thief/i);
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

it('opens the review workspace from one clear banner action without a modal', async () => {
  listByStatus({
    items: [],
    waitingItems: waiting(10, ['DROP_UNKNOWN']),
    tabCounts: { NEEDS_REVIEW: 120 },
  });
  getPlaceQuestions.mockResolvedValue({
    items: [
      { id: 'q1', tripsAffected: 8 },
      { id: 'q2', tripsAffected: 4 },
    ],
    total: 2,
  });
  open();
  expect(await screen.findByRole('heading', { name: '2 places need review' })).toBeInTheDocument();
  expect(screen.getByText('12 trips')).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(getPlaceQuestions).toHaveBeenCalledWith(expect.objectContaining({ limit: 200 }));
  fireEvent.click(screen.getByRole('button', { name: 'Review places' }));
  expect(await screen.findByRole('tab', { name: /Review places/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getAllByRole('button', { name: 'Review Unnamed stop' })[0]).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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
  expect(await screen.findByRole('heading', { name: '1 place needs review' })).toBeInTheDocument();
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

it('keeps a way back and the selected show-trips action after filtering waiting trips', async () => {
  listByStatus({
    items: [],
    waitingItems: waiting(2, ['DROP_UNKNOWN']),
    tabCounts: { NEEDS_REVIEW: 12 },
  });
  getPlaceQuestions.mockResolvedValue({ items: [{ id: 'q1', tripsAffected: 8 }], total: 1 });
  open('/auto-trips?range=7d');
  fireEvent.click(await screen.findByRole('button', { name: 'View affected trips' }));
  expect(await screen.findByRole('button', { name: 'Show all trips' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Show all trips' }));
  });
  expect(screen.getByLabelText('Current location')).not.toHaveTextContent('status=');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'View affected trips' }));
  });
  expect(screen.getByLabelText('Current location')).toHaveTextContent('status=NEEDS_REVIEW');
  fireEvent.click(screen.getByRole('button', { name: 'Review places' }));
  expect(await screen.findByRole('button', { name: 'Back to affected trips' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Back to affected trips' }));
  expect(await screen.findByRole('button', { name: 'Show all trips' })).toBeInTheDocument();
  expect(screen.getByLabelText('Current location')).toHaveTextContent('range=7d');
  expect(screen.getByLabelText('Current location')).toHaveTextContent('status=NEEDS_REVIEW');
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Show all trips' }));
  });
  expect(screen.getByLabelText('Current location')).not.toHaveTextContent('status=');
});

it('previews the exact bulk suggestions, cancels safely and writes only after confirmation', async () => {
  getUserRole.mockReturnValue('OWNER');
  listByStatus({
    items: [],
    waitingItems: waiting(2, ['DROP_UNKNOWN']),
    tabCounts: { NEEDS_REVIEW: 12 },
  });
  getPlaceQuestions.mockResolvedValue({
    items: [
      { id: 'drop', tripsAffected: 8, suggestion: { name: 'Customer yard', category: 'CUSTOMER' } },
      { id: 'fuel', tripsAffected: 4, suggestion: { name: 'Salbani pump', category: 'PUMP' } },
      { id: 'unnamed', tripsAffected: 2, suggestion: null },
    ],
    total: 468,
  });
  let finishFirst;
  answerPlaceQuestion.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
  );
  answerPlaceQuestion.mockResolvedValueOnce({ placeId: 'site-pump', tripsUpdated: 0 });
  open();
  fireEvent.click(await screen.findByRole('button', { name: 'Review places' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Confirm .*selected places/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select Customer yard' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select Salbani pump' }));
  expect(screen.queryByRole('checkbox', { name: 'Select Unnamed stop' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm 2 selected places' }));
  let dialog = within(await screen.findByRole('dialog', { name: 'Confirm suggested places' }));
  expect(dialog.getByText('Customer yard')).toBeInTheDocument();
  expect(dialog.getByText('Delivery / unloading point')).toBeInTheDocument();
  expect(dialog.getByText('Salbani pump')).toBeInTheDocument();
  expect(dialog.getByText('Fuel pump')).toBeInTheDocument();
  expect(
    dialog.getByText(/Matching trips outside this date range may also update/),
  ).toBeInTheDocument();
  expect(dialog.getByRole('button', { name: 'Confirm 2 places' })).toBeInTheDocument();
  expect(answerPlaceQuestion).not.toHaveBeenCalled();
  fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(answerPlaceQuestion).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm 2 selected places' }));
  dialog = within(await screen.findByRole('dialog', { name: 'Confirm suggested places' }));
  fireEvent.click(dialog.getByRole('button', { name: 'Confirm 2 places' }));
  expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  expect(dialog.getByRole('button', { name: /Saving 0 of 2/ })).toBeDisabled();
  expect(answerPlaceQuestion).toHaveBeenCalledTimes(1);
  expect(answerPlaceQuestion).toHaveBeenCalledWith('drop', {
    answer: 'CONFIRM',
    name: 'Customer yard',
    category: 'UNLOADING',
  });
  await act(async () => finishFirst({ placeId: 'site-drop', tripsUpdated: 8 }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(answerPlaceQuestion).toHaveBeenCalledTimes(2);
  expect(answerPlaceQuestion).toHaveBeenLastCalledWith('fuel', {
    answer: 'CONFIRM',
    name: 'Salbani pump',
    category: 'FUEL_PUMP',
  });
});

it('does not reuse the counts of the previous filter when the list answers without counts', async () => {
  let listReads = 0;
  AutoTripService.list.mockImplementation(async (params) => {
    if (params.limit === 50) {
      listReads += 1;
      // The first read of the filter answers with counts; the next one answers
      // without any (the `withCounts` fallback).
      return listReads === 1
        ? {
            items: [{ _id: 't1', registrationNumber: 'WB-ACTUAL', status: 'OPEN' }],
            total: 1,
            tabCounts: { OPEN: 7, total: 7 },
          }
        : { items: [], total: 0 };
    }
    return { items: [], total: 0 };
  });
  open();
  expect(await screen.findByRole('tab', { name: 'On the road 7' })).toBeInTheDocument();

  // Another filter: the list settles without counts. The counts of the
  // previous filter are not this filter's counts, and nobody answered these
  // ones either - they are unknown, not zero.
  fireEvent.click(screen.getByRole('tab', { name: 'Needs your answer 0' }));
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'On the road —' })).toBeInTheDocument(),
  );
  expect(screen.queryByRole('tab', { name: 'On the road 7' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Trips —' })).toBeInTheDocument();

  // The plant-to-plant count is unknown too: its tab stays and says so.
  fireEvent.click(screen.getByRole('tab', { name: /More/ }));
  const reposition = await screen.findByRole('menuitem', { name: /Plant to plant/ });
  expect(reposition.textContent).toContain('—');
});

it('spec 1: a header click sorts the whole list and keeps the choice in the URL', async () => {
  open('/auto-trips?range=7d&page=3');
  await screen.findByText('WB-ACTUAL');
  fireEvent.click(screen.getByRole('button', { name: 'Truck' }));
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'vehicle', order: 'desc', page: 1 }),
      expect.anything(),
    ),
  );
  const url = screen.getByLabelText('Current location');
  expect(url).toHaveTextContent('sortBy=vehicle');
  expect(url).toHaveTextContent('order=desc');
  // A new sort starts the list again at the first page.
  expect(url).not.toHaveTextContent('page=3');
});

it('spec 1: the sort cycles down, up and back to the newest first', async () => {
  open('/auto-trips?range=7d');
  await screen.findByText('WB-ACTUAL');
  fireEvent.click(screen.getByRole('button', { name: 'Truck' }));
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'vehicle', order: 'desc' }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Truck' }));
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'vehicle', order: 'asc' }),
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Truck' }));
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.not.objectContaining({ sortBy: expect.anything() }),
      expect.anything(),
    ),
  );
  const url = screen.getByLabelText('Current location');
  expect(url).not.toHaveTextContent('sortBy=');
  expect(url).not.toHaveTextContent('order=');
});

it('spec 1: the sort in the URL is the sort the list asks for, and an unknown one is ignored', async () => {
  open('/auto-trips?range=7d&sortBy=distance&order=asc');
  await screen.findByText('WB-ACTUAL');
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.objectContaining({ sortBy: 'distance', order: 'asc' }),
    expect.anything(),
  );
  cleanup();
  open('/auto-trips?range=7d&sortBy=nonsense&order=asc');
  await screen.findByText('WB-ACTUAL');
  expect(AutoTripService.list).toHaveBeenCalledWith(
    expect.not.objectContaining({ sortBy: expect.anything() }),
    expect.anything(),
  );
});

it('spec 2: a ?vehicle= link filters the list by that truck', async () => {
  getVehicleList.mockResolvedValue([{ _id: 'v1', registrationNumber: 'WB11F4262' }]);
  open('/auto-trips?range=7d&vehicle=WB11F4262');
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ vehicleId: 'v1' }),
      expect.anything(),
    ),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Current location')).toHaveTextContent('vehicleId=v1'),
  );
});

it('spec 2: a registration nobody knows goes to the search box', async () => {
  getVehicleList.mockResolvedValue([]);
  open('/auto-trips?range=7d&vehicle=WB99ZZ99');
  await waitFor(() =>
    expect(screen.getByLabelText('Search trips by truck, driver or place')).toHaveValue('WB99ZZ99'),
  );
  // The search goes to the server like any other search, once the typing settles.
  await waitFor(() =>
    expect(AutoTripService.list).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'WB99ZZ99' }),
      expect.anything(),
    ),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('Current location')).toHaveTextContent('search=WB99ZZ99'),
  );
});
