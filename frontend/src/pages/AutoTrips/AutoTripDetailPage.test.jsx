import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup, within, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import AutoTripDetailPage from './AutoTripDetailPage';
import AutoTripService from '../../services/AutoTripService';
import { FUEL_LOSS_TIP } from './tripFuel';

vi.mock('../../services/AutoTripService', () => ({
  default: {
    get: vi.fn(),
    track: vi.fn(),
    tolls: vi.fn(),
    fuelSummary: vi.fn(),
    confirm: vi.fn(),
    drop: vi.fn(),
    dismiss: vi.fn(),
  },
}));
vi.mock('../../services/RoadService', () => ({
  default: { getRoadTrailIfEnabled: vi.fn().mockResolvedValue(null) },
}));
vi.mock('../../services/RouteHubService', () => ({
  default: { getDeviationEvents: vi.fn().mockResolvedValue({ records: [] }) },
}));
vi.mock('../../services/fleetViewService.js', () => ({
  getWhereNext: vi.fn().mockResolvedValue(null),
}));
const { getUserRole } = vi.hoisted(() => ({ getUserRole: vi.fn() }));
vi.mock('../../utils/session.js', () => ({ getUserRole }));
// The map and the contract card have their own tests; here they are stand-ins.
vi.mock('./AutoTripReplay', () => ({ default: () => <div>Replay map</div> }));
vi.mock('../Sap/RouteSapCard', () => ({ default: () => null }));

const trip = {
  _id: 'trip-1',
  registrationNumber: 'WB11F4262',
  status: 'COMPLETE',
  flags: ['GPS_GAP'],
  pickup: {
    name: 'AMBUJA PLANT SANKRAIL',
    arrivedAt: '2026-11-02T19:38:00Z',
    departedAt: '2026-11-02T23:39:07Z',
    dwellMin: 241,
  },
  drop: {
    name: 'NIMPURA',
    source: 'LABELLED_PLACE',
    arrivedAt: '2026-11-03T02:40:01Z',
    departedAt: '2026-11-03T11:21:00Z',
  },
  extraDrops: [],
  km: { approach: 2, laden: 117, return: 18.37 },
  durations: { ladenMin: 180.9 },
  driver: { id: 'd1', name: 'Guddu Chaudhary' },
  totalCostInr: 3837,
  roleEconomics: {
    approach: { fuelInr: 67, wearInr: 6 },
    laden: { fuelInr: 3358, wearInr: 351 },
    return: { fuelInr: 0, wearInr: 55 },
  },
  stopsSummary: { fuel: 0, rest: 0, overnight: 0, unexplained: 0 },
  stops: [],
  routeStops: [],
};

function open() {
  render(
    <MemoryRouter initialEntries={['/auto-trips/trip-1']}>
      <Routes>
        <Route path="/auto-trips/:id" element={<AutoTripDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** The page stays mounted while the trip under it changes. */
function GoToOtherTrip() {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate('/auto-trips/trip-2')}>
      other trip
    </button>
  );
}

function openWithSwitch() {
  render(
    <MemoryRouter initialEntries={['/auto-trips/trip-1']}>
      <Routes>
        <Route path="/auto-trips/:id" element={<AutoTripDetailPage />} />
      </Routes>
      <GoToOtherTrip />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  getUserRole.mockReturnValue('VIEWER');
  AutoTripService.get.mockResolvedValue(trip);
  AutoTripService.track.mockResolvedValue({ points: [] });
  AutoTripService.tolls.mockResolvedValue(null);
  AutoTripService.fuelSummary.mockResolvedValue(null);
});

it('heads the trip with the truck, one status chip and the route in title case', async () => {
  open();
  expect(await screen.findByRole('heading', { name: 'WB11F4262' })).toBeInTheDocument();
  expect(document.querySelectorAll('.atx-status')).toHaveLength(1);
  expect(document.querySelector('.atx-status')).toHaveTextContent('Reached drop');
  expect(screen.getByTitle('AMBUJA PLANT SANKRAIL')).toHaveTextContent('Ambuja Plant Sankrail');
  // A check the route line does not already say gets its own chip.
  expect(screen.getByText('GPS went quiet on the way')).toBeInTheDocument();
});

it('badges a trip the server flagged as a suspicious unload, without accusing anyone', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'NEEDS_REVIEW',
    flags: ['SUSPICIOUS_UNLOAD'],
    drop: { name: 'NIMPURA', source: 'INFERRED_TURNAROUND', lat: 25.5647, lng: 83.9754 },
  });
  open();
  const badge = await screen.findByText('Suspicious unload');
  expect(badge).toBeInTheDocument();
  // The tooltip says a person should look at it, and never names a crime.
  expect(badge.getAttribute('title')).toMatch(/a person should look/i);
  expect(badge.getAttribute('title')).not.toMatch(/theft|stolen|steal|siphon|thief/i);
});

