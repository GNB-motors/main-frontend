import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, it, expect, beforeEach } from 'vitest';
import RouteSapCard from './RouteSapCard';
import SapService from '../../services/SapService';
import { getUserRole } from '../../utils/session';
const flags = vi.hoisted(() => ({ routes: false }));
vi.mock('../../contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: () => ({ isEnabled: () => flags.routes }),
}));
vi.mock('../../utils/session', () => ({ getUserRole: vi.fn() }));
vi.mock('../../services/SapService', () => ({
  default: {
    trip: vi.fn(),
    setRouteKm: vi.fn(),
    removeRouteKm: vi.fn(),
    alias: vi.fn(),
    lanes: vi.fn(),
  },
}));
const trip = {
  _id: 't1',
  pickup: { name: 'Plant', orgSiteId: 'p1' },
  drop: { name: 'Town', orgSiteId: 'd1' },
  routeLeg: { _id: 'leg1', n: 4, km: { p50: 105 } },
};
const sap = {
  status: 'MATCHED',
  sapKm: 100,
  values: [100, 200],
  multipleSap: true,
  source: 'SHEET',
  fromLabel: 'OCL',
  toLabel: 'TOWN',
  tolerancePct: 10,
  oneWay: { actualKm: 105, deltaKm: 5, deltaPct: 5, verdict: 'WITHIN' },
  roundTrip: { sapKm: 200, actualKm: 240, deltaKm: 40, deltaPct: 20, verdict: 'OVER' },
};
const response = () => ({
  trip,
  sap,
  candidates: { suggestions: [{ kind: 'DROP', label: 'TOWN', score: 0.9, sapValues: [100] }] },
  routeKm: { _id: 'manual1' },
});
const mount = (t = trip) =>
  render(
    <MemoryRouter>
      <RouteSapCard trip={t} />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  flags.routes = false;
  getUserRole.mockReturnValue('OWNER');
  SapService.trip.mockResolvedValue(response());
  SapService.setRouteKm.mockResolvedValue({ ok: true });
  SapService.alias.mockResolvedValue({ ok: true });
  SapService.removeRouteKm.mockResolvedValue({ ok: true });
});
it('shows one-way and round-trip values and gates the usual-route link', async () => {
  mount();
  await screen.findByText('Within 10%');
  expect(screen.getAllByText('+20%')).toHaveLength(2);
  expect(screen.getByText('200 km')).toBeTruthy();
  expect(screen.queryByText(/Usual for this route/)).toBeNull();
});
it('saves manual SAP with site IDs and refetches the card', async () => {
  flags.routes = true;
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Set SAP km' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('SAP km'), { target: { value: '123' } });
  fireEvent.change(within(dialog).getByLabelText('Note (optional)'), {
    target: { value: 'Agreed lane' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save SAP' }));
  await waitFor(() =>
    expect(SapService.setRouteKm).toHaveBeenCalledWith(
      { fromSiteId: 'p1', toSiteId: 'd1', sapKm: 123, note: 'Agreed lane' },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    ),
  );
  await waitFor(() => expect(SapService.trip).toHaveBeenCalledTimes(2));
  expect(screen.getByRole('link', { name: /Usual for this route/ }).getAttribute('href')).toBe(
    '/place-hub?tab=routes&leg=leg1',
  );
});
it('rejects a suggestion and removes a manual override', async () => {
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Not this one' }));
  await waitFor(() =>
    expect(SapService.alias).toHaveBeenCalledWith(
      { kind: 'DROP', label: 'TOWN', orgSiteId: 'd1', status: 'REJECTED' },
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Remove manual SAP' }));
  await waitFor(() =>
    expect(SapService.removeRouteKm).toHaveBeenCalledWith('manual1', expect.anything()),
  );
});
it('shows snapshots for readers without protected requests or edit controls', () => {
  getUserRole.mockReturnValue('USER');
  mount({ ...trip, sap });
  expect(screen.getByText('Within 10%')).toBeTruthy();
  expect(SapService.trip).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Set SAP km' })).toBeNull();
});
it('disables manual SAP when the trip has no saved drop', async () => {
  SapService.trip.mockResolvedValue({ ...response(), trip: { ...trip, drop: null } });
  mount();
  expect(await screen.findByRole('button', { name: 'Set SAP km' })).toBeDisabled();
});
it('offers retry when the new endpoint is not deployed', async () => {
  SapService.trip.mockRejectedValueOnce({ status: 404 });
  mount();
  fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
  expect(await screen.findByText('Within 10%')).toBeTruthy();
});
it('refreshes SAP when the drop is corrected on the same trip', async () => {
  const view = mount();
  await screen.findByText('Within 10%');
  const corrected = { ...trip, drop: { orgSiteId: 'd2', name: 'Corrected town' } };
  SapService.trip.mockResolvedValue({ ...response(), trip: corrected });
  view.rerender(
    <MemoryRouter>
      <RouteSapCard trip={corrected} />
    </MemoryRouter>,
  );
  await waitFor(() => expect(SapService.trip).toHaveBeenCalledTimes(2));
  expect(await screen.findByText('Plant → Corrected town')).toBeTruthy();
});
