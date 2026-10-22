import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import RouteSapCard from './RouteSapCard';
import SapService from '../../services/SapService';
import { getUserRole } from '../../utils/session';
const flags = vi.hoisted(() => ({ on: new Set(['sapV2']) }));
vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: (k) => flags.on.has(k) }),
}));
vi.mock('../../utils/session', () => ({ getUserRole: vi.fn() }));
vi.mock('../../services/SapService', () => ({
  default: { trip: vi.fn(), setRoute: vi.fn(), removeRoute: vi.fn(), hint: vi.fn() },
}));
const trip = {
  _id: 't1',
  pickup: { name: 'Plant', orgSiteId: 'p1' },
  drop: { name: 'Town', orgSiteId: 'd1' },
  routeLeg: { _id: 'leg1', n: 4, km: { p50: 105 } },
};
const route = {
  key: 'p1>d1',
  fromSiteId: 'p1',
  toSiteId: 'd1',
  fromName: 'DALMIA OCL',
  toName: 'AMTA',
};
const sap = {
  status: 'MATCHED',
  sapKm: 100,
  basis: 'ONE_WAY',
  source: 'MANUAL',
  tolerancePct: 10,
  comparison: { sapKm: 100, actualKm: 105, deltaKm: 5, deltaPct: 5, verdict: 'WITHIN' },
  verdict: 'WITHIN',
};
const response = (over = {}) => ({
  trip,
  sap,
  route,
  routeSap: { _id: 'rs1', sapKm: 100, basis: 'ONE_WAY', source: 'MANUAL', note: 'rate card' },
  history: [
    { _id: 'h1', sapKm: 90, basis: 'ONE_WAY', source: 'IMPORTED', supersededAt: '2026-10-01' },
  ],
  ...over,
});
const mount = () =>
  render(
    <MemoryRouter>
      <RouteSapCard trip={trip} />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  flags.on = new Set(['sapV2']);
  getUserRole.mockReturnValue('OWNER');
  SapService.trip.mockResolvedValue(response());
  SapService.setRoute.mockResolvedValue({ _id: 'rs2' });
  SapService.removeRoute.mockResolvedValue({ ok: true });
  SapService.hint.mockResolvedValue({ shortestOneWayKm: 98, suggestion: { basis: 'ONE_WAY' } });
});

it("shows the route's SAP compared on its basis, its source, and its history", async () => {
  mount();
  const card = await screen.findByRole('region', { name: 'Route SAP' });
  expect(await within(card).findByText('Within 10%')).toBeTruthy();
  expect(within(card).getByText(/DALMIA OCL → AMTA/)).toBeTruthy();
  expect(within(card).getByText(/Compared with loaded km/i)).toBeTruthy();
  expect(within(card).getByText(/Entered by a person · rate card/)).toBeTruthy();
  expect(within(card).getByText(/90 km one way · Imported from a sheet/)).toBeTruthy();
  expect(within(card).queryByText(/Usual for this route/)).toBeNull();
});

it('is hidden from other roles and from orgs without SAP, and asks nothing of the API', () => {
  getUserRole.mockReturnValue('DRIVER');
  const { container, unmount } = mount();
  expect(container.innerHTML).toBe('');
  unmount();
  getUserRole.mockReturnValue('OWNER');
  flags.on = new Set();
  expect(mount().container.innerHTML).toBe('');
  expect(SapService.trip).not.toHaveBeenCalled();
});

it('sets the route SAP with the chosen basis and shows the road hint', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: /Change SAP/ }));
  const km = await screen.findByLabelText('SAP km');
  expect(km.value).toBe('100');
  fireEvent.change(km, { target: { value: '200' } });
  fireEvent.click(screen.getByLabelText(/Round trip/));
  expect(await screen.findByText(/Shortest truck road: 98 km one way/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Save SAP' }));
  await waitFor(() =>
    expect(SapService.setRoute).toHaveBeenCalledWith(
      { fromSiteId: 'p1', toSiteId: 'd1', sapKm: 200, basis: 'ROUND_TRIP', note: 'rate card' },
      expect.anything(),
    ),
  );
  await waitFor(() => expect(SapService.trip).toHaveBeenCalledTimes(2));
});

it('removes the route SAP', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Remove route SAP' }));
  await waitFor(() =>
    expect(SapService.removeRoute).toHaveBeenCalledWith('rs1', expect.anything()),
  );
});

it('a trip whose ends are not places explains why, and offers no SAP to set', async () => {
  SapService.trip.mockResolvedValue(
    response({ sap: { status: 'NO_PLACE' }, route: null, routeSap: null, history: [] }),
  );
  mount();
  expect(await screen.findByText('Plant or drop is not a saved place')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Set SAP/ })).toBeNull();
});

it('links to the usual route when delivery routes are on', async () => {
  flags.on = new Set(['sapV2', 'routesV2']);
  mount();
  expect(await screen.findByText(/Usual for this route: 105 km \(4 trips\)/)).toBeTruthy();
});