it('puts the trip numbers in one strip, unknown as a dash with its reason', async () => {
  open();
  await screen.findByRole('heading', { name: 'WB11F4262' });
  const strip = within(document.querySelector('.atx-facts'));
  expect(strip.getByText('117 km')).toBeInTheDocument();
  expect(strip.getByText('from the GPS path')).toBeInTheDocument();
  expect(strip.getByText('3 h 1 min')).toBeInTheDocument();
  expect(strip.getByText('₹3,837')).toBeInTheDocument();
  expect(strip.getByText('fuel ₹3,425 · estimated maintenance cost ₹412')).toBeInTheDocument();
  expect(strip.getByText('Guddu Chaudhary')).toBeInTheDocument();
  expect(screen.getByText('Replay map')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Trip timeline' })).toBeInTheDocument();
});

it('says what is not known yet on a trip whose drop was not found', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'NEEDS_REVIEW',
    flags: ['DROP_UNKNOWN'],
    drop: { source: 'UNKNOWN' },
    km: { approach: 55, laden: null },
    durations: { ladenMin: null },
    driver: null,
    totalCostInr: null,
    roleEconomics: null,
  });
  open();
  expect(await screen.findByText('Needs answer')).toBeInTheDocument();
  expect(screen.getAllByText('drop not found').length).toBeGreaterThan(0);
  const strip = within(document.querySelector('.atx-facts'));
  expect(strip.getAllByText('needs a known drop')).toHaveLength(2);
  expect(strip.getByText('No driver')).toBeInTheDocument();
  expect(
    strip.getByText('Cost calculation unavailable until the drop is resolved.'),
  ).toBeInTheDocument();
  // The drop flag is said in the route, not repeated as a chip.
  const chips = [...document.querySelectorAll('.atx-chip')].map((el) => el.textContent);
  expect(chips).not.toContain('Drop not found');
});

it('says a trip was replaced by a newer one, and links to the truck’s trips', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'SUPERSEDED',
    vehicleId: 'vehicle-1',
    supersededBy: 'v2|WB11F4262|2026-11-04T04:00:00.000Z',
  });
  open();
  expect(await screen.findByText('This trip was replaced by a newer trip.')).toBeInTheDocument();
  const link = screen.getByRole('link', { name: 'open the trip list' });
  expect(link.getAttribute('href')).toContain('vehicleId=vehicle-1');
});

it('says why a trip was left open', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'OPEN',
    flags: ['STALE_OPEN'],
    staleReason: { detail: 'Open for 26 h while the longest trip on record is 20 h.' },
    drop: { source: 'UNKNOWN' },
  });
  open();
  expect(
    await screen.findByText('Reason: Open for 26 h while the longest trip on record is 20 h.'),
  ).toBeInTheDocument();
});

it('says why a trip needs a second look', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'NEEDS_REVIEW',
    needsReview: 'LINEAGE_SPLIT',
  });
  open();
  expect(await screen.findByText('Split from another trip')).toBeInTheDocument();
});

it('says what was only partly measured, and never a rupee that was not measured', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    kmPartial: true,
    fuelPartial: true,
    totalCostInr: null,
    roleEconomics: {
      approach: { fuelInr: null, wearInr: null },
      laden: { fuelInr: 3358, wearInr: 351, fuelBasis: 'PARTIAL' },
      return: { fuelInr: null, wearInr: null },
    },
  });
  open();
  await screen.findByRole('heading', { name: 'WB11F4262' });
  const strip = within(document.querySelector('.atx-facts'));
  expect(strip.getAllByText('Partly measured').length).toBe(2);
  expect(strip.getByText(/fuel ₹3,358 · 1 of 3 legs costed · partial/)).toBeInTheDocument();
});

it('shows distance the server could not attribute, on its own line', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    km: { approach: 2, laden: 117, return: 18.37, unattributed: 38 },
    unknownDriveReason: 'DROP_UNKNOWN',
  });
  open();
  await screen.findByRole('heading', { name: 'WB11F4262' });
  expect(screen.getByText(/Not attributed: 38 km/)).toBeInTheDocument();
  expect(screen.getByText(/Drop not found, so this drive has no load label/)).toBeInTheDocument();
});

it('shows known fuel and wear as a partial estimate when the full trip total is unavailable', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    totalCostInr: null,
    roleEconomics: {
      approach: { fuelInr: 4095, wearInr: 468, fuelBasis: 'AVAILABLE' },
      laden: { fuelInr: 8343, wearInr: 735, fuelBasis: 'AVAILABLE' },
    },
    economicsAvailability: { status: 'UNAVAILABLE', reason: 'Cost calculation unavailable.' },
  });
  open();
  await screen.findByRole('heading', { name: 'WB11F4262' });
  const strip = within(document.querySelector('.atx-facts'));
  expect(strip.getByText('₹13,641')).toBeInTheDocument();
  expect(strip.getByText('Partly measured').closest('dt')).toHaveClass('atx-cost-heading');
  expect(strip.getByText(/fuel ₹12,438/)).toHaveTextContent('estimated maintenance cost ₹1,203');
});

it.each(['COMPLETE', 'CONFIRMED'])(
  'does not tell a %s trip to wait for its end when cost is missing',
  async (status) => {
    AutoTripService.get.mockResolvedValue({
      ...trip,
      status,
      totalCostInr: null,
      roleEconomics: null,
    });
    open();
    expect(
      await screen.findByText('Cost calculation unavailable for this completed trip.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('priced once the trip ends')).not.toBeInTheDocument();
  },
);

it('uses the backend cost-availability reason and reserves pending copy for a running trip', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    totalCostInr: null,
    roleEconomics: null,
    economicsAvailability: {
      status: 'UNAVAILABLE',
      reason: 'Cost calculation unavailable: more than one matching trip record was found.',
    },
  });
  open();
  expect(await screen.findByText(/more than one matching trip record/)).toBeInTheDocument();
  cleanup();
  AutoTripService.get.mockResolvedValue({
    ...trip,
    status: 'OPEN',
    drop: null,
    totalCostInr: null,
    roleEconomics: null,
  });
  open();
  expect(
    await screen.findByText('Cost calculation pending while the trip is running.'),
  ).toBeInTheDocument();
});

it('shows an available total without claiming it is waiting for pricing when its breakdown is absent', async () => {
  AutoTripService.get.mockResolvedValue({ ...trip, roleEconomics: { laden: null, return: null } });
  open();
  expect(
    await screen.findByText('Estimated running cost; breakdown unavailable.'),
  ).toBeInTheDocument();
});

it('keeps the delivery timeline at the last drop and explicitly includes return stops on request', async () => {
  AutoTripService.get.mockResolvedValue({
    ...trip,
    routeStops: [
      {
        _id: 'return-fuel',
        startAt: '2026-11-03T12:30:00Z',
        endAt: '2026-11-03T13:00:00Z',
        dwellMinutes: 30,
        purpose: { top: 'FUEL' },
        place: { name: 'Return fuel stop' },
      },
    ],
  });
  open();
  await screen.findByRole('heading', { name: 'WB11F4262' });
  expect(screen.queryByText('Return fuel stop')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Loaded trip' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: 'Include empty return' })),
  );
  expect(await screen.findByText('Return fuel stop')).toBeInTheDocument();
  await waitFor(() =>
    expect(AutoTripService.track).toHaveBeenLastCalledWith(
      'trip-1',
      expect.objectContaining({ scope: 'JOURNEY' }),
    ),
  );
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Loaded trip' })));
  expect(screen.queryByText('Return fuel stop')).not.toBeInTheDocument();
});

it('spec 3: the fuel card says what was burnt, and never a litre that was not measured', async () => {
  AutoTripService.fuelSummary.mockResolvedValue({
    tripId: 'trip-1',
    window: { from: '2026-11-02T23:39:07Z', to: '2026-11-03T02:40:01Z' },
    burntL: 73.4,
    burntByLeg: { approach: 12.4, laden: 61, return: null },
    partial: true,
    loss: { totalL: null, events: [], source: 'FLEETEDGE_DRAIN' },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Fuel' })).closest('.atx-card');
  expect(within(card).getByText('73.4 L')).toBeInTheDocument();
  expect(within(card).getByText('Approach 12.4 L · Loaded 61.0 L')).toBeInTheDocument();
  expect(within(card).getByText('partial')).toBeInTheDocument();
  // The loss was not measured: a dash, never zero litres.
  expect(within(card).getByText('Unexplained fuel loss')).toBeInTheDocument();
  expect(within(card).getByText('—')).toBeInTheDocument();
});

it('spec 3: the fuel card lists the drain alerts with the time each one was seen', async () => {
  AutoTripService.fuelSummary.mockResolvedValue({
    tripId: 'trip-1',
    burntL: 73.4,
    burntByLeg: { approach: 12.4, laden: 61, return: null },
    partial: true,
    loss: {
      totalL: 18.5,
      coverage: 'DRAIN_ALERTS_ONLY',
      source: 'FLEETEDGE_DRAIN',
      events: [{ at: '2026-11-03T08:35:00Z', litres: 18.5, tank: 'main' }],
    },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Fuel' })).closest('.atx-card');
  expect(within(card).getByText('18.5 L in 1 event')).toBeInTheDocument();
  expect(within(card).getByText(/3 Nov, 14:05/)).toBeInTheDocument();
});

it('spec 3: a trip with no drain alert says exactly that', async () => {
  AutoTripService.fuelSummary.mockResolvedValue({
    tripId: 'trip-1',
    burntL: 73.4,
    burntByLeg: { approach: 12.4, laden: 61, return: null },
    partial: false,
    loss: { totalL: 0, coverage: 'DRAIN_ALERTS_ONLY', events: [] },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Fuel' })).closest('.atx-card');
  expect(within(card).getByText('No drain alert in this trip')).toBeInTheDocument();
});

it('spec 3: a fuel summary that fails says so and shows no litres', async () => {
  AutoTripService.fuelSummary.mockRejectedValue(new Error('no fuel today'));
  open();
  expect(await screen.findByText('Could not load fuel for this trip')).toBeInTheDocument();
});

it('spec 3: the fuel card never names a crime', async () => {
  AutoTripService.fuelSummary.mockResolvedValue({
    tripId: 'trip-1',
    burntL: 73.4,
    burntByLeg: { approach: 12.4, laden: 61, return: null },
    partial: true,
    loss: {
      totalL: 18.5,
      coverage: 'DRAIN_ALERTS_ONLY',
      source: 'FLEETEDGE_DRAIN',
      events: [{ at: '2026-11-03T08:35:00Z', litres: 18.5, tank: 'main' }],
    },
  });
  open();
  await screen.findByRole('heading', { name: 'Fuel' });
  expect(document.body.textContent.toLowerCase()).not.toMatch(/theft|stolen|steal|siphon|thief/);
  expect(FUEL_LOSS_TIP.toLowerCase()).not.toMatch(/theft|stolen|steal|siphon|thief/);
});

it('spec 4: the trip cost card adds the tolls to the running cost', async () => {
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.tolls.mockResolvedValue({
    tripId: 'trip-1',
    status: 'OK',
    passes: [{ at: '2026-11-03T01:00:00Z', lat: 22.8, lng: 88.3, name: 'Dankuni' }],
    total: { inr: 1850, priced: 1, unknown: 0, complete: true },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  expect(within(card).getByText('Running cost (fuel + wear)')).toBeInTheDocument();
  expect(within(card).getByText('₹3,837')).toBeInTheDocument();
  expect(within(card).getByText('Tolls (crossings on this trip)')).toBeInTheDocument();
  expect(within(card).getByText('₹1,850')).toBeInTheDocument();
  expect(within(card).getByText('₹3,837 + ₹1,850 = ₹5,687')).toBeInTheDocument();
});

it('spec 4: the trip cost card keeps an unknown part unknown', async () => {
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.get.mockResolvedValue({ ...trip, totalCostInr: null, roleEconomics: null });
  AutoTripService.tolls.mockResolvedValue({
    tripId: 'trip-1',
    status: 'OK',
    passes: [{ at: '2026-11-03T01:00:00Z', lat: 22.8, lng: 88.3, name: 'Dankuni' }],
    total: { inr: 1850, priced: 1, unknown: 0, complete: true },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  expect(within(card).getAllByText('—').length).toBeGreaterThan(0);
  expect(within(card).getByText('Partial: ₹1,850 known')).toBeInTheDocument();
});

it('spec 4: a role that may not see fares gets the running cost without tolls', async () => {
  getUserRole.mockReturnValue('DRIVER');
  AutoTripService.tolls.mockResolvedValue({
    tripId: 'trip-1',
    status: 'OK',
    passes: [{ at: '2026-11-03T01:00:00Z', lat: 22.8, lng: 88.3, name: 'Dankuni' }],
    total: null,
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  expect(within(card).queryByText('Tolls (crossings on this trip)')).not.toBeInTheDocument();
  expect(within(card).getByText('Total (without tolls)')).toBeInTheDocument();
  expect(within(card).getAllByText('₹3,837').length).toBe(2);
});

it('spec 4: a toll total of zero stays zero', async () => {
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.tolls.mockResolvedValue({
    tripId: 'trip-1',
    status: 'OK',
    passes: [],
    total: { inr: 0, priced: 0, unknown: 0, complete: true },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  expect(within(card).getByText('₹0')).toBeInTheDocument();
  expect(within(card).getByText('₹3,837 + ₹0 = ₹3,837')).toBeInTheDocument();
});

const partlyCostedTrip = {
  ...trip,
  totalCostInr: null,
  fuelPartial: true,
  roleEconomics: {
    approach: { fuelInr: null, wearInr: null },
    laden: { fuelInr: 1000, wearInr: 0, fuelBasis: 'PARTIAL' },
    return: { fuelInr: null, wearInr: null },
  },
};

it('spec 4: a running cost that is only partly known does not become a complete total', async () => {
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.get.mockResolvedValue(partlyCostedTrip);
  AutoTripService.tolls.mockResolvedValue({
    tripId: 'trip-1',
    status: 'OK',
    passes: [],
    total: { inr: 200, priced: 1, unknown: 0, complete: true },
  });
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  // The known subtotal is on the line, but the total is not a complete one.
  expect(within(card).getByText('₹1,000')).toBeInTheDocument();
  expect(within(card).queryByText('₹1,000 + ₹200 = ₹1,200')).not.toBeInTheDocument();
  expect(within(card).getByText('Partial: ₹1,200 known')).toBeInTheDocument();
});

it('spec 4: a partly known running cost is still partly known without tolls', async () => {
  getUserRole.mockReturnValue('DRIVER');
  AutoTripService.get.mockResolvedValue(partlyCostedTrip);
  open();
  const card = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  expect(within(card).getByText('Total (without tolls)')).toBeInTheDocument();
  expect(within(card).getByText('Partial: ₹1,000 known')).toBeInTheDocument();
});

it('spec 4: the cost card never adds another trip’s tolls to this trip', async () => {
  getUserRole.mockReturnValue('OWNER');
  AutoTripService.get.mockImplementation(async (id) =>
    id === 'trip-2' ? { ...trip, _id: 'trip-2', totalCostInr: 1000 } : trip,
  );
  AutoTripService.tolls.mockImplementation(async (id) => {
    if (id === 'trip-2') {
      // The new trip's tolls take their time; the old trip's must not stand
      // in for them.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return {
      tripId: id,
      status: 'OK',
      passes: [],
      total: { inr: id === 'trip-1' ? 500 : 200, priced: 1, unknown: 0, complete: true },
    };
  });
  openWithSwitch();
  const first = (await screen.findByRole('heading', { name: 'Trip cost' })).closest('.atx-card');
  await waitFor(() =>
    expect(within(first).getByText('₹3,837 + ₹500 = ₹4,337')).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'other trip' }));
  // The new trip's card never shows the old trip's tolls.
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Trip cost' })).toBeInTheDocument());
  const second = screen.getByRole('heading', { name: 'Trip cost' }).closest('.atx-card');
  expect(within(second).queryByText('₹500')).not.toBeInTheDocument();
  expect(within(second).getByText('₹1,000')).toBeInTheDocument();
  // Once the new trip's own tolls arrive, they are the ones on the card.
  await waitFor(
    () => expect(within(second).getByText('₹1,000 + ₹200 = ₹1,200')).toBeInTheDocument(),
    { timeout: 3000 },
  );
});
